/* eslint-disable @typescript-eslint/ban-ts-comment */
import type { onRequestHookHandler } from 'fastify'

export const intParam =
    (prop: string): onRequestHookHandler =>
    ({ params }, res, done) => {
        // @ts-ignore
        if (!params[prop]) return done()

        // @ts-ignore
        params[prop] = +params[prop]

        // @ts-ignore
        if (Number.isNaN(params[prop]))
            return res.status(400).send({
                error: `Expected ${prop} to be number`
            })

        // @ts-ignore
        if (params[prop] < 1)
            return res.status(400).send({
                error: `Expected ${prop} to be positive number`
            })

        done()
    }

export const intBody =
    (prop: string): onRequestHookHandler =>
    ({ body }, res, done) => {
        // @ts-ignore
        if (!body[prop]) return done()

        // @ts-ignore
        body[prop] = +body[prop]

        // @ts-ignore
        if (Number.isNaN(body[prop]))
            return res.status(400).send({
                error: `Expected ${prop} to be number`
            })

        // @ts-ignore
        if (body[prop] < 1)
            return res.status(400).send({
                error: `Expected ${prop} to be positive number`
            })

        done()
    }
