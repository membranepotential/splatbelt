import { Project, ProjectUpdate } from '$lib/schemas'
import * as postgrest from './postgrest'

export function list(): Promise<Project[]> {
  return postgrest.get('/projects')
}

export function get(id: string): Promise<Project> {
  return postgrest.getOne(`/projects?id=eq.${id}`).then(Project.parse)
}

export function create(name: string = 'New Project'): Promise<Project> {
  const project = ProjectUpdate.parse({ name, config: {} })
  return postgrest
    .fetch('/projects', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(project),
    })
    .then((r) => r.json())
    .then((data) => Project.parse(data[0]))
}

export function update(id: string, data: ProjectUpdate) {
  return postgrest.fetch(`/projects?id=eq.${id}`, {
    method: 'PATCH',
    body: JSON.stringify(ProjectUpdate.parse(data)),
  })
}

export function delete_(id: string) {
  return postgrest.fetch(`/projects?id=eq.${id}`, { method: 'DELETE' })
}
