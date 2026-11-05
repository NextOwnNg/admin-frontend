import { HttpResponse } from 'msw'
import { droppedAnswers, idempotentReplies } from '@/mocks/db/store'

/**
 * Replays the first answer for a repeated Idempotency-Key; otherwise runs the write, remembers its answer,
 * and drops the answer when a test asked for a lost response (design §5.6).
 */
export async function idempotent(request: Request, recordId: string, write: () => Promise<Response> | Response) {
  const key = request.headers.get('Idempotency-Key')
  const replies = idempotentReplies()
  const earlier = key ? replies.get(key) : undefined
  if (earlier) return HttpResponse.json(earlier.body as object, { status: earlier.status })

  const response = await write()
  if (key && response.ok) replies.set(key, { status: response.status, body: await response.clone().json() })
  if (response.ok && droppedAnswers().delete(recordId)) return HttpResponse.error()
  return response
}
