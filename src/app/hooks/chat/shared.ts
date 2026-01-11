'use client';

import { createClient } from '../../utils/supabase/client';

export const supabase = createClient();

export const BASE_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://express-back-end-phi.vercel.app/api';

export const CONFETTI_DURATION = 3000;

export async function getAuthHeader(): Promise<{ Authorization?: string }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : { Authorization: undefined };
}
