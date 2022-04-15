import type { FastifyPluginCallback } from 'fastify'

import {
    authGuardHook,
    refreshToken,
    removeToken,
    validateSchema
} from '@services'
import { signUp, signIn, changePassword } from './services'

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

            return {
                username
            }
        }
    )

    app.post<SignUpHandler>(
        '/signin',
        {
            preHandler: validateSchema(signInSchema)
        },
        async ({ body, cookies: { accessToken } }, res) => {
            const user = await signIn(body)
            if (user instanceof Error)
                return res.status(403).send({ error: user.message })

            const { id, ...data } = user
            const token = await refreshToken({
                id,
                previous: accessToken
            })

            const newToken = `${token},${id}`

            res.setCookie('accessToken', newToken, {
                httpOnly: true,
                path: '/'
            })

            return data
        }
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

            return user
        }
    )

    app.post(
        '/signout',
        {
            preHandler: [authGuardHook]
        },
        async ({ userId, cookies: { accessToken } }, res) => {
            if (!userId || !accessToken) return new Error('Already signed out')

            const removed = await removeToken({
                id: userId,
                previous: accessToken
            })

            res.unsignCookie('accessToken')

            if (!removed) return new Error('Already signed out')

            return 'Signed out'
        }
    )

    done()
}

export default auth
