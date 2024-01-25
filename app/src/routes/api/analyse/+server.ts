import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import * as projects from '$lib/server/projects'
import { error } from '@sveltejs/kit'
import type { AnalysisState } from '$lib/schemas'
import { validateBackendSecret } from '$lib/server/auth'

type AnalyseUpdate =
  | {
      state: AnalysisState.RUNNING | AnalysisState.FAILED
    }
  | {
      state: AnalysisState.COMPLETE
      scene: projects.SceneItem
    }

export const POST: RequestHandler = async ({ request }) => {
  validateBackendSecret(request)

  const project = await request.json()
  const { user, id, state } = project

  if (!['PENDING', 'RUNNING', 'COMPLETE', 'FAILED'].includes(state)) {
    throw error(400, 'Invalid state')
  }

  let data: AnalyseUpdate = { state }
  if (state === 'COMPLETE') {
    if (!project.scene) throw error(400, 'Missing scene')
    data = { state, scene: project.scene }
  }

  await projects.update(user, id, data)
  return json({ ok: true })
}
