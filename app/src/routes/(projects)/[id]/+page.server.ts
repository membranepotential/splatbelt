import * as projects from '$lib/server/projects'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
// import { AnalysisState } from '$lib/schemas/project'

export const load: PageServerLoad = async ({ params, parent }) => {
  const { user } = await parent()

  // await projects.update(user.userId, params.id, {
  //   state: AnalysisState.COMPLETE,
  //   scene: {
  //     position: [10, 10, 0],
  //     up: [0.0, -1, -1],
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
