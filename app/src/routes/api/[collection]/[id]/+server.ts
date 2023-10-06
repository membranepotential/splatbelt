import { API_URL } from '$env/static/private';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const fallback: RequestHandler = async ({ request, params, fetch }) => {
  const apiUrl = new URL(`${params.collection}?id=eq.${params.id}`, API_URL);
  // console.log(apiUrl.toString());

  request.headers.set('Accept', 'application/vnd.pgrst.object+json');
  const res = await fetch(new Request(apiUrl, request));

  if (res.ok) {
    return res;
  } else if (res.status == 406) {
    throw error(404, 'Not found');
  } else {
    throw error(res.status, res.statusText);
  }
};
