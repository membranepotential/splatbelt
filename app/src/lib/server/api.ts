import { API_URL } from '$env/static/private'
import type { RequestEvent } from '@sveltejs/kit'

export async function list(collection: string, { fetch }: RequestEvent) {
  const url = new URL(`/${collection}`, API_URL)
  return fetch(url)
}

export async function get(
  collection: string,
  id: string,
  { fetch }: RequestEvent
) {
  const url = new URL(`/${collection}?id=eq.${id}`, API_URL)
  return fetch(url)
}

export async function create(
  collection: string,
  data: any,
  { fetch }: RequestEvent
) {
  const url = new URL(`/${collection}`, API_URL)
  return fetch(url, {
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
  const url = new URL(`/${collection}?id=eq.${id}`, API_URL)
  return fetch(url, {
    method: 'DELETE',
  })
}

export async function update(
  collection: string,
  id: string,
  data: unknown,
  { fetch }: RequestEvent
) {
  const url = new URL(`/${collection}?id=eq.${id}`, API_URL)
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
}
