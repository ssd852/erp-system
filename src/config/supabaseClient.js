import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Dev diagnostics ──────────────────────────────────────────────────────────
const urlOk  = supabaseUrl  && !supabaseUrl.includes('your-project-id');
const keyOk  = supabaseAnonKey && !supabaseAnonKey.includes('your-anon-public-key');

if (import.meta.env.DEV) {
    console.group('%c🔌 Supabase Config Check', 'font-weight:bold;font-size:14px;color:#a78bfa');
    console.log(`VITE_SUPABASE_URL  : ${urlOk  ? '✅ ' + supabaseUrl  : '❌ MISSING or still placeholder'}`);
    console.log(`VITE_SUPABASE_ANON_KEY: ${keyOk ? '✅ (key present)' : '❌ MISSING or still placeholder'}`);
    if (!urlOk || !keyOk) {
        console.warn(
            '⚠️  Fill in your real keys inside  .env.local  (project root):\n\n' +
            '  VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co\n' +
            '  VITE_SUPABASE_ANON_KEY=eyJh...\n\n' +
            'Then RESTART the dev server (Ctrl+C → npm run dev).'
        );
    }
    console.groupEnd();
}

// Export a flag so UI components can show a helpful warning
export const supabaseReady = urlOk && keyOk;

// Safe fallback prevents createClient from throwing with undefined args
export const supabase = createClient(
    urlOk  ? supabaseUrl      : 'https://placeholder.supabase.co',
    keyOk  ? supabaseAnonKey  : 'placeholder-anon-key'
);
