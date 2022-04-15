import type { RouteShorthandMethod } from 'fastify'

export interface NewFavoriteHandler extends RouteShorthandMethod {
    Params: {
        id: number
    }
}

export interface GetFavoriteHandler extends RouteShorthandMethod {
    Params: {
        page: string
    }
}
