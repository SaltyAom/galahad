import { FastifyPluginCallback } from 'fastify'

import { authGuardHook, intParam, prisma, validateSchema } from '@services'
import {
    // addHentais,
    // removeHentais,
    createCollection,
    getCollection,
    getCollectionList,
    getHentai,
    getHentaiPreview,
    updateCollection,
    updateHentaiOrder,
    getHentaiStatusById,
    setCollectionByHentai,
    addHentai,
    removeHentai,
    isHentaiInCollection,
    deleteCollection
} from './services'

import { ownCollection } from './hooks'
import {
    createCollectionSchema,
    setCollectionByHentaiSchema,
    updateCollectionSchema,
    updateHentaiOrderSchema
} from './models'

import type {
    GetCollectionHandler,
    GetHentaiHandler,
    CreateCollectionHandler,
    UpdateCollectionHandler,
    AddHentaiHandler,
    UpdateHentaiOrderHandler,
    GetHentaiStatusHandler,
    SetCollectionByHentaiHandler,
    DeleteCollectionHandler
} from './types'

const collection: FastifyPluginCallback = (app, _, done) => {
    app.get<GetCollectionHandler>(
        '/:collection',
        {
            preHandler: intParam('collection')
        },
        async ({ params: { collection: id }, userId }, res) => {
            const collection = await getCollection(id, userId)

            if (!collection)
                return res.status(403).send({
                    error: 'Invalid Ownership'
                })

            return collection
        }
    )

    app.get<GetCollectionHandler>(
        '/:collection/hentai',
        {
            preHandler: [intParam('collection')]
        },
        ({ userId, params: { collection } }) =>
            getHentaiPreview(collection, userId)
    )

    app.get<GetHentaiHandler>(
        '/:collection/hentai/:batch',
        {
            preHandler: [intParam('collection'), intParam('batch')]
        },
        async (
            { userId, params: { collection: collectionId, batch } },
            res
        ) => {
            const hentai = await getHentai({ userId, collectionId, batch })

            if (!hentai)
                return res.status(403).send({
                    error: 'Invalid Ownership'
                })

            return hentai
        }
    )

    app.get<{
        Params: {
            batch: number
        }
    }>(
        '/list/:batch',
        {
            preHandler: [authGuardHook, intParam('batch')]
        },
        ({ params: { batch }, userId }) => getCollectionList(userId!, batch)
    )

    app.get<GetHentaiStatusHandler>(
        '/status/:hentai',
        {
            preHandler: [authGuardHook, intParam('hentai')]
        },
        ({ userId, params: { hentai } }) => getHentaiStatusById(userId!, hentai)
    )

    app.put<CreateCollectionHandler>(
        '/new',
        {
            preHandler: [authGuardHook, validateSchema(createCollectionSchema)]
        },
        ({ body, userId }) => createCollection(userId!, body)
    )

    app.patch<UpdateCollectionHandler>(
        '/:collection',
        {
            preHandler: [
                authGuardHook,
                intParam('collection'),
                validateSchema(updateCollectionSchema),
                ownCollection
            ]
        },
        ({ params: { collection }, body }) => updateCollection(collection, body)
    )

    app.put<AddHentaiHandler>(
        '/:collection/hentai/:hentai',
        {
            preHandler: [
                authGuardHook,
                intParam('collection'),
                intParam('hentai'),
                ownCollection
            ]
        },
        async (
            { params: { collection: collectionId, hentai: hentaiId } },
            res
        ) => {
            try {
                await prisma.$transaction((prisma) =>
                    addHentai(prisma, collectionId, hentaiId)
                )

                return {
                    id: hentaiId
                }
            } catch (error) {
                if (await isHentaiInCollection({ hentaiId, collectionId }))
                    return res.status(400).send({
                        error: 'Already in collection'
                    })

                return res.status(500).send({
                    error: (error as Error).message ?? 'Something went wrong'
                })
            }
        }
    )

    app.delete<AddHentaiHandler>(
        '/:collection/hentai/:hentai',
        {
            preHandler: [
                authGuardHook,
                intParam('collection'),
                intParam('hentai'),
                ownCollection
            ]
        },
        async (
            { params: { collection: collectionId, hentai: hentaiId } },
            res
        ) => {
            try {
                const removed = await prisma.$transaction((prisma) =>
                    removeHentai(prisma, collectionId, hentaiId)
                )

                if (removed instanceof Error)
                    return res.status(400).send({
                        error: removed.message
                    })

                return {
                    id: hentaiId
                }
            } catch (error) {
                return res.status(500).send({
                    error: (error as Error).message ?? 'Something went wrong'
                })
            }
        }
    )

    // app.put<AddFavoriteHentaiByCollection>(
    //     '/hentai/:hentai',
    //     {
    //         preHandler: [
    //             authGuardHook,
    //             intParam('hentai'),
    //             validateSchema(updateHentaiSchema),
    //             ownCollection
    //         ]
    //     },
    //     ({ params: { hentai }, body }) =>
    //         addFavoriteHentaiByCollection(hentai, body)
    // )

    // ? Bulk update cause link in-order bug
    // app.put<AddHentaisHandler>(
    //     '/:collection/hentai',
    //     {
    //         preHandler: [
    //             authGuardHook,
    //             intParam('collection'),
    //             validateSchema(updateHentaiSchema),
    //             ownCollection
    //         ]
    //     },
    //     ({ params: { collection }, body }) => addHentais(collection, body)
    // )

    // ? Bulk update cause link in-order bug
    // app.delete<RemoveHentaisHandler>(
    //     '/:collection/hentai',
    //     {
    //         preHandler: [
    //             authGuardHook,
    //             intParam('collection'),
    //             validateSchema(updateHentaiSchema),
    //             ownCollection
    //         ]
    //     },
    //     ({ params: { collection }, body }) => removeHentais(collection, body)
    // )

    app.patch<UpdateHentaiOrderHandler>(
        '/:collection/order',
        {
            preHandler: [
                authGuardHook,
                intParam('collection'),
                validateSchema(updateHentaiOrderSchema),
                ownCollection
            ]
        },
        ({ body, params: { collection } }) =>
            updateHentaiOrder(collection, body)
    )

    app.patch<SetCollectionByHentaiHandler>(
        '/set/:hentai',
        {
            preHandler: [
                authGuardHook,
                intParam('hentai'),
                validateSchema(setCollectionByHentaiSchema),
                ownCollection
            ]
        },
        async ({ body, params: { hentai } }, res) => {
            const response = await setCollectionByHentai(hentai, body)

            if (response instanceof Error)
                return res.status(400).send({
                    error: 'Invalid body, please try again'
                })

            return body
        }
    )

    app.delete<DeleteCollectionHandler>(
        '/:collection',
        {
            preHandler: [authGuardHook, intParam('collection'), ownCollection]
        },
        async ({ params: { collection } }, res) => {
            const deleted = await deleteCollection(collection)

            if (deleted instanceof Error)
                return res.status(500).send({
                    error: 'Something went wrong, please try again later'
                })

            return {
                collection
            }
        }
    )

    done()
}

export default collection
