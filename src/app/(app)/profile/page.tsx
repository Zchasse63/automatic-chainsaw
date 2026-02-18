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
import { Check, Loader2, LogOut, Trophy, User } from 'lucide-react';
import { TrophyCase } from '@/components/achievements/trophy-case';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  display_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  hyrox_division: string | null;
  hyrox_race_count: number | null;
  race_date: string | null;
  goal_time_minutes: number | null;
  weekly_availability_hours: number | null;
  current_phase: string | null;
  units_preference: string | null;
  equipment_available: string[] | null;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
      setLoading(false);
    }
    load();
  }, []);

  function updateField(field: keyof Profile, value: string | number | null) {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
    setSaved(false);
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });

    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 bg-surface-2 rounded animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-surface-1 border border-border-default rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="p-6 md:p-8 max-w-2xl space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center border border-border-default">
          <User className="h-6 w-6 text-hyrox-yellow" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-text-primary">
            {profile.display_name || 'Profile'}
          </h1>
          <p className="font-body text-sm text-text-secondary">
            Manage your athlete profile
          </p>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="font-display text-sm uppercase tracking-widest text-text-tertiary">
            Personal Info
          </h2>

          <div className="space-y-2">
            <Label className="font-body text-sm text-text-secondary">
              Display Name
            </Label>
            <Input
              value={profile.display_name || ''}
              onChange={(e) => updateField('display_name', e.target.value)}
              className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-body text-sm text-text-secondary">
                Weight (kg)
              </Label>
              <Input
                type="number"
                value={profile.weight_kg ?? ''}
                onChange={(e) =>
                  updateField(
                    'weight_kg',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm text-text-secondary">
                Height (cm)
              </Label>
              <Input
                type="number"
                value={profile.height_cm ?? ''}
                onChange={(e) =>
                  updateField(
                    'height_cm',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-sm uppercase tracking-widest text-text-tertiary">
            Hyrox
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-body text-sm text-text-secondary">
                Division
              </Label>
              <Select
                value={profile.hyrox_division || 'open'}
                onValueChange={(v) => updateField('hyrox_division', v)}
              >
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
              <Label className="font-body text-sm text-text-secondary">
                Training Phase
              </Label>
              <Select
                value={profile.current_phase || 'general_prep'}
                onValueChange={(v) => updateField('current_phase', v)}
              >
                <SelectTrigger className="h-12 bg-surface-1 border-border-default font-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general_prep">General Prep</SelectItem>
                  <SelectItem value="specific_prep">Specific Prep</SelectItem>
                  <SelectItem value="competition_prep">Competition</SelectItem>
                  <SelectItem value="taper">Taper</SelectItem>
                  <SelectItem value="off_season">Off Season</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-body text-sm text-text-secondary">
                Race Date
              </Label>
              <Input
                type="date"
                value={profile.race_date || ''}
                onChange={(e) =>
                  updateField('race_date', e.target.value || null)
                }
                className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-body text-sm text-text-secondary">
                Goal Time (min)
              </Label>
              <Input
                type="number"
                value={profile.goal_time_minutes ?? ''}
                onChange={(e) =>
                  updateField(
                    'goal_time_minutes',
                    e.target.value ? Number(e.target.value) : null
                  )
                }
                className="h-12 bg-surface-1 border-border-default focus:border-hyrox-yellow font-body"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-sm uppercase tracking-widest text-text-tertiary">
            Preferences
          </h2>

          <div className="space-y-2">
            <Label className="font-body text-sm text-text-secondary">
              Units
            </Label>
            <Select
              value={profile.units_preference || 'metric'}
              onValueChange={(v) => updateField('units_preference', v)}
            >
              <SelectTrigger className="h-12 bg-surface-1 border-border-default font-body">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (kg, km)</SelectItem>
                <SelectItem value="imperial">Imperial (lbs, miles)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
      </div>

      {/* Achievements */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-hyrox-yellow" />
          <h2 className="font-display text-sm uppercase tracking-widest text-text-tertiary">
            Achievements
          </h2>
        </div>
        <TrophyCase />
      </section>

      {/* Save & Sign Out */}
      <div className="flex flex-col gap-3 pt-4 border-t border-border-default">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-12 bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover font-display uppercase tracking-wider font-bold"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Saved
            </>
          ) : (
            'Save Changes'
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleSignOut}
          className="w-full h-12 border-border-default text-text-secondary hover:text-semantic-error hover:border-semantic-error font-display uppercase tracking-wider"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
