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

export const getHentai = async ({
    userId,
    collectionId,
    batch = 1
}: {
    userId: number | null
    collectionId: number
    batch?: number
}) => {
    const collection = await prisma.collection.findUnique({
        select: {
            uid: true,
            public: true,
            hentai: {
                select: {
                    id: true
                },
                orderBy: {
                    id: 'asc'
                },
                take: batchSize,
                skip: batchSize * (batch - 1)
            }
        },
        where: {
            id: collectionId
        }
    })

    if (!collection || (!collection.public && collection.uid !== userId)) return

    return collection.hentai.map(({ id }) => id)
}

export const getCollectionList = (userId: number) =>
    prisma.user
        .findUnique({
            select: {
                collection: {
                    orderBy: {
                        id: 'desc'
                    },
                    select: {
                        id: true,
                        title: true,
                        public: true,
                        hentai: {
                            take: 1,
                            orderBy: {
                                id: 'asc'
                            },
                            select: {
                                id: true
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
                    cover: hentai?.[0]?.id ?? null,
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

export const getHentaiList = async (id: number, userId: number | null) => {
    const collection = await prisma.collection.findUnique({
        include: {
            hentai: {
                select: {
                    id: true
                },
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

    return collection.hentai
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

    const deleted = prisma.collectionHentai.delete({
        where: {
            hentaiId_collectionId: {
                collectionId,
                hentaiId
            }
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
                        nextId: current
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
