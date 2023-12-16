import type { Project, ProjectUpdate } from '$lib/schemas'
import * as postgrest from './postgrest'

export function list(): Promise<Project[]> {
  return postgrest.get('/projects')
}

export function get(id: string): Promise<Project> {
  return postgrest.getOne(`/projects?id=eq.${id}`)
}

export function create(name = 'New Project'): Promise<Project> {
  return postgrest
    .fetch('/projects', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        name: name,
      }),
    })
    .then((r) => r.json())
    .then((data) => data[0])
}

export function update(id: string, data: ProjectUpdate) {
  return postgrest.fetch(`/projects?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function delete_(id: string) {
  return postgrest.fetch(`/projects?id=eq.${id}`, { method: 'DELETE' })
}
