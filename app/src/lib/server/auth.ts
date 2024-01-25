import {
  createKeyValueStorageFromCookieStorageAdapter,
  createUserPoolsTokenProvider,
  createAWSCredentialsAndIdentityIdProvider,
  runWithAmplifyServerContext,
} from 'aws-amplify/adapter-core'
import { getCurrentUser } from 'aws-amplify/auth/server'
import type { AuthUser } from 'aws-amplify/auth'
import { error, type Cookies } from '@sveltejs/kit'
import authConfig from '$lib/authConfig'
import { Config } from 'sst/node/config'

function cookieAdapter(cookies: Cookies) {
  return createKeyValueStorageFromCookieStorageAdapter({
    get: (name: string) => ({ name, value: cookies.get(name) }),
    getAll: cookies.getAll,
    set: (name: string, value: string) => {
      cookies.set(name, value, { path: '/' })
    },
    delete: (name: string) => cookies.delete(name, { path: '/' }),
  })
}

export function getCurrentUserFromCookies(
  cookies: Cookies
): Promise<AuthUser | undefined> {
  const keyValueStorage = cookieAdapter(cookies)
  const tokenProvider = createUserPoolsTokenProvider(
    authConfig.Auth,
    keyValueStorage
  )
  const credentialsProvider = createAWSCredentialsAndIdentityIdProvider(
    authConfig.Auth,
    keyValueStorage
  )

  return new Promise((resolve) => {
    runWithAmplifyServerContext(
      authConfig,
      { Auth: { tokenProvider, credentialsProvider } },
      (contextSpec) => getCurrentUser(contextSpec).then((user) => resolve(user))
    ).catch((_error) => {
      resolve(undefined)
    })
  })
}

export function validateBackendSecret(request: Request) {
  const header = request.headers.get('Authorization')
  if (!header) throw error(401, 'Missing Authorization header')

  const token = header.split(' ')[1]
  if (token !== Config.CLIENT_SECRET) {
    throw error(401, 'Invalid Authorization header')
  }
}
