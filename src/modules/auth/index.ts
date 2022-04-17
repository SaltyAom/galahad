import type { FastifyPluginCallback } from 'fastify'

import {
    authGuardHook,
    refreshToken,
    removeToken,
    validateSchema
} from '@services'
import { signUp, signIn, changePassword, refresh, delay } from './services'

import { signUpSchema, signInSchema, changePasswordSchema } from './models'

import type { ChangePasswordHandler, SignUpHandler } from './types'

const auth: FastifyPluginCallback = (app, _, done) => {
    app.put<SignUpHandler>(
        '/signup',
        {
            preHandler: validateSchema(signUpSchema)
        },
        async ({ body }, res) => {
            const user = await signUp(body)
            if (user instanceof Error)
                return res.status(401).send({ error: user.message })

            const { username } = user

            return username
        }
    )

    app.post<SignUpHandler>(
        '/signin',
        {
            preHandler: validateSchema(signInSchema)
        },
        async ({ body, cookies: { accessToken } }, res) => {
            const user = await signIn(body)
            if (user instanceof Error) {
                await delay(750)

                return res.status(403).send({ error: user.message })
            }

            const { id, username } = user
            const token = await refreshToken(id, accessToken)

            const newToken = `${token}:${id}`

            const expires = new Date()
            expires.setFullYear(expires.getFullYear() + 1)

            res.setCookie('accessToken', newToken, {
                httpOnly: true,
                path: '/',
                sameSite: 'none',
                secure: true,
                expires: new Date()
            })

            return username
        }
    )

    app.get(
        '/refresh',
        {
            preHandler: authGuardHook
        },
        async ({ userId }) => await refresh(userId!)
    )

    app.patch<ChangePasswordHandler>(
        '/change-password',
        {
            preHandler: [authGuardHook, validateSchema(changePasswordSchema)]
        },
        async ({ body, userId }, res) => {
            const user = await changePassword({ ...body, userId: userId! })
            if (user instanceof Error)
                return res.status(403).send({ error: user.message })

            return user.username
        }
    )

    app.post(
        '/signout',
        {
            preHandler: [authGuardHook]
        },
        async ({ userId, cookies: { accessToken } }, res) => {
            if (!userId || !accessToken) return new Error('Already signed out')

            const removed = await removeToken(userId, accessToken)
            res.unsignCookie('accessToken')

            if (!removed) return new Error('Already signed out')

            return 'Signed out'
        }
    )

    done()
}

export default auth
