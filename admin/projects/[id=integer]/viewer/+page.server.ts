import { getDownloadUrl } from '$lib/server/pointCloud'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  return {
    pointCloudUrl: await getDownloadUrl(params.id),
  }
}
