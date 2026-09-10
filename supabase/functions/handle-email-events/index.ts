import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

type EventData = { recipient: string; message_id?: string }

function getAdminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Server configuration error')
  return createClient(url, key)
}

async function recordOutcome(
  eventId: string,
  data: EventData,
  reason: 'bounce' | 'complaint' | 'unsubscribe',
  status: 'bounced' | 'complained' | 'suppressed',
  message: string,
) {
  const admin = getAdminClient()
  const recipient = data.recipient.toLowerCase()
  const { error: suppressionError } = await admin.from('suppressed_emails').upsert(
    { email: recipient, reason, metadata: null },
    { onConflict: 'email' },
  )
  if (suppressionError) {
    console.error('Failed to record email outcome', {
      code: suppressionError.code,
      message: suppressionError.message,
      event_id: eventId,
    })
    throw suppressionError
  }

  let duplicateQuery = admin
    .from('email_send_log')
    .select('id')
    .eq('recipient_email', recipient)
    .eq('status', status)
  duplicateQuery = data.message_id
    ? duplicateQuery.eq('message_id', data.message_id)
    : duplicateQuery.is('message_id', null)
  const { data: existing, error: lookupError } = await duplicateQuery.maybeSingle()
  if (lookupError) throw lookupError
  if (existing) return

  const { error: logError } = await admin.from('email_send_log').insert({
    message_id: data.message_id ?? null,
    template_name: 'system',
    recipient_email: recipient,
    status,
    error_message: message,
    metadata: null,
  })
  if (logError) {
    console.error('Failed to log email outcome', {
      code: logError.code,
      message: logError.message,
      event_id: eventId,
    })
    throw logError
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await recordOutcome(event.event_id, event.data, 'bounce', 'bounced', 'Permanent bounce — email address is invalid or rejected')
    },
    'email.complaint': async (event) => {
      await recordOutcome(event.event_id, event.data, 'complaint', 'complained', 'Spam complaint — recipient marked email as spam')
    },
    'email.unsubscribed': async (event) => {
      await recordOutcome(event.event_id, event.data, 'unsubscribe', 'suppressed', 'Recipient unsubscribed')
    },
  },
})

Deno.serve((req) => handler(req))
