import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { CustomSelect } from '../components/ui/CustomSelect';
import { monitoringApi } from '../api/monitoring.api';
import {
  SurveyMethod,
  EmploymentCategory,
  NoWishReason,
  UnemployedDirection,
  Mahalla,
} from '../types/monitoring.types';
import {
  formatUzPhone,
  isValidUzPhone,
  isValidFullName,
  isValidPinfl,
  isValidYouthAge,
  calculateAge,
  hasLetters,
  extractBirthDateFromPinfl,
} from '../utils/validators';
import { formatMahallaName } from '../utils/formatters';
import {
  Building2,
  Calendar,
  User,
  Hash,
  MapPin,
  GraduationCap,
  Phone,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Send,
  Home,
  CheckSquare,
  Square,
  Sparkles,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const PublicSurveyPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [districts, setDistricts] = useState<Array<{ id: string; name: string; region: string }>>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [mahallas, setMahallas] = useState<Mahalla[]>([]);
  const [loadingMahallas, setLoadingMahallas] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // 1-bosqich: Shaxsiy ma'lumotlar
  const [fullName, setFullName] = useState<string>('');
  const [birthDate, setBirthDate] = useState<string>('');
  const [pinfl, setPinfl] = useState<string>('');
  const [phone, setPhone] = useState<string>('+998');
  const [parentPhone, setParentPhone] = useState<string>('');
  const [pinflWarning, setPinflWarning] = useState<string | null>(null);

  // 2-bosqich: Yashash hududi
  const [mahallaId, setMahallaId] = useState<string>('');
  const [customMahallaName, setCustomMahallaName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [education, setEducation] = useState<string>('');
  const [specialty, setSpecialty] = useState<string>('');

  // 3-bosqich: Bandlik holati
  const [mainCategory, setMainCategory] = useState<EmploymentCategory>('UNEMPLOYED');
  const [officialWorkplace, setOfficialWorkplace] = useState<string>('');
  const [unofficialActivityType, setUnofficialActivityType] = useState<string>('');
  const [noWishReason, setNoWishReason] = useState<NoWishReason>('CHILD_CARE');
  const [unemployedDirections, setUnemployedDirections] = useState<UnemployedDirection[]>([
    'PERMANENT_JOB',
  ]);
  const [unemployedAdditionalNote, setUnemployedAdditionalNote] = useState<string>('');
  const [otherReasonNote, setOtherReasonNote] = useState<string>('');

  // Yosh chegarasi: 18 - 60 yosh
  const { maxBirthDate, minBirthDate } = useMemo(() => {
    const today = new Date();
    const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    const minDate = new Date(today.getFullYear() - 60, today.getMonth(), today.getDate());
    return {
      maxBirthDate: maxDate.toISOString().split('T')[0],
      minBirthDate: minDate.toISOString().split('T')[0],
    };
  }, []);

  const citizenAge = useMemo(() => {
    return calculateAge(birthDate);
  }, [birthDate]);

  // Tug'ilgan sanaga asoslangan JSHSHIR boshlang'ich 7 ta raqamlari (Erkak / Ayol)
  const pinflPrefixes = useMemo(() => {
    if (!birthDate) return null;
    const parts = birthDate.split('-');
    if (parts.length !== 3) return null;
    const [y, m, d] = parts;
    const is21st = y.startsWith('20');
    const maleDigit = is21st ? '5' : '3';
    const femaleDigit = is21st ? '6' : '4';
    const dateSuffix = `${d}${m}${y.slice(2)}`;
    return {
      male: `${maleDigit}${dateSuffix}`,
      female: `${femaleDigit}${dateSuffix}`,
      formattedDate: `${d}.${m}.${y}`,
    };
  }, [birthDate]);

  // Tug'ilgan sana o'zgarganda JSHSHIR boshini avtomatik chiqarib berish
  const handleBirthDateChange = (newDate: string) => {
    setBirthDate(newDate);
    if (!newDate) return;

    const check = isValidYouthAge(newDate);
    if (!check.valid) {
      setError(check.message || null);
    } else {
      setError(null);
    }

    const parts = newDate.split('-');
    if (parts.length === 3) {
      const [y, m, d] = parts;
      const isFemale = /qizi\b|ova\b|yeva\b/i.test(fullName.toLowerCase());
      const is21st = y.startsWith('20');
      const centuryDigit = is21st ? (isFemale ? '6' : '5') : (isFemale ? '4' : '3');
      const prefix = `${centuryDigit}${d}${m}${y.slice(2)}`;

      // Agar JSHSHIR hali to'liq kiritilmagan bo'lsa, boshlang'ich 7 ta raqamni avtomatik chiqarib beradi:
      if (!pinfl || pinfl.length <= 7) {
        setPinfl(prefix);
        setPinflWarning(null);
      } else if (pinfl.length === 14) {
        const pinflValidation = isValidPinfl(pinfl, newDate);
        if (!pinflValidation.valid) {
          setPinflWarning(pinflValidation.message || 'JSHSHIR tugʻilgan sanaga mos kelmadi');
        } else {
          setPinflWarning(null);
        }
      }
    }
  };

  // Tumanlar ro'yxatini yuklash
  useEffect(() => {
    monitoringApi
      .getDistrictsDropdown()
      .then((data) => {
        setDistricts(data);
        if (data && data.length > 0) {
          // Boshlang'ich tuman (masalan birinchisi yoki Davlatobod)
          const def = data.find((d) => d.name.toLowerCase().includes('davlatobod')) || data[0];
          setSelectedDistrictId(def.id);
        }
      })
      .catch((err) => console.error('Tumanlarni yuklashda xatolik:', err));
  }, []);

  // Tanlangan tumanga mos mahallalarni yuklash
  useEffect(() => {
    if (selectedDistrictId) {
      setLoadingMahallas(true);
      setMahallaId('');
      monitoringApi
        .getMahallasDropdown(selectedDistrictId)
        .then((data) => setMahallas(data as any))
        .catch(() => setMahallas([]))
        .finally(() => setLoadingMahallas(false));
    } else {
      setMahallas([]);
    }
  }, [selectedDistrictId]);

  // JSHSHIR kiritilganda avtomatik tug'ilgan sanani aniqlash va tekshirish
  const handlePinflChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 14);
    setPinfl(clean);
    setPinflWarning(null);

    // Agar 7 ta raqam kiritilsa va tug'ilgan sana kiritilmagan bo'lsa, avtomatik chiqarish
    if (clean.length >= 7) {
      const extracted = extractBirthDateFromPinfl(clean);
      if (extracted) {
        if (!birthDate) setBirthDate(extracted);
        const ageCheck = isValidYouthAge(extracted);
        if (!ageCheck.valid) {
          setPinflWarning(ageCheck.message || 'Yosh chegarasi 18 dan 60 yoshgacha');
        }
      } else {
        const firstDigit = clean[0];
        if (!['3', '4', '5', '6'].includes(firstDigit)) {
          setPinflWarning('JSHSHIR 1-raqami 3, 4 (1900-yillar) yoki 5, 6 (2000-yillar) boʻlishi kerak');
        }
      }
    }

    if (clean.length === 14) {
      const pinflValidation = isValidPinfl(clean, birthDate || undefined);
      if (!pinflValidation.valid) {
        setPinflWarning(pinflValidation.message || 'JSHSHIR formati notoʻgʻri');
      } else {
        setPinflWarning(null);
      }
    }
  };

  const toggleDirection = (dir: UnemployedDirection) => {
    if (unemployedDirections.includes(dir)) {
      setUnemployedDirections(unemployedDirections.filter((d) => d !== dir));
    } else {
      setUnemployedDirections([...unemployedDirections, dir]);
    }
  };

  // 1-bosqich validatsiyasi
  const validateStep1 = () => {
    if (!fullName.trim()) {
      setError('Iltimos, Familiya, Ism va Sharifingizni toʻliq kiriting');
      return false;
    }
    if (!isValidFullName(fullName)) {
      setError('F.I.Sh. kamida 2 ta soʻzdan iborat boʻlishi va raqam qatnashmasligi kerak');
      return false;
    }
    if (!birthDate) {
      setError('Tugʻilgan sanangizni kiriting');
      return false;
    }
    const ageValidation = isValidYouthAge(birthDate);
    if (!ageValidation.valid) {
      setError(ageValidation.message || 'Yosh chegarasi 18 dan 60 yoshgacha');
      return false;
    }
    const pinflValidation = isValidPinfl(pinfl, birthDate);
    if (!pinflValidation.valid) {
      setError(pinflValidation.message || 'JSHSHIR raqami notoʻgʻri');
      return false;
    }
    if (!phone.trim() || !isValidUzPhone(phone)) {
      setError('Bogʻlanish uchun telefon raqamingizni toʻgʻri kiriting (+998 formati)');
      return false;
    }
    setError(null);
    return true;
  };

  // 2-bosqich validatsiyasi
  const validateStep2 = () => {
    if (!selectedDistrictId) {
      setError('Iltimos, tumaningizni tanlang');
      return false;
    }
    if (!mahallaId) {
      setError('Iltimos, mahallangizni (MFY) tanlang');
      return false;
    }
    if (mahallaId === '_CUSTOM_' && (!customMahallaName.trim() || !hasLetters(customMahallaName))) {
      setError('Iltimos, mahallangiz nomini toʻgʻri kiriting');
      return false;
    }
    if (!address.trim() || !hasLetters(address)) {
      setError('Yashash manzilingizni (koʻcha, uy raqami) kiriting');
      return false;
    }
    if (!education.trim() || !hasLetters(education)) {
      setError('Maʼlumotingizni kiriting (masalan: 12-maktab, SamDU, TATU)');
      return false;
    }
    setError(null);
    return true;
  };

  // Yakuniy arizani yuborish
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mainCategory === 'OFFICIALLY_EMPLOYED' && (!officialWorkplace.trim() || !hasLetters(officialWorkplace))) {
      setError('Rasmiy ish joyingiz va tashkilot nomini kiriting');
      return;
    }
    if (mainCategory === 'UNOFFICIALLY_EMPLOYED' && (!unofficialActivityType.trim() || !hasLetters(unofficialActivityType))) {
      setError('Norasmiy faoliyat yoki kasbingiz turini kiriting');
      return;
    }
    if (mainCategory === 'UNEMPLOYED' && unemployedDirections.length === 0) {
      setError('Iltimos, sizga kerakli boʻlgan kamida bitta bandlik yoʻnalishini tanlang');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await monitoringApi.submitPublicSurvey({
        surveyDate: new Date().toISOString().split('T')[0],
        surveyMethod: 'ONLINE' as any,
        districtId: selectedDistrictId,
        mahallaId: mahallaId === '_CUSTOM_' ? undefined : mahallaId,
        customMahallaName: mahallaId === '_CUSTOM_' ? customMahallaName.trim() : undefined,
        fullName: fullName.trim(),
        birthDate,
        pinfl: pinfl.trim(),
        address: address.trim(),
        education: education.trim(),
        phone: phone.trim(),
        parentPhone: parentPhone.trim() || undefined,
        specialty: specialty.trim() || undefined,
        mainCategory,
        officialWorkplace: mainCategory === 'OFFICIALLY_EMPLOYED' ? officialWorkplace.trim() : undefined,
        unofficialActivityType: mainCategory === 'UNOFFICIALLY_EMPLOYED' ? unofficialActivityType.trim() : undefined,
        noWishReason: mainCategory === 'NO_WISH_TO_WORK' ? noWishReason : undefined,
        unemployedDirections: mainCategory === 'UNEMPLOYED' ? unemployedDirections : undefined,
        unemployedAdditionalNote: mainCategory === 'UNEMPLOYED' ? unemployedAdditionalNote.trim() : undefined,
        otherReasonNote: mainCategory === 'OTHER' ? otherReasonNote.trim() : undefined,
        citizenSigned: true,
        operatorSigned: false,
      });

      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Arizani yuborishda xatolik yuz berdi. Iltimos, qaytadan urinib koʻring.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDistrictName = districts.find((d) => d.id === selectedDistrictId)?.name || 'Namangan';
  const selectedMahallaName = mahallas.find((m) => m.id === mahallaId)?.name || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-slate-100 py-6 sm:py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* 1. Rasmiy Davlat Tashkiloti Sarlavhasi (Header) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 sm:p-7 mb-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#163D5C] via-sky-500 to-emerald-500" />
          
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#163D5C]/10 text-[#163D5C] mb-3 border border-[#163D5C]/20 shadow-xs">
            <Building2 className="w-7 h-7" />
          </div>

          <h2 className="text-[11px] sm:text-xs font-black tracking-widest uppercase text-[#163D5C] mb-1">
            Oʻzbekiston Respublikasi Kambagʻallikni qisqartirish va bandlik vazirligi
          </h2>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Namangan Viloyati Aholi Bandligi Portali
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-1.5">
            Doimiy ish oʻrniga ega boʻlish, davlat subsidiyasi yoki imtiyozli kreditlar olish, bepul kasb-hunarga oʻqish uchun rasmiy soʻrovnoma
          </p>

          <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rasmiy davlat xizmati • Barcha arizalar kafolatlangan holda koʻrib chiqiladi</span>
          </div>
        </div>

        {/* Muvaffaqiyat ekrani (Success State) */}
        {success ? (
          <div className="bg-white rounded-2xl shadow-md border-2 border-emerald-500 p-8 sm:p-10 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Arizangiz muvaffaqiyatli qabul qilindi!
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              Hurmatli <b>{fullName}</b>, sizning arizangiz <b>{selectedDistrictName}</b>,{' '}
              <b>{formatMahallaName(selectedMahallaName)}</b> yetakchisi koʻrib chiqishi uchun navbatga yoʻnaltirildi.
            </p>

            <div className="bg-slate-50 rounded-xl p-4 max-w-md mx-auto border border-slate-200 text-left text-xs space-y-2 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Fuqaro:</span>
                <span className="font-bold text-slate-800">{fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hudud:</span>
                <span className="font-bold text-slate-800">{selectedDistrictName}, {formatMahallaName(selectedMahallaName)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Telefon:</span>
                <span className="font-bold text-slate-800">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Holati:</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Koʻrib chiqishda</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-6">
              💡 Mahalla yoshlar yetakchisi kiritilgan telefon raqamingiz orqali tez orada siz bilan bogʻlanadi.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSuccess(false);
                  setStep(1);
                  setFullName('');
                  setBirthDate('');
                  setPinfl('');
                  setAddress('');
                  setCustomMahallaName('');
                }}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#163D5C] text-white text-xs font-bold hover:bg-[#11314a] transition cursor-pointer shadow-xs"
              >
                Yana yangi ariza toʻldirish
              </button>
            </div>
          </div>
        ) : (
          /* Asosiy Forma Kartasi */
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
            {/* Bosqichlar indikatori (Step wizard) */}
            <div className="bg-slate-50/80 px-5 sm:px-8 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between max-w-lg mx-auto">
                {[
                  { stepNum: 1, title: 'Shaxsiy maʼlumot' },
                  { stepNum: 2, title: 'Yashash hududi' },
                  { stepNum: 3, title: 'Bandlik holati' },
                ].map((s, idx) => (
                  <div key={s.stepNum} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                          step === s.stepNum
                            ? 'bg-[#163D5C] text-white shadow-sm ring-4 ring-[#163D5C]/15 scale-105'
                            : step > s.stepNum
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white border-2 border-slate-200 text-slate-400'
                        }`}
                      >
                        {step > s.stepNum ? <CheckCircle2 className="w-5 h-5" /> : s.stepNum}
                      </div>
                      <span
                        className={`text-[11px] font-bold mt-1.5 hidden sm:block ${
                          step === s.stepNum ? 'text-[#163D5C]' : 'text-slate-400'
                        }`}
                      >
                        {s.title}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`w-12 sm:w-20 h-1 mx-2 rounded-full transition-all ${
                          step > s.stepNum ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Xatolik xabari */}
            {error && (
              <div className="m-5 sm:m-7 mb-0 p-3.5 rounded-xl bg-rose-50 border-2 border-rose-200 text-xs font-semibold text-rose-700 flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 sm:p-7">
              {/* ============================================================== */}
              {/* 1-BOSQICH: SHAXSIY MA'LUMOTLAR */}
              {/* ============================================================== */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#163D5C]" />
                      <span>1-qadam. Shaxsiy maʼlumotlaringiz</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Passport yoki ID-kartangizdagi maʼlumotlarni aniq kiriting
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* F.I.Sh. */}
                    <div className="sm:col-span-2">
                      <Input
                        label="Familiya, Ism va Otangizning ismi"
                        required
                        placeholder="Masalan: Rustamov Jasur Anvar oʻgʻli"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        icon={<User className="w-4 h-4" />}
                      />
                    </div>

                    {/* Tug'ilgan sana */}
                    <div>
                      <Input
                        label="Tugʻilgan sanangiz (18 - 60 yosh)"
                        type="date"
                        required
                        max={maxBirthDate}
                        min={minBirthDate}
                        value={birthDate}
                        onChange={(e) => handleBirthDateChange(e.target.value)}
                        icon={<Calendar className="w-4 h-4" />}
                      />
                      {citizenAge !== null && (
                        <div className="mt-1.5">
                          {citizenAge < 18 ? (
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700">
                              ⚠️ <b>18 yoshga toʻlmagansiz:</b> Yoshlar bandligi 18 yoshdan boshlanadi.
                            </div>
                          ) : citizenAge > 60 ? (
                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-700">
                              ⚠️ Bandlik monitoringi 18 dan 60 yoshgacha oʻtkaziladi.
                            </div>
                          ) : (
                            <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-700 flex items-center space-x-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Yoshingiz: <b>{citizenAge} yoshda</b> (Mos toifa)</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* JSHSHIR (PINFL) */}
                    <div>
                      <Input
                        label="JSHSHIR raqami (14 ta raqam)"
                        required
                        maxLength={14}
                        placeholder="Passportdagi 14 ta raqam"
                        value={pinfl}
                        onChange={(e) => handlePinflChange(e.target.value)}
                        icon={<Hash className="w-4 h-4" />}
                        helperText={
                          pinfl.length > 0 && pinfl.length < 14
                            ? `${pinfl.length}/14 raqam kiritildi (qolgan ${14 - pinfl.length} ta raqam)`
                            : "Passportingiz yoki ID-kartangiz pastki qismidagi 14 ta raqam"
                        }
                      />

                      {/* JSHSHIR boshlang'ich raqamini chiqarib berish paneli */}
                      {pinflPrefixes && (
                        <div className="mt-2 p-2.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-950 space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <span className="text-[11px] font-medium text-blue-800">
                              💡 <b>{pinflPrefixes.formattedDate}</b> uchun JSHSHIR boshi:
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  const tail = pinfl.length > 7 ? pinfl.slice(7) : '';
                                  handlePinflChange(`${pinflPrefixes.male}${tail}`);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                  pinfl.startsWith(pinflPrefixes.male)
                                    ? 'bg-[#163D5C] text-white shadow-xs'
                                    : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-100/60'
                                }`}
                                title="Erkak fuqarolar uchun JSHSHIR boshini qoʻyish"
                              >
                                <span>Erkak:</span>
                                <b>{pinflPrefixes.male}</b>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const tail = pinfl.length > 7 ? pinfl.slice(7) : '';
                                  handlePinflChange(`${pinflPrefixes.female}${tail}`);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                                  pinfl.startsWith(pinflPrefixes.female)
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                                }`}
                                title="Ayol fuqarolar uchun JSHSHIR boshini qoʻyish"
                              >
                                <span>Ayol:</span>
                                <b>{pinflPrefixes.female}</b>
                              </button>
                            </div>
                          </div>
                          {(!pinfl || pinfl.length < 7) && (
                            <p className="text-[10px] text-blue-600">
                              Tugmani bosing — JSHSHIR boshidagi 7 ta raqam avtomatik yoziladi.
                            </p>
                          )}
                        </div>
                      )}

                      {/* Validatsiya xabarlari */}
                      {pinflWarning && (
                        <div className="mt-1.5 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                          <span className="shrink-0">⚠️</span>
                          <span>{pinflWarning}</span>
                        </div>
                      )}

                      {pinfl.length === 14 && !pinflWarning && (
                        <div className="mt-1.5 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="font-semibold">JSHSHIR 14 ta raqam toʻliq va tugʻilgan sanaga mos!</span>
                        </div>
                      )}
                    </div>

                    {/* Telefon raqami */}
                    <div>
                      <Input
                        label="Siz bilan bogʻlanish uchun telefon raqam"
                        required
                        placeholder="+998 (90) 123-45-67"
                        value={phone}
                        onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                        icon={<Phone className="w-4 h-4" />}
                      />
                    </div>

                    {/* Oila a'zosi telefoni */}
                    <div>
                      <Input
                        label="Qoʻshimcha telefon raqami (ixtiyoriy)"
                        placeholder="+998 (91) 987-65-43"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(formatUzPhone(e.target.value))}
                        icon={<Phone className="w-4 h-4" />}
                        helperText="Oila aʼzosi yoki yaqiningizning telefoni"
                      />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep1()) setStep(2);
                      }}
                      className="px-6 py-3 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-bold transition flex items-center space-x-2 shadow-xs cursor-pointer"
                    >
                      <span>Keyingi qadam: Yashash hududi</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* 2-BOSQICH: YASHASH HUDUDI (TUMAN VA MAHALLA) */}
              {/* ============================================================== */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-3 mb-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#163D5C]" />
                      <span>2-qadam. Yashash hududingiz (Tuman va Mahalla)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Arizangiz aynan oʻzingizning mahallangiz yetakchisiga yetib borishi uchun toʻgʻri tanlang
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tuman tanlash (1-dropdown) */}
                    <div>
                      <CustomSelect
                        label="1. Tuman / Shahringizni tanlang"
                        required
                        searchable
                        placeholder="Tumanni tanlang..."
                        value={selectedDistrictId}
                        onChange={(val) => setSelectedDistrictId(val)}
                        icon={<Building2 className="w-4 h-4 text-[#163D5C]" />}
                        options={districts.map((d) => ({
                          value: d.id,
                          label: d.name,
                          sublabel: d.region,
                        }))}
                      />
                    </div>

                    {/* Mahalla tanlash (2-dropdown - ichida qidiruv bilan!) */}
                    <div>
                      <CustomSelect
                        label="2. Mahallangizni (MFY) tanlang"
                        required
                        searchable
                        placeholder={loadingMahallas ? 'Mahallalar yuklanmoqda...' : 'Mahallangizni tanlang yoki qidiring...'}
                        disabled={loadingMahallas || (mahallas.length === 0 && !selectedDistrictId)}
                        value={mahallaId}
                        onChange={(val) => setMahallaId(val)}
                        icon={<Home className="w-4 h-4 text-emerald-600" />}
                        options={[
                          ...mahallas.map((m) => ({
                            value: m.id,
                            label: formatMahallaName(m.name),
                          })),
                          {
                            value: '_CUSTOM_',
                            label: '+ Mahallam roʻyxatda yoʻq (qoʻlda kiritish)',
                          }
                        ]}
                      />
                      {mahallas.length === 0 && selectedDistrictId && !loadingMahallas && (
                        <p className="text-[11px] text-amber-600 mt-1">
                          Ushbu tuman boʻyicha mahallalar roʻyxati yangilanmoqda.
                        </p>
                      )}
                    </div>

                    {/* Mahallam ro'yxatda yo'q kiritish maydoni */}
                    {mahallaId === '_CUSTOM_' && (
                      <div className="sm:col-span-2">
                        <Input
                          label="Mahallangiz nomi"
                          required
                          placeholder="Masalan: Navbahor MFY"
                          value={customMahallaName}
                          onChange={(e) => setCustomMahallaName(e.target.value)}
                          icon={<Home className="w-4 h-4 text-blue-600" />}
                          helperText="Iltimos, mahallangiz nomini to'liq kiriting"
                        />
                      </div>
                    )}

                    {/* Yashash manzili */}
                    <div className="sm:col-span-2">
                      <Input
                        label="Aniq koʻcha va uy raqamingiz"
                        required
                        placeholder="Masalan: Doʻstlik koʻchasi, 24-uy"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        icon={<MapPin className="w-4 h-4" />}
                      />
                    </div>

                    {/* Ta'lim muassasasi */}
                    <div>
                      <Input
                        label="Tamomlagan taʼlim muassasangiz"
                        required
                        placeholder="Masalan: 12-maktab, SamDU, TATU"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        icon={<GraduationCap className="w-4 h-4" />}
                      />
                    </div>

                    {/* Mutaxassisligi */}
                    <div>
                      <Input
                        label="Mutaxassisligingiz yoki qiziqqan sohangiz"
                        placeholder="Masalan: Tikuvchi, Santexnik, Dasturchi, Haydovchi"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        icon={<Briefcase className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center space-x-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Orqaga</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (validateStep2()) setStep(3);
                      }}
                      className="px-6 py-2.5 rounded-xl bg-[#163D5C] hover:bg-[#11314a] text-white text-xs font-bold transition flex items-center space-x-2 shadow-xs cursor-pointer"
                    >
                      <span>Keyingi qadam: Bandlik holati</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* 3-BOSQICH: BANDLIK HOLATI VA YORDAM YO'NALISHI */}
              {/* ============================================================== */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#163D5C]" />
                      <span>3-qadam. Hozirgi bandlik holatingiz</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Oʻzingizga mos toifani tanlang — davlat yordami aynan shunga qarab koʻrsatiladi
                    </p>
                  </div>

                  {/* 5 ta Katta toifa kartochkalari */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 2.4. Ishsiz (Tavsiya etilgan eng ko'p murojaat) */}
                    <div
                      onClick={() => setMainCategory('UNEMPLOYED')}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        mainCategory === 'UNEMPLOYED'
                          ? 'border-rose-500 bg-rose-50/30 ring-2 ring-rose-500/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-rose-700 uppercase tracking-wider">
                          2.4. Ishsizman (Yordam kerak)
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mainCategory === 'UNEMPLOYED' ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'}`}>
                          {mainCategory === 'UNEMPLOYED' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Hozirda ishsizman, doimiy ish, kasb-hunar, subsidiya yoki kredit olishda amaliy yordam kerak
                      </p>
                    </div>

                    {/* 2.1. Rasmiy band */}
                    <div
                      onClick={() => setMainCategory('OFFICIALLY_EMPLOYED')}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        mainCategory === 'OFFICIALLY_EMPLOYED'
                          ? 'border-emerald-500 bg-emerald-50/30 ring-2 ring-emerald-500/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-emerald-700 uppercase tracking-wider">
                          2.1. Rasmiy bandman
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mainCategory === 'OFFICIALLY_EMPLOYED' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'}`}>
                          {mainCategory === 'OFFICIALLY_EMPLOYED' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Davlat yoki xususiy korxonada qonuniy mehnat shartnomasi asosida ishlayman
                      </p>
                    </div>

                    {/* 2.2. Norasmiy band */}
                    <div
                      onClick={() => setMainCategory('UNOFFICIALLY_EMPLOYED')}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        mainCategory === 'UNOFFICIALLY_EMPLOYED'
                          ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-amber-700 uppercase tracking-wider">
                          2.2. Norasmiy bandman
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mainCategory === 'UNOFFICIALLY_EMPLOYED' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'}`}>
                          {mainCategory === 'UNOFFICIALLY_EMPLOYED' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Daromadga egaman, lekin shartnomasiz ishlayman (oʻzini oʻzi band qilgan, mavsumiy, mardikor)
                      </p>
                    </div>

                    {/* 2.3. Ishlash istagi yo'q */}
                    <div
                      onClick={() => setMainCategory('NO_WISH_TO_WORK')}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        mainCategory === 'NO_WISH_TO_WORK'
                          ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/15'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">
                          2.3. Hozircha ishlamayman
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mainCategory === 'NO_WISH_TO_WORK' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>
                          {mainCategory === 'NO_WISH_TO_WORK' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Oʻqishda (abituriyent), bola parvarishida yoki uy bekasi boʻlganim sababli hozir ishlamayman
                      </p>
                    </div>
                  </div>

                  {/* Agar 2.4 (Ishsiz) tanlansa -> Yordam yo'nalishlari */}
                  {mainCategory === 'UNEMPLOYED' && (
                    <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-3">
                      <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider">
                        Sizga aynan qanday bandlik yordami kerak? (Bir yoki bir nechtasini tanlang) <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { id: 'PERMANENT_JOB', label: 'Doimiy ishga joylashtirish' },
                          { id: 'SUBSIDY', label: 'Subsidiya ajratish (asbob-uskunalar)' },
                          { id: 'VOCATIONAL_TRAINING', label: 'Kasb-hunarga bepul oʻqitish' },
                          { id: 'LOAN_BUSINESS', label: 'Kredit orqali tadbirkorlik boshlash' },
                          { id: 'ADDITIONAL', label: 'Qoʻshimcha boshqa yoʻnalish' },
                        ].map((dir) => {
                          const checked = unemployedDirections.includes(dir.id as UnemployedDirection);
                          return (
                            <button
                              key={dir.id}
                              type="button"
                              onClick={() => toggleDirection(dir.id as UnemployedDirection)}
                              className={`p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center space-x-2 transition cursor-pointer ${
                                checked
                                  ? 'bg-white border-rose-500 text-rose-900 shadow-2xs'
                                  : 'bg-white/60 border-slate-200 text-slate-700 hover:bg-white'
                              }`}
                            >
                              {checked ? (
                                <CheckSquare className="w-4 h-4 text-rose-600 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 shrink-0" />
                              )}
                              <span>{dir.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Qoʻshimcha istaklaringiz yoki izoh (ixtiyoriy)..."
                          value={unemployedAdditionalNote}
                          onChange={(e) => setUnemployedAdditionalNote(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-lg bg-white border border-rose-200 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* Agar 2.1 (Rasmiy band) tanlansa */}
                  {mainCategory === 'OFFICIALLY_EMPLOYED' && (
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                      <label className="block text-xs font-bold text-emerald-900">
                        Ishlayotgan korxona yoki tashkilotingiz nomi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Masalan: Davlat soliq inspeksiyasi, 'Artel' MCHJ"
                        value={officialWorkplace}
                        onChange={(e) => setOfficialWorkplace(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-emerald-200 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-500"
                      />
                    </div>
                  )}

                  {/* Agar 2.2 (Norasmiy band) tanlansa */}
                  {mainCategory === 'UNOFFICIALLY_EMPLOYED' && (
                    <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                      <label className="block text-xs font-bold text-amber-900">
                        Shugʻullanayotgan faoliyatingiz turi <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Masalan: Qurilishda usta, taksichilik, kosibchilik"
                        value={unofficialActivityType}
                        onChange={(e) => setUnofficialActivityType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-amber-200 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  {/* Agar 2.3 (Ishlash istagi yo'q) tanlansa */}
                  {mainCategory === 'NO_WISH_TO_WORK' && (
                    <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2">
                      <label className="block text-xs font-bold text-indigo-900">
                        Ishlamaslik sababi
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'CHILD_CARE', label: 'Bola tarbiyasida' },
                          { id: 'HOUSEWIFE', label: 'Uy bekasi' },
                          { id: 'WEALTHY_FAMILY', label: 'Oʻziga toʻq oila' },
                          { id: 'APPLICANT', label: 'Abituriyent' },
                        ].map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setNoWishReason(r.id as NoWishReason)}
                            className={`p-2 rounded-lg border text-xs font-semibold transition cursor-pointer text-center ${
                              noWishReason === r.id
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tugmalar */}
                  <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition flex items-center space-x-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Orqaga</span>
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition flex items-center space-x-2 shadow-md cursor-pointer disabled:opacity-60"
                    >
                      {submitting ? (
                        <span>Yuborilmoqda...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Arizani yuborish</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 mt-6 space-y-1">
          <p>© 2026 Oʻzbekiston Respublikasi Kambagʻallikni qisqartirish va bandlik vazirligi.</p>
          <p>Yagona axborot tizimi. Fuqarolar maʼlumotlari davlat tomonidan qatʼiy himoyalanadi.</p>
        </div>
      </div>
    </div>
  );
};
