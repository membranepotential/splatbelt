import type { PageLoad } from './$types'

export const load: PageLoad = async ({ data }) => {
  return { pointCloud: fetch(data.pointCloudUrl).then((res) => res.blob()) }
}
