import type { RouteShorthandMethod } from 'fastify'
import type { Collection } from '@prisma/client'

export interface GetCollectionHandler extends RouteShorthandMethod {
    Params: {
        collection: number
    }
}

export interface GetHentaiHandler extends RouteShorthandMethod {
    Params: {
        collection: number
        batch: number
    }
}

export interface GetHentaiStatusHandler extends RouteShorthandMethod {
    Params: {
        hentai: number
    }
}

export type CreateCollectionBody = Omit<
    Collection,
    'id' | 'uid' | 'created' | 'updated'
>

export interface CreateCollectionHandler extends RouteShorthandMethod {
    Body: CreateCollectionBody
}

export type UpdateCollectionBody = Partial<Collection>

export interface UpdateCollectionHandler extends RouteShorthandMethod {
    Body: UpdateCollectionBody
    Params: {
        collection: number
    }
}

export interface AddFavoriteHentaiByCollection extends RouteShorthandMethod {
    Params: {
        hentai: number
    }
    Body: number[]
}

export interface AddHentaiHandler extends RouteShorthandMethod {
    Params: {
        collection: number
    }
    Body: number[]
}

export interface RemoveHentaiHandler extends RouteShorthandMethod {
    Params: {
        collection: number
    }
    Body: number[]
}

export interface UpdateHentaiOrderBody {
    id: number
    order: number
}

export interface UpdateHentaiOrderHandler extends RouteShorthandMethod {
    Params: {
        collection: number
    }
    Body: UpdateHentaiOrderBody[]
}

export interface SetCollectionByHentaiBody {
    add: number[]
    remove: number[]
}

export interface SetCollectionByHentaiHandler extends RouteShorthandMethod {
    Params: {
        hentai: number
    }
    Body: SetCollectionByHentaiBody
}
