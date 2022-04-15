import type { FastifyPluginCallback } from 'fastify'

const base: FastifyPluginCallback = (app, _, done) => {
    app.get('/', async (_req, res) => {
        res.send('Working')
    })

    done()
}

export default base
