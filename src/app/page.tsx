import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const stations = [
  { name: 'Ski Erg', color: 'bg-station-ski' },
  { name: 'Sled Push', color: 'bg-station-push' },
  { name: 'Sled Pull', color: 'bg-station-pull' },
  { name: 'Burpee Broad Jump', color: 'bg-station-burpee' },
  { name: 'Rowing', color: 'bg-station-row' },
  { name: 'Farmers Carry', color: 'bg-station-carry' },
  { name: 'Sandbag Lunges', color: 'bg-station-lunge' },
  { name: 'Wall Balls', color: 'bg-station-wall' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-hero-gradient grain">
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 space-y-12">
        {/* Hero */}
        <header className="space-y-4">
          <h1 className="font-display text-5xl font-black uppercase tracking-wider leading-none text-text-primary">
            HYROX AI COACH
          </h1>
          <p className="font-body text-lg text-text-secondary">
            Raw Industrial Meets Precision Coaching
          </p>
          <div className="caution-stripe w-full" />
        </header>

        {/* Station Rail Preview */}
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-text-primary">
            THE STATION RAIL
          </h2>
          <div className="flex gap-0.5">
            {stations.map((station) => (
              <div
                key={station.name}
                className={`h-2 flex-1 rounded-sm ${station.color}`}
                title={station.name}
              />
            ))}
          </div>
        </section>

        {/* Typography Check */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-text-primary">
            TYPOGRAPHY
          </h2>
          <Card className="bg-surface-2 border-border-default">
            <CardHeader>
              <CardTitle className="font-display text-2xl font-bold uppercase tracking-wide">
                Barlow Condensed — Display
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-body text-base text-text-secondary">
                IBM Plex Sans — Body text for descriptions and coaching responses.
              </p>
              <p className="font-mono text-stat font-bold tabular-nums text-hyrox-yellow">
                01:23:45
              </p>
              <p className="font-mono text-sm text-text-tertiary">
                JetBrains Mono — Data and timer displays
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Color System */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-text-primary">
            SURFACE ELEVATION
          </h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <div className="bg-surface-0 h-16 rounded-sm border border-border-default flex items-center justify-center">
              <span className="font-mono text-xs text-text-tertiary">S-0</span>
            </div>
            <div className="bg-surface-1 h-16 rounded-sm border border-border-default flex items-center justify-center">
              <span className="font-mono text-xs text-text-tertiary">S-1</span>
            </div>
            <div className="bg-surface-2 h-16 rounded-sm border border-border-default flex items-center justify-center">
              <span className="font-mono text-xs text-text-tertiary">S-2</span>
            </div>
            <div className="bg-surface-3 h-16 rounded-sm border border-border-default flex items-center justify-center">
              <span className="font-mono text-xs text-text-tertiary">S-3</span>
            </div>
            <div className="bg-surface-4 h-16 rounded-sm border border-border-default flex items-center justify-center">
              <span className="font-mono text-xs text-text-tertiary">S-4</span>
            </div>
            <div className="bg-surface-5 h-16 rounded-sm border border-border-default flex items-center justify-center">
              <span className="font-mono text-xs text-text-tertiary">S-5</span>
            </div>
          </div>
        </section>

        {/* Button & Accent */}
        <section className="space-y-4">
          <h2 className="font-display text-xl font-bold uppercase tracking-wide text-text-primary">
            COMPONENTS
          </h2>
          <div className="flex gap-3 flex-wrap">
            <Button className="bg-hyrox-yellow text-text-inverse hover:bg-hyrox-yellow-hover shadow-glow-md font-display uppercase tracking-wider font-bold">
              Start Training
            </Button>
            <Button variant="outline" className="border-border-hover text-text-primary">
              View Plan
            </Button>
            <Button variant="secondary">
              Settings
            </Button>
          </div>
        </section>

        {/* Equipment Label */}
        <section className="flex gap-3">
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-text-tertiary border border-border-hover px-2 py-0.5 rounded-sm bg-surface-1">
            VO2 MAX EST.
          </span>
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-text-tertiary border border-border-hover px-2 py-0.5 rounded-sm bg-surface-1">
            ZONE 2 HR
          </span>
          <span className="font-display text-[10px] uppercase tracking-[0.2em] text-text-tertiary border border-border-hover px-2 py-0.5 rounded-sm bg-surface-1">
            RACE DAY −47
          </span>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-border-default">
          <p className="font-body text-sm text-text-tertiary">
            B1 Scaffold Complete — Design tokens loaded, fonts configured, components ready.
          </p>
        </footer>
      </div>
    </div>
  );
}
