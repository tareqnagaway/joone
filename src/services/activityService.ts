import { supabase } from './supabase';

/** آخر رحلات الراكب — جدول rides (لا يوجد جدول activities في المخطط الموحّد) */
export const fetchActivities = async (userId: string) => {
  const { data, error } = await supabase
    .from('rides')
    .select('*')
    .eq('passenger_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching rides (activities):', error);
    return [];
  }
  return data || [];
};
