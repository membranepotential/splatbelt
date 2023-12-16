import * as projects from '$lib/server/projects'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ params }) => {
  return { project: await projects.get(params.id) }
}
