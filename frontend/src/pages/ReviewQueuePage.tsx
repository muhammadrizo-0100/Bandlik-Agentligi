import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { monitoringApi } from '../api/monitoring.api';
import { Survey, Citizen } from '../types/monitoring.types';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  X,
  Send,
  User,
  MapPin,
  Clock,
  ArrowRight,
  Search,
} from 'lucide-react';
import { formatMahallaName } from '../utils/formatters';

export const ReviewQueuePage: React.FC = () => {
  const [queue, setQueue] = useState<Survey[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Review Item Modal
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [itemData, setItemData] = useState<{
    pendingSurvey: Survey;
    existingCitizen: Citizen;
  } | null>(null);
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [reviewerNote, setReviewerNote] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchQueue = async (query?: string) => {
    try {
      setLoading(true);
      const res = await monitoringApi.getReviewQueue({
        limit: 50,
        search: (query !== undefined ? query : search).trim() || undefined,
      });
      setQueue(res.items);
      setTotal(res.total);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchQueue(search);
    }, 250);

    return () => clearTimeout(handler);
  }, [search]);

  const handleOpenReview = async (id: string) => {
    setSelectedId(id);
    setItemData(null);
    setReviewerNote('');
    setActionSuccess(null);
    setModalLoading(true);
    try {
      const data = await monitoringApi.getReviewQueueItem(id);
      setItemData(data);
    } catch {
      // error
    } finally {
      setModalLoading(false);
    }
  };

  const handleResolve = async (action: 'APPROVE_UPDATE' | 'REJECT') => {
    if (!selectedId || !reviewerNote.trim()) {
      alert('Iltimos, tekshiruv xulosasi / izohini yozing');
      return;
    }

    try {
      setSubmitting(true);
      await monitoringApi.resolveReviewItem(selectedId, {
        action,
        reviewerNote,
      });
      setActionSuccess(
        action === 'APPROVE_UPDATE'
          ? 'Anketa tasdiqlandi va fuqaro kartasiga qabul qilindi'
          : 'Ziddiyatli anketa rad etildi',
      );
      setTimeout(() => {
        setItemData(null);
        setSelectedId(null);
        fetchQueue();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Tekshiruv Navbati (Data Review Queue)"
      breadcrumbs={['Sahifalar', 'Tekshiruv navbati', 'Ziddiyatli anketalar']}
      searchValue={search}
      onSearch={setSearch}
      searchPlaceholder="Anketalardan qidirish (F.I.Sh., JSHSHIR, telefon)..."
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Ziddiyatli va Dublikat Anketalar
                </h3>
                <p className="text-xs text-slate-400">
                  Tekshiruv va qaror qabul qilishni kutayotgan holatlar: {total} ta
                </p>
              </div>
            </div>

            {/* Promoy (jonli) qidiruv inputi */}
            <div className="w-full sm:w-80 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Qidirish (F.I.Sh., JSHSHIR, telefon)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
                  title="Tozalash"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs text-slate-400">Yuklanmoqda...</div>
          ) : queue.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-500 font-medium flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Barcha holatlar koʻrib chiqilgan</span>
              <span className="text-xs text-slate-400 mt-1">Hozirda tekshiruv kutayotgan ziddiyatli anketalar mavjud emas.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="py-3.5 px-5">Fuqaro F.I.Sh.</th>
                    <th className="py-3.5 px-4">JSHSHIR</th>
                    <th className="py-3.5 px-4">Mahalla</th>
                    <th className="py-3.5 px-4">Kiritilgan sana</th>
                    <th className="py-3.5 px-4">Ziddiyat sababi</th>
                    <th className="py-3.5 px-4">Yetakchi</th>
                    <th className="py-3.5 px-5 text-right">Amal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {queue.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/40 transition">
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {item.citizenFullName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                        {item.citizenPinfl}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {formatMahallaName(item.mahalla?.name)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('uz-UZ')}
                      </td>
                      <td className="py-3.5 px-4 text-amber-800 max-w-xs font-medium">
                        {item.conflictReason}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.operator?.fullName || 'Yetakchi'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => handleOpenReview(item.id)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Koʻrish & Hal qilish</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Review & Diff Comparison Modal */}
      {selectedId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Ziddiyatli So'rovnomani Tekshirish
                  </h3>
                  <p className="text-xs text-gray-500">
                    Mavjud fuqaro ma'lumotlari va yangi so'rovnoma o'rtasidagi taqqoslash
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionSuccess ? (
              <div className="p-8 text-center bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-base font-bold text-emerald-900 mb-1">
                  Qaror muvaffaqiyatli saqlandi!
                </h4>
                <p className="text-xs text-emerald-700">{actionSuccess}</p>
              </div>
            ) : modalLoading || !itemData ? (
              <div className="p-12 text-center text-xs text-gray-400">Yuklanmoqda...</div>
            ) : (
              <div className="space-y-6">
                {/* Taqqoslash Jadvali (Side by Side Comparison) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Chap: Bazadagi amaldagi fuqaro */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block pb-1 border-b border-gray-200">
                      Amaldagi Bazadagi Holat:
                    </span>
                    <div>
                      <span className="text-gray-400 block">F.I.Sh:</span>
                      <span className="font-bold text-gray-900">{itemData.existingCitizen?.fullName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">JSHSHIR:</span>
                      <span className="font-mono font-semibold text-gray-800">{itemData.existingCitizen?.pinfl}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Mahalla:</span>
                      <span className="font-semibold text-gray-800">{formatMahallaName(itemData.existingCitizen?.mahalla?.name)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Joriy toifa:</span>
                      <span className="font-bold text-blue-700">{itemData.existingCitizen?.currentCategory}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Tavsif:</span>
                      <span className="text-gray-700">{itemData.existingCitizen?.currentStatusDetail || '-'}</span>
                    </div>
                  </div>

                  {/* O'ng: Yangi yuborilgan anketa */}
                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 text-xs space-y-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block pb-1 border-b border-amber-200">
                      Yangi Yuborilgan So'rovnoma:
                    </span>
                    <div>
                      <span className="text-gray-400 block">F.I.Sh:</span>
                      <span className="font-bold text-gray-900">{itemData.pendingSurvey.citizenFullName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">JSHSHIR:</span>
                      <span className="font-mono font-semibold text-gray-800">{itemData.pendingSurvey.citizenPinfl}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Mahalla:</span>
                      <span className="font-semibold text-gray-800">{formatMahallaName(itemData.pendingSurvey.mahalla?.name)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Yangi toifa:</span>
                      <span className="font-bold text-amber-800">{itemData.pendingSurvey.mainCategory}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Yangi ma'lumotlar:</span>
                      <span className="text-gray-700">
                        {itemData.pendingSurvey.officialWorkplace ||
                          itemData.pendingSurvey.unofficialActivityType ||
                          itemData.pendingSurvey.noWishReason ||
                          (itemData.pendingSurvey.unemployedDirections || []).join(', ') ||
                          itemData.pendingSurvey.otherReasonNote}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ziddiyat sababi */}
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                  <span className="font-bold">Ziddiyat sababi: </span>
                  {itemData.pendingSurvey.conflictReason}
                </div>

                {/* Reviewer Izohi */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Tekshiruv xulosasi va asoslovchi izoh <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Masalan: Fuqaro bilan bog'lanildi, 2026-yilda yangi ish joyiga kirganligi tasdiqlandi..."
                    value={reviewerNote}
                    onChange={(e) => setReviewerNote(e.target.value)}
                    className="w-full p-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  />
                </div>

                {/* Qaror tugmalari */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleResolve('REJECT')}
                    className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold border border-red-300 text-red-700 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Rad etish (Amaldagini saqlash)</span>
                  </button>

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleResolve('APPROVE_UPDATE')}
                    className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Tasdiqlash & Fuqaroni yangilash</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
