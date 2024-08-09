// handlers.ts
import { t } from 'elysia'

export const handlers = {
  get: () => 'hello Next',
  post: ({ body }) => body, {
    body: t.Object({
      name: t.String()
    })
  }
}