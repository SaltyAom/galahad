import type { RouteShorthandMethod } from 'fastify'
import type { User } from '@prisma/client'

export type SignUpInput = Pick<User, 'username' | 'password' | 'email'>

export interface SignUpHandler extends RouteShorthandMethod {
    Body: SignUpInput
}

export interface ChangePasswordInput extends Pick<User, 'password'> {
    userId: number
    newPassword: string
}

export interface ChangePasswordHandler extends RouteShorthandMethod {
    Body: Omit<ChangePasswordInput, 'userId'>
}
