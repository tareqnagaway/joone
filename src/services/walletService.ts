import { supabase } from './supabase';
import type { Wallet } from '../types';

export const getWalletBalance = async (userId: string) => {
  const { data, error } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle(); // Use maybeSingle to avoid 406 error if record not found

  if (error) {
    console.error('Error fetching wallet:', error);
    return null;
  }
  return data;
};

function mapWalletRow(row: Record<string, unknown>): Wallet {
  return {
    user_id: String(row.user_id),
    balance: Number(row.balance ?? 0),
    updated_at: String(row.updated_at ?? ''),
  };
}

/**
 * يضمن وجود صف في `wallets` للمستخدم (رصيد ابتدائي 0).
 * بدون ذلك لا يعمل خصم الرحلة ولا شحن المحفظة عبر update.
 */
export async function ensureWallet(userId: string): Promise<Wallet | null> {
  const { data: existing, error: selErr } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (selErr) {
    console.error('ensureWallet select:', selErr);
    return null;
  }

  if (existing) {
    return mapWalletRow(existing as Record<string, unknown>);
  }

  const { data: created, error: insErr } = await supabase
    .from('wallets')
    .insert({ user_id: userId, balance: 0 })
    .select()
    .single();

  if (insErr) {
    console.error('ensureWallet insert:', insErr);
    return null;
  }

  return mapWalletRow(created as Record<string, unknown>);
}
