import { EmailAPIError, sendLovableEmail } from 'npm:@lovable.dev/email-js@0.1.0'

const SITE_NAME = 'High society botanicals'
const SENDER_DOMAIN = 'notify.highsocietybotanicals.com'
const FROM_DOMAIN = 'highsocietybotanicals.com'

export interface SendRawEmailOptions {
  to: string
  subject: string
  html: string
  text: string
  label: string
  idempotencyKey: string
  replyTo?: string
}

export async function sendRawEmail(
  options: SendRawEmailOptions,
): Promise<{ sent: true } | { sent: false; reason: 'recipient_suppressed' }> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured')

  try {
    await sendLovableEmail(
      {
        to: options.to,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject: options.subject,
        html: options.html,
        text: options.text,
        purpose: 'transactional',
        label: options.label,
        idempotency_key: options.idempotencyKey,
        reply_to: options.replyTo,
      },
      { apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') },
    )
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === 'recipient_suppressed') {
      return { sent: false, reason: 'recipient_suppressed' }
    }
    throw error
  }

  return { sent: true }
}