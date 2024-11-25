import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'

import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { getBestSequenceOnDiet } from '../utils/getBestOnDietSequence'

export function mealsRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [checkSessionIdExists] }, async (req, res) => {
    const { sessionId } = req.cookies

    const meals = await knex('meals').where('session_id', sessionId).select('*')

    const formattedMeals = meals.map((meal) => ({
      ...meal,
      isOnDiet: Boolean(meal.isOnDiet),
    }))

    return res.send({ meals: formattedMeals })
  })

  app.post('/', { preHandler: [checkSessionIdExists] }, async (req, res) => {
    // Object example:
    // {
    //   "name": "Launch",
    //   "description": "Rice, beans and grilled chicken",
    //   "dateTime": "2024-11-22T12:30:00Z",
    //   "isOnDiet": true
    // }

    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string().nullable(),
      dateTime: z.string().refine(
        (value) => !isNaN(Date.parse(value)), // Verify if this string is a valid date format
        { message: 'Invalid date format. Use ISO 8601.' },
      ),
      isOnDiet: z.boolean(),
    })

    const { name, description, dateTime, isOnDiet } =
      createMealBodySchema.parse(req.body)

    const sessionId = req.cookies.sessionId

    await knex('meals').insert({
      id: randomUUID(),
      session_id: sessionId,
      name,
      description,
      dateTime,
      isOnDiet,
    })

    return res.status(201).send({ message: 'Meal created successfully.' })
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (req, res) => {
    const { sessionId } = req.cookies

    const getMealParamsSchema = z.object({ id: z.string().uuid() })

    const { id } = getMealParamsSchema.parse(req.params)

    const meal = await knex('meals')
      .where({ id, session_id: sessionId })
      .first()

    if (!meal) {
      return res.status(404).send({ message: 'Meal not found.' })
    }

    return res.send(meal)
  })

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (req, res) => {
      const { sessionId } = req.cookies

      const getMealParamsSchema = z.object({ id: z.string().uuid() })

      const { id } = getMealParamsSchema.parse(req.params)

      const meal = await knex('meals')
        .where({ id, session_id: sessionId })
        .first()

      if (!meal) {
        return res.status(404).send({ message: 'Meal not found.' })
      }

      await knex('meals').where({ id, session_id: sessionId }).delete()

      return res.send({ message: 'Meal deleted successfully.' })
    },
  )

  app.put('/:id', { preHandler: [checkSessionIdExists] }, async (req, res) => {
    const { sessionId } = req.cookies

    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const mealBodySchema = z
      .object({
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        dateTime: z
          .string()
          .refine((value) => !isNaN(Date.parse(value)), {
            message: 'Invalid date format. Use ISO 8601.',
          })
          .optional(),
        isOnDiet: z.boolean().optional(),
      })
      .strict()

    try {
      const { id } = getMealParamsSchema.parse(req.params)
      const updateData = mealBodySchema.parse(req.body)

      const meal = await knex('meals')
        .where({ id, session_id: sessionId })
        .first()

      if (!meal) {
        return res.status(404).send({ message: 'Meal not found.' })
      }

      const updatedMealData: Partial<typeof updateData> & {
        updated_at: string
      } = {
        ...updateData,
        updated_at: new Date().toISOString(),
      }

      await knex('meals')
        .where({ id, session_id: sessionId })
        .update(updatedMealData)

      return res.send({ message: 'Meal updated successfully.' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .send({ message: 'Invalid input', errors: error.errors })
      }

      return res.status(500).send({ message: 'Internal server error.' })
    }
  })

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (req, res) => {
      const { sessionId } = req.cookies

      const meals = await knex('meals')
        .where('session_id', sessionId)
        .select('*')

      const summary = {
        totalMeals: meals.length,
        mealsOnDiet: meals.filter((meal) => meal.isOnDiet).length,
        mealsNotOnDiet: meals.filter((meal) => !meal.isOnDiet).length,
        bestSequenceOnDiet: getBestSequenceOnDiet(meals),
      }

      return res.send(summary)
    },
  )
}
