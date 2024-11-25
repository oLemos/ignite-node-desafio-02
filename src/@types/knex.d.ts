// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    users: {
      id: string
      username: string
      session_id: string
    }
    meals: {
      id: string
      name: string
      description: string | null
      dateTime: string
      isOnDiet: boolean
      session_id: string
    }
  }
}
