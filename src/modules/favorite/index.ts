import type { FastifyPluginCallback } from 'fastify'

import { authGuardHook } from '@services'
import {
    isNHentai,
    addFavorite,
    removeFavorite,
    getFavoriteByPage,
    getFavoriteData
} from './services'

import type { GetFavoriteHandler, NewFavoriteHandler } from './types'

const base: FastifyPluginCallback = (app, _, done) => {
    app.put<NewFavoriteHandler>(
        '/h/:id',
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
        '/h/:id',
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

            return await getFavoriteData(favorites)
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

            // ? Ping the server to startup from serverless coldstart
            // await isn't require because it's a side-effect
            fetch('https://api.hifumin.app')

            const favorites = await getFavoriteByPage(userId!, +page)
            if (favorites instanceof Error)
                return res.status(502).send('Something went wrong')

            return await getFavoriteData(favorites)
        }
    )

    done()
}

export default base
