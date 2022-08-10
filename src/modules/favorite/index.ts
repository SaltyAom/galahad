import type { FastifyPluginCallback } from 'fastify'

import { authGuardHook } from '@services'
import {
    isNHentai,
    addFavorite,
    removeFavorite,
    getFavoriteByPage,
    isFavorite,
    overviewStatus
} from './services'

import type { GetFavoriteHandler, NewFavoriteHandler } from './types'

const base: FastifyPluginCallback = (app, _, done) => {
    app.get<NewFavoriteHandler>(
        '/id/:id',
        {
            preHandler: [authGuardHook]
        },
        async ({ userId, params: { id } }, res) => {
            if (!isNHentai(id)) return 'Invalid id'

            const isFavorited = await isFavorite(userId!, +id)
            if (isFavorited instanceof Error)
                return res.status(502).send({
                    error: 'Something went wrong'
                })

            return isFavorited
        }
    )

    app.put<NewFavoriteHandler>(
        '/id/:id',
        {
            preHandler: [authGuardHook]
        },
        async ({ userId, params: { id } }, res) => {
            if (!isNHentai(id)) return 'Invalid id'

            const favorite = await addFavorite(userId!, +id)
            if (favorite instanceof Error)
                return res.status(502).send('Something went wrong')

            return id
        }
    )

    app.delete<NewFavoriteHandler>(
        '/id/:id',
        {
            preHandler: [authGuardHook]
        },
        async ({ userId, params: { id } }, res) => {
            if (!isNHentai(id)) return 'Invalid id'

            const favorite = await removeFavorite(userId!, +id)
            if (favorite instanceof Error)
                return res.status(502).send('Something went wrong')

            return id
        }
    )

    app.get(
        '/list',
        {
            preHandler: [authGuardHook]
        },
        async ({ userId }, res) => {
            const favorites = await getFavoriteByPage(userId!)
            if (favorites instanceof Error)
                return res.status(502).send('Something went wrong')

            return favorites
        }
    )

    app.get(
        '/overview',
        {
            preHandler: [authGuardHook]
        },
        async ({ userId }, res) => {
            const overview = await overviewStatus(userId!)
            if (overview instanceof Error || !overview)
                return res.status(502).send('Something went wrong')

            const { favorites: [{ id }], ...rest } = overview

            return {
                ...rest,
                cover: id
            }
        }
    )

    app.get<GetFavoriteHandler>(
        '/list/:page',
        {
            preHandler: [authGuardHook]
        },
        async ({ userId, params: { page: stringifiedPage } }, res) => {
            const page = +stringifiedPage

            if (!page || Number.isNaN(page) || page <= 0 || page >= 10e6)
                return 'Invalid page'

            const favorites = await getFavoriteByPage(userId!, +page)
            if (favorites instanceof Error)
                return res.status(502).send('Something went wrong')

            return favorites
        }
    )

    done()
}

export default base
