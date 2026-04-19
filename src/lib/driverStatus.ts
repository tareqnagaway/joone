import type { DriverDetails, Profile } from '../types';

/** سائق أرسل طلبه ولم يُعتمد بعد — يبقى على شاشة الانتظار فقط */
export function isDriverPendingReview(
  profile: Profile | null,
  driverDetails: DriverDetails | null
): boolean {
  if (profile?.role !== 'driver') return false;
  if (!driverDetails) return false;
  const st = driverDetails.current_status;
  if (st === 'تحت المراجعة' || st === 'قيد المراجعة') return true;
  if (
    !driverDetails.is_approved &&
    driverDetails.current_status !== 'مرفوض' &&
    driverDetails.current_status !== 'موقوف'
  ) {
    return true;
  }
  return false;
}
