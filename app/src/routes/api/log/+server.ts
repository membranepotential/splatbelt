import type { RequestHandler } from './$types'

export async function POST({ request }) {
  const { job, step, timestamp, message } = await request.json()
  
}
