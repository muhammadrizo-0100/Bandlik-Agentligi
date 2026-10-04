import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { monitoringApi } from '../api/monitoring.api';
import { DashboardSummary, Mahalla, Survey } from '../types/monitoring.types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Briefcase,
  UserCheck,
  UserX,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Calendar,
  Download,
  ArrowRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  FilePlus,
  RefreshCw,
  Eye,
  ChevronDown,
  Check,
  Building2,
  CalendarDays,
  History,
  X,
  Search,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user, isSuperAdmin, isDistrictAdmin, isMahallaOperator } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [mahallas, setMahallas] = useState<Mahalla[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>(
    user?.districtId || '',
  );
  const [selectedMahallaId, setSelectedMahallaId] = useState<string>(
    user?.mahallaId || '',
  );
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Vaqt filteri holati (Time Filter state)
  const [timePreset, setTimePreset] = useState<string>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>('2026-10-01');
  const [endDate, setEndDate] = useState<string>('2026-10-31');
  const [customStart, setCustomStart] = useState<string>('2026-10-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-10-31');
  const [isDateFilterOpen, setIsDateFilterOpen] = useState<boolean>(false);
  const dateFilterRef = useRef<HTMLDivElement>(null);

  // Ustun bosilganda ochiladigan Eventlar tarixi modali
  const [selectedEventData, setSelectedEventData] = useState<{
    type: 'MAHALLA' | 'DAY';
    title: string;
    subtitle: string;
    total: number;
    official: number;
    unofficial: number;
    unemployed: number;
    noWish: number;
    events: Survey[];
  } | null>(null);

  // Tashqariga bosilganda date filter dropdownni yopish
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateFilterRef.current && !dateFilterRef.current.contains(event.target as Node)) {
        setIsDateFilterOpen(false);
      }
    };
    if (isDateFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDateFilterOpen]);

  // Mahalla filter popover holati (Tuman Boshlig'i va Admin uchun)
  const [isMahallaFilterOpen, setIsMahallaFilterOpen] = useState<boolean>(false);
  const [mahallaSearchQuery, setMahallaSearchQuery] = useState<string>('');
  const mahallaFilterRef = useRef<HTMLDivElement>(null);

  // Tashqariga bosilganda mahalla filter dropdownni yopish
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mahallaFilterRef.current && !mahallaFilterRef.current.contains(event.target as Node)) {
        setIsMahallaFilterOpen(false);
      }
    };
    if (isMahallaFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMahallaFilterOpen]);

  // Vaqt oralig'i yozuvi
  const timeFilterLabel = useMemo(() => {
    if (timePreset === 'TODAY') return 'Bugun';
    if (timePreset === 'THIS_WEEK') return 'Oxirgi 7 kun';
    if (timePreset === 'THIS_MONTH') return 'Shu oy (Oktabr 2026)';
    if (timePreset === 'LAST_MONTH') return 'Oʻtgan oy (Sentabr)';
    if (timePreset === 'THIS_YEAR') return 'Shu yil (2026)';
    if (timePreset === 'ALL') return 'Barcha davr';
    if (startDate && endDate) return `${startDate} – ${endDate}`;
    return '01 Okt 2026 - 31 Okt 2026';
  }, [timePreset, startDate, endDate]);

  // Mahalla qidiruv va ko'rsatish mantiqi
  const filteredMahallaOptions = useMemo(() => {
    if (!mahallaSearchQuery.trim()) return mahallas;
    const q = mahallaSearchQuery.toLowerCase();
    return mahallas.filter((m) => (m.name || '').toLowerCase().includes(q));
  }, [mahallas, mahallaSearchQuery]);

  const selectedMahallaObj = useMemo(() => {
    return mahallas.find((m) => m.id === selectedMahallaId);
  }, [mahallas, selectedMahallaId]);

  const selectedMahallaDisplayName = selectedMahallaObj
    ? `${(selectedMahallaObj.name || '').replace(/\s*MFY\s*/gi, '')} MFY`
    : 'Barcha mahallalar';

  const setPeriod = (preset: string) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    let s = '';
    let e = '';

    if (preset === 'TODAY') {
      s = formatDate(now);
      e = formatDate(now);
    } else if (preset === 'THIS_WEEK') {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 6);
      s = formatDate(weekStart);
      e = formatDate(now);
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      s = formatDate(firstDay);
      e = formatDate(lastDay);
    } else if (preset === 'LAST_MONTH') {
      const firstDay = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      s = formatDate(firstDay);
      e = formatDate(lastDay);
    } else if (preset === 'THIS_YEAR') {
      s = `${y}-01-01`;
      e = `${y}-12-31`;
    } else if (preset === 'ALL') {
      s = '';
      e = '';
    }

    setTimePreset(preset);
    setStartDate(s);
    setEndDate(e);
    setIsDateFilterOpen(false);
  };

  const applyCustomRange = () => {
    setTimePreset('CUSTOM');
    setStartDate(customStart);
    setEndDate(customEnd);
    setIsDateFilterOpen(false);
  };

  const fetchDashboardData = async (
    distId?: string,
    mId?: string,
    sDate?: string,
    eDate?: string,
  ) => {
    try {
      setLoading(true);
      setError(null);
      const data = await monitoringApi.getDashboardSummary({
        districtId: distId || undefined,
        mahallaId: mId || undefined,
        startDate: sDate || undefined,
        endDate: eDate || undefined,
      });
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Statistika ma\'lumotlarini yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    monitoringApi
      .getMahallasDropdown(selectedDistrictId || undefined)
      .then((res) => setMahallas(res as any))
      .catch(() => {});

    fetchDashboardData(selectedDistrictId, selectedMahallaId, startDate, endDate);
  }, [selectedDistrictId, selectedMahallaId, startDate, endDate]);

  const handleDistrictChange = (distId: string) => {
    setSelectedDistrictId(distId);
    setSelectedMahallaId('');
  };

  const handleMahallaChange = (mId: string) => {
    setSelectedMahallaId(mId);
  };

  // Drill down: tegishli fuqarolar ro'yxatiga o'tish
  const handleDrillDown = (category?: string) => {
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (selectedDistrictId) query.set('districtId', selectedDistrictId);
    if (selectedMahallaId) query.set('mahallaId', selectedMahallaId);
    navigate(`/citizens?${query.toString()}`);
  };

  // Hisobot ma'lumotlarini Excel/CSV formatida yuklab olish (Export)
  const handleExportData = () => {
    try {
      const areaName = user?.mahallaName ? (user.mahallaName.includes('MFY') ? user.mahallaName : `${user.mahallaName} MFY`) : user?.districtName || 'Davlatobod tumani';
      let csv = `"O'ZBEKISTON RESPUBLIKASI YOSHLAR BANDLIGI MONITORINGI VA TAHLILI"\n`;
      csv += `"Hudud:","${areaName}"\n`;
      csv += `"Hisobot davri:","${timeFilterLabel}"\n`;
      csv += `"Eksport qilingan vaqt:","${new Date().toLocaleString('uz-UZ')}"\n\n`;

      csv += `"1. ASOSIY BANDLIK KO'RSATKICHLARI (KPI)"\n`;
      csv += `"Ko'rsatkich toifasi","Fuqarolar soni","Umumiy ulushdagi foizi"\n`;
      csv += `"Jami o'rganilgan fuqarolar","${kpi?.totalCitizens || 0}","100%"\n`;
      csv += `"Rasmiy band yoshlar","${kpi?.officiallyEmployed?.count || 0}","${kpi?.officiallyEmployed?.percentage || 0}%"\n`;
      csv += `"Norasmiy band yoshlar","${kpi?.unofficiallyEmployed?.count || 0}","${kpi?.unofficiallyEmployed?.percentage || 0}%"\n`;
      csv += `"Ishsiz yoshlar","${kpi?.unemployed?.count || 0}","${kpi?.unemployed?.percentage || 0}%"\n`;
      csv += `"Ishlash istagi yo'qlar","${kpi?.noWishToWork?.count || 0}","${kpi?.noWishToWork?.percentage || 0}%"\n`;
      csv += `"Boshqa holatlar","${kpi?.other?.count || 0}","${kpi?.other?.percentage || 0}%"\n\n`;

      csv += `"2. O'RGANILGAN FUQAROLAR XATLOV RO'YXATI"\n`;
      csv += `"№","Fuqaro F.I.Sh.","JSHSHIR","Tug'ilgan sana","Telefon raqami","Mahalla","O'rganish shakli","Bandlik toifasi","Batafsil ma'lumot (Ish joyi / Faoliyat / Sabab / Izoh)","So'rovnoma sanasi","Status"\n`;

      const list = summary?.recentSurveys || [];
      list.forEach((s, idx) => {
        const details =
          s.officialWorkplace ||
          s.unofficialActivityType ||
          s.noWishReason ||
          s.unemployedDirections?.join(', ') ||
          s.otherReasonNote ||
          '-';

        const categoryText =
          s.mainCategory === 'OFFICIALLY_EMPLOYED'
            ? 'Rasmiy band'
            : s.mainCategory === 'UNOFFICIALLY_EMPLOYED'
            ? 'Norasmiy band'
            : s.mainCategory === 'UNEMPLOYED'
            ? 'Ishsiz yosh'
            : s.mainCategory === 'NO_WISH_TO_WORK'
            ? 'Ishlash istagi yo\'q'
            : 'Boshqa';

        const methodText =
          s.surveyMethod === 'HOME_VISIT'
            ? 'Uyma-uy'
            : s.surveyMethod === 'PHONE'
            ? 'Telefon'
            : 'Qabulda';

        const cleanPinfl = `="${s.citizenPinfl}"`;

        csv += `"${idx + 1}","${s.citizenFullName}","${cleanPinfl}","${s.citizen?.birthDate || '-'}","${s.citizen?.phone || '-'}","${s.mahalla?.name || '-'}","${methodText}","${categoryText}","${details.replace(/"/g, '""')}","${s.surveyDate}","${s.status === 'APPROVED' ? 'Tasdiqlangan' : 'Tekshiruvda'}"\n`;
      });

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanArea = areaName.replace(/\s+/g, '_');
      link.setAttribute('download', `bandlik_hisobot_${cleanArea}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
    }
  };

  // So'nggi so'rovnomalarni tab bo'yicha filtrlash
  const filteredSurveys = useMemo(() => {
    const list = summary?.recentSurveys || [];
    if (activeTab === 'ALL') return list;
    if (activeTab === 'PENDING') {
      return list.filter((s) => s.status === 'PENDING_REVIEW');
    }
    return list.filter((s) => s.mainCategory === activeTab);
  }, [summary?.recentSurveys, activeTab]);

  const kpi = summary?.kpi;

  // Bar chart uchun mahallalar ma'lumotlari (Yashil, Sariq, Qizil toifalar bilan)
  // So'rovnoma sanasini insonbop formatlash (soatsiz, faqat rasmiy kiritilgan sana)
  const formatSurveyDateLabel = (dateInput?: string | Date | null) => {
    if (!dateInput) return null;
    const str = String(dateInput).slice(0, 10);
    const parts = str.split('-');
    if (parts.length !== 3) return null;

    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const targetDate = new Date(y, m, d);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const monthNames = [
      'Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun',
      'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'
    ];
    const monthFullNames = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
      'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
    ];

    const isToday = targetDate.getTime() === today.getTime();
    const isYesterday = targetDate.getTime() === yesterday.getTime();
    const dayStr = String(d).padStart(2, '0');
    const monthShort = monthNames[m] || '';
    const monthFull = monthFullNames[m] || '';

    let shortLabel = `${dayStr}-${monthShort}`;
    let fullLabel = `${dayStr}-${monthFull} ${y}`;

    if (isToday) {
      shortLabel = 'Bugun';
      fullLabel = `Bugun (${dayStr}-${monthShort})`;
    } else if (isYesterday) {
      shortLabel = 'Kecha';
      fullLabel = `Kecha (${dayStr}-${monthShort})`;
    }

    return {
      isToday,
      isYesterday,
      shortLabel,
      fullLabel,
    };
  };

  // Bar chart uchun mahallalar ma'lumotlari (pastida rasmiy xatlov kuni bilan)
  const barChartData = useMemo(() => {
    if (!summary?.mahallaBreakdown || summary.mahallaBreakdown.length === 0) return [];
    return summary.mahallaBreakdown.slice(0, 8).map((m: any) => {
      const rawName = m.mahallaName || m.name || '';
      const cleanName = rawName.replace(/\s*MFY\s*/gi, '').trim() || rawName;

      // Ushbu mahalla bo'yicha eng oxirgi xatlov sanasini topish
      const matchingSurvey = (summary?.recentSurveys || []).find((s) => {
        const sMName = (s.mahalla?.name || '').toLowerCase();
        const mNameLower = cleanName.toLowerCase();
        return sMName.includes(mNameLower) || mNameLower.includes(sMName);
      });

      const eventDateSource = matchingSurvey?.surveyDate || matchingSurvey?.createdAt || m.lastSurveyAt;
      const parsedDate = formatSurveyDateLabel(eventDateSource);

      return {
        name: cleanName,
        fullName: rawName.includes('MFY') ? rawName : `${rawName} MFY`,
        total: Number(m.total) || 0,
        official: Number(m.official ?? m.officiallyEmployed ?? 0),
        unofficial: Number(m.unofficial ?? m.unofficiallyEmployed ?? 0),
        unemployed: Number(m.unemployed ?? 0),
        noWish: Number(m.noWish ?? 0),
        other: Number(m.other ?? 0),
        eventDateLabel: parsedDate?.shortLabel || '',
        eventDateFull: parsedDate?.fullLabel || '',
      };
    });
  }, [summary?.mahallaBreakdown, summary?.recentSurveys]);

  // Haftalik mini trend ma'lumotlari: Du, Se, Cho, Pa, Ju, Sha, Ya
  const weeklyTrendData = useMemo(() => {
    const trendList = summary?.trendData || [];
    const uzDaysShort = ['Du', 'Se', 'Cho', 'Pa', 'Ju', 'Sha', 'Ya'];
    const uzDaysFull = [
      'Dushanba',
      'Seshanba',
      'Chorshanba',
      'Payshanba',
      'Juma',
      'Shanba',
      'Yakshanba',
    ];

    const now = new Date();
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    const weekDays = [];
    let currentWeekHasData = false;

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const matched = trendList.find((t) => t.date === dateStr);
      const count = matched ? Number(matched.count) || 0 : 0;
      if (count > 0) currentWeekHasData = true;

      weekDays.push({
        dayLabel: uzDaysShort[i],
        fullDayName: uzDaysFull[i],
        dateStr,
        displayDate: `${dd}.${mm}`,
        count,
        official: matched ? Number((matched as any).official) || 0 : 0,
        unofficial: matched ? Number((matched as any).unofficial) || 0 : 0,
        unemployed: matched ? Number((matched as any).unemployed) || 0 : 0,
        noWish: matched ? Number((matched as any).noWish) || 0 : 0,
        isToday: d.toDateString() === now.toDateString(),
      });
    }

    if (currentWeekHasData || trendList.length === 0) {
      return weekDays;
    }

    return trendList.slice(-7).map((t) => {
      const d = new Date(t.date + 'T00:00:00');
      const dayIdx = (d.getDay() + 6) % 7;
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return {
        dayLabel: uzDaysShort[dayIdx] || 'Kun',
        fullDayName: uzDaysFull[dayIdx] || 'Kun',
        dateStr: t.date,
        displayDate: `${dd}.${mm}`,
        count: Number(t.count) || 0,
        official: Number((t as any).official) || 0,
        unofficial: Number((t as any).unofficial) || 0,
        unemployed: Number((t as any).unemployed) || 0,
        noWish: Number((t as any).noWish) || 0,
        isToday: d.toDateString() === now.toDateString(),
      };
    });
  }, [summary?.trendData]);

  // So'nggi xatlov eventining sanasi va tafsilotlari (soatsiz, faqat rasmiy sana)
  const latestSurveyEvent = useMemo(() => {
    const surveys = summary?.recentSurveys || [];
    if (surveys.length === 0) return null;
    const latest = surveys[0];
    const parsedDate = formatSurveyDateLabel(latest.surveyDate || latest.createdAt);
    if (!parsedDate) return null;

    return {
      dateText: parsedDate.fullLabel,
      mahallaName: latest.mahalla?.name ? (latest.mahalla.name.includes('MFY') ? latest.mahalla.name : `${latest.mahalla.name} MFY`) : 'Davlatobod',
      citizenName: latest.citizenFullName,
      category: latest.mainCategory,
    };
  }, [summary?.recentSurveys]);

  const openEventModal = (payload: any) => {
    if (!payload) return;
    const searchName = (payload.name || '').toLowerCase();
    const matchingSurveys = (summary?.recentSurveys || []).filter((s) => {
      const mName = (s.mahalla?.name || '').toLowerCase();
      return mName.includes(searchName) || searchName.includes(mName);
    });

    setSelectedEventData({
      type: 'MAHALLA',
      title: payload.fullName || (payload.name?.includes('MFY') ? payload.name : `${payload.name} MFY`),
      subtitle: payload.eventDateFull
        ? `Xatlov sanasi: ${payload.eventDateFull}`
        : 'Ushbu hudud boʻyicha oʻrganishlar jurnali',
      total: payload.total || 0,
      official: payload.official || 0,
      unofficial: payload.unofficial || 0,
      unemployed: payload.unemployed || 0,
      noWish: payload.noWish || 0,
      events: matchingSurveys,
    });
  };

  const handleChartClick = (state: any) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      openEventModal(state.activePayload[0].payload);
    }
  };

  const getStatusBadge = (category: string, status?: string) => {
    if (status === 'PENDING_REVIEW') {
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
          Tekshiruvda
        </span>
      );
    }

    switch (category) {
      case 'OFFICIALLY_EMPLOYED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            Rasmiy band
          </span>
        );
      case 'UNOFFICIALLY_EMPLOYED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-[#163D5C] border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#163D5C] mr-1.5"></span>
            Norasmiy band
          </span>
        );
      case 'UNEMPLOYED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5"></span>
            Ishsiz yosh
          </span>
        );
      case 'NO_WISH_TO_WORK':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
            Istagi yoʻq
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span>
            Boshqa
          </span>
        );
    }
  };

  // Sichqoncha borganda chiqadigan ixcham, yengil tooltip
  const CustomMainChartTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-xl px-3 py-2 text-xs shadow-xl border border-slate-700/60 pointer-events-none">
        <div className="flex items-center justify-between gap-3 font-bold border-b border-slate-700/70 pb-1 mb-1.5">
          <span className="text-white text-xs">{data.fullName || data.name}</span>
          {data.eventDateFull && (
            <span className="text-[10px] text-sky-300 font-medium">
              {data.eventDateFull}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 text-[11px]">
          <span className="text-emerald-400 font-semibold" title="Rasmiy band">● {data.official || 0}</span>
          <span className="text-amber-400 font-semibold" title="Norasmiy band">● {data.unofficial || 0}</span>
          <span className="text-rose-400 font-semibold" title="Ishsiz">● {data.unemployed || 0}</span>
          <span className="text-slate-300 font-semibold" title="Istagi yoʻq">● {data.noWish || 0}</span>
          <span className="text-slate-400 font-bold ml-1 border-l border-slate-700 pl-2">
            Jami: {data.total || 0}
          </span>
        </div>
      </div>
    );
  };

  // Grafik ustuni ostida mahalla nomi va kunini bir yo'la chiqarish
  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const item = barChartData[payload.index];
    if (!item) return null;

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={10}
          textAnchor="middle"
          fill="#1E293B"
          fontSize={11}
          fontWeight={700}
        >
          {item.name}
        </text>
        {item.eventDateLabel && (
          <text
            x={0}
            y={0}
            dy={24}
            textAnchor="middle"
            fill="#64748B"
            fontSize={10}
            fontWeight={500}
          >
            {item.eventDateLabel}
          </text>
        )}
      </g>
    );
  };

  const CustomWeeklyTrendTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0].payload;

    return (
      <div className="bg-white/95 backdrop-blur-md rounded-xl p-2.5 border-2 border-slate-200 shadow-lg text-xs min-w-[170px]">
        <div className="font-extrabold text-slate-900 border-b border-slate-100 pb-1 mb-1.5 flex items-center justify-between">
          <span>{item.fullDayName}</span>
          <span className="text-[10px] font-semibold text-slate-400">{item.displayDate}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-slate-500 font-medium">Xatlovlar soni:</span>
          <span className="font-bold text-[#163D5C]">{item.count} ta</span>
        </div>
        {item.count > 0 && (
          <div className="grid grid-cols-2 gap-1 text-[10px] pt-1 border-t border-slate-100">
            <span className="text-emerald-700">Rasmiy: <b>{item.official}</b></span>
            <span className="text-amber-700">Norasmiy: <b>{item.unofficial}</b></span>
            <span className="text-rose-700">Ishsiz: <b>{item.unemployed}</b></span>
            <span className="text-slate-600">Istagi yoʻq: <b>{item.noWish}</b></span>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout
      title="Boshqaruv Paneli"
      breadcrumbs={['Sahifalar', 'Boshqaruv paneli']}
      selectedDistrictId={selectedDistrictId}
      onDistrictChange={handleDistrictChange}
    >
      {/* 1. Sarlavha va Asosiy Harakatlar (Screenshot 3 "Xush kelibsiz" uslubi) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Xush kelibsiz, {user?.fullName?.split(' ')[0] || 'Foydalanuvchi'}.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            {user?.mahallaName ? (user.mahallaName.includes('MFY') ? user.mahallaName : `${user.mahallaName} MFY`) : user?.districtName || 'Davlatobod tumani'} boʻyicha yoshlar bandligi koʻrsatkichlarini kuzatib boring.
          </p>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="hidden sm:inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white border-2 border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Maʻlumotlar ulangan</span>
          </div>

          {isMahallaOperator && (
            <button
              type="button"
              onClick={() => navigate('/new-survey')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <FilePlus className="w-4 h-4 text-sky-200" />
              <span>Yangi soʻrovnoma</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDrillDown()}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-200 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <span>Fuqarolar reyestri</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 2. Dastur Status E'loni (Screenshot 3 dagi nafis xabarnoma uslubi) */}
      <div className="bg-[#163D5C]/5 border-2 border-[#163D5C]/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-2xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#163D5C]/10 text-[#163D5C] border border-[#163D5C]/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Yoshlar bandligi davlat monitoringi dasturi (2026)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {user?.districtName || 'Davlatobod tumani'}da uyma-uy soʻrovnomalar orqali haqiqiy bandlik holati shakllantirilmoqda.
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center space-x-2 text-xs font-semibold text-[#163D5C] bg-white px-3.5 py-1.5 rounded-xl border-2 border-[#163D5C]/20 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Monitoring faol holatda</span>
        </div>
      </div>

      {/* 3. Filtr Tablari va Davr tanlagich (Screenshot 2-3 uslubida) */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Kategoriya Tablari (Sonlar ko'rsatilgan interaktiv tugmalar) */}
          {/* Kategoriya Tablari (Nomiga yarasha rangli interaktiv tugmalar) */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-2xl border-2 border-slate-200 text-xs overflow-x-auto gap-1">
            {[
              {
                id: 'ALL',
                label: 'Barchasi',
                count: kpi?.totalCitizens || 0,
                dotColor: 'bg-[#163D5C]',
                textColor: 'text-slate-800',
                activeTextColor: 'text-[#163D5C]',
                activeBorder: 'border-[#163D5C]/30 ring-2 ring-[#163D5C]/10',
                hoverBg: 'hover:bg-slate-200/60',
                inactiveBadge: 'bg-slate-200 text-slate-700',
                activeBadge: 'bg-[#163D5C] text-white',
              },
              {
                id: 'OFFICIALLY_EMPLOYED',
                label: 'Rasmiy band',
                count: kpi?.officiallyEmployed.count || 0,
                dotColor: 'bg-emerald-500',
                textColor: 'text-emerald-700',
                activeTextColor: 'text-emerald-800',
                activeBorder: 'border-emerald-300 ring-2 ring-emerald-500/20',
                hoverBg: 'hover:bg-emerald-50',
                inactiveBadge: 'bg-emerald-100 text-emerald-800',
                activeBadge: 'bg-emerald-600 text-white',
              },
              {
                id: 'UNOFFICIALLY_EMPLOYED',
                label: 'Norasmiy band',
                count: kpi?.unofficiallyEmployed.count || 0,
                dotColor: 'bg-amber-500',
                textColor: 'text-amber-700',
                activeTextColor: 'text-amber-800',
                activeBorder: 'border-amber-300 ring-2 ring-amber-500/20',
                hoverBg: 'hover:bg-amber-50',
                inactiveBadge: 'bg-amber-100 text-amber-800',
                activeBadge: 'bg-amber-500 text-white',
              },
              {
                id: 'UNEMPLOYED',
                label: 'Ishsizlar',
                count: kpi?.unemployed.count || 0,
                dotColor: 'bg-rose-500',
                textColor: 'text-rose-700',
                activeTextColor: 'text-rose-800',
                activeBorder: 'border-rose-300 ring-2 ring-rose-500/20',
                hoverBg: 'hover:bg-rose-50',
                inactiveBadge: 'bg-rose-100 text-rose-800',
                activeBadge: 'bg-rose-600 text-white',
              },
              {
                id: 'PENDING',
                label: 'Tekshiruvda',
                count: summary?.pendingReviewsCount || 0,
                dotColor: 'bg-purple-500 animate-pulse',
                textColor: 'text-purple-700',
                activeTextColor: 'text-purple-800',
                activeBorder: 'border-purple-300 ring-2 ring-purple-500/20',
                hoverBg: 'hover:bg-purple-50',
                inactiveBadge: 'bg-purple-100 text-purple-800',
                activeBadge: 'bg-purple-600 text-white',
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'ALL') {
                      setTimeout(() => {
                        document.getElementById('recent-surveys-table')?.scrollIntoView({ behavior: 'smooth' });
                      }, 50);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center space-x-1.5 ${
                    isActive
                      ? `bg-white ${tab.activeTextColor} shadow-xs border ${tab.activeBorder}`
                      : `${tab.textColor} ${tab.hoverBg}`
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${tab.dotColor} shrink-0`}></span>
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-black transition-colors ${
                      isActive ? tab.activeBadge : tab.inactiveBadge
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Vaqt & Eksport */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Vaqt Filteri (Interaktiv Davr Tanlagich) */}
            <div className="relative" ref={dateFilterRef}>
              <button
                type="button"
                onClick={() => setIsDateFilterOpen(!isDateFilterOpen)}
                className={`flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 rounded-xl border-2 transition text-xs font-semibold shadow-2xs cursor-pointer ${
                  isDateFilterOpen ? 'border-[#163D5C] ring-2 ring-[#163D5C]/10 text-[#163D5C]' : 'border-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-[#163D5C]" />
                <span>{timeFilterLabel}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${isDateFilterOpen ? 'rotate-180 text-[#163D5C]' : ''}`} />
              </button>

              {/* Floating Date Picker Popover */}
              {isDateFilterOpen && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl p-4 shadow-xl border-2 border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800">
                      Vaqt oraligʻini tanlang
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDateFilterOpen(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tezkor tanlovlar (Presets) */}
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {[
                      { id: 'THIS_MONTH', label: 'Shu oy' },
                      { id: 'THIS_WEEK', label: 'Oxirgi 7 kun' },
                      { id: 'TODAY', label: 'Bugun' },
                      { id: 'LAST_MONTH', label: 'Oʻtgan oy' },
                      { id: 'THIS_YEAR', label: 'Shu yil (2026)' },
                      { id: 'ALL', label: 'Barcha davr' },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPeriod(p.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition text-left cursor-pointer flex items-center justify-between ${
                          timePreset === p.id
                            ? 'bg-[#163D5C] text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{p.label}</span>
                        {timePreset === p.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>

                  {/* Ixtiyoriy sana oralig'i (Custom Range) */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Ixtiyoriy sana oraligʻi
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium mb-1">
                          Boshlanish:
                        </label>
                        <input
                          type="date"
                          value={customStart}
                          onChange={(e) => setCustomStart(e.target.value)}
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-[#163D5C]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-medium mb-1">
                          Tugash:
                        </label>
                        <input
                          type="date"
                          value={customEnd}
                          onChange={(e) => setCustomEnd(e.target.value)}
                          className="w-full text-xs font-medium border border-slate-200 rounded-xl p-2 focus:outline-none focus:border-[#163D5C]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={applyCustomRange}
                      className="w-full mt-2 py-2 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Qoʻllash</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Eksport Tugmasi (Haqiqiy Excel/CSV hisobot yuklab oladi) */}
            <button
              type="button"
              onClick={handleExportData}
              title="Hisobotni Excel/CSV formatida yuklab olish"
              className="flex items-center space-x-1.5 bg-[#163D5C] hover:bg-[#11314a] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-200" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Filtr faolligi haqida xabarnoma (Toggle bosilganda darhol ekranda ko'rinadi) */}
        {activeTab !== 'ALL' && (
          <div className="mt-3 p-3 rounded-2xl bg-[#163D5C]/5 border-2 border-[#163D5C]/20 flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#163D5C] animate-pulse"></span>
              <span className="text-slate-800 font-semibold">
                Tanlangan toifa: <b>{
                  activeTab === 'OFFICIALLY_EMPLOYED'
                    ? 'Rasmiy band yoshlar'
                    : activeTab === 'UNOFFICIALLY_EMPLOYED'
                    ? 'Norasmiy band yoshlar'
                    : activeTab === 'UNEMPLOYED'
                    ? 'Ishsiz yoshlar'
                    : 'Tekshiruvdagi anketalar'
                }</b> ({filteredSurveys.length} ta anketa)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  document.getElementById('recent-surveys-table')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-2.5 py-1 rounded-lg bg-[#163D5C] text-white font-bold text-xs hover:bg-[#11314a] transition cursor-pointer"
              >
                Jadvalda koʻrish ↓
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 font-semibold text-xs cursor-pointer"
              >
                Tozalash ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. 4 ta Asosiy KPI Kartochkalari (Qalin borderli, interaktiv tanlov bilan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* Karta 1: Jami oʻrganilgan */}
        <div
          onClick={() => setActiveTab('ALL')}
          className={`bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'ALL'
              ? 'border-[#163D5C] ring-4 ring-[#163D5C]/10 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Jami oʻrganilgan
            </span>
            <div className="w-10 h-10 rounded-xl bg-[#163D5C]/10 text-[#163D5C] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight my-1">
              {(kpi?.totalCitizens || 0).toLocaleString()}
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#163D5C]/10 text-[#163D5C] border border-[#163D5C]/20">
                Umumiy
              </span>
              <span className="text-slate-400 font-medium text-[11px]">xatlovdan oʻtganlar</span>
            </div>
          </div>
        </div>

        {/* Karta 2: Rasmiy band */}
        <div
          onClick={() => setActiveTab('OFFICIALLY_EMPLOYED')}
          className={`bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'OFFICIALLY_EMPLOYED'
              ? 'border-emerald-500 ring-4 ring-emerald-500/15 bg-emerald-50/20 shadow-sm'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rasmiy band
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight my-1 flex items-baseline space-x-2">
              <span>{(kpi?.officiallyEmployed.count || 0).toLocaleString()}</span>
              <span className="text-xs font-extrabold text-emerald-600">
                {kpi?.officiallyEmployed.percentage || 0}%
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-600">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                Qonuniy
              </span>
              <span className="text-slate-400 font-medium text-[11px]">mehnat shartnomasi</span>
            </div>
          </div>
        </div>

        {/* Karta 3: Norasmiy band */}
        <div
          onClick={() => setActiveTab('UNOFFICIALLY_EMPLOYED')}
          className={`bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'UNOFFICIALLY_EMPLOYED'
              ? 'border-amber-500 ring-4 ring-amber-500/15 bg-amber-50/20 shadow-sm'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Norasmiy band
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight my-1 flex items-baseline space-x-2">
              <span>{(kpi?.unofficiallyEmployed.count || 0).toLocaleString()}</span>
              <span className="text-xs font-extrabold text-amber-600">
                {kpi?.unofficiallyEmployed.percentage || 0}%
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                Mavsumiy
              </span>
              <span className="text-slate-400 font-medium text-[11px]">legalizatsiya zarur</span>
            </div>
          </div>
        </div>

        {/* Karta 4: Ishsiz yoshlar */}
        <div
          onClick={() => setActiveTab('UNEMPLOYED')}
          className={`bg-white rounded-2xl p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
            activeTab === 'UNEMPLOYED'
              ? 'border-rose-500 ring-4 ring-rose-500/15 bg-rose-50/20 shadow-sm'
              : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ishsiz yoshlar
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-5 h-5" />
            </div>
          </div>

          <div>
            <div className="text-3xl font-black text-slate-900 tracking-tight my-1 flex items-baseline space-x-2">
              <span>{(kpi?.unemployed.count || 0).toLocaleString()}</span>
              <span className="text-xs font-extrabold text-rose-600">
                {kpi?.unemployed.percentage || 0}%
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-600">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                Chora talab
              </span>
              <span className="text-slate-400 font-medium text-[11px]">2.4 yoʻnalishlar</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Grafika Bloklari (Qalin borderli 2 ta zamonaviy container) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chap grafik (2 ustun): Mahallalar kesimida rangli taqsimot yoki Kunlik Eventlar */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-2xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                Taqsimot va Xatlov Dinamikasi
              </span>
              <h4 className="text-base font-bold text-slate-900 tracking-tight">
                Mahallalar kesimida yoshlar bandligi holati
              </h4>
            </div>

            {/* O'ng tomon: Mahalla Filteri va So'nggi xatlov badge */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Maxsus Chiroyli Mahalla Dropdown (Tuman Boshlig'i va Admin uchun) */}
              {!isMahallaOperator && (
                <div className="relative" ref={mahallaFilterRef}>
                  <button
                    type="button"
                    onClick={() => setIsMahallaFilterOpen(!isMahallaFilterOpen)}
                    className={`flex items-center space-x-2 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-2 rounded-xl border-2 transition text-xs font-bold shadow-2xs cursor-pointer ${
                      isMahallaFilterOpen || selectedMahallaId
                        ? 'border-[#163D5C] ring-2 ring-[#163D5C]/10 text-[#163D5C]'
                        : 'border-slate-200'
                    }`}
                  >
                    <span className="text-slate-500 font-medium text-[11px]">Mahalla:</span>
                    <span className="font-bold text-slate-900">{selectedMahallaDisplayName}</span>
                    {selectedMahallaId ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMahallaChange('');
                        }}
                        className="ml-1 px-1.5 py-0.5 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-700 text-[10px]"
                        title="Filtrni tozalash"
                      >
                        Tozalash ✕
                      </span>
                    ) : (
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                          isMahallaFilterOpen ? 'rotate-180 text-[#163D5C]' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Chiroyli Floating Mahalla Popover (Emojilarsiz, rasmiy dizayn) */}
                  {isMahallaFilterOpen && (
                    <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl p-3 shadow-xl border-2 border-slate-200 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-800">
                          Mahallani tanlang
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsMahallaFilterOpen(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Qidiruv */}
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Mahalla nomini qidirish..."
                          value={mahallaSearchQuery}
                          onChange={(e) => setMahallaSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#163D5C]"
                        />
                        {mahallaSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setMahallaSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
                            title="Tozalash"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Mahalla variantlari */}
                      <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                        <button
                          type="button"
                          onClick={() => {
                            handleMahallaChange('');
                            setIsMahallaFilterOpen(false);
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition text-left cursor-pointer flex items-center justify-between ${
                            !selectedMahallaId
                              ? 'bg-[#163D5C] text-white shadow-xs font-bold'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span>Barcha mahallalar (Tuman boʻyicha)</span>
                          {!selectedMahallaId && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>

                        {filteredMahallaOptions.map((m) => {
                          const isSelected = selectedMahallaId === m.id;
                          const mName = `${(m.name || '').replace(/\s*MFY\s*/gi, '')} MFY`;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => {
                                handleMahallaChange(m.id);
                                setIsMahallaFilterOpen(false);
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-semibold transition text-left cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-[#163D5C] text-white shadow-xs font-bold'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span className="truncate">{mName}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-1.5" />}
                            </button>
                          );
                        })}

                        {filteredMahallaOptions.length === 0 && (
                          <div className="py-4 text-center text-xs text-slate-400">
                            Bunday mahalla topilmadi
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* So'nggi xatlov sanasi nishoni - bir qatorda chiroyli va ixcham */}
              {latestSurveyEvent && (
                <div
                  className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs"
                  title="Eng soʻnggi xatlov sanasi"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Calendar className="w-3.5 h-3.5 text-[#163D5C]" />
                  <span>Soʻnggi xatlov:</span>
                  <b className="text-slate-900 font-bold">{latestSurveyEvent.dateText}</b>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#163D5C] font-semibold">{latestSurveyEvent.mahallaName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Rangli ko'rsatkichlar (Legend) & Click hint */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center flex-wrap gap-2 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-700 font-semibold">Rasmiy</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="text-slate-700 font-semibold">Norasmiy</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span className="text-slate-700 font-semibold">Ishsiz</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                <span className="text-slate-700 font-semibold">Istagi yoʻq</span>
              </span>
            </div>

            <span className="text-[11px] font-medium text-slate-400 flex items-center">
              Tarixni koʻrish uchun ustunga bosing 👆
            </span>
          </div>

          <div className="h-64 w-full">
            {barChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  onClick={handleChartClick}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={<CustomXAxisTick />}
                    interval={0}
                    height={38}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                  />
                  <Tooltip
                    content={<CustomMainChartTooltip />}
                    cursor={{ fill: '#F8FAFC' }}
                  />
                  {/* Yashil: Rasmiy band */}
                  <Bar
                    dataKey="official"
                    name="Rasmiy band"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                    barSize={isMahallaOperator ? 24 : 14}
                    minPointSize={3}
                    cursor="pointer"
                    onClick={(data) => openEventModal(data)}
                  />
                  {/* Sariq: Norasmiy band */}
                  <Bar
                    dataKey="unofficial"
                    name="Norasmiy band"
                    fill="#F59E0B"
                    radius={[6, 6, 0, 0]}
                    barSize={isMahallaOperator ? 24 : 14}
                    minPointSize={3}
                    cursor="pointer"
                    onClick={(data) => openEventModal(data)}
                  />
                  {/* Qizil: Ishsiz yoshlar */}
                  <Bar
                    dataKey="unemployed"
                    name="Ishsiz yoshlar"
                    fill="#EF4444"
                    radius={[6, 6, 0, 0]}
                    barSize={isMahallaOperator ? 24 : 14}
                    minPointSize={3}
                    cursor="pointer"
                    onClick={(data) => openEventModal(data)}
                  />
                  {/* Kulrang: Ishlash istagi yo'q */}
                  <Bar
                    dataKey="noWish"
                    name="Ishlash istagi yoʻq"
                    fill="#94A3B8"
                    radius={[6, 6, 0, 0]}
                    barSize={isMahallaOperator ? 24 : 14}
                    minPointSize={3}
                    cursor="pointer"
                    onClick={(data) => openEventModal(data)}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400 font-medium">
                Hozircha mahalla maʻlumotlari mavjud emas
              </div>
            )}
          </div>
        </div>

        {/* O'ng grafik (1 ustun): Toifalar nisbati va Dinamika (Screenshot 3 dagi rangli barlar) */}
        <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Toifalar nisbati
                </span>
                <h4 className="text-base font-bold text-slate-900 tracking-tight">
                  Bandlik toifalari ulushi
                </h4>
              </div>
              <span className="text-xs font-bold text-[#163D5C] bg-[#163D5C]/10 border border-[#163D5C]/20 px-2.5 py-1 rounded-xl">
                Umumiy ulush
              </span>
            </div>

            {/* Smart School 3-rasmdagi gorizontal rangli progress barlar */}
            <div className="space-y-3.5 my-3">
              {/* 1. Yashil: Rasmiy band */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>Rasmiy band</span>
                  </div>
                  <span className="font-bold text-emerald-600">
                    {kpi?.officiallyEmployed.percentage || 0}% ({kpi?.officiallyEmployed.count || 0})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kpi?.officiallyEmployed.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* 2. Sariq: Norasmiy band */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>Norasmiy band</span>
                  </div>
                  <span className="font-bold text-amber-600">
                    {kpi?.unofficiallyEmployed.percentage || 0}% ({kpi?.unofficiallyEmployed.count || 0})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kpi?.unofficiallyEmployed.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* 3. Qizil: Ishsiz yoshlar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                    <span>Ishsiz yoshlar (ogohlik)</span>
                  </div>
                  <span className="font-bold text-rose-600">
                    {kpi?.unemployed.percentage || 0}% ({kpi?.unemployed.count || 0})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kpi?.unemployed.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* 4. Kulrang: Istagi yo'qlar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center space-x-2 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                    <span>Ishlash istagi yoʻq</span>
                  </div>
                  <span className="font-bold text-slate-500">
                    {kpi?.noWishToWork?.percentage || 0}% ({kpi?.noWishToWork?.count || 0})
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(kpi?.noWishToWork?.percentage || 0, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Pastida mini trend chizig'i (Kunlik so'rovnoma dinamikasi: Du, Se, Cho, Pa, Ju, Sha, Ya) */}
          <div className="pt-3 border-t-2 border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
              <span className="font-bold text-slate-800 flex items-center">
                <TrendingUp className="w-3.5 h-3.5 text-[#163D5C] mr-1" />
                Kunlik xatlov surʻati (Haftalik):
              </span>
              <span className="font-bold text-[#163D5C] bg-[#163D5C]/10 px-2 py-0.5 rounded-lg text-[10px]">
                Du — Ya
              </span>
            </div>
            {weeklyTrendData.length > 0 ? (
              <div className="h-20 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrendData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                    <XAxis
                      dataKey="dayLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }}
                    />
                    <Tooltip content={<CustomWeeklyTrendTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#163D5C"
                      strokeWidth={2.5}
                      dot={{ r: 3.5, fill: '#163D5C', strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 5.5, fill: '#163D5C', stroke: '#93C5FD', strokeWidth: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-16 flex items-center justify-center text-xs text-slate-400 font-medium bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                Tanlangan davrda xatlov oʻtkazilmagan
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. Pastki Jadval: So'nggi so'rovnomalar (Smart School "Qurilmalar boshqaruvi" uslubi) */}
      <div id="recent-surveys-table" className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xs overflow-hidden scroll-mt-6">
        {/* Sarlavha va Action tugmalari */}
        <div className="p-5 border-b-2 border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 tracking-tight">
              Soʻnggi xatlov yozuvlari
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Operatorlar tomonidan kiritilgan anketalar jurnali (KPI koʻrsatkichlarida fuqarolarning oxirgi amaldagi holati aks etadi)
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => fetchDashboardData(selectedDistrictId, selectedMahallaId)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Yangilash</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/surveys')}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Barchasini koʻrish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Jadval qismi */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50/80 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-5">Fuqaro F.I.Sh.</th>
                <th className="py-3.5 px-4">Sana</th>
                <th className="py-3.5 px-4">Mahalla</th>
                <th className="py-3.5 px-4">Oʻrganish shakli</th>
                <th className="py-3.5 px-4">Bandlik Holati</th>
                <th className="py-3.5 px-5 text-right">Batafsil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredSurveys.length > 0 ? (
                (() => {
                  const seenCitizenMap = new Map<string, number>();
                  filteredSurveys.forEach((s: Survey) => {
                    const key = s.citizenPinfl || s.citizenId || s.citizenFullName;
                    seenCitizenMap.set(key, (seenCitizenMap.get(key) || 0) + 1);
                  });
                  const renderedCitizens = new Set<string>();

                  return filteredSurveys.map((survey: Survey) => {
                    const key = survey.citizenPinfl || survey.citizenId || survey.citizenFullName;
                    const isMulti = (seenCitizenMap.get(key) || 0) > 1;
                    const isLatest = !renderedCitizens.has(key);
                    renderedCitizens.add(key);

                    return (
                      <tr key={survey.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-5 font-bold text-slate-900">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-xl bg-[#163D5C]/10 text-[#163D5C] flex items-center justify-center font-bold text-xs shrink-0">
                              {survey.citizenFullName.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <span className="truncate max-w-[200px] text-slate-900 font-bold">
                                  {survey.citizenFullName}
                                </span>
                                {isMulti && (
                                  isLatest ? (
                                    <span
                                      className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
                                      title="Fuqaroning eng soʻnggi tasdiqlangan amaldagi holati"
                                    >
                                      Amaldagi
                                    </span>
                                  ) : (
                                    <span
                                      className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-500 border border-slate-200 shrink-0"
                                      title="Fuqaroning avvalgi xatlov yozuvi (arxiv tarixi)"
                                    >
                                      Oldingi xatlov
                                    </span>
                                  )
                                )}
                              </div>
                              {survey.citizenPinfl && (
                                <span className="text-[10px] font-mono text-slate-400">
                                  JSHSHIR: {survey.citizenPinfl}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {new Date(survey.surveyDate).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {survey.mahalla?.name || 'Davlatobod'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {survey.surveyMethod === 'HOME_VISIT'
                            ? 'Uyma-uy'
                            : survey.surveyMethod === 'PHONE'
                            ? 'Telefon'
                            : 'Qabulda'}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(survey.mainCategory, survey.status)}
                        </td>
                        <td className="py-3.5 px-5 text-right">
                          <button
                            onClick={() => navigate(`/surveys`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#163D5C] hover:bg-slate-100 transition cursor-pointer"
                            title="Koʻrish"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  });
                })()
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-xs">
                    Hozircha tanlangan toifada anketalar mavjud emas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Xatlov Eventlari Tarixi Modali (Ustun yoki sana bosilganda ochiladi) */}
      {selectedEventData && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedEventData(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border-2 border-slate-200 max-h-[90vh] flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div>
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#163D5C]/10 text-[#163D5C] border border-[#163D5C]/20 flex items-center justify-center shrink-0">
                    <History className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {selectedEventData.type === 'MAHALLA' ? 'Hududiy Event' : 'Kunlik Event'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-emerald-600 flex items-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
                        Xatlov jurnali
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                      {selectedEventData.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {selectedEventData.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedEventData(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tezkor Ko'rsatkichlar (KPI Pills) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Jami</span>
                  <span className="text-base font-black text-slate-900">{selectedEventData.total}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Rasmiy</span>
                  <span className="text-base font-black text-emerald-700">{selectedEventData.official}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Norasmiy</span>
                  <span className="text-base font-black text-amber-700">{selectedEventData.unofficial}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-700 uppercase block">Ishsiz</span>
                  <span className="text-base font-black text-rose-700">{selectedEventData.unemployed}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-300 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-600 uppercase block">Istagi yoʻq</span>
                  <span className="text-base font-black text-slate-700">{selectedEventData.noWish}</span>
                </div>
              </div>
            </div>

            {/* Event Timeline / Ro'yxat */}
            <div className="flex-1 overflow-y-auto max-h-[45vh] pr-1 space-y-2.5 my-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Anketalar va Xatlov Sanalari ({selectedEventData.events.length} ta soʻnggi yozuv)
              </span>
              {selectedEventData.events.length > 0 ? (
                selectedEventData.events.map((ev) => {
                  const dateStr = new Date(ev.surveyDate).toLocaleDateString('uz-UZ');
                  return (
                    <div
                      key={ev.id}
                      className="p-3 rounded-2xl bg-white border-2 border-slate-100 hover:border-slate-300 transition flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#163D5C]/10 text-[#163D5C] flex items-center justify-center font-bold text-xs shrink-0">
                          <Calendar className="w-4 h-4 text-[#163D5C]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {ev.citizenFullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {ev.citizenPinfl ? `(${ev.citizenPinfl})` : ''}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="font-bold text-[#163D5C]">{dateStr}</span>
                            <span>•</span>
                            <span>{ev.mahalla?.name || 'Davlatobod'}</span>
                            <span>•</span>
                            <span>{ev.surveyMethod === 'HOME_VISIT' ? 'Uyma-uy' : ev.surveyMethod === 'PHONE' ? 'Telefon' : 'Qabulda'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {getStatusBadge(ev.mainCategory, ev.status)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Soʻnggi oʻrganishlar jurnali qisqa roʻyxatda emas</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Ushbu toʻplam boʻyicha barcha yozuvlarni Fuqarolar reyestri sahifasida batafsil tahlil qilishingiz mumkin.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-2">
              <button
                type="button"
                onClick={() => setSelectedEventData(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
              >
                Yopish
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedEventData(null);
                  handleDrillDown();
                }}
                className="px-4 py-2 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <span>Fuqarolar reyestrida ochish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
