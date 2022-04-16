import { prisma, gql, getFavoriteHentais } from '@services'

import type { GetFavoriteHentais, GetFavoriteHentaisVariable } from '@services'
import type { FavoriteRequest, Favorite } from './types'

// In the future, code might exceed 6 digits however it would take atleast 10 years to reach 8 digits.
export const isNHentai = (id: string | number) =>
    `${id}`.length <= 7 && !Number.isNaN(+id)

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

export const getFavoriteByPage = async (
    uid: number,
    page = 1
): Promise<Favorite[] | Error> => {
    try {
        return await prisma.favorite.findMany({
            select: {
                id: true,
                created: true
            },
            take: batchSize,
            skip: batchSize * (page - 1),
            where: {
                uid
            }
        })
    } catch (err) {
        return new Error('Something went wrong')
    }
}

export const getFavoriteData = async (favorites: Favorite[]) => {
    const hentais = await gql<GetFavoriteHentais, GetFavoriteHentaisVariable>(
        getFavoriteHentais,
        {
            variables: {
                id: favorites.map(({ id }) => id)
            }
        }
    )

    if (hentais instanceof Error || Array.isArray(hentais))
        return favorites.map(({ id }) => ({
            id,
            success: false,
            data: null
        }))

    return hentais.nhql.multiple.data.map((datum, index) => ({
        id: favorites[index].id,
        ...datum
    }))
}
