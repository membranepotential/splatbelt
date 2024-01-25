// import { browser } from '$app/environment'
// import type { LayoutLoad } from './$types'
// import { redirect } from '@sveltejs/kit'

// export const load: LayoutLoad = async ({ parent }) => {
//   if (browser) {
//     const { user } = await parent()
//     if (!user) {
//       console.log('redirecting to login')
//       redirect(302, '/login')
//     }
//   }
// }
