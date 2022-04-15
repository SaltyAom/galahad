import { prisma } from '@services'

// In the future, code might exceed 6 digits however it would take atleast 10 years to reach 8 digits.
export const isNHentai = (id: string | number) =>
    `${id}`.length <= 7 && !Number.isNaN(+id)

export const addFavorite = async (uid: string, id: number) => {
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

export const removeFavorite = async (uid: string, id: number) => {
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

export const getFavoriteByPage = async (uid: string, page = 1) => {
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
