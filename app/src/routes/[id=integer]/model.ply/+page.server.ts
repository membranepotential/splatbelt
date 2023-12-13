import { getDownloadUrl, exists } from '$lib/server/pointCloud'
import { redirect, error } from '@sveltejs/kit'

/*
The gaussian-splats-3d viewer wants a URL that ends with a file extension,
so we comply and simply redirect.
*/
export async function load({ params }) {
  if (await exists(params.id)) {
    throw redirect(302, await getDownloadUrl(params.id))
  } else {
    throw error(404, 'Not Found')
  }
}
