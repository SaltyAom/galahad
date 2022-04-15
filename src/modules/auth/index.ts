import type { FastifyPluginCallback } from 'fastify'

import { authGuardHook, refreshToken, validateSchema } from '@services'
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

            const { id, ...rest } = user
            const token = await refreshToken({
                id,
                previous: accessToken
            })

            const newToken = `${token},${id}`

            res.setCookie('accessToken', newToken, {
                httpOnly: true,
                sameSite: true,
                path: '/'
            })

            return {
                ...rest,
                token: newToken
            }
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

    done()
}

export default auth
