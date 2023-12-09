import type { PageServerLoad, Actions } from './$types'
import * as projects from '$lib/server/projects'
import { fail } from '@sveltejs/kit'

export const load: PageServerLoad = () => {
  return { projects: projects.list() }
}

export const actions = {
  default: async () => {
    try {
      await projects.create()
    } catch (error: any) {
      return fail(422, { message: error.message })
    }
  },
} satisfies Actions
