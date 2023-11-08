import type { Project } from '$lib'
import * as schemas from '$lib/schemas'
import * as postgrest from './postgrest'

const defaultConfig = {
  frames: {},
  pairing: { type: 'exhaustive' },
  features: 'sift',
  matcher: 'vocab_tree',
  numIter: 7000,
}

const defaultProject = schemas.project.parse({
  name: 'New Project',
  config: defaultConfig,
})

export function list() {
  return postgrest.get('/projects') as Promise<Project[]>
}

export function get(id: string) {
  return postgrest.getOne(`/projects?id=eq.${id}`) as Promise<Project>
}

export function create() {
  return postgrest.fetch('/projects', {
    method: 'POST',
    body: JSON.stringify(defaultProject),
  })
}

export function update(id: string, data: Partial<Project>) {
  return postgrest.fetch(`/projects?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(schemas.project.parse(data)),
  })
}

export function delete_(id: string) {
  return postgrest.fetch(`/projects?id=eq.${id}`, { method: 'DELETE' })
}
