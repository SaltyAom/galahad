import type { onRequestHookHandler } from 'fastify'

import validate, { type Schema } from 'fluent-schema-validator'

import { verifyToken } from '@services'

export const mutateAuthHook: onRequestHookHandler = async (req, res) => {
    const {
        cookies: { accessToken }
    } = req

    if (!accessToken) return
    const { id, exists } = await verifyToken(accessToken)

    if (!exists) return res.unsignCookie('accessToken')

    req.auth = true
    req.userId = +id
}

export const authGuardHook: onRequestHookHandler = (req, res, done) => {
    if (!req.auth)
        return res.status(401).send({
            error: 'Unauthorized'
        })

    done()
}

export const validateSchema =
    <T = Schema>(schema: T): onRequestHookHandler =>
    ({ body }, res, done) => {
        const validation = validate(body as T, schema)

        if (validation !== true)
            return res.status(400).send({ error: validation.message })

        done()
    }
