import React, { useState, useRef } from 'react';
import {
  School,
  Building,
  Calendar,
  CreditCard,
  ShieldCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Lock,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  BookOpen,
  DollarSign,
  Layers,
  Plus,
  X,
} from 'lucide-react';
import { api } from '../../services/apiClient';

interface SetupSchoolWizardProps {
  onSetupComplete: (result: {
    user: any;
    token: string;
    schoolConfig: any;
  }) => void;
}

const PRESET_CLASSES = [
  'Playgroup',
  'Nursery',
  'Kindergarten (KG)',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
];

const PRESET_FEE_CATEGORIES = [
  'Monthly Tuition Fee',
  'Admission / Registration Fee',
  'Annual Examination Fee',
  'Computer & Science Lab Fee',
  'Library & Resource Fee',
  'Transport / Bus Service',
  'Sports & Activity Fund',
];

export const SetupSchoolWizard: React.FC<SetupSchoolWizardProps> = ({ onSetupComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: School Identity
  const [schoolName, setSchoolName] = useState<string>('');
  const [schoolCode, setSchoolCode] = useState<string>('');
  const [schoolEmail, setSchoolEmail] = useState<string>('');
  const [schoolPhone, setSchoolPhone] = useState<string>('');
  const [schoolAddress, setSchoolAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [country, setCountry] = useState<string>('Pakistan');
  const [website, setWebsite] = useState<string>('');
  const [currency, setCurrency] = useState<string>('PKR');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 2: Academic Term & Structure
  const [currentSession, setCurrentSession] = useState<string>('2025-2026');
  const [sessionStartDate, setSessionStartDate] = useState<string>('2025-04-01');
  const [sessionEndDate, setSessionEndDate] = useState<string>('2026-03-31');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([
    'Nursery',
    'Kindergarten (KG)',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
  ]);
  const [customClassInput, setCustomClassInput] = useState<string>('');

  // Step 3: Billing & Financial Rules
  const [feeFrequency, setFeeFrequency] = useState<'Monthly' | 'Bi-Monthly' | 'Quarterly' | 'Per Term'>('Monthly');
  const [voucherDueDays, setVoucherDueDays] = useState<number>(10);
  const [selectedFeeCategories, setSelectedFeeCategories] = useState<string[]>([
    'Monthly Tuition Fee',
    'Admission / Registration Fee',
    'Annual Examination Fee',
    'Computer & Science Lab Fee',
  ]);
  const [customFeeInput, setCustomFeeInput] = useState<string>('');

  // Step 4: Master Super Admin
  const [adminName, setAdminName] = useState<string>('');
  const [adminUsername, setAdminUsername] = useState<string>('admin');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPhone, setAdminPhone] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Logo upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('School logo file must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string);
        setErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleClass = (cls: string) => {
    setSelectedClasses((prev) =>
      prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]
    );
  };

  const handleAddCustomClass = () => {
    if (!customClassInput.trim()) return;
    const trimmed = customClassInput.trim();
    if (!selectedClasses.includes(trimmed)) {
      setSelectedClasses((prev) => [...prev, trimmed]);
    }
    setCustomClassInput('');
  };

  const handleToggleFeeCat = (cat: string) => {
    setSelectedFeeCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleAddCustomFeeCat = () => {
    if (!customFeeInput.trim()) return;
    const trimmed = customFeeInput.trim();
    if (!selectedFeeCategories.includes(trimmed)) {
      setSelectedFeeCategories((prev) => [...prev, trimmed]);
    }
    setCustomFeeInput('');
  };

  // Step Validation
  const validateStep = (step: number): boolean => {
    setErrorMessage(null);

    if (step === 1) {
      if (!schoolName.trim()) {
        setErrorMessage('Please enter the Official School / Institute Name.');
        return false;
      }
      if (schoolEmail.trim() && !/^\S+@\S+\.\S+$/.test(schoolEmail.trim())) {
        setErrorMessage('Please enter a valid official school email address.');
        return false;
      }
      return true;
    }

    if (step === 2) {
      if (!currentSession.trim()) {
        setErrorMessage('Please specify the active Academic Session (e.g., 2025–2026).');
        return false;
      }
      return true;
    }

    if (step === 3) {
      if (voucherDueDays < 1 || voucherDueDays > 31) {
        setErrorMessage('Voucher Due Days must be between 1 and 31 days.');
        return false;
      }
      return true;
    }

    if (step === 4) {
      if (!adminName.trim()) {
        setErrorMessage('Administrator Full Name is required.');
        return false;
      }
      if (!adminUsername.trim() || adminUsername.trim().length < 3) {
        setErrorMessage('Administrator username must be at least 3 characters.');
        return false;
      }
      if (!adminPassword || adminPassword.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return false;
      }
      if (adminPassword !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify your password.');
        return false;
      }
      if (adminEmail.trim() && !/^\S+@\S+\.\S+$/.test(adminEmail.trim())) {
        setErrorMessage('Please enter a valid administrator email address.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final Setup Submission
  const handleCompleteSetup = async () => {
    if (!validateStep(4)) {
      setCurrentStep(4);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        schoolInfo: {
          schoolName: schoolName.trim(),
          schoolCode: schoolCode.trim(),
          schoolEmail: schoolEmail.trim(),
          schoolPhone: schoolPhone.trim(),
          schoolAddress: schoolAddress.trim(),
          city: city.trim(),
          country: country.trim(),
          website: website.trim(),
          currentSession: currentSession.trim(),
          logo: logoUrl,
        },
        adminAccount: {
          name: adminName.trim(),
          username: adminUsername.trim().toLowerCase(),
          email: adminEmail.trim(),
          password: adminPassword,
          phone: adminPhone.trim(),
        },
        schoolSettings: {
          currency,
          feeFrequency,
          voucherDueDays,
          sessionStartDate,
          sessionEndDate,
        },
        initialClasses: selectedClasses.map((name) => ({
          name,
          section: 'A',
          room: 'Main Wing',
        })),
        initialFeeCategories: selectedFeeCategories,
      };

      const res = await api.post('/setup/complete', payload);

      if (res && res.success) {
        onSetupComplete({
          user: res.user,
          token: res.token,
          schoolConfig: res.schoolConfig,
        });
      } else {
        setErrorMessage(res.error || 'Failed to complete school setup. Please check your inputs.');
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'An error occurred while connecting to the server. Please verify your connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels = [
    { number: 1, title: 'School Identity', icon: Building },
    { number: 2, title: 'Academic Terms', icon: Calendar },
    { number: 3, title: 'Fee Structure', icon: CreditCard },
    { number: 4, title: 'Administrator', icon: ShieldCheck },
    { number: 5, title: 'Confirmation', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
              <School className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-base tracking-tight text-white">EduPulse School ERP</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  First-Run Installation
                </span>
              </div>
              <p className="text-xs text-slate-400">Institutional Onboarding & Clean Environment Initializer</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero Demo Data Guarantee</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 flex flex-col justify-center">
        {/* Stepper Progress Header */}
        <div className="mb-8">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 relative">
            {stepLabels.map((s) => {
              const Icon = s.icon;
              const isCompleted = currentStep > s.number;
              const isCurrent = currentStep === s.number;

              return (
                <div
                  key={s.number}
                  className={`flex flex-col items-center text-center transition-all ${
                    isCurrent
                      ? 'text-white'
                      : isCompleted
                      ? 'text-blue-400'
                      : 'text-slate-500'
                  }`}
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-600/20 shadow-blue-500/20'
                        : isCompleted
                        ? 'bg-blue-950 text-blue-400 border border-blue-600/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 text-blue-400" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="mt-2 text-[11px] sm:text-xs font-medium truncate max-w-full">
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 flex items-start gap-3 shadow-lg animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <p className="font-semibold text-rose-300">Action Required</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Wizard Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
          {/* STEP 1: School Identity */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Step 1 of 5</span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Set Up Your School Identity</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Enter your institution's official legal name, contact details, and branding.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Official School / Institution Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="e.g., Beacon Public School & College"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-hidden transition"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    School Short Code / Prefix
                  </label>
                  <input
                    type="text"
                    value={schoolCode}
                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                    placeholder="e.g., RPS or BSS"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-hidden uppercase tracking-wider transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Used on student admission numbers and fee vouchers.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Accounting Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-hidden transition"
                  >
                    <option value="PKR">Pakistani Rupee (PKR - Rs.)</option>
                    <option value="USD">US Dollar (USD - $)</option>
                    <option value="GBP">British Pound (GBP - £)</option>
                    <option value="EUR">Euro (EUR - €)</option>
                    <option value="AED">UAE Dirham (AED)</option>
                    <option value="SAR">Saudi Riyal (SAR)</option>
                    <option value="INR">Indian Rupee (INR - ₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Official School Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={schoolEmail}
                      onChange={(e) => setSchoolEmail(e.target.value)}
                      placeholder="info@schoolname.edu"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Official Phone / Landline
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={schoolPhone}
                      onChange={(e) => setSchoolPhone(e.target.value)}
                      placeholder="+92 42 35889100"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-hidden transition"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Campus Physical Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <textarea
                      rows={2}
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                      placeholder="Plot # 12, Main Boulevard, Sector B..."
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-600 outline-hidden resize-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g., Lahore"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g., Pakistan"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-hidden transition"
                  />
                </div>

                {/* Logo Upload Section */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-800 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center shrink-0 overflow-hidden">
                    {logoUrl ? (
                      <img src={logoUrl} alt="School Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <School className="w-6 h-6 text-slate-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-300">School Crest / Emblem (Optional)</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo</span>
                      </button>
                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Academic Terms & Class Structure */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Step 2 of 5</span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Academic Session & Classes</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Define your institutional term and select the initial class roster.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Active Academic Session <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={currentSession}
                    onChange={(e) => setCurrentSession(e.target.value)}
                    placeholder="2025-2026"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Term Start Date</label>
                  <input
                    type="date"
                    value={sessionStartDate}
                    onChange={(e) => setSessionStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-hidden transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Term End Date</label>
                  <input
                    type="date"
                    value={sessionEndDate}
                    onChange={(e) => setSessionEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-hidden transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Initial Classes to Initialize ({selectedClasses.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedClasses(PRESET_CLASSES)}
                      className="text-[11px] text-blue-400 hover:underline cursor-pointer"
                    >
                      Select All Standard
                    </button>
                    <span className="text-slate-700">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedClasses([])}
                      className="text-[11px] text-slate-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Preset badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {PRESET_CLASSES.map((cls) => {
                    const isChecked = selectedClasses.includes(cls);
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => handleToggleClass(cls)}
                        className={`p-2 rounded-lg text-xs font-medium flex items-center justify-between text-left transition border cursor-pointer ${
                          isChecked
                            ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{cls}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom class adder */}
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={customClassInput}
                    onChange={(e) => setCustomClassInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomClass();
                      }
                    }}
                    placeholder="Add custom class (e.g. Pre-Engineering Grade 11)..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomClass}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Fee & Billing Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Step 3 of 5</span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Tuition Billing & Fee Categories</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Configure default fee collection cycles and activate fee account heads.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Tuition Billing Cycle
                  </label>
                  <select
                    value={feeFrequency}
                    onChange={(e) => setFeeFrequency(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-hidden transition"
                  >
                    <option value="Monthly">Monthly (Standard)</option>
                    <option value="Bi-Monthly">Bi-Monthly (Every 2 Months)</option>
                    <option value="Quarterly">Quarterly (Every 3 Months)</option>
                    <option value="Per Term">Per Academic Term</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Frequency for automatic voucher generation schedules.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Voucher Due Date (Days from Generation)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={voucherDueDays}
                    onChange={(e) => setVoucherDueDays(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white outline-hidden transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Number of days parents have before vouchers become overdue.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Initial Fee Categories ({selectedFeeCategories.length} selected)
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {PRESET_FEE_CATEGORIES.map((cat) => {
                    const isChecked = selectedFeeCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleFeeCat(cat)}
                        className={`p-2.5 rounded-lg text-xs font-medium flex items-center justify-between text-left transition border cursor-pointer ${
                          isChecked
                            ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                        }`}
                      >
                        <span className="truncate">{cat}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-blue-400 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={customFeeInput}
                    onChange={(e) => setCustomFeeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomFeeCat();
                      }
                    }}
                    placeholder="Add custom fee category (e.g. Board Registration Fee)..."
                    className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 outline-hidden transition"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomFeeCat}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center gap-1 cursor-pointer transition shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: First Super Admin Account */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Step 4 of 5</span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Create Super Administrator</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  This master account will possess full institutional clearance to manage users, admissions, and settings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Administrator Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g., Principal Tariq Mahmood"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-hidden transition"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Username <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                    placeholder="admin"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-hidden transition"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Used for system login.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Administrator Email (Optional)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="principal@school.edu"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Master Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-hidden transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Confirm Master Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 outline-hidden transition"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                    />
                    <span>Show Passwords</span>
                  </label>
                  {adminPassword && (
                    <span
                      className={`text-xs font-semibold ${
                        adminPassword.length >= 8 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {adminPassword.length >= 8 ? 'Strong length (>= 8 chars)' : 'Too short (min 8 chars)'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Review & Initialize */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Step 5 of 5</span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">Review & Initialize School ERP</h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Please review your institutional setup before activating the school database.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* School Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 text-sm flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-blue-400" />
                      <span>School Profile</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-blue-400 hover:underline text-[11px]"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 pt-1 text-slate-400">
                    <p className="text-white font-semibold text-sm">{schoolName}</p>
                    {schoolCode && <p>Code: <span className="text-slate-300 font-mono">{schoolCode}</span></p>}
                    {city && <p>Location: <span className="text-slate-300">{city}, {country}</span></p>}
                    <p>Accounting Currency: <span className="text-slate-300 font-bold">{currency}</span></p>
                  </div>
                </div>

                {/* Academic Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 text-sm flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-400" />
                      <span>Academic & Structure</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-blue-400 hover:underline text-[11px]"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 pt-1 text-slate-400">
                    <p>Academic Session: <span className="text-white font-semibold">{currentSession}</span></p>
                    <p>Classes to Setup: <span className="text-slate-300 font-bold">{selectedClasses.length} classes</span></p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedClasses.slice(0, 6).map((c) => (
                        <span key={c} className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-800">
                          {c}
                        </span>
                      ))}
                      {selectedClasses.length > 6 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400">
                          +{selectedClasses.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Billing Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 text-sm flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-400" />
                      <span>Billing Policies</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="text-blue-400 hover:underline text-[11px]"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 pt-1 text-slate-400">
                    <p>Frequency: <span className="text-white font-semibold">{feeFrequency}</span></p>
                    <p>Voucher Due Window: <span className="text-slate-300">{voucherDueDays} days</span></p>
                    <p>Active Fee Heads: <span className="text-slate-300 font-semibold">{selectedFeeCategories.length} categories</span></p>
                  </div>
                </div>

                {/* Administrator Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Master Administrator</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="text-blue-400 hover:underline text-[11px]"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1 pt-1 text-slate-400">
                    <p className="text-white font-semibold">{adminName}</p>
                    <p>Username: <span className="text-blue-400 font-mono font-bold">{adminUsername}</span></p>
                    <p>Role: <span className="text-amber-300 font-bold">Super Admin</span></p>
                    <p>Status: <span className="text-emerald-400 font-semibold">Active clearance</span></p>
                  </div>
                </div>
              </div>

              {/* Zero Demo Data Assurance Card */}
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/40 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-200">
                  <p className="font-bold text-blue-100">Clean Slate Database Initializer</p>
                  <p className="mt-0.5 text-blue-300/90 leading-relaxed">
                    Once initialized, the ERP begins with completely empty student, teacher, fee, and attendance rosters.
                    All charts and KPIs will compute live from genuine institutional entries only.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteSetup}
                disabled={isSubmitting}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl shadow-emerald-600/30 cursor-pointer transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initializing Institutional Database...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Complete Setup & Launch ERP</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 px-6 py-4 text-center text-xs text-slate-600">
        <p>EduPulse School ERP Enterprise Gateway • Secure SQLite & Server-Authoritative Architecture</p>
      </footer>
    </div>
  );
};
