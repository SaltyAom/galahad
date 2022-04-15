/* eslint-disable @typescript-eslint/no-unused-vars */
import type fastify, { FastifyRequest } from 'fastify'

declare module 'fastify' {
    interface FastifyRequest {
        auth: boolean
        userId: number | null
    }
}
