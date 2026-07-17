import { createClient } from "@supabase/supabase-js";

const getEnv = (key: string) => {
  try {
    // Attempt to get from import.meta.env first (Vite standard)
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
    // Fallback to process.env (Node/Define fallback)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
    return "";
  } catch {
    return "";
  }
};

const cleanValue = (val: any) => {
  if (typeof val !== 'string') return "";
  let cleaned = val.trim();
  // Strip potential wrapping quotes
  while ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  return cleaned;
};

const rawUrl = cleanValue(getEnv('VITE_SUPABASE_URL'));
const supabaseAnonKey = cleanValue(getEnv('VITE_SUPABASE_ANON_KEY'));

// Robust URL cleaning to ensure ONLY the origin is used
function getCleanOrigin(urlStr: string): string {
  if (!urlStr) return "";
  try {
    // If it starts with h, assume it might be a full URL
    if (urlStr.toLowerCase().startsWith('http')) {
      const url = new URL(urlStr);
      return url.origin;
    }
    // Otherwise, try to fix it if it looks like a domain
    if (urlStr.includes('.supabase.co')) {
      return `https://${urlStr.split('/')[0]}`;
    }
    return urlStr;
  } catch {
    // Fallback splitting logic if URL parsing fails
    return urlStr.split('/rest/v1')[0].split('/auth/v1')[0].replace(/\/$/, "");
  }
}

const supabaseUrl = getCleanOrigin(rawUrl);

function isValidSupabaseUrl(url: string) {
  try {
    if (!url || url.includes('your-project') || url === 'undefined' || url === 'null') return false;
    const parsed = new URL(url);
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
    const isWebEnv = typeof window !== 'undefined' && (window.location.hostname.endsWith('.run.app') || window.location.hostname.includes('.studio'));
    
    // If we are on the web but URL is localhost, it's likely a configuration error
    if (isWebEnv && isLocalhost) {
      console.warn("Supabase configuration error: VITE_SUPABASE_URL is set to localhost but app is running on the web. Authentication will likely fail.");
    }
    
    return (parsed.protocol === 'https:' || parsed.protocol === 'http:') && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

export const supabase = (supabaseUrl && isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey && supabaseAnonKey.length > 20) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        fetch: async (input, init) => {
          try {
            const res = await window.fetch(input, init);
            return res;
          } catch (err: any) {
            console.warn("Supabase network request intercepted gracefully:", err?.message || err);
            return new Response(JSON.stringify({
              error: "service_unavailable",
              message: "Supabase database or authentication endpoint is currently unreachable."
            }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
      }
    }) 
  : null;
