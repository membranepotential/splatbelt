import { getDownloadUrl, exists } from '$lib/server/pointCloud'
import { redirect, error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

/*
The gaussian-splats-3d viewer wants a URL that ends with a file extension,
so we comply and simply redirect.
*/
export const load: PageServerLoad = async ({ params, parent, setHeaders }) => {
  const { user } = await parent()

  if (await exists(user.userId, params.id)) {
    setHeaders({ 'Cache-Control': 'max-age=3600' })
    redirect(302, await getDownloadUrl(user.userId, params.id))
  } else {
    error(404, 'Not Found')
  }
}
