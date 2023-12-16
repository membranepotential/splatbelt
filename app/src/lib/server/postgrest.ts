import { API_URL } from '$env/static/private'
import { error, type NumericRange } from '@sveltejs/kit'

function withBaseURL(input: RequestInfo | URL): RequestInfo | URL {
  if (input instanceof Request) {
    return new Request(withBaseURL(input.url), input)
  }
  return new URL(input, API_URL).toString()
}

export async function fetch(input: RequestInfo | URL, init?: RequestInit) {
  init = init ?? {}
  init.headers = { ...init.headers, 'Content-Type': 'application/json' }
  const response = await global.fetch(withBaseURL(input), init)

  if (!response.ok) {
    // This satisfies the type checker. technically 300-399 could lead to issues here
    const status = response.status as NumericRange<400, 599>
    error(status, response.statusText)
  }

  return response
}

export function get(url: string) {
  return fetch(url).then((res) => res.json())
}

export function getOne(url: string) {
  return fetch(url, {
    headers: { Accept: 'application/vnd.pgrst.object+json' },
  }).then((res) => res.json())
}
