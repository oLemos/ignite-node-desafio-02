import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { knex } from '../database'
// import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export function usersRoutes(app: FastifyInstance) {
  app.post('/', async (req, res) => {
    const createUserBodySchema = z.object({
      username: z.string().min(3).max(30),
    })

    const { username } = createUserBodySchema.parse(req.body)

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      res.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('users').insert({
      id: randomUUID(),
      username,
      session_id: sessionId,
    })

    return res.status(201).send({ message: 'User created successfully.' })
  })

  app.get('/', async (_, res) => {
    const users = await knex('users').select('*')

    return res.send({ users })
  })
}
