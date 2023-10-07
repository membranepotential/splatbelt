import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

/**
 * Redirect users from [id]/ to [id]/edit
 */
export const load: PageServerLoad = ({ url }) => {
  const pathname = url.pathname
  throw redirect(302, `${pathname}/edit`)
}
