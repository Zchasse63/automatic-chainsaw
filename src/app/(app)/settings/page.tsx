'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  User,
  Flag,
  Dumbbell,
  LogOut,
  Bell,
  Watch,
  Database,
  Info,
  Check,
  Loader2,
  Mic,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useDashboard } from '@/hooks/use-dashboard';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';

// ── Section wrapper ──
function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof User;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-bg-card rounded-2xl border border-white/5 overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <Icon size={14} className="text-[#39FF14]" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">{title}</h3>
      </div>
      <div className="px-5 pb-4 space-y-3">{children}</div>
    </div>
  );
}

// ── Field row ──
function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-sm text-white/60 flex-shrink-0">{label}</label>
      <div className="flex-1 max-w-[200px]">{children}</div>
    </div>
  );
}

// ── Text input ──
function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#39FF14]/40 transition-colors text-right"
    />
  );
}

// ── Select input ──
function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#39FF14]/40 transition-colors text-right appearance-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#1a1a1a]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Save button ──
function SaveButton({
  onSave,
  saving,
  saved,
}: {
  onSave: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onSave}
      disabled={saving}
      className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
        saved
          ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
          : 'bg-[#39FF14] text-black hover:bg-[#39FF14]/90'
      }`}
    >
      {saving ? (
        <Loader2 size={14} className="animate-spin mx-auto" />
      ) : saved ? (
        <span className="flex items-center justify-center gap-1">
          <Check size={14} /> Saved
        </span>
      ) : (
        'Save Changes'
      )}
    </motion.button>
  );
}

// ── Main settings page ──
export default function SettingsPage() {
  const router = useRouter();
  const { data: dashData } = useDashboard();
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  // Personal info state
  const [displayName, setDisplayName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [sex, setSex] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [personalSaved, setPersonalSaved] = useState(false);

  // Race setup state
  const [division, setDivision] = useState('');
  const [raceCount, setRaceCount] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [goalTime, setGoalTime] = useState('');
  const [raceSaved, setRaceSaved] = useState(false);

  // Training prefs state
  const [weeklyHours, setWeeklyHours] = useState('');
  const [phase, setPhase] = useState('');
  const [units, setUnits] = useState('');
  const [trainingSaved, setTrainingSaved] = useState(false);

  // Voice input state
  const [voiceAutoSend, setVoiceAutoSend] = useState(false);

  // Initialize voice setting from localStorage
  useEffect(() => {
    setVoiceAutoSend(localStorage.getItem('voiceAutoSend') === 'true');
  }, []);

  // Initialize form state from profile (useEffect to avoid setState during render)
  useEffect(() => {
    if (!profile) return;
    setDisplayName(profile.display_name ?? '');
    setDateOfBirth(profile.date_of_birth ?? '');
    setSex(profile.sex ?? '');
    setWeightKg(profile.weight_kg?.toString() ?? '');
    setHeightCm(profile.height_cm?.toString() ?? '');
    setDivision(profile.hyrox_division ?? 'open');
    setRaceCount(profile.hyrox_race_count?.toString() ?? '');
    setRaceDate(profile.race_date ?? '');
    setGoalTime(profile.goal_time_minutes?.toString() ?? '');
    setWeeklyHours(profile.weekly_availability_hours?.toString() ?? '');
    setPhase(profile.current_phase ?? 'general_prep');
    setUnits(profile.units_preference ?? 'metric');
  }, [profile]);

  const email = dashData?.email ?? '';

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  function savePersonal() {
    updateProfile.mutate(
      {
        display_name: displayName || null,
        date_of_birth: dateOfBirth || null,
        sex: sex || null,
        weight_kg: weightKg ? Number(weightKg) : null,
        height_cm: heightCm ? Number(heightCm) : null,
      } as Record<string, unknown> as Partial<import('@/hooks/use-profile').AthleteProfile>,
      {
        onSuccess: () => {
          setPersonalSaved(true);
          setTimeout(() => setPersonalSaved(false), 2000);
        },
      }
    );
  }

  function saveRace() {
    updateProfile.mutate(
      {
        hyrox_division: division || null,
        hyrox_race_count: raceCount ? Number(raceCount) : null,
        race_date: raceDate || null,
        goal_time_minutes: goalTime ? Number(goalTime) : null,
      } as Record<string, unknown> as Partial<import('@/hooks/use-profile').AthleteProfile>,
      {
        onSuccess: () => {
          setRaceSaved(true);
          setTimeout(() => setRaceSaved(false), 2000);
        },
      }
    );
  }

  function saveTraining() {
    updateProfile.mutate(
      {
        weekly_availability_hours: weeklyHours ? Number(weeklyHours) : null,
        current_phase: phase || null,
        units_preference: units || 'metric',
      } as Record<string, unknown> as Partial<import('@/hooks/use-profile').AthleteProfile>,
      {
        onSuccess: () => {
          setTrainingSaved(true);
          setTimeout(() => setTrainingSaved(false), 2000);
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-deep px-6 pt-6 pb-6 animate-pulse">
        <div className="h-8 w-32 bg-white/5 rounded-lg mb-6" />
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28 }}
      className="flex-1 overflow-y-auto px-6 pt-6 pb-6 bg-bg-deep min-h-screen"
    >
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
        </motion.button>
        <h2 className="text-2xl font-black italic tracking-tighter uppercase text-white leading-none">
          Settings
        </h2>
      </header>

      <div className="space-y-4">
        {/* ── Personal Information ── */}
        <SettingsSection title="Personal Info" icon={User}>
          <FieldRow label="Name">
            <TextInput value={displayName} onChange={setDisplayName} placeholder="Your name" />
          </FieldRow>
          <FieldRow label="Date of Birth">
            <TextInput value={dateOfBirth} onChange={setDateOfBirth} type="date" />
          </FieldRow>
          <FieldRow label="Sex">
            <SelectInput
              value={sex}
              onChange={setSex}
              options={[
                { value: '', label: 'Not set' },
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
              ]}
            />
          </FieldRow>
          <FieldRow label="Weight (kg)">
            <TextInput value={weightKg} onChange={setWeightKg} type="number" placeholder="82" />
          </FieldRow>
          <FieldRow label="Height (cm)">
            <TextInput value={heightCm} onChange={setHeightCm} type="number" placeholder="180" />
          </FieldRow>
          <SaveButton onSave={savePersonal} saving={updateProfile.isPending} saved={personalSaved} />
        </SettingsSection>

        {/* ── Race Setup ── */}
        <SettingsSection title="Race Setup" icon={Flag}>
          <FieldRow label="Division">
            <SelectInput
              value={division}
              onChange={setDivision}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'pro', label: 'Pro' },
                { value: 'doubles', label: 'Doubles' },
                { value: 'relay', label: 'Relay' },
              ]}
            />
          </FieldRow>
          <FieldRow label="Race Count">
            <TextInput value={raceCount} onChange={setRaceCount} type="number" placeholder="0" />
          </FieldRow>
          <FieldRow label="Race Date">
            <TextInput value={raceDate} onChange={setRaceDate} type="date" />
          </FieldRow>
          <FieldRow label="Goal Time (min)">
            <TextInput value={goalTime} onChange={setGoalTime} type="number" placeholder="75" />
          </FieldRow>
          <SaveButton onSave={saveRace} saving={updateProfile.isPending} saved={raceSaved} />
        </SettingsSection>

        {/* ── Training Preferences ── */}
        <SettingsSection title="Training" icon={Dumbbell}>
          <FieldRow label="Weekly Hours">
            <TextInput value={weeklyHours} onChange={setWeeklyHours} type="number" placeholder="10" />
          </FieldRow>
          <FieldRow label="Phase">
            <SelectInput
              value={phase}
              onChange={setPhase}
              options={[
                { value: 'general_prep', label: 'General Prep' },
                { value: 'specific_prep', label: 'Specific Prep' },
                { value: 'competition', label: 'Competition' },
                { value: 'taper', label: 'Taper' },
                { value: 'off_season', label: 'Off Season' },
              ]}
            />
          </FieldRow>
          <FieldRow label="Units">
            <SelectInput
              value={units}
              onChange={setUnits}
              options={[
                { value: 'metric', label: 'Metric' },
                { value: 'imperial', label: 'Imperial' },
              ]}
            />
          </FieldRow>
          <SaveButton onSave={saveTraining} saving={updateProfile.isPending} saved={trainingSaved} />
        </SettingsSection>

        {/* ── Voice Input ── */}
        <SettingsSection title="Voice Input" icon={Mic}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Auto-send voice messages</p>
              <p className="text-[10px] text-white/30 mt-0.5">
                Automatically send after you stop speaking
              </p>
            </div>
            <button
              onClick={() => {
                const next = !voiceAutoSend;
                localStorage.setItem('voiceAutoSend', String(next));
                setVoiceAutoSend(next);
              }}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                voiceAutoSend ? 'bg-[#39FF14]' : 'bg-white/10'
              }`}
              role="switch"
              aria-checked={voiceAutoSend}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                  voiceAutoSend ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </SettingsSection>

        {/* ── Notifications (stub) ── */}
        <SettingsSection title="Notifications" icon={Bell}>
          <p className="text-xs text-white/30">Notification preferences coming soon.</p>
        </SettingsSection>

        {/* ── Connected Devices (stub) ── */}
        <SettingsSection title="Connected Devices" icon={Watch}>
          <p className="text-xs text-white/30">Connect your Garmin, Whoop, or Apple Watch — coming soon.</p>
        </SettingsSection>

        {/* ── Data Management (stub) ── */}
        <SettingsSection title="Data Management" icon={Database}>
          <p className="text-xs text-white/30">Export or delete your data — coming soon.</p>
        </SettingsSection>

        {/* ── Account ── */}
        <SettingsSection title="Account" icon={User}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Email</span>
            <span className="text-sm text-white/40">{email || 'Not set'}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </SettingsSection>

        {/* ── App Info ── */}
        <SettingsSection title="App Info" icon={Info}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Version</span>
            <span className="text-sm text-white/30">1.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Build</span>
            <span className="text-sm text-white/30">Next.js 16 + Grok</span>
          </div>
        </SettingsSection>
      </div>
    </motion.div>
  );
}
