// DB-backed rate-limited insert game edge function
// Max 10 requests per IP per hour

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WINDOW_HOURS = 1
const MAX_REQUESTS = 10

const allowedOrigins = [
  'https://diagmatrix.github.io',
  'http://localhost:5173'
]

function getCorsHeaders(origin: string | null) {
  if (origin && allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
    }
  }
  return {
    'Access-Control-Allow-Origin': 'null',
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = {
    ...getCorsHeaders(origin),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get client IP (best-effort)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'

    const { count, error: countError } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString())

    if (countError) throw countError

    if ((count || 0) >= MAX_REQUESTS) {
      const retryAfterSeconds = WINDOW_HOURS * 60 * 60
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfterSeconds }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSeconds)
          }
        }
      )
    }

    // Record this request
    const { error: insertRateError } = await supabase
      .from('rate_limits')
      .insert([{ ip }])

    if (insertRateError) {
      console.error('Error recording rate limit:', insertRateError)
      // Continue processing the request even if we fail to record the rate limit
    }

    const gameData = await req.json()

    if (
      !gameData.playerData ||
      !Array.isArray(gameData.playerData) ||
      !gameData.winner ||
      !gameData.gameDate
    ) {
      return new Response(
        JSON.stringify({ error: 'Invalid game data', warning: insertRateError }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (gameData.playerData.length > 6) {
      return new Response(
        JSON.stringify({ error: 'Too many players', warning: insertRateError }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate each player
    for (const player of gameData.playerData) {
      if (!player.player || !player.commander) {
        return new Response(
          JSON.stringify({ error: 'Invalid player data', warning: insertRateError }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    const game_id = crypto.randomUUID()

    const rows = gameData.playerData.map((player: { player: string; commander: string }) => ({
      game_id,
      game_date: gameData.gameDate,
      player: player.player,
      commander: player.commander,
      is_winner: player.player === gameData.winner,
      is_starting: player.player === gameData.startingPlayer,
      _created_at: new Date().toISOString()
    }))

    // Insert game rows
    const { error } = await supabase
      .from('games')
      .insert(rows)

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, warning: insertRateError }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)

    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
