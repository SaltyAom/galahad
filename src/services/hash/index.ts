import { hash as argon2Hash, argon2id } from 'argon2'
import type { Options } from 'argon2'

if (
    typeof process.env.salt === 'undefined' ||
    typeof process.env.pepper === 'undefined'
)
    throw new Error('Salt and pepper is required')

const salt = process.env.salt
const fixedPepper = process.env.pepper

const argon2Config: Options = {
    version: 19,
    type: argon2id,
    hashLength: 32,
    timeCost: 256,
    parallelism: 8,
    memoryCost: 1024 * 16
}

const rawHash = async (value: string, pepper: string) =>
    await argon2Hash(value, {
        ...argon2Config,
        salt: Buffer.from(salt + pepper + fixedPepper, 'utf8'),
        raw: true
    })

export const hash = async (value: string, pepper = '') =>
    await rawHash(value, pepper).then((v) => v.toString('base64'))

export const verify = async (
    hashValue: string,
    value: string,
    pepper: string
) => hashValue === (await hash(value, pepper))
