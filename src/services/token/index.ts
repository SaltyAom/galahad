import { nanoid } from 'nanoid'
import { redis } from '@services'

export const refreshToken = async ({
    id,
    previous: previousToken
}: {
    id: string
    previous: string
}) => {
    const key = `a:${id}`

    const accessToken = nanoid()
    await redis.sadd(key, accessToken)

    if (previousToken) await redis.srem(key, 1, previousToken)

    return accessToken
}

export const verifyToken = async (accessToken: string) => {
    const [token, id] = accessToken.split(',')

    const exists = await redis.sismember(`ac:${id}`, token)

    return { id, exists }
}
