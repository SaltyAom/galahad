import { nanoid } from 'nanoid'
import { redis } from '@services'

const readTokenSession = (token: string): string => token.slice(0, 21)

const readToken = (token: string): string[] => [
    readTokenSession(token),
    token.slice(22, token.length + 1)
]

export const refreshToken = async (id: number, previousToken: string) => {
    const accessToken = nanoid()
    const key = `a:${id}`

    await redis.sadd(key, accessToken)
    if (previousToken) await redis.srem(key, 1, previousToken)

    return accessToken
}

export const verifyToken = async (accessToken: string) => {
    const [token, id] = readToken(accessToken)
    const exists = await redis.sismember(`a:${id}`, token)

    return { id, exists }
}

export const removeToken = async (id: number, previous: string) => {
    const token = readTokenSession(previous)

    return !!(await redis.srem(`a:${id}`, 1, token))
}
