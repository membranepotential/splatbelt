import type { RequestHandler } from './$types'
import { json } from '@sveltejs/kit'
import * as projects from '$lib/server/projects'
import { error } from '@sveltejs/kit'
import { fetchUserAttributes } from 'aws-amplify/auth'

export const POST: RequestHandler = async ({ request, params }) => {
  const { id } = params
  const body = await request.json()

  const { sub } = await fetchUserAttributes()
  if (!sub) error(403, 'Forbidden')

  await projects.update(sub, id, { shots: body })
  return json({ ok: true })
}
