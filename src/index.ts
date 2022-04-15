import env from 'dotenv'
env.config()

import fastify from 'fastify'

import helmet from 'fastify-helmet'
import staticPlugin from 'fastify-static'
import cookie from 'fastify-cookie'
import cors from 'fastify-cors'

import { resolve } from 'path'

import { auth, base, favorite } from '@modules'
import { mutateAuthHook } from '@services'

const app = fastify()

app.register(helmet)
    .register(cookie)
    .register(cors, {
        origin: [/localhost:3000$/, /hifumin.app$/],
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type'],
        credentials: true,
        preflight: true
    })
    .register(staticPlugin, {
        root: resolve('./public')
    })
    .decorateRequest('userId', null)
    .decorateRequest('auth', false)
    .addHook('onRequest', mutateAuthHook)
    .register(auth, {
        prefix: '/auth'
    })
    .register(favorite, {
        prefix: '/favorite'
    })
    .register(base)
    .listen(process.env.PORT ?? 8080, '0.0.0.0', (error, address) => {
        if (error) return console.error(error)

        console.log(`Running at ${address}`)
    })
