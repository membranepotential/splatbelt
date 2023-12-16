import type { PageServerLoad, Actions } from './$types'
import { list, create } from '$lib/server/projects'
import { redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async () => {
  const projects = await list()

  if (projects.length === 0) {
    const newProject = await create()
    redirect(302, `${newProject.id}`)
  }

  return { projects }
}

export const actions = {
  default: async () => {
    const project = await create()
    redirect(302, `${project.id}`)
  },
} satisfies Actions
