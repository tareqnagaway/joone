/**
 * استعلام موحّد لجدول rides + السائق (profiles فقط عبر rides_driver_id_fkey).
 * لا نُضمّن driver_details من profiles لأن PostgREST قد لا يعرض علاقة profiles↔driver_details
 * في الـ schema cache إلا بوجود FK واضح؛ عند الحاجة جلب تفاصيل السائق باستعلام منفصل بـ driver_id.
 */
export const RIDE_WITH_DRIVER_SELECT = `
  *,
  driver:profiles!rides_driver_id_fkey (
    id,
    full_name,
    profile_image
  )
` as const;

/** حالات الرحلة النشطة للراكب (مطابقة لـ rides_status_check في SQL) */
export const PASSENGER_ACTIVE_RIDE_STATUSES = [
  'searching',
  'accepted',
  'arrived',
  'picked_up',
  'in_progress',
  'ongoing',
] as const;
