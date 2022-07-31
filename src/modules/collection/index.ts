import { FastifyPluginCallback } from 'fastify'

import { authGuardHook, intParam, validateSchema } from '@services'
import {
    addHentais,
    removeHentais,
    createCollection,
    getCollection,
    getCollectionList,
    getHentai,
    getHentaiList,
    updateCollection,
    updateHentaiOrder,
    getHentaiStatusById,
    addFavoriteHentaiByCollection,
    setCollectionByHentai
} from './services'

import { ownCollection } from './hooks'
import {
    createCollectionSchema,
    setCollectionByHentaiSchema,
    updateCollectionSchema,
    updateHentaiOrderSchema,
    updateHentaiSchema
} from './models'

import type {
    GetCollectionHandler,
    GetHentaiHandler,
    CreateCollectionHandler,
    UpdateCollectionHandler,
    AddHentaiHandler,
    RemoveHentaiHandler,
    UpdateHentaiOrderHandler,
    GetHentaiStatusHandler,
    AddFavoriteHentaiByCollection,
    SetCollectionByHentaiHandler
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
            getHentaiList(collection, userId)
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

    app.get(
        '/list',
        {
            preHandler: authGuardHook
        },
        ({ userId }) => getCollectionList(userId!)
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
                intParam('hentai'),
                validateSchema(updateCollectionSchema),
                ownCollection
            ]
        },
        ({ params: { collection }, body }) => updateCollection(collection, body)
    )

    app.put<AddFavoriteHentaiByCollection>(
        '/hentai/:hentai',
        {
            preHandler: [
                authGuardHook,
                intParam('hentai'),
                validateSchema(updateHentaiSchema),
                ownCollection
            ]
        },
        ({ params: { hentai }, body }) =>
            addFavoriteHentaiByCollection(hentai, body)
    )

    app.put<AddHentaiHandler>(
        '/:collection/hentai',
        {
            preHandler: [
                authGuardHook,
                intParam('collection'),
                validateSchema(updateHentaiSchema),
                ownCollection
            ]
        },
        ({ params: { collection }, body }) => addHentais(collection, body)
    )

    app.delete<RemoveHentaiHandler>(
        '/:collection/hentai',
        {
            preHandler: [
                authGuardHook,
                intParam('collection'),
                validateSchema(updateHentaiSchema),
                ownCollection
            ]
        },
        ({ params: { collection }, body }) => removeHentais(collection, body)
    )

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

            return response
        }
    )

    done()
}

export default collection
