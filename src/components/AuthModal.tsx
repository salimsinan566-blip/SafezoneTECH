import React, { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { signInTechnician, signUpTechnician } from '../lib/supabase';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, setCurrentUser, showNotification } = useApp();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await signInTechnician(email.trim(), password);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          setCurrentUser(res.user);
          showNotification(`أهلاً بك يا فني [${res.user.name}]!`, 'success');
          setIsAuthModalOpen(false);
        }
      } else {
        if (!technicianName.trim()) {
          setErrorMsg('يرجى كتابة اسم الفني (مثل: سالم أو سرمد)');
          setIsLoading(false);
          return;
        }
        const res = await signUpTechnician(email.trim(), password, technicianName.trim());
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          setCurrentUser(res.user);
          showNotification(`تم إنشاء الحساب وتسجيل الدخول باسم [${res.user.name}]!`, 'success');
          setIsAuthModalOpen(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء الاتصال');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-black/10 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-black/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-black text-xs">
              SZ
            </div>
            <div>
              <h3 className="text-sm font-black text-black">
                {mode === 'login' ? 'تسجيل دخول الفني' : 'إنشاء حساب فني جديد'}
              </h3>
              <p className="text-[10px] text-neutral-500">
                SAFE ZONE Cloud Authentication
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-4 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-black text-neutral-800 mb-1">
                اسم الفني الظاهر <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="مثال: سالم سنان، سرمد..."
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-xl border border-black/20 focus:border-black text-xs font-bold text-black outline-hidden"
                />
                <User className="w-4 h-4 text-neutral-400 absolute right-2.5 top-2.5" />
              </div>
              <span className="text-[10px] text-neutral-400 mt-0.5 block">
                هذا الاسم هو الذي سيظهر لزملائك عند حجز أي موعد
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-neutral-800 mb-1">
              البريد الإلكتروني <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                dir="ltr"
                placeholder="tech@safezone.iq"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-black/20 focus:border-black text-xs font-bold text-black outline-hidden"
              />
              <Mail className="w-4 h-4 text-neutral-400 absolute right-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-neutral-800 mb-1">
              كلمة المرور <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="password"
                required
                minLength={6}
                dir="ltr"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3 pr-9 py-2 rounded-xl border border-black/20 focus:border-black text-xs font-bold text-black outline-hidden"
              />
              <Lock className="w-4 h-4 text-neutral-400 absolute right-2.5 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 rounded-xl bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-black transition-colors"
          >
            {isLoading ? 'جاري التحقق...' : mode === 'login' ? 'دخول الحساب' : 'إنشاء الحساب الآن'}
          </button>
        </form>

        {/* Mode Toggle Footer */}
        <div className="p-3 bg-neutral-50 border-t border-black/5 text-center text-xs text-neutral-600">
          {mode === 'login' ? (
            <div>
              <span>ليس لديك حساب بعد؟ </span>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                }}
                className="font-black text-black underline hover:text-neutral-700"
              >
                إنشاء حساب فني جديد
              </button>
            </div>
          ) : (
            <div>
              <span>لديك حساب بالفعل؟ </span>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className="font-black text-black underline hover:text-neutral-700"
              >
                تسجيل الدخول
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
