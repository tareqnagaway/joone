import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';
import { ensureWallet } from '../services/walletService';
import { useAuth } from './AuthContext';
import { PASSENGER_ACTIVE_RIDE_STATUSES, RIDE_WITH_DRIVER_SELECT } from '../lib/rideQueries';

/** مطابق لـ CHECK (status IN (...)) في مخطط قاعدة البيانات */
export type RideStatus =
  | 'searching'
  | 'accepted'
  | 'arrived'
  | 'picked_up'
  | 'in_progress'
  | 'ongoing'
  | 'completed'
  | 'cancelled';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface RideContextType {
  currentRide: any | null;
  pickup: Location | null;
  dropoff: Location | null;
  setPickup: (loc: Location | null) => void;
  setDropoff: (loc: Location | null) => void;
  requestRide: (finalFare: number, paymentMethod: 'cash' | 'wallet') => Promise<void>;
  cancelRide: () => Promise<void>;
  isLoading: boolean;
  distance: number | null;
  setDistance: (d: number | null) => void;
  estimatedFare: number | null;
}

const RideContext = createContext<RideContextType | undefined>(undefined);

// Jordanian Taxi Fare Constants
const FARE_BASE = 0.350;
const FARE_PER_KM = 0.250;
// Note: waiting fare is usually per hour, but we'll focus on distance for estimation

export const RideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentRide, setCurrentRide] = useState<any | null>(null);
  const [pickup, setPickup] = useState<Location | null>(null);
  const [dropoff, setDropoff] = useState<Location | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const rideSubscription = useRef<any>(null);

  const estimatedFare = distance ? (FARE_BASE + (distance / 1000) * FARE_PER_KM) : null;
  useEffect(() => {
    if (pickup && dropoff) {
      // Haversine formula for real-world distance calculation
      const R = 6371; // Radius of the Earth in km
      const dLat = (dropoff.lat - pickup.lat) * (Math.PI / 180);
      const dLng = (dropoff.lng - pickup.lng) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(pickup.lat * (Math.PI / 180)) * Math.cos(dropoff.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c; // Distance in km
      setDistance(dist * 1000); // Set distance in meters to maintain compatibility
    } else {
      setDistance(null);
    }
  }, [pickup, dropoff, setDistance]);

  // Subscribe to current activity
  useEffect(() => {
    if (!user?.id) {
      setCurrentRide(null);
      return;
    }

    let mounted = true;
    const userId = user.id;

    const fetchActiveActivity = async () => {
      let query = supabase
        .from('rides')
        .select(RIDE_WITH_DRIVER_SELECT)
        .eq('passenger_id', userId)
        .in('status', [...PASSENGER_ACTIVE_RIDE_STATUSES])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let { data, error } = await query;

      if (error) {
        console.warn('[RideContext] join driver failed, fallback to rides only:', error.message);
        const fb = await supabase
          .from('rides')
          .select('*')
          .eq('passenger_id', userId)
          .in('status', [...PASSENGER_ACTIVE_RIDE_STATUSES])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        data = fb.data;
      }

      if (mounted && data) {
        setCurrentRide(data);
        setupRideSubscription(data.id);
      }
    };

    const setupRideSubscription = (rideId: string) => {
      if (rideSubscription.current) {
        supabase.removeChannel(rideSubscription.current);
      }

      const sub = supabase
        .channel(`ride_${rideId}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'rides', filter: `id=eq.${rideId}` },
          async (payload) => {
            if (!mounted) return;
            const updated = payload.new as any;
            if (['completed', 'cancelled'].includes(updated.status)) {
              setCurrentRide(null);
            } else {
              // Refresh full data for reliability
              const { data } = await supabase
                .from('rides')
                .select(RIDE_WITH_DRIVER_SELECT)
                .eq('id', updated.id)
                .maybeSingle();
              if (mounted) setCurrentRide(data);
            }
          }
        )
        .subscribe();
      
      rideSubscription.current = sub;
    };

    fetchActiveActivity();

    // عند إنشاء رحلة جديدة من هذا الراكب (مصدر الحقيقة: جدول rides فقط)
    const requestSub = supabase
      .channel(`new_rides_${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rides', filter: `passenger_id=eq.${userId}` },
        async (payload) => {
          if (!mounted) return;
          const row = payload.new as { id: string };
          const { data } = await supabase
            .from('rides')
            .select(RIDE_WITH_DRIVER_SELECT)
            .eq('id', row.id)
            .maybeSingle();
          if (mounted && data) {
            setCurrentRide(data);
            setupRideSubscription(data.id);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      if (rideSubscription.current) supabase.removeChannel(rideSubscription.current);
      supabase.removeChannel(requestSub);
    };
  }, [user?.id]);

  const requestRide = async (finalFare: number, paymentMethod: 'cash' | 'wallet') => {
    if (!user || !pickup || !dropoff) {
      throw new Error('بيانات ناقصة: تأكد من نقطة الانطلاق والوصول.');
    }

    setIsLoading(true);
    try {
      if (paymentMethod === 'wallet') {
        const walletRow = await ensureWallet(user.id);
        if (!walletRow) {
          throw new Error('تعذر تجهيز المحفظة. تحقق من الاتصال أو صلاحيات قاعدة البيانات.');
        }

        const currentBalance = Number(walletRow.balance);
        if (currentBalance < finalFare) {
          throw new Error(
            `رصيد المحفظة (${currentBalance.toFixed(2)} د.أ) لا يكفي لأجرة الرحلة (${finalFare.toFixed(2)} د.أ). اختر الدفع نقداً أو شحن المحفظة.`
          );
        }

        const newBalance = currentBalance - finalFare;
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('user_id', user.id);

        if (walletError) throw new Error(`تعذر خصم المحفظة: ${walletError.message}`);

        const { error: txErr } = await supabase.from('wallet_transactions').insert({
          user_id: user.id,
          amount: finalFare,
          type: 'رحلة',
          description: 'دفع أجرة رحلة',
        });
        if (txErr) throw new Error(`خطأ تسجيل حركة المحفظة: ${txErr.message}`);
      }

      const insertPayload = {
        passenger_id: user.id,
        passenger_name: user.user_metadata?.full_name || 'راكب',
        passenger_phone: user.phone || '000000000',
        pickup_address: pickup.address,
        dropoff_address: dropoff.address,
        pickup_coords: JSON.stringify({ lat: pickup.lat, lng: pickup.lng }),
        dropoff_coords: JSON.stringify({ lat: dropoff.lat, lng: dropoff.lng }),
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        destination_lat: dropoff.lat,
        destination_lng: dropoff.lng,
        distance_km: distance ? distance / 1000 : null,
        status: 'searching' as const,
        fare: finalFare,
        estimated_fare_jod: finalFare,
      };
      console.log('Sending payload to rides:', insertPayload);

      const { data, error } = await supabase
        .from('rides')
        .insert(insertPayload)
        .select('id, status, passenger_id, driver_id, fare, created_at, pickup_address, dropoff_address')
        .maybeSingle();

      if (error) {
        console.error('Supabase Error during insert:', error);
        throw new Error(
          `حدث خطأ من قاعدة البيانات: ${error.message}${error.details ? `\n${error.details}` : ''}`
        );
      }
      if (data) {
        console.log('Ride created successfully in DB:', data);
        setCurrentRide(data);
      } else {
        throw new Error('لم يُعاد صف الرحلة بعد الإدراج. تحقق من جدول rides وصلاحيات الـ API.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const cancelRide = async () => {
    if (!currentRide) return;
    
    setIsLoading(true);
    const { error } = await supabase
      .from('rides')
      .update({ status: 'cancelled' })
      .eq('id', currentRide.id);

    if (error) {
      console.error('Error cancelling ride:', error);
    } else {
      setCurrentRide(null);
    }
    setIsLoading(false);
  };

  return (
    <RideContext.Provider value={{
      currentRide,
      pickup,
      dropoff,
      setPickup,
      setDropoff,
      requestRide,
      cancelRide,
      isLoading,
      distance,
      setDistance,
      estimatedFare
    }}>
      {children}
    </RideContext.Provider>
  );
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (context === undefined) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};
