import { Project, ProjectUpdate } from '$lib/schemas'
import * as postgrest from './postgrest'

export function list(): Promise<Project[]> {
  return postgrest
    .get('/projects')
    .then((projects: Project[]) =>
      projects
        .map((project) => Project.parse(project))
        .sort((a, b) => b.updated.getTime() - a.updated.getTime())
    )
}

export function get(id: string): Promise<Project> {
  return postgrest.getOne(`/projects?id=eq.${id}`).then(Project.parse)
}

export function create() {
  return postgrest.fetch('/projects', {
    method: 'POST',
    body: JSON.stringify(Project.parse({})),
  })
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
