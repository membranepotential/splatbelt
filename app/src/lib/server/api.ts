import { API_URL } from '$env/static/private'
import type { RequestEvent } from '@sveltejs/kit'

const withBaseURL = (url: string) => new URL(url, API_URL)

export async function list(collection: string, { fetch }: RequestEvent) {
  return fetch(withBaseURL(`/${collection}`))
}

export async function get(
  collection: string,
  id: string,
  { fetch }: RequestEvent
) {
  return fetch(withBaseURL(`/${collection}?id=eq.${id}`))
}

export async function create(
  collection: string,
  data: { [key: string]: any }, // eslint-disable-line @typescript-eslint/no-explicit-any
  { fetch }: RequestEvent
) {
  return fetch(withBaseURL(`/${collection}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}

export async function delete_(
  collection: string,
  id: string,
  { fetch }: RequestEvent
) {
  return fetch(withBaseURL(`/${collection}?id=eq.${id}`), {
    method: 'DELETE',
  })
}

export async function update(
  collection: string,
  id: string,
  data: unknown,
  { fetch }: RequestEvent
) {
  return fetch(withBaseURL(`/${collection}?id=eq.${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}
