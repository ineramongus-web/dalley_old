// Device Token Management System
// Generates and validates secure device tokens for cross-domain authentication

import type { SupabaseClient } from '@supabase/supabase-js';

export interface DeviceInfo {
  userAgent: string;
  screenResolution: string;
  timezone: string;
  language: string;
  platform: string;
  colorDepth: number;
}

export interface DeviceSession {
  id: string;
  user_id: string;
  token_hash: string;
  device_fingerprint: string;
  device_info: DeviceInfo;
  last_used_at: string;
  expires_at: string;
  created_at: string;
  is_revoked: boolean;
}

/**
 * Synchronous hash for fingerprint (uses simple hash algorithm)
 */
function hashStringSync(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Generate a unique device fingerprint based on browser characteristics
 * This prevents token cloning to different devices
 */
export function generateDeviceFingerprint(): string {
  const components: string[] = [
    navigator.userAgent,
    screen.width.toString(),
    screen.height.toString(),
    screen.colorDepth.toString(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    navigator.language,
    navigator.platform || 'unknown',
    navigator.hardwareConcurrency?.toString() || '0',
  ];

  // Create a consistent fingerprint
  const fingerprint = components.join('|');
  return hashStringSync(fingerprint);
}

/**
 * Get detailed device information
 */
export function getDeviceInfo(): DeviceInfo {
  return {
    userAgent: navigator.userAgent,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform || 'unknown',
    colorDepth: screen.colorDepth,
  };
}

/**
 * Generate a new unique device token (UUID v4)
 */
export function generateDeviceToken(): string {
  return crypto.randomUUID();
}

/**
 * Hash a device token using SHA-256 (async)
 */
export async function hashDeviceToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Store device token in localStorage
 */
export function storeDeviceToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('device_token', token);
  }
}

/**
 * Retrieve device token from localStorage
 */
export function getStoredDeviceToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('device_token');
  }
  return null;
}

/**
 * Remove device token from localStorage
 */
export function removeDeviceToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('device_token');
  }
}

/**
 * Check if device token exists in URL parameters
 */
export function getDeviceTokenFromURL(): string | null {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    return params.get('deviceToken');
  }
  return null;
}

/**
 * Create a new device session in the database
 */
export async function createDeviceSession(
  supabase: SupabaseClient,
  userId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const tokenHash = await hashDeviceToken(token);
    const fingerprint = generateDeviceFingerprint();
    const deviceInfo = getDeviceInfo();

    const { error } = await supabase
      .from('device_sessions')
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        device_fingerprint: fingerprint,
        device_info: deviceInfo,
      });

    if (error) {
      console.error('Error creating device session:', error);
      return { success: false, error: error.message };
    }

    // Store token in localStorage
    storeDeviceToken(token);

    return { success: true };
  } catch (error) {
    console.error('Error creating device session:', error);
    return { success: false, error: 'Failed to create device session' };
  }
}

/**
 * Validate a device token via API
 * Returns userId if valid, null otherwise
 */
export async function validateDeviceToken(
  token: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  try {
    const fingerprint = generateDeviceFingerprint();

    const response = await fetch('/api/auth/validate-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        fingerprint,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { valid: false, error: error.error || 'Invalid token' };
    }

    const data = await response.json();
    return { valid: true, userId: data.userId };
  } catch (error) {
    console.error('Error validating device token:', error);
    return { valid: false, error: 'Failed to validate token' };
  }
}

/**
 * Revoke all device sessions for a user
 */
export async function revokeAllDeviceSessions(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('device_sessions')
      .update({ is_revoked: true })
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    removeDeviceToken();
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to revoke sessions' };
  }
}

/**
 * Revoke current device session
 */
export async function revokeCurrentDeviceSession(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fingerprint = generateDeviceFingerprint();

    const { error } = await supabase
      .from('device_sessions')
      .update({ is_revoked: true })
      .eq('user_id', userId)
      .eq('device_fingerprint', fingerprint);

    if (error) {
      return { success: false, error: error.message };
    }

    removeDeviceToken();
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to revoke session' };
  }
}
