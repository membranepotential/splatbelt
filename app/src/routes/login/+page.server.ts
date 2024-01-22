import { redirect, fail, type Actions } from '@sveltejs/kit'
import { signIn } from 'aws-amplify/auth'

export const actions: Actions = {
  default: async ({ request }) => {
    const body = await request.formData()
    const username = body.get('username') as string
    const password = body.get('password') as string

    try {
      await signIn({ username, password })
      redirect(302, '/')
    } catch (error) {
      console.error(error)
      throw fail(422, { message: error.message })
    }
  },
} satisfies Actions
