import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, accept-profile, x-requested-with',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { email, display_name, center_id, role } = await req.json()

    // Validate input
    if (!email || !display_name || !center_id || !role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate role against enum values
    const validRoles = ['treasurer', 'viewer', 'exporter', 'center_admin', 'app_admin']
    if (!validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emailLower = email.toLowerCase().trim()
    const displayNameTrimmed = display_name.trim()

    // Check if email already has a pending invitation
    const { data: existingInvitation } = await supabaseClient
      .from('pending_invitations')
      .select('id')
      .eq('email', emailLower)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: 'An invitation is already pending for this email address' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user already exists in auth.users - CORRECTED METHOD
    const { data: existingUsers, error: userCheckError } = await supabaseClient
      .from('admins')
      .select('id')
      .eq('email', emailLower)
      .single()

    if (existingUsers) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create pending invitation
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('pending_invitations')
      .insert({
        email: emailLower,
        display_name: displayNameTrimmed,
        center_id,
        role,
        status: 'pending'
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Invitation creation error:', invitationError)
      throw invitationError
    }

    // Send invitation email
    const { data: inviteData, error: inviteError } = await supabaseClient.auth.admin.inviteUserByEmail(
      emailLower,
      {
        data: {
          display_name: displayNameTrimmed,
          invitation_id: invitation.id,
          center_id: center_id,
          role: role,
          invited_via: 'admin_invitation'
        }
      }
    )

    if (inviteError) {
      console.error('Invite email error:', inviteError)
      // Clean up pending invitation if email fails
      await supabaseClient
        .from('pending_invitations')
        .delete()
        .eq('id', invitation.id)
      throw inviteError
    }

    // If invitation was successful, try to process any existing user with this email
    // This handles cases where the user already exists but wasn't properly linked
    try {
      const { data: processResult, error: processError } = await supabaseClient
        .rpc('process_pending_invitation', { user_email: emailLower })
      
      if (processError) {
        console.log('Could not immediately process invitation (user may not exist yet):', processError.message)
      } else if (processResult) {
        console.log('Successfully processed existing user invitation')
      }
    } catch (processErr) {
      console.log('Invitation processing will happen when user accepts:', processErr)
    }

    console.log('Invitation sent successfully:', { email: emailLower, invitation_id: invitation.id })

    return new Response(
      JSON.stringify({ success: true, invitation_id: invitation.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge Function Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.details || null
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})