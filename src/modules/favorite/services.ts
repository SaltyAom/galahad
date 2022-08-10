import { prisma } from '@services'

import type { FavoriteRequest } from './types'

// In the future, code might exceed 6 digits however it would take atleast 10 years to reach 8 digits.
export const isNHentai = (id: string | number) =>
    `${id}`.length <= 7 && !Number.isNaN(+id)

export const isFavorite = async (
    uid: number,
    id: number
): Promise<boolean | Error> => {
    try {
        return !!(await prisma.favorite.count({
            where: {
                id,
                uid
            }
        }))
    } catch (err) {
        return new Error('Something went wrong')
    }
}

export const addFavorite = async (
    uid: number,
    id: number
): Promise<FavoriteRequest | Error> => {
    try {
        return await prisma.favorite.create({
            data: {
                id,
                uid
            }
        })
    } catch (err) {
        return new Error('Something went wrong')
    }
}

export const removeFavorite = async (
    uid: number,
    id: number
): Promise<FavoriteRequest | Error> => {
    try {
        return await prisma.favorite.delete({
            where: {
                id_uid: {
                    id,
                    uid
                }
            }
        })
    } catch (err) {
        return new Error('Something went wrong')
    }
}

const batchSize = 25

export const overviewStatus = async (uid: number) => {
    try {
        const status = await prisma.user.findUnique({
            select: {
                favorites: {
                    select: {
                        id: true
                    },
                    take: 1,
                    orderBy: {
                        id: 'desc'
                    }
                },
                _count: {
                    select: {
                        collection: true,
                        favorites: true
                    }
                }
            },
            where: {
                id: uid
            }
        })

        return status
    } catch (err) {
        return new Error('Something went wrong')
    }
}

export const getFavoriteByPage = async (
    uid: number,
    page = 1
): Promise<number[] | Error> => {
    try {
        const favorites = await prisma.favorite.findMany({
            select: {
                id: true
            },
            take: batchSize,
            skip: batchSize * (page - 1),
            where: {
                uid
            },
            orderBy: {
                created: 'desc'
            }
        })

        return favorites.map(({ id }) => id)
    } catch (err) {
        return new Error('Something went wrong')
    }
}
