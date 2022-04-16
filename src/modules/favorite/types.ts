import type { RouteShorthandMethod } from 'fastify'

export interface FavoriteRequest {
    id: number
    uid: number
}

export interface Favorite {
    id: number
    created: Date
}

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
