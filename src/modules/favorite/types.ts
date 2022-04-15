import type { RouteShorthandMethod } from 'fastify'

export interface NewFavoriteHandler extends RouteShorthandMethod {
    Params: {
        id: string
    }
}

export interface GetFavoriteHandler extends RouteShorthandMethod {
    Params: {
        page: string
    }
}
