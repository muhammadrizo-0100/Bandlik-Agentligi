import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  FilePlus,
  AlertTriangle,
  Building2,
  UserCheck,
  UserCog,
  LogOut,
  ChevronDown,
  Layers,
  MapPin,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { monitoringApi } from '../../api/monitoring.api';

interface SidebarProps {
  selectedDistrictId?: string;
  onDistrictChange?: (districtId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedDistrictId,
  onDistrictChange,
}) => {
  const {
    user,
    logout,
    isSuperAdmin,
    isDistrictAdmin,
    isMahallaOperator,
    isDataReviewer,
  } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [districts, setDistricts] = useState<Array<{ id: string; name: string }>>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    // Review navbati hisoblagichi
    if (isDataReviewer || isSuperAdmin || isDistrictAdmin) {
      monitoringApi
        .getReviewQueueCount()
        .then((res) => setPendingCount(res.count))
        .catch(() => {});
    }

    // Super Admin uchun tumanlar ro'yxati
    if (isSuperAdmin) {
      monitoringApi
        .getDistrictsDropdown()
        .then((res) => setDistricts(res))
        .catch(() => {});
    }
  }, [isDataReviewer, isSuperAdmin, isDistrictAdmin]);

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    toast.info('Tizimdan muvaffaqiyatli chiqildi');
    navigate('/login');
  };

  const getRoleDisplayName = () => {
    const roleCode = user?.roleCode || user?.role;
    switch (roleCode) {
      case 'SUPER_ADMIN':
        return 'Bosh Administrator';
      case 'DISTRICT_ADMIN':
        return 'Tuman Boshligʻi';
      case 'MAHALLA_OPERATOR':
        return 'Mahalla Yetakchisi';
      case 'DATA_REVIEWER':
        return 'Data Reviewer';
      default:
        return 'Xodim';
    }
  };

  const currentDistrictName = () => {
    if (isSuperAdmin) {
      if (!selectedDistrictId) return 'Barcha tumanlar';
      const found = districts.find((d) => d.id === selectedDistrictId);
      return found ? found.name : 'Barcha tumanlar';
    }
    if (isDistrictAdmin) {
      return user?.districtName || 'Davlatobod tumani';
    }
    if (isMahallaOperator) {
      return user?.mahallaName
        ? (user.mahallaName.includes('MFY') ? user.mahallaName : `${user.mahallaName} MFY`)
        : 'Mahalla';
    }
    if (isDataReviewer) {
      return 'Tekshiruv Markazi';
    }
    return 'Bandlik Agentligi';
  };

  // Screenshot uslubi: Oq fon, active holatda #163D5C rangidagi nozik glassmorfizm kapsulasi
  const getNavLinkClass = (isActive: boolean) =>
    `flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl transition duration-150 text-[13px] ${
      isActive
        ? 'bg-[#163D5C]/10 backdrop-blur-md border border-[#163D5C]/20 text-[#163D5C] font-bold shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
    }`;

  return (
    <aside className="w-64 h-full bg-white text-slate-700 flex flex-col justify-between border-r border-slate-200/80 flex-shrink-0 select-none overflow-y-auto">
      {/* Yuqori qism: Logo, Hudud tanlagich va Menyu */}
      <div>
        {/* 1. Brand Logo (Screenshot uslubida) */}
        <div className="p-5 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#163D5C] flex items-center justify-center shadow-md shadow-[#163D5C]/20 text-white flex-shrink-0">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h1 className="text-base font-bold text-[#163D5C] tracking-tight">
                Bandlik
              </h1>
              <span className="text-[10px] font-bold bg-[#163D5C]/10 text-[#163D5C] px-1.5 py-0.5 rounded-md">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Monitoring & Tahlil</p>
          </div>
        </div>

        {/* 2. Faoliyat Hududi (Toza oq karkas kartasi) */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Faoliyat Hududi
          </p>
          <div className="relative">
            <button
              type="button"
              onClick={() => isSuperAdmin && setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition ${
                isSuperAdmin
                  ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-800 cursor-pointer'
                  : 'bg-slate-50/80 border-slate-200/70 text-slate-800 cursor-default'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <div className="w-7 h-7 rounded-xl bg-[#163D5C]/10 border border-[#163D5C]/20 text-[#163D5C] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="text-left truncate">
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {currentDistrictName()}
                  </span>
                  <span className="block text-[10px] text-slate-400 font-medium truncate">
                    {isMahallaOperator
                      ? user?.districtName || 'Davlatobod tumani'
                      : 'Namangan viloyati'}
                  </span>
                </div>
              </div>
              {isSuperAdmin && (
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              )}
            </button>

            {/* Super Admin Tuman Tanlash Dropdowni */}
            {isSuperAdmin && isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-1.5 max-h-56 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    onDistrictChange && onDistrictChange('');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 rounded-xl transition ${
                    !selectedDistrictId
                      ? 'font-bold text-[#163D5C] bg-[#163D5C]/10 border border-[#163D5C]/20'
                      : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }`}
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {!selectedDistrictId && (
                      <Check className="w-4 h-4 text-[#163D5C] stroke-[2.5]" />
                    )}
                  </div>
                  <span>Barcha tumanlar</span>
                </button>
                {districts.map((d) => {
                  const isSelected = selectedDistrictId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        onDistrictChange && onDistrictChange(d.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 rounded-xl transition ${
                        isSelected
                          ? 'font-bold text-[#163D5C] bg-[#163D5C]/10 border border-[#163D5C]/20'
                          : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="w-4 h-4 flex items-center justify-center shrink-0">
                        {isSelected && (
                          <Check className="w-4 h-4 text-[#163D5C] stroke-[2.5]" />
                        )}
                      </div>
                      <span className="truncate">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Menyu Bo'limlari (Screenshot uslubida) */}
        <nav className="p-3 space-y-1">
          {/* ======================================================== */}
          {/* A. SUPER ADMIN KABINETI */}
          {/* ======================================================== */}
          {isSuperAdmin && (
            <>
              <div className="pt-2 pb-1 px-3">
                <span className="text-xs font-semibold text-slate-700">
                  Kunlik ish
                </span>
              </div>

              <NavLink to="/dashboard" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <LayoutDashboard
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Boshqaruv paneli</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/new-survey" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <FilePlus
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Yangi soʻrovnoma</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/citizens" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <Users
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Fuqarolar reyestri</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/surveys" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <FileSpreadsheet
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Soʻrovnomalar jurnali</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/review-queue" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <AlertTriangle
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-amber-500'
                      }`}
                    />
                    <span>Tekshiruv navbati</span>
                    {pendingCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shadow-xs">
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>

              <div className="pt-4 pb-1 px-3">
                <span className="text-xs font-semibold text-slate-700">
                  Tizim boshqaruvi
                </span>
              </div>

              <NavLink to="/mahallas" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <Building2
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Tuman & Mahallalar</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/users" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <UserCog
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Xodimlar & Rollar</span>
                  </>
                )}
              </NavLink>
            </>
          )}

          {/* ======================================================== */}
          {/* B. DISTRICT ADMIN (TUMAN BOSHLIG'I) KABINETI */}
          {/* ======================================================== */}
          {isDistrictAdmin && (
            <>
              <div className="pt-2 pb-1 px-3">
                <span className="text-xs font-semibold text-slate-700">
                  Kunlik ish
                </span>
              </div>

              <NavLink to="/dashboard" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <LayoutDashboard
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Boshqaruv paneli</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/new-survey" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <FilePlus
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Yangi soʻrovnoma</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/citizens" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <Users
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Tuman yoshlari</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/surveys" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <FileSpreadsheet
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Tuman soʻrovnomalari</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/review-queue" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <AlertTriangle
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-amber-500'
                      }`}
                    />
                    <span>Tekshiruv navbati</span>
                    {pendingCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shadow-xs">
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>

              <div className="pt-4 pb-1 px-3">
                <span className="text-xs font-semibold text-slate-700">
                  Tuman boshqaruvi
                </span>
              </div>

              <NavLink to="/mahallas" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <Building2
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Mahallalar</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/users" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <UserCheck
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Mahalla yetakchilari</span>
                  </>
                )}
              </NavLink>
            </>
          )}

          {/* ======================================================== */}
          {/* C. MAHALLA OPERATORI (YETAKCHI) KABINETI */}
          {/* TALAB: 1-o'rinda Boshqaruv paneli tursin (Mahalla tahlili) */}
          {/* ======================================================== */}
          {isMahallaOperator && (
            <>
              <div className="pt-2 pb-1 px-3">
                <span className="text-xs font-semibold text-slate-700">
                  Kunlik ish
                </span>
              </div>

              {/* 1. BIRINCHI O'RINDA: Boshqaruv paneli (Mahalla tahlili) */}
              <NavLink to="/dashboard" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <LayoutDashboard
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Boshqaruv paneli</span>
                  </>
                )}
              </NavLink>

              {/* 2. Yangi so'rovnoma kiritish */}
              <NavLink to="/new-survey" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <FilePlus
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Yangi soʻrovnoma</span>
                  </>
                )}
              </NavLink>

              {/* 3. So'rovnomalar jurnali */}
              <NavLink to="/surveys" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <FileSpreadsheet
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Soʻrovnomalar jurnali</span>
                  </>
                )}
              </NavLink>

              {/* 4. Mahalla yoshlari reyestri */}
              <NavLink to="/citizens" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <Users
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Mahalla yoshlari</span>
                  </>
                )}
              </NavLink>
            </>
          )}

          {/* ======================================================== */}
          {/* D. DATA REVIEWER (MA'LUMOT TEKSHIRUVCHI) KABINETI */}
          {/* ======================================================== */}
          {isDataReviewer && (
            <>
              <div className="pt-2 pb-1 px-3">
                <span className="text-xs font-semibold text-slate-700">
                  Kunlik ish
                </span>
              </div>

              <NavLink to="/review-queue" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <AlertTriangle
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-amber-500'
                      }`}
                    />
                    <span>Tekshiruv navbati</span>
                    {pendingCount > 0 && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto shadow-xs">
                        {pendingCount}
                      </span>
                    )}
                  </>
                )}
              </NavLink>

              <NavLink to="/dashboard" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <LayoutDashboard
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Boshqaruv paneli</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/citizens" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <Users
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Fuqarolar reyestri</span>
                  </>
                )}
              </NavLink>

              <NavLink to="/surveys" className={({ isActive }) => getNavLinkClass(isActive)}>
                {({ isActive }) => (
                  <>
                    <FileSpreadsheet
                      className={`w-[18px] h-[18px] flex-shrink-0 ${
                        isActive ? 'text-[#163D5C]' : 'text-slate-500'
                      }`}
                    />
                    <span>Soʻrovnomalar jurnali</span>
                  </>
                )}
              </NavLink>
            </>
          )}
        </nav>
      </div>

      {/* 4. Pastki qism: Xodim ma'lumoti va Chiqish (Screenshot uslubi) */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        {/* User Card */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
          <div className="w-9 h-9 rounded-xl bg-[#163D5C] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="truncate flex-1">
            <span className="block text-xs font-bold text-slate-800 truncate">
              {user?.fullName}
            </span>
            <span className="block text-[10px] text-slate-400 font-semibold truncate">
              {getRoleDisplayName()}
            </span>
          </div>
        </div>

        {/* Chiqish Tugmasi (Screenshot uslubida) */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer text-[13px] font-medium"
        >
          <LogOut className="w-[18px] h-[18px] text-slate-500" />
          <span>Chiqish</span>
        </button>
      </div>

      {/* Chiqishni tasdiqlash modali */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
              <LogOut className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">
                Tizimdan chiqishni tasdiqlaysizmi?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Joriy ish sessiyangiz yakunlanadi. Qayta kirish uchun login va parolingizni kiritishingiz kerak boʻladi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={confirmLogout}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Ha, chiqish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
