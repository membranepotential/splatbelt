import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import * as projects from '$lib/server/projects'

export const POST: RequestHandler = async ({ request, params }) => {
  const { id } = params
  const body = await request.json()
  await projects.update(id, { shots: body })
  return json({ ok: true })
}
