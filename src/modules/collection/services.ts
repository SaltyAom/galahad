import { prisma } from '@services'
import type {
    CreateCollectionBody,
    SetCollectionByHentaiBody,
    UpdateCollectionBody,
    UpdateHentaiOrderBody
} from './types'

import type { Prisma } from '@prisma/client'

const batchSize = 25

export const getCollection = async (id: number, userId: number | null) => {
    const collection = await prisma.collection.findUnique({
        include: {
            _count: {
                select: {
                    hentai: true
                }
            },
            hentai: {
                take: batchSize,
                orderBy: {
                    id: 'asc'
                }
            }
        },
        where: {
            id
        }
    })

    if (!collection || (!collection.public && collection.uid !== userId)) return

    const { uid, ...rest } = collection

    return {
        owned: uid === userId,
        ...rest
    }
}

interface LinkedRequest {
    hentaiId: true
    next?: {
        select: LinkedRequest
    }
}

interface LinkedData {
    hentaiId: number
    next?: LinkedData
}

const createLink = (deep: number) => {
    const object = {}
    let current = object as LinkedRequest

    for (let i = 0; i < deep; i++) {
        current.next = {
            select: {
                hentaiId: true
            }
        }

        current = current.next.select
    }

    return object as unknown as LinkedRequest
}

const defaultLink = createLink(batchSize)
const initialLink = createLink(batchSize - 1)

const linkToArray = (link: LinkedData, includeInitial = false) => {
    const array: number[] = includeInitial ? [link.hentaiId] : []

    let next = link.next

    while (next) {
        const { hentaiId, next: newNext } = next

        array.push(hentaiId)

        next = newNext
    }

    return array
}

export const getHentai = async ({
    userId,
    collectionId,
    linkedId
}: {
    userId: number | null
    collectionId: number
    linkedId?: number | undefined
}) => {
    const h = await (linkedId
        ? prisma.collectionHentai.findUnique({
              select: {
                  collection: {
                      select: {
                          public: true,
                          uid: true
                      }
                  },
                  next: defaultLink.next
              },
              where: {
                  hentaiId_collectionId: {
                      collectionId,
                      hentaiId: linkedId
                  }
              }
          })
        : prisma.collectionHentai.findFirst({
              select: {
                  collection: {
                      select: {
                          public: true,
                          uid: true
                      }
                  },
                  hentaiId: true,
                  // Because this will select itself, so it use initial link
                  next: initialLink.next
              },
              where: {
                  previous: null,
                  collectionId
              }
          }))

    if (!h) return Error("Invalid link or collection doesn't existed")
    if (!h.collection.public && h.collection.uid !== userId)
        Error('Invalid ownership')

    return linkToArray(h as unknown as LinkedData, !linkedId)
}

export const getCollectionList = (userId: number, batch = 1) =>
    prisma.user
        .findUnique({
            select: {
                collection: {
                    orderBy: {
                        id: 'desc'
                    },
                    take: batchSize,
                    skip: batchSize * (batch - 1),
                    select: {
                        id: true,
                        title: true,
                        public: true,
                        _count: {
                            select: {
                                hentai: true
                            }
                        },
                        hentai: {
                            take: 1,
                            select: {
                                hentaiId: true
                            },
                            where: {
                                previous: null
                            }
                        }
                    }
                }
            },
            where: {
                id: userId
            }
        })
        .then(
            (r) =>
                r?.collection?.map(({ hentai, ...rest }) => ({
                    cover: hentai?.[0]?.hentaiId ?? null,
                    ...rest
                })) ?? []
        )

export const isHentaiInCollection = ({
    hentaiId,
    collectionId
}: {
    collectionId: number
    hentaiId: number
}) =>
    prisma.collectionHentai.findUnique({
        select: {
            id: true
        },
        where: {
            hentaiId_collectionId: {
                collectionId,
                hentaiId
            }
        }
    })

export const getHentaiStatusById = async (userId: number, hentaiId: number) => {
    const [favorite, user] = await prisma.$transaction([
        prisma.favorite.count({
            where: {
                id: hentaiId,
                uid: userId
            }
        }),
        prisma.user.findUnique({
            select: {
                collection: {
                    orderBy: {
                        created: 'desc'
                    },
                    select: {
                        id: true,
                        title: true,
                        public: true,
                        hentai: {
                            select: {
                                id: true
                            },
                            where: {
                                hentaiId
                            }
                        }
                    }
                }
            },
            where: {
                id: userId
            }
        })
    ])

    return {
        isFavorite: favorite > 0,
        collection:
            user?.collection?.map(({ hentai, ...rest }) => ({
                ...rest,
                selected: !!hentai[0]
            })) || []
    }
}

export const getHentaiPreview = async (id: number, userId: number | null) => {
    const collection = await prisma.collection.findUnique({
        select: {
            id: true,
            title: true,
            uid: true,
            public: true,
            updated: true,
            _count: {
                select: {
                    hentai: true
                }
            }
        },
        where: {
            id
        }
    })

    if (!collection || (!collection.public && collection.uid !== userId))
        return new Error('Invalid ownership')

    const { uid, ...rest } = collection

    return {
        ...rest,
        owned: uid === userId
    }
}

export const createCollection = async (
    uid: number,
    { detail = '', ...rest }: CreateCollectionBody
) =>
    prisma.collection.create({
        data: {
            ...rest,
            uid,
            detail
        }
    })

export const updateCollection = (
    collectionId: number,
    body: UpdateCollectionBody
) =>
    prisma.collection.update({
        data: {
            ...body,
            updated: new Date()
        },
        where: {
            id: collectionId
        }
    })

export const addFavoriteHentaiByCollection = async (
    hentaiId: number,
    collectionIds: number[]
) =>
    prisma.$transaction(async (prisma) => {
        await Promise.all(
            collectionIds.map((collectionId) =>
                addHentai(prisma, collectionId, hentaiId)
            )
        )
    })

export const addHentai = async (
    prisma: Prisma.TransactionClient,
    collectionId: number,
    hentaiId: number
) => {
    const latest = await prisma.collectionHentai.findFirst({
        select: {
            id: true
        },
        where: {
            collectionId
        },
        orderBy: {
            id: 'desc'
        },
        take: 1
    })

    if (!latest) {
        return void (await prisma.collectionHentai.create({
            select: {
                id: true
            },
            data: {
                collectionId,
                hentaiId
            }
        }))
    }

    await prisma.collectionHentai.update({
        data: {
            collection: {
                update: {
                    updated: new Date()
                }
            },
            next: {
                create: {
                    collectionId,
                    hentaiId
                }
            }
        },
        where: {
            id: latest.id
        }
    })
}

export const removeHentai = async (
    prisma: Prisma.TransactionClient,
    collectionId: number,
    hentaiId: number
) => {
    const latest = await prisma.collectionHentai.findUnique({
        select: {
            previous: {
                select: {
                    collectionId: true,
                    id: true
                }
            },
            next: {
                select: {
                    collectionId: true,
                    id: true
                }
            }
        },
        where: {
            hentaiId_collectionId: {
                collectionId,
                hentaiId
            }
        }
    })

    if (!latest) return new Error("id doesn't existed")

    const { previous, next } = latest

    const deleted = prisma.collection.update({
        data: {
            updated: new Date(),
            hentai: {
                delete: {
                    hentaiId_collectionId: {
                        collectionId,
                        hentaiId
                    }
                }
            }
        },
        where: {
            id: collectionId
        }
    })

    if (previous && next)
        await Promise.all([
            deleted,
            prisma.collectionHentai.update({
                data: {
                    nextId: next.id
                },
                where: {
                    id: previous.id
                }
            })
        ])
    else if (previous && !next)
        await Promise.all([
            deleted,
            prisma.collectionHentai.update({
                data: {
                    nextId: null
                },
                where: {
                    id: previous.id
                }
            })
        ])
    else await deleted
}

// export const addHentais = async (collectionId: number, hentaiIds: number[]) => {
//     if (!hentaiIds[0]) return

//     await prisma.$transaction(async (prisma) => {
//         let latest = await prisma.collectionHentai.findFirst({
//             select: {
//                 id: true
//             },
//             orderBy: {
//                 id: 'desc'
//             },
//             take: 1
//         })

//         if (!latest) {
//             latest = await prisma.collectionHentai.create({
//                 select: {
//                     id: true
//                 },
//                 data: {
//                     collectionId,
//                     hentaiId: hentaiIds.shift()!
//                 }
//             })
//         }

//         const operation: Record<string, any> = {}
//         let current = operation

//         hentaiIds.forEach((id) => {
//             current.next = {
//                 create: {
//                     collection: {
//                         connect: {
//                             id: collectionId
//                         }
//                     },
//                     hentaiId: id
//                 }
//             }

//             current = current.next.create
//         })

//         console.dir(operation, {
//             depth: null
//         })

//         await prisma.collectionHentai.update({
//             data: {
//                 next: operation?.next ?? undefined
//             },
//             where: {
//                 id: latest.id
//             }
//         })
//     })

//     return hentaiIds
// }

// export const removeHentais = (collectionId: number, hentaiIds: number[]) =>
//     prisma.collectionHentai.deleteMany({
//         where: {
//             OR: hentaiIds.map((hentaiId) => ({
//                 hentaiId,
//                 collectionId
//             }))
//         }
//     })

export const updateHentaiOrder = async (
    collectionId: number,
    { previous, current, next }: UpdateHentaiOrderBody
) => {
    try {
        prisma.$transaction(async (prisma) => {
            const request = await prisma.collectionHentai.findUnique({
                select: {
                    previous: {
                        select: {
                            id: true
                        }
                    },
                    next: {
                        select: {
                            id: true
                        }
                    }
                },
                where: {
                    hentaiId_collectionId: {
                        collectionId,
                        hentaiId: current
                    }
                }
            })

            if (!request) throw new Error("Current doesn't existed")
            const { previous: oldPrevious, next: oldNext } = request

            await Promise.all([
                prisma.collectionHentai.update({
                    data: {
                        collection: {
                            update: {
                                updated: new Date()
                            }
                        },
                        next: {
                            connect: {
                                id: current
                            }
                        }
                    },
                    where: {
                        hentaiId_collectionId: {
                            collectionId,
                            hentaiId: previous
                        }
                    }
                }),
                prisma.collectionHentai.update({
                    data: {
                        nextId: next
                    },
                    where: {
                        hentaiId_collectionId: {
                            collectionId,
                            hentaiId: current
                        }
                    }
                }),
                oldPrevious &&
                    oldNext &&
                    // Link old H to new H
                    prisma.collectionHentai.update({
                        data: {
                            nextId: oldNext.id
                        },
                        where: {
                            hentaiId_collectionId: {
                                collectionId,
                                hentaiId: oldPrevious.id
                            }
                        }
                    })
            ])
        })
    } catch (error) {
        return error
    }
}

// ? Used in 'add to list' page, to update multiple hentai
export const setCollectionByHentai = async (
    hentaiId: number,
    { add, remove }: SetCollectionByHentaiBody
) => {
    try {
        await prisma.$transaction(async (prisma) => {
            await Promise.all([
                ...add.map((collectionId) =>
                    addHentai(prisma, collectionId, hentaiId)
                ),
                ...remove.map((collectionId) =>
                    removeHentai(prisma, collectionId, hentaiId)
                )
            ])
        })
    } catch (error) {
        return new Error('Something went wrong')
    }
}

export const deleteCollection = async (collectionId: number) => {
    try {
        await prisma.$transaction([
            prisma.collectionHentai.deleteMany({
                where: {
                    collectionId
                }
            }),
            prisma.collection.delete({
                where: {
                    id: collectionId
                }
            })
        ])
    } catch (error) {
        return error as Error
    }
}
