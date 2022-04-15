import fastify from 'fastify'
import base from '~/modules/base'

const app = fastify()
app.register(base)

describe('[Module] Base', () => {
    it('Get(/) to be "Working"', async () => {
        const { statusCode, body } = await app.inject({
            method: 'GET',
            url: '/'
        })

        expect(statusCode).toBe(200)
        expect(body).toBe('Working')
    })
})
