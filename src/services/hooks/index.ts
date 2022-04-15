import type { onRequestHookHandler } from 'fastify'

import validate from 'fluent-schema-validator'

import { verifyToken } from '@services'

import type { ObjectSchema } from 'fluent-json-schema'

export const mutateAuthHook: onRequestHookHandler = async (req) => {
    const {
        cookies: { accessToken }
    } = req
    if (!accessToken) return

    const { id, exists } = await verifyToken(accessToken)
    if (!exists) return

    req.auth = true
    req.userId = id
}

export const authGuardHook: onRequestHookHandler = (req, res, done) => {
    if (!req.auth)
        return res.status(401).send({
            error: 'Unauthorized'
        })

    done()
}

export const validateSchema =
    <T = ObjectSchema>(schema: ObjectSchema): onRequestHookHandler =>
    ({ body }, res, done) => {
        if (!validate(body as T, schema))
            return res.status(401).send({ error: 'Invalid body' })

        done()
    }
