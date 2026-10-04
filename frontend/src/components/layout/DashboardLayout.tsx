import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Search, Bell, ChevronRight, ShieldCheck, X } from 'lucide-react';
import { formatMahallaName } from '../../utils/formatters';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: string[];
  selectedDistrictId?: string;
  onDistrictChange?: (districtId: string) => void;
  searchValue?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs = ['Sahifalar', 'Dashboard'],
  selectedDistrictId,
  onDistrictChange,
  searchValue,
  onSearch,
  searchPlaceholder = 'Istalgan narsani qidiring (F.I.Sh., JSHSHIR, telefon)...',
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [internalSearch, setInternalSearch] = useState(searchValue || '');

  useEffect(() => {
    if (searchValue !== undefined) {
      setInternalSearch(searchValue);
    }
  }, [searchValue]);

  const handleInputChange = (val: string) => {
    setInternalSearch(val);
    if (onSearch) {
      onSearch(val);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!onSearch && internalSearch.trim()) {
        navigate(`/citizens?search=${encodeURIComponent(internalSearch.trim())}`);
      }
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-sans text-slate-800 antialiased select-none">
      {/* Sidebar with district switcher - 100% Fixed */}
      <aside className="w-64 h-screen flex-shrink-0 z-30">
        <Sidebar
          selectedDistrictId={selectedDistrictId}
          onDistrictChange={onDistrictChange}
        />
      </aside>

      {/* Mustaqil scroll bo'luvchi asosiy qism */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-y-auto overflow-x-hidden select-text">
        {/* Top Header (Screenshots 2 & 3 uslubi) */}
        <header className="h-16 min-h-[64px] flex-shrink-0 bg-white border-b-2 border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          {/* Chap: Qidiruv inputi (Screenshot 2-3 uslubida) */}
          <div className="relative w-64 sm:w-80 md:w-96 flex-shrink-0">
            <input
              type="text"
              value={internalSearch}
              placeholder={searchPlaceholder}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-xs pl-4 pr-10 py-2.5 rounded-xl border-2 border-slate-200 focus:border-[#163D5C] focus:outline-none transition font-medium"
            />
            {internalSearch ? (
              <button
                type="button"
                onClick={() => handleInputChange('')}
                className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Search className="w-4 h-4 text-[#163D5C] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            )}
          </div>

          {/* O'ng: Hudud nishoni, Bildirishnomalar va Profil */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
            {/* Hudud nishoni (Screenshotdagi '27-maktab' o'rnida) */}
            <div className="hidden md:flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border-2 border-slate-200 text-xs font-semibold text-slate-700 flex-shrink-0 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              <span className="truncate max-w-[160px]">
                {user?.mahallaName
                  ? formatMahallaName(user.mahallaName)
                  : user?.districtName || 'Davlatobod tumani'}
              </span>
            </div>

            {/* Bildirishnomalar qo'ng'irog'i (Haqiqiy bildirishnoma bo'lmasa qizil doira chiqmaydi) */}
            <button
              type="button"
              className="w-10 h-10 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-2 border-slate-200 transition relative cursor-pointer flex items-center justify-center flex-shrink-0"
              title="Bildirishnomalar"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Xodim kartasi (Screenshot 2-3 uslubi) */}
            <div className="flex items-center space-x-2.5 pl-2 sm:pl-3 border-l-2 border-slate-200 flex-shrink-0">
              <div className="w-9 h-9 rounded-xl bg-[#163D5C] text-white flex items-center justify-center text-xs font-bold shadow-xs flex-shrink-0">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <div className="hidden lg:block text-left flex-shrink-0">
                <span className="block text-xs font-bold text-slate-900 leading-tight">
                  {user?.fullName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium block">
                  {user?.roleCode === 'MAHALLA_OPERATOR'
                    ? 'Mahalla yetakchisi'
                    : user?.roleCode === 'DISTRICT_ADMIN'
                    ? 'Tuman boshligʻi'
                    : user?.roleCode === 'DATA_REVIEWER'
                    ? 'Data Reviewer'
                    : 'Super Admin'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Sahifa ichki qismi */}
        <main className="p-6 sm:p-8 flex-1 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
