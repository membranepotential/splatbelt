import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import * as projects from '$lib/server/projects'
import { error } from '@sveltejs/kit'

export const POST: RequestHandler = async ({ request, params, locals }) => {
  if (!locals.user) {
    error(404, 'Not Found')
  }

  const body = await request.json()
  await projects.update(locals.user.userId, params.id, { shots: body })
  return json({ ok: true })
}
