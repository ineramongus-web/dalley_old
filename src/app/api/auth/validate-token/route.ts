import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dkqwxjxbnczcgnroltnd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcXd4anhibmN6Y2ducm9sdG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Njk4OTgsImV4cCI6MjA4MDA0NTg5OH0.zTD1OUcF-C5QO0KfRYpnUH9NNtT-nx0OomKxC5ZI1bs';

// Rate limiting map (simple in-memory rate limiting)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // 10 requests per minute

/**
 * Hash a string using SHA-256
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { token, fingerprint } = body;

    if (!token || !fingerprint) {
      return NextResponse.json(
        { error: 'Token and fingerprint are required' },
        { status: 400 }
      );
    }

    // Hash the token
    const tokenHash = await hashString(token);

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Query device_sessions table
    const { data: sessions, error } = await supabase
      .from('device_sessions')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('is_revoked', false)
      .single();

    if (error || !sessions) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Security check: Verify fingerprint matches
    if (sessions.device_fingerprint !== fingerprint) {
      // Token is being used from a different device - potential security breach
      console.warn('Token used from different device. Revoking token.', {
        storedFingerprint: sessions.device_fingerprint,
        providedFingerprint: fingerprint,
      });

      // Revoke the token
      await supabase
        .from('device_sessions')
        .update({ is_revoked: true })
        .eq('id', sessions.id);

      return NextResponse.json(
        { error: 'Security violation: Device fingerprint mismatch' },
        { status: 403 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(sessions.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 401 }
      );
    }

    // Update last_used_at
    await supabase
      .from('device_sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', sessions.id);

    // Return user_id for session creation
    return NextResponse.json({
      valid: true,
      userId: sessions.user_id,
    });

  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
