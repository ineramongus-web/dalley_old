import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dkqwxjxbnczcgnroltnd.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcXd4anhibmN6Y2ducm9sdG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0Njk4OTgsImV4cCI6MjA4MDA0NTg5OH0.zTD1OUcF-C5QO0KfRYpnUH9NNtT-nx0OomKxC5ZI1bs';

/**
 * Create a new Supabase session for a user (used after device token validation)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user data
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate a new session for the user
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
    });

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    // Extract session tokens from the magic link
    const url = new URL(data.properties.action_link);
    const accessToken = url.searchParams.get('access_token');
    const refreshToken = url.searchParams.get('refresh_token');

    if (!accessToken || !refreshToken) {
      return NextResponse.json(
        { error: 'Failed to generate session tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: user,
    });

  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
