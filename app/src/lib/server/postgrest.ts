import { API_URL } from '$env/static/private'

import { STATUS_CODES } from 'http'

export class HTTPError extends Error {
  status: number
  extras?: any

  constructor(status: number, extras?: any) {
    super(STATUS_CODES[status])
    this.name = 'HTTPError'
    this.status = status
    this.extras = extras
  }
}

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
    throw new HTTPError(response.status)
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
