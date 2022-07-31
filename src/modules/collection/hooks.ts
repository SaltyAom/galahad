/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { onRequestHookHandler } from 'fastify'

import { prisma } from '@services'

// @ts-ignore
export const ownCollection: onRequestHookHandler = async (
    {
        userId: uid,
        params: { collection }
    }: {
        userId: number
        params: {
            collection: number
        }
    },
    res
) => {
    try {
        const owned = await prisma.collection.findFirst({
            where: {
                uid,
                id: collection
            }
        })

        if (!owned)
            return res.status(403).send({
                error: 'Invalid ownership'
            })
    } catch (error) {
        return res.status(403).send({
            error: 'Invalid ownership'
        })
    }
}
