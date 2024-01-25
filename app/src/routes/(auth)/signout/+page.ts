import { redirect } from '@sveltejs/kit'
import { signOut } from 'aws-amplify/auth'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { user } = await parent()
  console.log('signing out', user)
  if (user) await signOut()
  redirect(302, '/login')
}

export const ssr = false
