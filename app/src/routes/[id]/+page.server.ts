import * as projects from '$lib/server/projects'
import { error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { AnalysisState } from '$lib/schemas'
import { fetchUserAttributes } from 'aws-amplify/auth'

export const load: PageServerLoad = async ({ params }) => {
  const { sub } = await fetchUserAttributes()
  if (!sub) error(403, 'Forbidden')

  // await projects.update(sub, params.id, {
  //   state: AnalysisState.COMPLETE,
  //   scene: {
  //     position: [5.99, 5.1, -12.77],
  //     up: [-0.07, -0.71, -0.7],
  //     center: [0, 0, 0],
  //     fov: 50,
  //   },
  // })

  const project = await projects.get(sub, params.id)
  if (!project) {
    error(404, 'Project not found')
  } else if (
    [
      AnalysisState.CONFIGURING,
      AnalysisState.PENDING,
      AnalysisState.RUNNING,
    ].includes(project.state)
  ) {
    error(503, 'Analysis pending')
  } else if (project.state === AnalysisState.FAILED) {
    error(500, 'Analysis failed')
  }

  return { project }
}

export const ssr = false
