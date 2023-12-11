import * as projects from '$lib/server/projects'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ params }) => {
  return { project: projects.get(params.id) }
}
