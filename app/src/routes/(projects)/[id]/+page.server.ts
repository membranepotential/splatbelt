import * as projects from '$lib/server/projects'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params, parent }) => {
  const { user } = await parent()

  // await projects.update(sub, params.id, {
  //   state: AnalysisState.COMPLETE,
  //   scene: {
  //     position: [5.99, 5.1, -12.77],
  //     up: [-0.07, -0.71, -0.7],
  //     center: [0, 0, 0],
  //     fov: 50,
  //   },
  // })

  const project = await projects.get(user.userId, params.id)
  if (!project) {
    error(404, 'Project not found')
  }

  return { project }
}

export const ssr = false
