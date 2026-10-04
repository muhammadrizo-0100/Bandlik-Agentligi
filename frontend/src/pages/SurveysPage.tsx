import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { monitoringApi } from '../api/monitoring.api';
import { Survey, SurveyStatus } from '../types/monitoring.types';
import { formatMahallaName } from '../utils/formatters';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Calendar,
  Filter,
  UserCheck,
  X,
} from 'lucide-react';

export const SurveysPage: React.FC = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchSurveys = async () => {
    try {
      setLoading(true);
      const res = await monitoringApi.getSurveys({
        search: search.trim() || undefined,
        limit: 50,
      });
      setSurveys(res.items);
      setTotal(res.total);
    } catch {
      // error handling
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSurveys();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredSurveys = surveys.filter((s) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'APPROVED') return s.status === 'APPROVED' || s.status === 'RESOLVED';
    return s.status === statusFilter;
  });

  const getStatusBadge = (status: SurveyStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Tasdiqlangan
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Tekshiruvda
          </span>
        );
      case 'RESOLVED':
        return (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60"
            title="Ziddiyat tekshiruvchi tomonidan koʻrib chiqilib tasdiqlangan"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Tekshiruvdan oʻtgan
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Rad etilgan
          </span>
        );
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'OFFICIALLY_EMPLOYED':
        return '2.1. Rasmiy band';
      case 'UNOFFICIALLY_EMPLOYED':
        return '2.2. Norasmiy band';
      case 'NO_WISH_TO_WORK':
        return '2.3. Ishlash istagi yoʻq';
      case 'UNEMPLOYED':
        return '2.4. Ishsiz yosh';
      case 'OTHER':
        return '2.5. Boshqa';
      default:
        return category;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'HOME_VISIT':
        return 'Uyma-uy';
      case 'PHONE':
        return 'Telefon';
      case 'IN_PERSON':
        return 'Qabulda';
      default:
        return method;
    }
  };

  return (
    <DashboardLayout
      title="Soʻrovnomalar Reyestri"
      breadcrumbs={['Sahifalar', 'Soʻrovnomalar', 'Barcha anketalar']}
      searchValue={search}
      onSearch={(q) => setSearch(q)}
      searchPlaceholder="Fuqaro F.I.Sh., JSHSHIR yoki telefon boʻyicha qidirish..."
    >
      <div className="space-y-6">
        {/* Yuqori Filter va Qidiruv Paneli */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Fuqaro F.I.Sh., JSHSHIR yoki telefon boʻyicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#163D5C]/20 focus:border-[#163D5C] bg-slate-50/50"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer"
                title="Tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-600 w-full md:w-auto overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'ALL'
                  ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Barchasi ({total})
            </button>
            <button
              onClick={() => setStatusFilter('APPROVED')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'APPROVED'
                  ? 'bg-white text-emerald-600 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Tasdiqlangan
            </button>
            <button
              onClick={() => setStatusFilter('PENDING_REVIEW')}
              className={`px-3 py-1.5 rounded-lg transition ${
                statusFilter === 'PENDING_REVIEW'
                  ? 'bg-white text-amber-600 shadow-sm font-semibold'
                  : 'hover:text-slate-900'
              }`}
            >
              Tekshiruvda
            </button>
          </div>
        </div>

        {/* Anketalar Jadvali */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Oʻtkazilgan Soʻrovnomalar Jurnali
                </h3>
                <p className="text-xs text-slate-400">
                  Reyestrda jami {filteredSurveys.length} ta yozuv koʻrsatilmoqda
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">
              Yuklanmoqda...
            </div>
          ) : filteredSurveys.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center">
              <FileText className="w-10 h-10 text-slate-300 mb-2" />
              <span>Mos keluvchi soʻrovnomalar topilmadi</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Fuqaro F.I.Sh.</th>
                    <th className="py-3.5 px-4">JSHSHIR</th>
                    <th className="py-3.5 px-4">Mahalla</th>
                    <th className="py-3.5 px-4">Sana</th>
                    <th className="py-3.5 px-4">Shakl</th>
                    <th className="py-3.5 px-4">Bandlik toifasi</th>
                    <th className="py-3.5 px-4">Holati</th>
                    <th className="py-3.5 px-5">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSurveys.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-indigo-50/30 transition group"
                    >
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition">
                          {s.citizenFullName}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                        {s.citizenPinfl}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {formatMahallaName(s.mahalla?.name)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(s.surveyDate).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {getMethodLabel(s.surveyMethod)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {getCategoryLabel(s.mainCategory)}
                        </div>
                        {s.officialWorkplace && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {s.officialWorkplace}
                          </div>
                        )}
                        {s.unofficialActivityType && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            {s.unofficialActivityType}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(s.status)}</td>
                      <td className="py-3.5 px-5 text-slate-500">
                        {s.operator?.fullName || 'Yetakchi'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

