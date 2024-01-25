import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import { listByState } from '$lib/server/projects'
import { AnalysisState } from '$lib/schemas'
import { validateBackendSecret } from '$lib/server/auth'

export const GET: RequestHandler = async ({ request }) => {
  validateBackendSecret(request)
  const projects = await listByState(AnalysisState.PENDING)
  return json(projects)
}
