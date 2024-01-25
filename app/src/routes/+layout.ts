import { Amplify } from 'aws-amplify'
import { getCurrentUser } from 'aws-amplify/auth'
import type { LayoutLoad } from './$types'
import { browser } from '$app/environment'
import authConfig from '$lib/authConfig'

if (browser) {
  Amplify.configure(authConfig, { ssr: true })
}

export const load: LayoutLoad = async () => {
  if (browser) {
    let user
    try {
      user = await getCurrentUser()
      console.log('logged in as', user.username, user.userId)
    } catch (e) {
      // nobody is logged in
    }
    return { user }
  }
}
