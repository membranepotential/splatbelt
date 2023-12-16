import * as projects from '$lib/server/projects'
import type { Project } from '$lib/schemas'
import type { LayoutServerLoad } from './$types'

export type LayoutLoadResponse = {
  project: Project
}
export const load: LayoutServerLoad = async ({ params }) => {
  return { project: await projects.get(params.id) }
}
