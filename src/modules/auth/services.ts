import { prisma, hash, verify } from '@services'

import type { ChangePasswordInput, SignUpInput } from './types'

export const signUp = async ({ username, password, email }: SignUpInput) => {
    try {
        return await prisma.user.create({
            data: {
                username,
                password: await hash(password, username),
                email
            }
        })
    } catch (err) {
        console.log(err)
        console.log({
            username,
            password: await hash(password, username),
            email
        })
        return new Error('Something went wrong')
    }
}

export const signIn = async ({ username, password }: SignUpInput) => {
    const user = await prisma.user.findUnique({
        select: {
            id: true,
            username: true,
            password: true
        },
        where: {
            username
        }
    })

    if (!user) return new Error('User not found')

    const { id, password: userPassword } = user
    if (!(await verify(userPassword, password, username)))
        return new Error('Invalid password')

    return {
        id,
        username
    }
}

export const changePassword = async ({
    userId,
    password,
    newPassword
}: ChangePasswordInput) => {
    const user = await prisma.user.findUnique({
        select: {
            username: true,
            password: true
        },
        where: {
            id: userId
        }
    })
    if (!user) return new Error('User not found')

    const { username, password: currentPassword } = user

    if (!(await verify(currentPassword, password, username)))
        return new Error('Invalid password')

    await prisma.user.update({
        where: {
            id: userId
        },
        data: {
            password: await hash(newPassword, username)
        }
    })

    return { username }
}
