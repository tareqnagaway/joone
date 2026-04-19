import { createClient } from '@supabase/supabase-js';

/**
 * بدون VITE_SUPABASE_* في `.env`، أي إدراج يذهب لمشروع **افتراضي** وليس قاعدتك.
 * أعد تشغيل `npm run dev` بعد كل تعديل على `.env`.
 */
const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envAnon = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const FALLBACK_URL = 'https://rvcyilonydtszgoeixkv.supabase.co';
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabaseUrl = envUrl || FALLBACK_URL;
const supabaseAnonKey = envAnon || FALLBACK_ANON_KEY;

const usingEnv = Boolean(envUrl && envAnon);

if (!usingEnv) {
  console.error(
    '%c[Jo One] تحذير: التطبيق لا يستخدم ملف `.env` كاملاً — الطلبات قد لا تصل لقاعدتك الحقيقية.',
    'color:#b91c1c;font-weight:bold'
  );
  console.info('ضع في `.env`: VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY من Supabase → Settings → API ثم أعد تشغيل السيرفر.');
}

if (envAnon && !envAnon.startsWith('eyJ')) {
  console.error(
    '[Jo One] مفتاح VITE_SUPABASE_ANON_KEY لا يبدو مفتاح Supabase (يجب أن يبدأ بـ eyJ…). انسخ "anon public" من لوحة المشروع.'
  );
}

if (import.meta.env.DEV) {
  try {
    const host = new URL(supabaseUrl).hostname;
    console.info(
      `[Jo One] اتصال Supabase → ${host} ${usingEnv ? '(من .env ✓)' : '(افتراضي — ليست قاعدتك!)'}`
    );
  } catch {
    /* ignore */
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
