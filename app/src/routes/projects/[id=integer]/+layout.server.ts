import type { LayoutServerLoad } from './$types'
import { error } from '@sveltejs/kit'

export const load: LayoutServerLoad = async ({ fetch, params }) => {
  const res = await fetch(`/api/projects/${params.id}`)

  if (!res.ok) {
    throw error(res.status, 'Project not found')
  }

  return { project: res.json() }
}
