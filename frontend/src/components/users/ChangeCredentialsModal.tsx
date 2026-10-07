import React, { useState } from 'react';
import { User } from '../../types/auth.types';
import { monitoringApi } from '../../api/monitoring.api';
import { useToast } from '../../context/ToastContext';
import {
  KeyRound,
  User as UserIcon,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  X,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface ChangeCredentialsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: User) => void;
}

export const ChangeCredentialsModal: React.FC<ChangeCredentialsModalProps> = ({
  user,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();
  const [username, setUsername] = useState(user.username || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Tasodifiy kuchli parol generatsiya qilish
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
    setShowPassword(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setError('Foydalanuvchi logini boʻsh boʻlishi mumkin emas');
      return;
    }

    if (password && password.length < 6) {
      setError('Yangi parol kamida 6 ta belgidan iborat boʻlishi shart');
      return;
    }

    if (cleanUsername === user.username && !password) {
      setError('Hech qanday oʻzgarish kiritilmadi');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const updatePayload: any = {};
      if (cleanUsername !== user.username) {
        updatePayload.username = cleanUsername;
      }
      if (password) {
        updatePayload.password = password;
      }

      const res = await monitoringApi.updateUser(user.id, updatePayload);
      toast.success(
        `"${user.fullName}" xodimining login/paroli muvaffaqiyatli yangilandi`,
      );
      onSuccess(res as any);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Kirish maʼlumotlarini yangilashda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative my-6 animate-in zoom-in-95 duration-150">
        {/* Sarlavha qismi */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Login va parol berish
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {user.fullName} ({user.roleName || user.roleCode || user.role})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Eslatma / Xavfsizlik xabari */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px] text-slate-500">
            Yangi maʼlumotlarni xodimga xavfsiz yetkazing. Parol saqlangach, xavfsizlik maqsadida shifrlanadi va qayta koʻrsatilmaydi.
          </p>
        </div>

        {/* Xatolik xabari */}
        {error && (
          <div className="mt-4 flex items-center p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4" autoComplete="off">
          {/* 1. Login (Foydalanuvchi nomi) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Foydalanuvchi logini <span className="text-red-500">*</span>
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Foydalanuvchi logini..."
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#163D5C] focus:ring-2 focus:ring-[#163D5C]/15 transition"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Amaldagi logini avtomatik koʻrsatilgan. Kerak boʻlsa oʻzgartirishingiz mumkin.
            </p>
          </div>

          {/* 2. Yangi parol */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Yangi parol
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#163D5C] hover:text-[#0f283d] transition cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Generatsiya qilish</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi (yoki boʻsh qoldiring)"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#163D5C] focus:ring-2 focus:ring-[#163D5C]/15 transition"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none transition cursor-pointer"
                title={showPassword ? 'Parolni yashirish' : 'Parolni koʻrsatish'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Agar parolni oʻzgartirish kerak boʻlmasa, bu maydonni boʻsh qoldiring.
            </p>
          </div>

          {/* Tugmalar */}
          <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#163D5C] hover:bg-[#11314a] focus:outline-none shadow-xs transition disabled:opacity-60 flex items-center space-x-2 cursor-pointer"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
