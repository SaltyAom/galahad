import 'dotenv/config'

import fastify from 'fastify'

import helmet from '@fastify/helmet'
import staticPlugin from '@fastify/static'
import cookie from '@fastify/cookie'
import cors from '@fastify/cors'

import { resolve } from 'path'

import { auth, base, collection, favorite } from '@modules'
import { mutateAuthHook, prisma } from '@services'

const app = fastify()

const main = async () => {
    await prisma.$connect()

    app.register(helmet)
        .register(cookie)
        .register(cors, {
            origin: [/localhost:3000$/, /localhost:5173$/, /hifumin.app$/],
            methods: [
                'GET',
                'HEAD',
                'PUT',
                'PATCH',
                'POST',
                'DELETE',
                'OPTIONS'
            ],
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
        .register(base)
        .register(auth, {
            prefix: '/auth'
        })
        .register(favorite, {
            prefix: '/favorite'
        })
        .register(collection, {
            prefix: '/collection'
        })
        .listen(
            {
                port: process.env.PORT ? +process.env.PORT || 8080 : 8080,
                host: '0.0.0.0'
            },
            (error, address) => {
                if (error) return console.error(error)

                console.log(`Running at ${address}`)
            }
        )
}

main()
