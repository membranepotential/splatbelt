/**
 * https://kit.svelte.dev/docs/hooks
 * https://gist.github.com/michaelwooley/3d35e552fbaeaa44801f93228c486a8a
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer#security_requirements
 */
import type { Handle } from '@sveltejs/kit'
import { Amplify } from 'aws-amplify'
import { env } from '$env/dynamic/private'

export const handle: Handle = async ({ event, resolve }) => {
  const authConfig = {
    Cognito: {
      region: env.AWS_REGION,
      userPoolId: env.USER_POOL_ID,
      userPoolClientId: env.USER_POOL_CLIENT_ID,
      identityPoolId: env.IDENTITY_POOL_ID,
    },
  }
  Amplify.configure({ Auth: authConfig })

  const response = await resolve(event)

  /**
   * We want the headers for our web workers to use the shared array buffer.
   * However, not all server responses allow us to set these headers,
   * e.g. redirects are immutable. Doesn't matter, we just set it where we can.
   */
  try {
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  } catch (e) {
    // console.error(e)
  }

  return response
}
