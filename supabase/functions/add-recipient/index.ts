import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-profile',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400'
}

interface Recipient {
  name: string
  date: string
  address?: string
  phone_number?: string
  driver_license?: string
  marital_status: 'single' | 'married'
  zakat_requests: number
  notes?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const recipientData: Recipient = await req.json()

    // Validate required fields
    const errors: string[] = []
    if (!recipientData.name?.trim()) errors.push('Name is required')
    if (!recipientData.date?.trim()) errors.push('Date is required')
    if (!recipientData.marital_status || !['single', 'married'].includes(recipientData.marital_status)) {
      errors.push('Valid marital status is required')
    }
    if (typeof recipientData.zakat_requests !== 'number' || recipientData.zakat_requests < 0) {
      errors.push('Zakat requests must be a non-negative number')
    }
    if (recipientData.phone_number && !/^\(\d{3}\) \d{3}-\d{4}$/.test(recipientData.phone_number)) {
        errors.push('Invalid phone number format')
      }

    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: errors.join('; ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user exists in admins table (for verification)
    const { data: adminData, error: adminError } = await supabaseClient
      .from('admins')
      .select('id')
      .eq('email', user.email)
      .single()

    if (adminError || !adminData) {
      throw new Error('Unauthorized: Only admins can add recipients')
    }

    // Get admin's center using the auth user ID directly
    const { data: adminCenter, error: centerError } = await supabaseClient
      .from('admin_centers')
      .select('center_id')
      .eq('admin_id', user.id)  // Use user.id from auth.users, not adminData.id
      .single()

    if (centerError || !adminCenter) {
      throw new Error('No center access found')
    }

    // Sanitize input
    const sanitizeInput = (input: string): string => {
      return input
        .replace(/[<>{}]/g, '')
        .trim()
        .substring(0, 1000)
    }

    const sanitizedData = {
      ...recipientData,
      name: sanitizeInput(recipientData.name),
      address: recipientData.address ? sanitizeInput(recipientData.address) : undefined,
      phone_number: recipientData.phone_number ? sanitizeInput(recipientData.phone_number) : undefined,
      driver_license: recipientData.driver_license ? sanitizeInput(recipientData.driver_license) : undefined,
      notes: recipientData.notes ? sanitizeInput(recipientData.notes) : undefined,
    }

    // Insert recipient
    const { data: recipient, error: insertError } = await supabaseClient
      .from('recipients')
      .insert([{
        ...sanitizedData,
        center_id: adminCenter.center_id,
        added_by_admin_id: adminData.id,  // Use adminData.id for the admins table reference
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        centers (name),
        admins!added_by_admin_id (display_name)
      `)
      .single()

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify(recipient),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})