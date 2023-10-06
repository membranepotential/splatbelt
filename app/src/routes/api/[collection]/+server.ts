import { API_URL } from '$env/static/private'
import type { RequestHandler } from './$types'

export const fallback: RequestHandler = async ({ request, params, fetch }) => {
  const apiUrl = new URL(params.collection, API_URL)
  return fetch(new Request(apiUrl, request))
}
