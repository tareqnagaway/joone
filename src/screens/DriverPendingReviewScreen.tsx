import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Clock, LogOut } from 'lucide-react';
import logo from '../logo-white.svg';

/**
 * سائق بحالة قيد المراجعة: لا يمكنه العودة لملء الطلب — فقط انتظار الموافقة أو تسجيل الخروج.
 */
export default function DriverPendingReviewScreen() {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#1E3A8A] flex flex-col items-center justify-center p-8 text-center" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white rounded-[2rem] shadow-2xl p-10 border border-white/10">
          <div className="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-2xl flex items-center justify-center">
            <img src={logo} alt="Jo One" className="w-14 h-14 object-contain" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-800 text-sm font-black mb-4 border border-amber-100">
            <Clock size={18} />
            قيد المراجعة
          </div>

          <h1 className="text-2xl font-black text-[#1E3A8A] mb-3">طلبك قيد المراجعة</h1>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            تم استلام مستنداتك. فريقنا يراجع طلب الانضمام كسائق. سنُعلمك عند اعتماد الحساب.
            لا حاجة لإعادة إرسال الطلب.
          </p>

          <button
            type="button"
            onClick={() => signOut()}
            className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-black border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-3"
          >
            <LogOut size={22} />
            {t('common.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
