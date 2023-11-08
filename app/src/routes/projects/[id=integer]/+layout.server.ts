import type { LayoutServerLoad } from './$types'
import * as projects from '$lib/server/projects'

export const load: LayoutServerLoad = ({ params }) => {
  return { project: projects.get(params.id) }
}
