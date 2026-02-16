'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const STEPS = [
  { label: 'Identity', description: 'Basic info' },
  { label: 'Experience', description: 'Hyrox background' },
  { label: 'Training', description: 'Current fitness' },
  { label: 'Goals', description: 'Race targets' },
  { label: 'Health', description: 'Optional' },
];

const EQUIPMENT_OPTIONS = [
  'SkiErg', 'Rower', 'Sled', 'Kettlebells', 'Sandbag',
  'Medicine Ball', 'Pull-up Bar', 'Barbell', 'Dumbbells',
  'Assault Bike', 'Treadmill', 'Gym Membership',
];

interface FormData {
  display_name: string;
  date_of_birth: string;
  sex: string;
  weight_kg: string;
  height_cm: string;
  hyrox_division: string;
  hyrox_race_count: string;
  experience_level: string;
  run_mpw: string;
  strength_days: string;
  weekly_availability_hours: string;
  equipment_available: string[];
  race_date: string;
  goal_time_minutes: string;
  current_phase: string;
  injuries_limitations: string;
  units_preference: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    display_name: '',
    date_of_birth: '',
    sex: '',
    weight_kg: '',
    height_cm: '',
    hyrox_division: 'open',
    hyrox_race_count: '0',
    experience_level: 'beginner',
    run_mpw: '',
    strength_days: '',
    weekly_availability_hours: '',
    equipment_available: [],
    race_date: '',
    goal_time_minutes: '',
    current_phase: 'general_prep',
    injuries_limitations: '',
    units_preference: 'metric',
  });

  function updateForm(field: keyof FormData, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleEquipment(item: string) {
    setForm((prev) => ({
      ...prev,
      equipment_available: prev.equipment_available.includes(item)
        ? prev.equipment_available.filter((e) => e !== item)
        : [...prev.equipment_available, item],
    }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return form.display_name.trim().length > 0;
      case 1:
        return true;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const injuries = form.injuries_limitations.trim()
      ? form.injuries_limitations.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const body = {
      display_name: form.display_name,
      date_of_birth: form.date_of_birth || null,
      sex: form.sex || null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      hyrox_division: form.hyrox_division,
      hyrox_race_count: Number(form.hyrox_race_count) || 0,
      training_history: {
        experience: form.experience_level,
        run_mpw: Number(form.run_mpw) || 0,
        strength_days: Number(form.strength_days) || 0,
      },
      current_phase: form.current_phase,
      race_date: form.race_date || null,
      goal_time_minutes: form.goal_time_minutes ? Number(form.goal_time_minutes) : null,
      weekly_availability_hours: form.weekly_availability_hours
        ? Number(form.weekly_availability_hours)
        : null,
      equipment_available: form.equipment_available,
      injuries_limitations: injuries,
      units_preference: form.units_preference,
    };

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to create profile');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-surface-0 grain flex flex-col">
      {/* Progress */}
      <div className="w-full bg-surface-1 border-b border-border-default">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="font-display text-lg font-bold uppercase tracking-wider text-text-primary">
              Set Up Your Profile
            </h1>
            <span className="font-mono text-sm text-text-tertiary">
              {step + 1}/{STEPS.length}
            </span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <div
                key={s.label}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-hyrox-yellow' : 'bg-surface-3'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <span
                key={s.label}
                className={`font-display text-[10px] uppercase tracking-widest ${
                  i <= step ? 'text-hyrox-yellow' : 'text-text-tertiary'
                }`}
              >
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* Error */}
          {error && (
            <div className="bg-semantic-error/10 border border-semantic-error/20 rounded-sm px-4 py-3">
              <p className="font-body text-sm text-semantic-error">{error}</p>
            </div>
          )}

          {/* Step 0: Identity */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-text-primary">
                  Who Are You?
                </h2>
                <p className="font-body text-text-secondary mt-1">
                  Let&apos;s start with the basics so Coach K can personalize your experience.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-body text-sm text-text-secondary">Display Name *</Label>
                  <Input
                    placeholder="How should we call you?"
                    value={form.display_name}
                    onChange={(e) => updateForm('display_name', e.target.value)}
                    className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-body text-sm text-text-secondary">Date of Birth</Label>
                    <Input
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => updateForm('date_of_birth', e.target.value)}
                      className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body text-sm text-text-secondary">Sex</Label>
                    <Select value={form.sex} onValueChange={(v) => updateForm('sex', v)}>
                      <SelectTrigger className="h-12 bg-surface-1 border-border-default font-body">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-body text-sm text-text-secondary">Weight (kg)</Label>
                    <Input
                      type="number"
                      placeholder="75"
                      value={form.weight_kg}
                      onChange={(e) => updateForm('weight_kg', e.target.value)}
                      className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body text-sm text-text-secondary">Height (cm)</Label>
                    <Input
                      type="number"
                      placeholder="178"
                      value={form.height_cm}
                      onChange={(e) => updateForm('height_cm', e.target.value)}
                      className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Hyrox Experience */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-text-primary">
                  Hyrox Experience
                </h2>
                <p className="font-body text-text-secondary mt-1">
                  Tell us about your Hyrox background so we can calibrate recommendations.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-body text-sm text-text-secondary">Division</Label>
                  <Select value={form.hyrox_division} onValueChange={(v) => updateForm('hyrox_division', v)}>
                    <SelectTrigger className="h-12 bg-surface-1 border-border-default font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="doubles">Doubles</SelectItem>
                      <SelectItem value="relay">Relay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-body text-sm text-text-secondary">How many Hyrox races have you completed?</Label>
                  <Select value={form.hyrox_race_count} onValueChange={(v) => updateForm('hyrox_race_count', v)}>
                    <SelectTrigger className="h-12 bg-surface-1 border-border-default font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">None — this will be my first</SelectItem>
                      <SelectItem value="1">1 race</SelectItem>
                      <SelectItem value="2">2-3 races</SelectItem>
                      <SelectItem value="5">4-5 races</SelectItem>
                      <SelectItem value="10">6+ races</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-body text-sm text-text-secondary">Overall Experience Level</Label>
                  <Select value={form.experience_level} onValueChange={(v) => updateForm('experience_level', v)}>
                    <SelectTrigger className="h-12 bg-surface-1 border-border-default font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner — new to structured training</SelectItem>
                      <SelectItem value="intermediate">Intermediate — consistent training 6+ months</SelectItem>
                      <SelectItem value="advanced">Advanced — years of training, competitive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Current Training */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-text-primary">
                  Current Training
                </h2>
                <p className="font-body text-text-secondary mt-1">
                  What does your training currently look like? This helps Coach K build on your existing base.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-body text-sm text-text-secondary">Running (miles/week)</Label>
                    <Input
                      type="number"
                      placeholder="25"
                      value={form.run_mpw}
                      onChange={(e) => updateForm('run_mpw', e.target.value)}
                      className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-body text-sm text-text-secondary">Strength days/week</Label>
                    <Input
                      type="number"
                      placeholder="3"
                      min="0"
                      max="7"
                      value={form.strength_days}
                      onChange={(e) => updateForm('strength_days', e.target.value)}
                      className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-body text-sm text-text-secondary">Hours available for training per week</Label>
                  <Input
                    type="number"
                    placeholder="8"
                    value={form.weekly_availability_hours}
                    onChange={(e) => updateForm('weekly_availability_hours', e.target.value)}
                    className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-body text-sm text-text-secondary">Equipment You Have Access To</Label>
                  <div className="flex flex-wrap gap-2">
                    {EQUIPMENT_OPTIONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleEquipment(item)}
                        className={`px-3 py-1.5 rounded-sm font-display text-xs uppercase tracking-wider border transition-colors ${
                          form.equipment_available.includes(item)
                            ? 'bg-hyrox-yellow/10 border-hyrox-yellow text-hyrox-yellow'
                            : 'bg-surface-1 border-border-default text-text-tertiary hover:border-border-hover'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Race Goals */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-text-primary">
                  Race Goals
                </h2>
                <p className="font-body text-text-secondary mt-1">
                  When is your next race, and what are you aiming for?
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-body text-sm text-text-secondary">Next Race Date</Label>
                  <Input
                    type="date"
                    value={form.race_date}
                    onChange={(e) => updateForm('race_date', e.target.value)}
                    className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
                  />
                  <p className="font-body text-xs text-text-tertiary">Leave blank if no race planned yet</p>
                </div>

                <div className="space-y-2">
                  <Label className="font-body text-sm text-text-secondary">Goal Finish Time (minutes)</Label>
                  <Input
                    type="number"
                    placeholder="90"
                    value={form.goal_time_minutes}
                    onChange={(e) => updateForm('goal_time_minutes', e.target.value)}
                    className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
                  />
                  <p className="font-body text-xs text-text-tertiary">Typical range: 60-120 minutes</p>
                </div>

                <div className="space-y-2">
                  <Label className="font-body text-sm text-text-secondary">Training Phase</Label>
                  <Select value={form.current_phase} onValueChange={(v) => updateForm('current_phase', v)}>
                    <SelectTrigger className="h-12 bg-surface-1 border-border-default font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_prep">General Prep — building base fitness</SelectItem>
                      <SelectItem value="specific_prep">Specific Prep — Hyrox-focused training</SelectItem>
                      <SelectItem value="competition_prep">Competition Prep — race simulation phase</SelectItem>
                      <SelectItem value="taper">Taper — race is imminent</SelectItem>
                      <SelectItem value="off_season">Off Season — maintenance/recovery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Health & Safety (Optional) */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-text-primary">
                  Health & Safety
                </h2>
                <p className="font-body text-text-secondary mt-1">
                  This step is optional but helps Coach K keep you safe and avoid aggravating any issues.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-body text-sm text-text-secondary">
                    Injuries or Limitations
                  </Label>
                  <Textarea
                    placeholder="e.g., knee pain when running downhill, shoulder impingement, recovering from ankle sprain"
                    value={form.injuries_limitations}
                    onChange={(e) => updateForm('injuries_limitations', e.target.value)}
                    className="min-h-[100px] bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
                  />
                  <p className="font-body text-xs text-text-tertiary">
                    Separate multiple items with commas. Leave blank if none.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="font-body text-sm text-text-secondary">Unit Preference</Label>
                  <Select value={form.units_preference} onValueChange={(v) => updateForm('units_preference', v)}>
                    <SelectTrigger className="h-12 bg-surface-1 border-border-default font-body">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (kg, km)</SelectItem>
                      <SelectItem value="imperial">Imperial (lbs, miles)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="border-border-default text-text-secondary hover:text-text-primary font-display uppercase tracking-wider"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider font-bold"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover shadow-glow-md font-display uppercase tracking-wider font-bold"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Skip for optional steps */}
          {step >= 3 && step < STEPS.length - 1 && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="font-body text-sm text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Skip this step
              </button>
            </div>
          )}
          {step === 4 && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="font-body text-sm text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Skip and finish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
