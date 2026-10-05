import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { monitoringApi } from '../api/monitoring.api';
import { User, UserRole } from '../types/auth.types';
import { Mahalla, District } from '../types/monitoring.types';
import { CustomSelect } from '../components/ui/CustomSelect';
import { Pagination } from '../components/ui/Pagination';
import { useAuth } from '../context/AuthContext';
import { formatUzPhone, isValidUzPhone } from '../utils/validators';
import { formatMahallaName } from '../utils/formatters';
import {
  Users,
  Plus,
  Trash2,
  Search,
  Eye,
  EyeOff,
  X,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone,
} from 'lucide-react';

type TabRoleFilter = 'ALL' | UserRole;

export const UsersManagementPage: React.FC = () => {
  const { user: currentUser, isSuperAdmin, isDistrictAdmin } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [mahallas, setMahallas] = useState<Mahalla[]>([]);
  const [districts, setDistricts] = useState<Array<{ id: string; name: string; region: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabRoleFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState<number>(1);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalRole, setModalRole] = useState<UserRole>('MAHALLA_OPERATOR');

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginReadOnly, setLoginReadOnly] = useState(true);
  const [passwordReadOnly, setPasswordReadOnly] = useState(true);
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [mahallaId, setMahallaId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await monitoringApi.getUsers({ limit: 100 });
      setUsers(res.items);
    } catch (err: any) {
      console.error('Xodimlarni yuklashda xatolik:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [mRes, dRes] = await Promise.all([
        monitoringApi.getMahallasDropdown(),
        monitoringApi.getDistrictsDropdown(),
      ]);
      setMahallas(mRes as any);
      setDistricts(dRes);
    } catch (err) {
      console.error('Dropdown ma\'lumotlarini yuklashda xatolik:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDropdowns();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab, searchQuery]);

  useEffect(() => {
    if (showAddModal) {
      setUsername('');
      setPassword('');
      setLoginReadOnly(true);
      setPasswordReadOnly(true);
      const timer = setTimeout(() => {
        setUsername('');
        setPassword('');
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [showAddModal, modalRole]);

  const openAddModal = (roleToCreate: UserRole) => {
    setModalRole(roleToCreate);
    setFirstName('');
    setLastName('');
    setUsername('');
    setPhone('');
    setPassword('');
    setLoginReadOnly(true);
    setPasswordReadOnly(true);
    setShowPassword(false);
    setError(null);

    // Boshlang'ich tuman va mahalla tanlovi (har doim bo'sh tanlanmagan holatda turadi)
    const defaultDistrictId = isDistrictAdmin ? currentUser?.districtId || '' : '';
    setSelectedDistrictId(defaultDistrictId);
    setMahallaId('');

    setShowAddModal(true);
  };

  const handleDistrictChange = (districtId: string) => {
    setSelectedDistrictId(districtId);
    setMahallaId(''); // Mahalla tanlovini tozalash
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      setError('Iltimos, ism va familiyani kiriting');
      return;
    }
    if (!username.trim()) {
      setError('Login (foydalanuvchi nomi) kiritilishi shart');
      return;
    }

    // Telefon raqami qat'iy majburiy va O'zbekiston formati bo'yicha
    if (!phone.trim() || !isValidUzPhone(phone)) {
      setError('Telefon raqami kiritilishi majburiy. Format: +998 (XX) XXX-XX-XX');
      return;
    }

    if (!password || password.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    // Tuman Admini uchun tuman majburiy
    if (modalRole === 'DISTRICT_ADMIN' && !selectedDistrictId) {
      setError('Tuman boshlig\'i uchun tuman tanlanishi shart');
      return;
    }

    // Mahalla Operatori uchun tuman va mahalla majburiy
    if (modalRole === 'MAHALLA_OPERATOR') {
      if (!selectedDistrictId) {
        setError('Mahalla operatori uchun tuman tanlanishi shart');
        return;
      }
      if (!mahallaId) {
        setError('Mahalla operatori uchun mahalla tanlanishi shart');
        return;
      }
    }

    const fullFullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      setSubmitting(true);
      setError(null);

      await monitoringApi.createUser({
        username: username.trim(),
        password,
        fullName: fullFullName,
        phone: phone.trim(),
        role: modalRole,
        districtId: selectedDistrictId || undefined,
        mahallaId: modalRole === 'MAHALLA_OPERATOR' ? mahallaId : undefined,
      });

      setShowAddModal(false);
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Xodimni yaratishda xatolik yuz berdi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" xodimini o'chirishga ishonchingiz komilmi?`)) return;
    try {
      await monitoringApi.deleteUser(id);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'O\'chirishda xatolik yuz berdi');
    }
  };

  // 4 ta rol bo'yicha hisob-kitoblar (Tablar uchun)
  const countByRole = (r: UserRole) =>
    users.filter((u) => {
      const code =
        typeof u.role === 'object' && u.role !== null
          ? (u.role as any).code
          : u.roleCode || u.role;
      return code === r;
    }).length;

  // Filtrlash mantiqi
  const filteredUsers = users.filter((u) => {
    const roleCode =
      typeof u.role === 'object' && u.role !== null
        ? (u.role as any).code
        : u.roleCode || u.role;

    if (activeTab !== 'ALL' && roleCode !== activeTab) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const cleanDigits = searchQuery.replace(/\D/g, '');
      const matchName = u.fullName?.toLowerCase().includes(q);
      const matchUsername = u.username?.toLowerCase().includes(q);
      const userPhoneDigits = u.phone?.replace(/\D/g, '') || '';
      const matchPhone =
        u.phone?.toLowerCase().includes(q) ||
        (cleanDigits.length >= 3 && userPhoneDigits.includes(cleanDigits));
      const matchMahalla = u.mahallaName?.toLowerCase().includes(q);
      const matchDistrict = u.districtName?.toLowerCase().includes(q);
      return matchName || matchUsername || matchPhone || matchMahalla || matchDistrict;
    }

    return true;
  });

  const getRoleTitle = (r: UserRole): string => {
    switch (r) {
      case 'MAHALLA_OPERATOR':
        return 'Mahalla Operatori (Yetakchi)';
      case 'DISTRICT_ADMIN':
        return 'Tuman Boshligʻi';
      case 'DATA_REVIEWER':
        return 'Maʼlumot Tekshiruvchi';
      case 'SUPER_ADMIN':
        return 'Super Admin';
      default:
        return 'Xodim';
    }
  };

  const getRoleBadge = (u: User) => {
    const code =
      typeof u.role === 'object' && u.role !== null
        ? (u.role as any).code
        : u.roleCode || u.role;
    switch (code) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-900 text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
            Super Admin
          </span>
        );
      case 'DISTRICT_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#163D5C]/10 text-[#163D5C] border border-[#163D5C]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#163D5C]"></span>
            Tuman Boshligʻi
          </span>
        );
      case 'MAHALLA_OPERATOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Mahalla Operatori
          </span>
        );
      case 'DATA_REVIEWER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Maʼlumot Tekshiruvchi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {code}
          </span>
        );
    }
  };

  // Tanlangan tumanga mos mahallalar ro'yxati
  const availableMahallas = selectedDistrictId
    ? mahallas.filter((m) => {
        const dId = m.districtId || (typeof m.district === 'object' ? (m.district as any)?.id : m.district);
        return dId === selectedDistrictId;
      })
    : mahallas;

  return (
    <DashboardLayout
      title="Xodimlar Boshqaruvi"
      breadcrumbs={['Sahifalar', 'Boshqaruv', 'Xodimlar & Rollar']}
      searchValue={searchQuery}
      onSearch={setSearchQuery}
      searchPlaceholder="Xodimlarni qidirish (Ism, telefon, login...)"
    >
      {/* 1. Yuqori qism: Sarlavha va Yagona Asosiy Harakat Tugmasi */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-2xs border-2 border-slate-200 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#163D5C]/10 text-[#163D5C] border border-[#163D5C]/15 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Xodimlar</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Tizim xodimlarini 4 ta asosiy rol boʻyicha boshqarish va biriktirish
              </p>
            </div>
          </div>

          {/* Ikkita alohida aniq harakat tugmasi */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => openAddModal('DISTRICT_ADMIN')}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#163D5C] bg-[#163D5C]/10 hover:bg-[#163D5C]/20 border border-[#163D5C]/30 shadow-2xs transition cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-[#163D5C]" />
              <span>+ Tuman boshligʻi qoʻshish</span>
            </button>
            <button
              type="button"
              onClick={() => openAddModal('MAHALLA_OPERATOR')}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#163D5C] hover:bg-[#11314a] shadow-xs transition cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>+ Mahalla operatori qoʻshish</span>
            </button>
          </div>
        </div>

        {/* 2. Kategoriya tablari va Qidiruv */}
        <div className="mt-5 pt-4 border-t-2 border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="p-1 bg-slate-100 rounded-xl border border-slate-200/80 inline-flex flex-wrap gap-1 text-xs">
            {[
              { id: 'ALL', label: 'Barcha xodimlar', count: users.length },
              { id: 'MAHALLA_OPERATOR', label: 'Mahalla yetakchilari', count: countByRole('MAHALLA_OPERATOR') },
              { id: 'DISTRICT_ADMIN', label: 'Tuman boshliqlari', count: countByRole('DISTRICT_ADMIN') },
              ...(isSuperAdmin
                ? [
                    { id: 'DATA_REVIEWER', label: 'Tekshiruvchilar', count: countByRole('DATA_REVIEWER') },
                  ]
                : []),
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as TabRoleFilter)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-white text-[#163D5C] shadow-xs font-bold border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                      isActive ? 'bg-[#163D5C] text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full md:w-72 relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Qidirish (Ism, telefon, login...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition"
                title="Tozalash"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Xodimlar Jadvali */}
      <div className="bg-white rounded-2xl shadow-2xs border-2 border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#163D5C] mb-2" />
            <span className="text-xs font-medium">Xodimlar roʻyxati yuklanmoqda...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 text-xs">
            <Users className="w-10 h-10 text-slate-300 mb-2" />
            <span>Xodimlar topilmadi</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b-2 border-slate-200/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Xodim</th>
                  <th className="py-3.5 px-4">Login</th>
                  <th className="py-3.5 px-4">Toifasi (Roli)</th>
                  <th className="py-3.5 px-4">Biriktirilgan Hudud</th>
                  <th className="py-3.5 px-4">Telefon</th>
                  <th className="py-3.5 px-4">Holati</th>
                  <th className="py-3.5 px-4 text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers
                  .slice((page - 1) * 10, page * 10)
                  .map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                      {(page - 1) * 10 + idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-[#163D5C]/10 text-[#163D5C] border border-[#163D5C]/15 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.fullName}</div>
                          <div className="text-[11px] text-slate-400">{u.email || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-600">
                      {u.username}
                    </td>
                    <td className="py-3.5 px-4">{getRoleBadge(u)}</td>
                    <td className="py-3.5 px-4">
                      {u.mahallaName ? (
                        <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatMahallaName(u.mahallaName)}</span>
                          {u.districtName && (
                            <span className="text-slate-400 text-[11px]">({u.districtName})</span>
                          )}
                        </div>
                      ) : u.districtName ? (
                        <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{u.districtName}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-medium">
                      {u.phone ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-700">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{formatUzPhone(u.phone)}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-sans text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Faol
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-500 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Nofaol
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isSuperAdmin && u.roleCode !== 'SUPER_ADMIN' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id, u.fullName)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Xodimni oʻchirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Sahifalash (Pagination) */}
        {!loading && filteredUsers.length > 0 && (
          <Pagination
            currentPage={page}
            totalItems={filteredUsers.length}
            pageSize={10}
            onPageChange={(p) => setPage(p)}
          />
        )}
      </div>

      {/* 5. Yangi xodim qo'shish modali */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border-2 border-slate-200 relative my-6 animate-in fade-in zoom-in-95">
            {/* Modal Sarlavhasi */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs ${
                    modalRole === 'DISTRICT_ADMIN' ? 'bg-[#163D5C]' : 'bg-emerald-600'
                  }`}
                >
                  {modalRole === 'DISTRICT_ADMIN' ? (
                    <Building2 className="w-5 h-5" />
                  ) : (
                    <Users className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {modalRole === 'DISTRICT_ADMIN'
                      ? 'Yangi Tuman Boshligʻi qoʻshish'
                      : 'Yangi Mahalla Operatori qoʻshish'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {modalRole === 'DISTRICT_ADMIN'
                      ? 'Tuman darajasidagi masʼul rahbar akkauntini yaratish'
                      : 'Mahalla boʻyicha yoshlar yetakchisi akkauntini yaratish'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Qaysi rol kiritilayotganini aniq ko'rsatuvchi va o'zgartiruvchi blok */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                Biriktiriladigan lavozim (Roli)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setModalRole('DISTRICT_ADMIN')}
                  className={`p-3 rounded-xl border-2 text-left transition flex items-center space-x-3 cursor-pointer ${
                    modalRole === 'DISTRICT_ADMIN'
                      ? 'border-[#163D5C] bg-[#163D5C]/5 text-[#163D5C] ring-2 ring-[#163D5C]/15 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      modalRole === 'DISTRICT_ADMIN'
                        ? 'bg-[#163D5C] text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">Tuman Boshligʻi</div>
                    <div className="text-[10px] text-slate-400 font-normal">Tuman boshqaruvi</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setModalRole('MAHALLA_OPERATOR')}
                  className={`p-3 rounded-xl border-2 text-left transition flex items-center space-x-3 cursor-pointer ${
                    modalRole === 'MAHALLA_OPERATOR'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/15 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      modalRole === 'MAHALLA_OPERATOR'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">Mahalla Operatori</div>
                    <div className="text-[10px] text-slate-400 font-normal">Yetakchi (Xatlovchi)</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Xatolik xabari */}
            {error && (
              <div className="flex items-center p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4" autoComplete="off">
              {/* Brauzer avtomatik to'ldirishi (Chrome/Edge autofill) ni to'xtatuvchi tuzoq */}
              <div
                style={{
                  opacity: 0,
                  position: 'absolute',
                  top: -9999,
                  left: -9999,
                  height: 0,
                  width: 0,
                  overflow: 'hidden',
                }}
                tabIndex={-1}
                aria-hidden="true"
              >
                <input
                  type="text"
                  name="fake_autofill_username"
                  tabIndex={-1}
                  autoComplete="off"
                />
                <input
                  type="password"
                  name="fake_autofill_password"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Ism */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Ism <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Vali"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 text-sm text-slate-800 placeholder-slate-400 outline-none transition"
                  />
                </div>

                {/* 2. Familiya */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Familiya <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Aliyev"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 text-sm text-slate-800 placeholder-slate-400 outline-none transition"
                  />
                </div>

                {/* 3. Login */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Login (foydalanuvchi nomi) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="emp_acc_alias"
                    name="emp_acc_alias"
                    type="text"
                    required
                    autoComplete="off"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-form-type="other"
                    placeholder="Masalan: vali_aliyev"
                    value={username}
                    readOnly={loginReadOnly}
                    onFocus={() => setLoginReadOnly(false)}
                    onMouseDown={() => setLoginReadOnly(false)}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 text-sm font-mono text-slate-800 placeholder-slate-400 outline-none transition"
                  />
                </div>

                {/* 4. Telefon raqami */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Telefon raqami <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+998 (90) 123-45-67"
                    value={phone}
                    onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 text-sm font-mono text-slate-800 placeholder-slate-400 outline-none transition"
                  />
                </div>

                {/* 5. Parol */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Parol <span className="text-red-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="emp_sec_token"
                      name="emp_sec_token"
                      type="text"
                      required
                      autoComplete="off"
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      style={
                        {
                          WebkitTextSecurity: showPassword ? 'none' : 'disc',
                        } as React.CSSProperties
                      }
                      placeholder="Parolni kiriting..."
                      value={password}
                      readOnly={passwordReadOnly}
                      onFocus={() => setPasswordReadOnly(false)}
                      onMouseDown={() => setPasswordReadOnly(false)}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 focus:border-[#163D5C] focus:ring-1 focus:ring-[#163D5C]/20 text-sm text-slate-800 placeholder-slate-400 outline-none transition font-mono"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 p-0.5 focus:outline-none transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 6. Tuman tanlash */}
                <div>
                  <CustomSelect
                    label="Biriktirilgan tuman"
                    required
                    searchable={true}
                    placeholder="Tumanni tanlang..."
                    disabled={isDistrictAdmin}
                    value={selectedDistrictId}
                    onChange={handleDistrictChange}
                    options={districts.map((d) => ({
                      value: d.id,
                      label: d.name,
                      sublabel: d.region,
                    }))}
                  />
                </div>

                {/* 7. Mahalla tanlash (Faqat Mahalla Operatori bo'lsa) */}
                {modalRole === 'MAHALLA_OPERATOR' && (
                  <div className="sm:col-span-2">
                    <CustomSelect
                      label="Biriktiriladigan mahalla (MFY)"
                      required
                      searchable={true}
                      placeholder={
                        selectedDistrictId
                          ? 'Mahallani tanlang...'
                          : 'Avval tumanni tanlang'
                      }
                      disabled={!selectedDistrictId}
                      value={mahallaId}
                      onChange={(val) => setMahallaId(val)}
                      options={availableMahallas.map((m) => ({
                        value: m.id,
                        label: formatMahallaName(m.name),
                      }))}
                    />
                    {selectedDistrictId && availableMahallas.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        Ushbu tumanda hali mahallalar kiritilmagan.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Tugmalari */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 focus:outline-none transition cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#163D5C] hover:bg-[#11314a] focus:outline-none shadow-xs transition disabled:opacity-60 flex items-center space-x-2 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
