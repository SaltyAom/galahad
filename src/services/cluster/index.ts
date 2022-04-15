import cluster from 'cluster'
import { cpus } from 'os'

const { isPrimary, fork } = cluster

const available = cpus().length

const run = (app: () => void): void => {
    if (process.env.NODE_ENV !== 'production') return app()

    if (isPrimary) for (let node = 0; node < available; node++) fork()
    else app()
}

export default run
