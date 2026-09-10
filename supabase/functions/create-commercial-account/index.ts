import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405)

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'Authentification requise' }, 401)

    const url = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !anonKey || !serviceKey) return json({ error: 'Configuration serveur incomplète' }, 500)

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await userClient.auth.getUser()
    if (!userData.user) return json({ error: 'Session invalide' }, 401)

    const { data: isAdmin } = await userClient.rpc('is_admin')
    if (!isAdmin) return json({ error: 'Accès refusé' }, 403)

    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const fullName = typeof body.full_name === 'string' ? body.full_name.trim().slice(0, 200) : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 20) : ''
    const zone = typeof body.zone === 'string' ? body.zone.trim().slice(0, 200) : ''
    const commissionPercent = Number(body.commission_percent ?? 10)

    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Adresse email invalide' }, 400)
    }
    if (!fullName) return json({ error: 'Nom requis' }, 400)
    if (password.length < 8 || password.length > 72) {
      return json({ error: 'Le mot de passe doit contenir entre 8 et 72 caractères' }, 400)
    }
    if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 100) {
      return json({ error: 'Taux de commission invalide' }, 400)
    }

    const admin = createClient(url, serviceKey)
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existingProfile) return json({ error: 'Un compte existe déjà pour cette adresse email' }, 409)

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    if (createError || !created.user) {
      return json({ error: createError?.message ?? 'Création du compte impossible' }, 400)
    }

    const userId = created.user.id
    try {
      const { error: profileError } = await admin
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          is_pro_validated: true,
          is_vat_validated: false,
        })
        .eq('id', userId)
      if (profileError) throw profileError

      const { error: rolesError } = await admin.from('user_roles').upsert(
        [
          { user_id: userId, role: 'commercial' },
          { user_id: userId, role: 'pro' },
        ],
        { onConflict: 'user_id,role', ignoreDuplicates: true },
      )
      if (rolesError) throw rolesError

      const { error: repError } = await admin.from('sales_reps').insert({
        user_id: userId,
        full_name: fullName,
        email,
        phone: phone || null,
        zone: zone || "50 km autour d'Abbaretz (44170)",
        commission_percent: commissionPercent,
      })
      if (repError) throw repError
    } catch (setupError) {
      await admin.auth.admin.deleteUser(userId)
      throw setupError
    }

    let emailSent = false
    try {
      const response = await fetch(`${url}/functions/v1/send-transactional-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          apikey: serviceKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateName: 'commercial-access',
          recipientEmail: email,
          idempotencyKey: `commercial-access-${userId}`,
          templateData: {
            fullName,
            email,
            password,
            loginUrl: 'https://highsocietybotanicals.com/auth',
          },
        }),
      })
      emailSent = response.ok
      if (!response.ok) console.error('Commercial access email failed', { status: response.status })
    } catch (emailError) {
      console.error('Commercial access email failed', (emailError as Error).message)
    }

    return json({ success: true, emailSent })
  } catch (error) {
    console.error('create-commercial-account error', (error as Error).message)
    return json({ error: 'Création du compte impossible' }, 500)
  }
})