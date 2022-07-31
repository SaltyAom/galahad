import { prisma } from '@services'
import type {
    CreateCollectionBody,
    SetCollectionByHentaiBody,
    UpdateCollectionBody,
    UpdateHentaiOrderBody
} from './types'

const batchSize = 25

export const getCollection = async (id: number, userId: number | null) => {
    const collection = await prisma.collection.findUnique({
        include: {
            hentai: {
                take: batchSize,
                orderBy: {
                    order: 'asc'
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
                    order: 'asc'
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
                        created: 'desc'
                    },
                    select: {
                        id: true,
                        title: true,
                        public: true,
                        hentai: {
                            take: 1,
                            orderBy: {
                                order: 'asc'
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
                                id: hentaiId
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

    //     .then((r) =>
    //     r?.collection.map(({ hentai, ...rest }) => ({
    //         ...rest,
    //         selected: !!hentai[0]
    //     }))
    // )

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
                    id: true,
                    order: true
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

export const addFavoriteHentaiByCollection = (
    hentaiId: number,
    collectionIds: number[]
) =>
    prisma.hentaiCollection.createMany({
        data: collectionIds.map((collectionId) => ({
            id: hentaiId,
            collectionId
        }))
    })

export const addHentais = (collectionId: number, hentaiIds: number[]) =>
    prisma.hentaiCollection.createMany({
        data: hentaiIds.map((id) => ({
            id,
            collectionId
        }))
    })

export const removeHentais = (collectionId: number, hentaiIds: number[]) =>
    prisma.hentaiCollection.deleteMany({
        where: {
            OR: hentaiIds.map((id) => ({
                id,
                collectionId
            }))
        }
    })

export const updateHentaiOrder = async (
    collectionId: number,
    newCollection: UpdateHentaiOrderBody[]
) => {
    const data = await prisma.collection.findUnique({
        include: {
            hentai: true
        },
        where: {
            id: collectionId
        }
    })

    if (!data || !data.hentai.length) return []

    const collection = data.hentai
    const newIds = new Set(newCollection.map((x) => x.id))
    const newOrders = new Set(newCollection.map((x) => x.order))

    if (
        collection.length !== newIds.size ||
        !collection.every(({ id }) => newIds.has(id))
    )
        return new Error('Ids not match')

    if (
        collection.length !== newOrders.size ||
        !collection.every(({ order }) => newOrders.has(order))
    )
        return new Error('Order not matched')

    await prisma.$transaction(async (prisma) => {
        await prisma.hentaiCollection.deleteMany({
            where: {
                collectionId
            }
        })

        await prisma.hentaiCollection.createMany({
            data: newCollection.map(({ id, order }) => ({
                id,
                order,
                collectionId
            }))
        })
    })

    return newCollection.sort((a, b) => a.order - b.order)
}

export const setCollectionByHentai = async (
    id: number,
    { add: requestAdd, remove: requestRemove }: SetCollectionByHentaiBody
) => {
    try {
        const [add, remove] = await prisma.$transaction([
            prisma.hentaiCollection.createMany({
                data: requestAdd.map((collectionId) => ({
                    id,
                    collectionId
                }))
            }),
            prisma.hentaiCollection.deleteMany({
                where: {
                    OR: requestRemove.map((collectionId) => ({
                        id,
                        collectionId
                    }))
                }
            })
        ])

        return {
            add,
            remove
        }
    } catch (error) {
        return new Error('Something went wrong')
    }
}
