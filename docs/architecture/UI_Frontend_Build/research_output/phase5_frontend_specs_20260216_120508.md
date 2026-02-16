# Research Output: Screen-by-Screen Frontend Specs for Hyrox AI Coach
## Generated: 2026-02-16T12:05:08.394793
## Preset: advanced-deep-research
## Model: anthropic/claude-opus-4-6
## Cost: $0.9809
## Research steps: 3 searches, 4 URL fetches
## Output length: 56124 chars, 5551 words

---

Now I have sufficient information about the component libraries. Let me compile the complete Phase 5 spec.

---

# Phase 5: Screen-by-Screen Frontend Specs — Hyrox AI Coach

## Complete Build Blueprint

---

# DELIVERABLE 1: Screen Spec Document

---

## Screen 0: Landing & Auth Pages

### 0A. Landing Page (`/`)

**Route & Layout**
- Route: `app/(marketing)/page.tsx`
- Layout: `app/(marketing)/layout.tsx` — no app shell, no bottom nav, no sidebar
- Auth: Public (unauthenticated)

**User Story**
> "What is Hyrox AI Coach and why should I sign up?"

**Primary Action**: Click "Get Started" → navigate to `/signup`

**Component Tree**
```
<MarketingLayout>                          — Custom layout (no nav shell)
  <LandingPage>
    <header>
      <MorphicNavbar>                      — Kokonut Free
        <Logo />                           — Custom (text + icon)
        <NavLinks />                       — "Features" | "Pricing" | "About"
        <Button variant="outline">Log In</Button>   — shadcn/ui
        <Button>Get Started</Button>       — shadcn/ui
      </MorphicNavbar>
    </header>

    <main>
      <HeroSection>                        — Custom
        <ShimmerText>                      — Kokonut Free
          "Your AI-Powered Hyrox Coach"
        </ShimmerText>
        <TypingText>                       — Kokonut Free
          "Train smarter. Race faster. Beat your PB."
        </TypingText>
        <p>Subheadline description</p>
        <div class="cta-group">
          <ParticleButton>Get Started Free</ParticleButton>   — Kokonut Free
          <Button variant="outline">See How It Works</Button> — shadcn/ui
        </div>
      </HeroSection>

      <FeaturesSection>                    — Custom using BentoGrid
        <BentoGrid>                        — Kokonut Free
          <BentoCard> AI Coaching </BentoCard>
          <BentoCard> Training Plans </BentoCard>
          <BentoCard> Race Analytics </BentoCard>
          <BentoCard> Station Breakdown </BentoCard>
          <BentoCard> Progress Tracking </BentoCard>
        </BentoGrid>
      </FeaturesSection>

      <SocialProofSection>                 — Custom
        <DynamicText>                      — Kokonut Free
          "500+ Hyrox athletes coached"
        </DynamicText>
      </SocialProofSection>

      <CTASection>
        <ParticleButton>Start Training Now</ParticleButton>
      </CTASection>

      <Footer>                             — Kokonut Pro Footer
        links, social, copyright
      </Footer>
    </main>
  </LandingPage>
</MarketingLayout>
```

**Data Requirements**: None. Static page.

**States**
- **Populated**: The default and only state — static content.
- **Loading**: N/A (static, no data fetch).
- **Error**: N/A.

**Interactions**
| Element | Action |
|---------|--------|
| "Get Started" / "Start Training Now" buttons | → `/signup` |
| "Log In" nav link | → `/login` |
| Feature cards | Scroll to features section (anchor) or hover animation only |
| Nav links | Smooth scroll to sections |

**Responsive Behavior**
- **Mobile (<768px)**: Single-column hero. Bento grid stacks to 1 column. Morphic Navbar collapses to hamburger menu with Sheet/Drawer.
- **Tablet (768–1023px)**: 2-column bento grid. Hero stays full width.
- **Desktop (≥1024px)**: Full 3-column bento grid. Hero side-by-side with visual element.

**Animations**
- `ShimmerText` on hero headline — continuous shimmer
- `TypingText` on tagline — types out on mount
- `ParticleButton` — particle burst on hover
- `BentoGrid` cards — staggered fade-in on scroll (Motion `whileInView`)
- `DynamicText` counter — counts up from 0 to target number on scroll

**Dark Mode**: Default dark. Light mode: invert background to white, dark text, adjusted bento card borders.

---

### 0B. Login Page (`/login`)

**Route & Layout**
- Route: `app/(auth)/login/page.tsx`
- Layout: `app/(auth)/layout.tsx` — centered card layout, no app shell
- Auth: Public (redirect to `/dashboard` if already authenticated)

**User Story**
> "I want to sign in to my account."

**Component Tree**
```
<AuthLayout>                               — Custom (centered, minimal)
  <LoginPage>                              — Based on Kokonut Pro Login-05 (providers + email)
    <div class="auth-container max-w-md mx-auto">
      <Logo />
      <h1>"Welcome back"</h1>
      <p>"Sign in to your account"</p>

      <div class="social-providers">
        <Button variant="outline">         — shadcn/ui
          <GoogleIcon /> Continue with Google
        </Button>
        <Button variant="outline">
          <AppleIcon /> Continue with Apple
        </Button>
      </div>

      <Separator>                          — shadcn/ui
        "Or continue with email"
      </Separator>

      <form>
        <div class="field">
          <Label>Email</Label>             — shadcn/ui
          <Input type="email" />           — shadcn/ui (or Kokonut Pro Input variant)
        </div>
        <div class="field">
          <Label>Password</Label>
          <Input type="password" />
          <Link href="/forgot-password" class="text-sm">Forgot password?</Link>
        </div>
        <Button type="submit" class="w-full">Sign In</Button>  — shadcn/ui
      </form>

      <p class="text-sm text-center">
        Don't have an account? <Link href="/signup">Sign up</Link>
      </p>
    </div>
  </LoginPage>
</AuthLayout>
```

**Data Requirements**
- On submit: `POST /api/auth/login` with `{ email, password }`
- Social OAuth: Redirect to provider flow
- On success: Check if `athlete_profile` exists → `/dashboard` or `/onboarding`

**States**
- **Default**: Form visible, empty fields
- **Loading**: Submit button shows spinner, inputs disabled
- **Error**: Inline error below form ("Invalid email or password"), input borders turn red
- **Success**: Brief spinner → redirect

**Interactions**
| Element | Action |
|---------|--------|
| "Sign In" button | Validate form → POST login → redirect |
| "Continue with Google" | OAuth redirect |
| "Continue with Apple" | OAuth redirect |
| "Forgot password?" link | → `/forgot-password` |
| "Sign up" link | → `/signup` |

**Responsive Behavior**
- **Mobile**: Card fills screen width with padding. No side image.
- **Desktop**: Optionally split-screen layout (image left, form right — Kokonut Pro Login-01 style) or centered card on subtle gradient background.

**Animations**
- Card fade-in on mount (`motion.div` initial={{ opacity: 0, y: 20 }})
- Button loading spinner

**Dark Mode**: Card uses `bg-card` token. Inputs use `bg-input` token. Borders soften.

---

### 0C. Sign Up Page (`/signup`)

**Route & Layout**
- Route: `app/(auth)/signup/page.tsx`
- Layout: Same `(auth)` layout
- Auth: Public

**Component Tree**: Nearly identical to Login, but:
- Title: "Create your account"
- Fields: Name, Email, Password, Confirm Password
- CTA: "Create Account"
- Footer: "Already have an account? Sign in"
- On success: `POST /api/auth/register` → redirect to `/onboarding`

---

### 0D. Forgot Password Page (`/forgot-password`)

**Route & Layout**
- Route: `app/(auth)/forgot-password/page.tsx`

**Component Tree**
```
<AuthLayout>
  <ForgotPasswordPage>
    <Logo />
    <h1>"Reset your password"</h1>
    <p>"Enter your email and we'll send you a reset link"</p>
    <form>
      <Label>Email</Label>
      <Input type="email" />
      <Button type="submit" class="w-full">Send Reset Link</Button>
    </form>
    <Link href="/login">← Back to sign in</Link>
  </ForgotPasswordPage>
</AuthLayout>
```

**States**
- **Default**: Form visible
- **Loading**: Button spinner
- **Success**: Replace form with "Check your email" message + check icon
- **Error**: "Email not found" inline error

---

## Screen 1: Onboarding / Profile Setup

**Route & Layout**
- Route: `app/(auth)/onboarding/page.tsx`
- Layout: `app/(auth)/layout.tsx` — no app shell (user hasn't fully entered app yet)
- Auth: Authenticated, but no profile yet (redirect to `/dashboard` if profile exists)

**User Story**
> "I just signed up. Let me tell you about myself so you can coach me."

**Primary Action**: Complete multi-step form → create athlete profile → enter app.

**Component Tree**
```
<AuthLayout>
  <OnboardingPage>
    <div class="onboarding-container max-w-2xl mx-auto">
      <Logo />

      <StepperIndicator                    — Custom
        steps={["About You", "Hyrox Background", "Training", "Race Goals", "Preferences"]}
        currentStep={currentStep}
      />

      <motion.div key={currentStep}>       — Motion (AnimatePresence for step transitions)

        {/* STEP 1: Basic Identity */}
        <OnboardingStep1>                  — Based on Kokonut Pro Form-04 (multi-step)
          <h2>"Tell us about yourself"</h2>
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <Label>Full Name</Label>
              <Input />                    — shadcn/ui
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input type="date" />        — shadcn/ui (or react-day-picker Popover)
            </div>
            <div>
              <Label>Sex</Label>
              <RadioGroup>                 — shadcn/ui
                <RadioGroupItem value="male" /> Male
                <RadioGroupItem value="female" /> Female
                <RadioGroupItem value="other" /> Prefer not to say
              </RadioGroup>
            </div>
          </div>
        </OnboardingStep1>

        {/* STEP 2: Hyrox Background */}
        <OnboardingStep2>
          <h2>"Your Hyrox Experience"</h2>
          <div>
            <Label>How many Hyrox races have you completed?</Label>
            <Select>                       — shadcn/ui
              <SelectItem>0 - First timer</SelectItem>
              <SelectItem>1-2</SelectItem>
              <SelectItem>3-5</SelectItem>
              <SelectItem>5+</SelectItem>
            </Select>
          </div>
          <div>
            <Label>Division</Label>
            <RadioGroup>
              <RadioGroupItem value="singles_men" />Men's Singles
              <RadioGroupItem value="singles_women" />Women's Singles
              <RadioGroupItem value="doubles_men" />Men's Doubles
              <RadioGroupItem value="doubles_women" />Women's Doubles
              <RadioGroupItem value="doubles_mixed" />Mixed Doubles
              <RadioGroupItem value="relay" />Relay
            </RadioGroup>
          </div>
          <div>
            <Label>Experience Level</Label>
            <Select>
              <SelectItem>Beginner — new to structured training</SelectItem>
              <SelectItem>Intermediate — train regularly, raced before</SelectItem>
              <SelectItem>Advanced — competitive, targeting podium</SelectItem>
              <SelectItem>Elite — sub-60 / Hyrox Pro level</SelectItem>
            </Select>
          </div>
          <div>
            <Label>Best race time (if applicable)</Label>
            <div class="flex gap-2">
              <Input placeholder="HH" type="number" /> :
              <Input placeholder="MM" type="number" /> :
              <Input placeholder="SS" type="number" />
            </div>
          </div>
        </OnboardingStep2>

        {/* STEP 3: Current Training */}
        <OnboardingStep3>
          <h2>"Your Current Training"</h2>
          <div>
            <Label>Weekly running volume (km)</Label>
            <Slider                        — shadcn/ui + Custom labels
              min={0} max={80} step={5}
              labels={["0km","20km","40km","60km","80km"]}
            />
          </div>
          <div>
            <Label>Strength sessions per week</Label>
            <Select>0 / 1 / 2 / 3 / 4 / 5+</Select>
          </div>
          <div>
            <Label>Weekly training hours available</Label>
            <Slider min={2} max={20} step={1} />
          </div>
          <div>
            <Label>Equipment access</Label>
            <MultiSelectChips>             — Custom
              Gym / SkiErg / Rower / Sled / Pull-up bar / Sandbag /
              Wall balls / Kettlebells / Running track / None
            </MultiSelectChips>
          </div>
        </OnboardingStep3>

        {/* STEP 4: Race Goals (skippable) */}
        <OnboardingStep4>
          <h2>"Race Goals"</h2>
          <p class="text-muted-foreground">"Optional — you can set this later"</p>
          <div>
            <Label>Next race date</Label>
            <Input type="date" />          — or react-day-picker Calendar
            <Checkbox>                     — shadcn/ui
              "I don't have a race planned yet"
            </Checkbox>
          </div>
          <div>
            <Label>Goal finish time</Label>
            <div class="flex gap-2">
              <Input placeholder="HH" /> :
              <Input placeholder="MM" /> :
              <Input placeholder="SS" />
            </div>
          </div>
        </OnboardingStep4>

        {/* STEP 5: Preferences (skippable) */}
        <OnboardingStep5>
          <h2>"Anything else Coach K should know?"</h2>
          <div>
            <Label>Injuries or limitations</Label>
            <Textarea />                   — shadcn/ui
            <p class="text-xs text-muted-foreground">
              "e.g., 'Bad left knee', 'recovering from shoulder surgery'"
            </p>
          </div>
          <div>
            <Label>Preferred training days</Label>
            <MultiSelectChips>
              Mon / Tue / Wed / Thu / Fri / Sat / Sun
            </MultiSelectChips>
          </div>
        </OnboardingStep5>

      </motion.div>

      <div class="step-navigation flex justify-between mt-8">
        <Button variant="ghost"            — shadcn/ui
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          ← Back
        </Button>
        <div class="flex gap-2">
          {currentStep >= 3 && (
            <Button variant="ghost"
              onClick={skipStep}
            >
              Skip
            </Button>
          )}
          <Button onClick={nextStep || submit}>
            {currentStep < 4 ? "Continue →" : "Let's Go! 🏋️"}
          </Button>
        </div>
      </div>

      <Progress                            — shadcn/ui
        value={(currentStep + 1) / 5 * 100}
        class="mt-4"
      />
    </div>
  </OnboardingPage>
</AuthLayout>
```

**Data Requirements**
- On final submit: `POST /api/athletes/profile` with all collected data
- Response: `201 Created` with `athlete_profile` object
- On success: Redirect to `/dashboard`

**States**
- **Step Transition**: AnimatePresence slide-left/slide-right between steps
- **Validation Error**: Red border on invalid fields + error message below field. "Continue" button disabled until current step is valid (Steps 1–3 have required fields).
- **Submit Loading**: Final "Let's Go!" button shows spinner, all inputs disabled
- **Submit Error**: Toast notification "Something went wrong. Please try again." with retry

**Interactions**
| Element | Action |
|---------|--------|
| "Continue →" | Validate current step → animate to next step |
| "← Back" | Animate to previous step |
| "Skip" | Move to next step without validation (Steps 4–5 only) |
| "Let's Go!" (Step 5) | Submit all data → POST → redirect to `/dashboard` |
| Stepper indicator dots | Click to jump to step (only if step is ≤ current or completed) |
| Equipment chips | Toggle on/off (multi-select) |
| "No race planned" checkbox | Disable/hide date and goal time fields |

**Responsive Behavior**
- **Mobile**: Full-width form, single column. Slider with large touch target. Equipment chips wrap to 2 columns.
- **Desktop**: Centered container (max-w-2xl). Steps 1–3 use 2-column grid for short fields.

**Animations**
- Step transitions: `motion.div` with `initial={{ x: 100, opacity: 0 }}`, `animate={{ x: 0, opacity: 1 }}`, `exit={{ x: -100, opacity: 0 }}`
- Progress bar: smooth width transition (CSS transition or Motion)
- Stepper dots: scale pulse on active step
- Final submit: ParticleButton burst → confetti (canvas-confetti) → redirect

**Dark Mode**: Standard — form fields use dark input backgrounds. Chip selections use brand color highlights.

---

## Screen 2: Dashboard (Home)

**Route & Layout**
- Route: `app/(app)/dashboard/page.tsx`
- Layout: `app/(app)/layout.tsx` — app shell with bottom nav (mobile) / sidebar (desktop)
- Auth: Authenticated + profile exists

**User Story**
> "What should I do today? Am I on track?"

**Primary Action**: Tap "Start Workout" to begin today's session.

**Component Tree**
```
<AppLayout>                                — Custom (sidebar + content area)
  <DashboardPage>

    <header class="dashboard-header mb-6">
      <div>
        <DynamicText>                      — Kokonut Free
          "Good morning, {firstName}! 👋"  — time-aware greeting
        </DynamicText>
        <p class="text-muted-foreground">
          "{dayOfWeek}, {formattedDate}"
        </p>
      </div>
    </header>

    <BentoGrid                             — Kokonut Free
      columns={{ mobile: 1, tablet: 2, desktop: 4 }}
    >

      {/* === ROW 1: Hero cards === */}

      {/* Race Countdown Card — spans 2 cols desktop */}
      <BentoCard colSpan={2} rowSpan={1}   — Kokonut Free (customized)
        class="bg-gradient-to-br from-brand-600 to-brand-800"
      >
        <RaceCountdownCard>                — Custom
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-80">Next Race</p>
              <h2 class="text-4xl font-bold">{daysUntilRace}</h2>
              <p class="text-lg">days to go</p>
              <p class="text-sm opacity-80">{raceName} · {raceDate}</p>
            </div>
            <ProgressRing                  — Custom (SVG circle)
              percentage={weeksCompleted / totalWeeks * 100}
              label="Plan Progress"
            />
          </div>
        </RaceCountdownCard>
      </BentoCard>

      {/* Today's Workout Card — spans 2 cols desktop */}
      <BentoCard colSpan={2} rowSpan={1}>
        <TodaysWorkoutCard>                — Custom
          <div class="flex items-center gap-2 mb-2">
            <Dumbbell class="h-5 w-5" />   — Lucide
            <h3>"Today's Workout"</h3>
          </div>
          <p class="text-lg font-semibold">{workout.title}</p>
          <p class="text-sm text-muted-foreground">
            {workout.sessionType} · ~{workout.estimatedDuration}min
          </p>
          <div class="flex flex-wrap gap-1 mt-2">
            {workout.tags.map(tag =>
              <Badge>{tag}</Badge>          — shadcn/ui
            )}
          </div>
          <div class="mt-4 flex gap-2">
            <Button>                       — shadcn/ui
              <Play class="h-4 w-4 mr-1" /> Start Workout
            </Button>
            <Button variant="outline">View Details</Button>
          </div>
        </TodaysWorkoutCard>
      </BentoCard>

      {/* === ROW 2: Metrics === */}

      {/* Weekly Training Summary */}
      <BentoCard colSpan={2}>
        <AppleActivityCard>                — Kokonut Free (repurposed)
          {/* Ring 1: Running hours */}
          {/* Ring 2: Station/Strength hours */}
          {/* Ring 3: Recovery sessions */}
          <ActivityRings
            move={{ current: runHours, goal: runGoal, label: "RUN" }}
            exercise={{ current: strengthHours, goal: strengthGoal, label: "STRENGTH" }}
            stand={{ current: recoverySessions, goal: recoveryGoal, label: "RECOVERY" }}
          />
          <p class="text-sm mt-2">
            {workoutsCompleted}/{workoutsPlanned} sessions this week
          </p>
        </AppleActivityCard>
      </BentoCard>

      {/* Quick Stats Card */}
      <BentoCard colSpan={1}>
        <QuickStatCard>                    — Custom
          <StatItem
            icon={<Timer />}               — Lucide
            label="Est. Race Time"
            value={estimatedRaceTime}
            trend={timeTrend}              — "↓ 2:30 from last month"
          />
        </QuickStatCard>
      </BentoCard>

      {/* Training Streak */}
      <BentoCard colSpan={1}>
        <QuickStatCard>
          <StatItem
            icon={<Flame />}               — Lucide
            label="Training Streak"
            value={`${streakDays} days`}
            subtext="Keep it up! 🔥"
          />
        </QuickStatCard>
      </BentoCard>

      {/* === ROW 3: Activity & AI === */}

      {/* Recent AI Insight */}
      <BentoCard colSpan={2}>
        <CoachInsightCard>                 — Custom
          <div class="flex items-center gap-2 mb-2">
            <Bot class="h-5 w-5" />        — Lucide
            <h3>"Coach K Says"</h3>
          </div>
          <p class="text-sm line-clamp-3">
            {lastInsight.preview}
          </p>
          <Button variant="link" class="mt-2 p-0">
            Continue conversation →
          </Button>
        </CoachInsightCard>
      </BentoCard>

      {/* Recent Activity Feed */}
      <BentoCard colSpan={2}>
        <RecentActivityCard>               — Custom container
          <h3 class="mb-3">"Recent Activity"</h3>
          <AnimatedList>                   — Kokonut Pro
            {recentWorkouts.map(workout =>
              <ActivityItem
                icon={getSessionTypeIcon(workout.type)}
                title={workout.title}
                subtitle={`${workout.duration}min · RPE ${workout.rpe}`}
                timestamp={workout.date}
              />
            )}
          </AnimatedList>
        </RecentActivityCard>
      </BentoCard>

    </BentoGrid>

  </DashboardPage>
</AppLayout>
```

**Data Requirements**
- **On mount**: `GET /api/dashboard` — returns aggregate:
  ```json
  {
    "athlete": { "firstName", "raceDate", "raceName" },
    "todaysWorkout": { "title", "sessionType", "duration", "tags", "planDayId" },
    "weekSummary": { "completed", "planned", "runHours", "strengthHours", "recoverySessions" },
    "streak": { "days" },
    "estimatedRaceTime": { "time", "trend" },
    "lastInsight": { "conversationId", "preview" },
    "recentWorkouts": [{ "title", "type", "duration", "rpe", "date" }]
  }
  ```
- **Revalidation**: On focus (when user returns to tab), and after workout log save

**States**
- **Loading**: Full-page skeleton — `BentoGrid` with shimmer/pulse placeholder cards. Each card is a rounded rectangle with animated gradient. Use Kokonut's shimmer patterns.
- **Empty (New User)**: Replace bento content with guided "Get Started" cards:
  ```
  <EmptyDashboard>
    <h2>"Welcome to Hyrox AI Coach! 🎉"</h2>
    <p>"Let's get you started. Here are some things you can do:"</p>
    <div class="grid gap-4">
      <GetStartedCard
        icon={<MessageSquare />}
        title="Chat with Coach K"
        description="Get personalized advice and training recommendations"
        cta="Start Conversation"
        href="/coach"
      />
      <GetStartedCard
        icon={<Dumbbell />}
        title="Log Your First Workout"
        description="Record a session to start tracking your progress"
        cta="Log Workout"
        href="/training/log"
      />
      <GetStartedCard
        icon={<Target />}
        title="Set a Race Goal"
        description="Pick your next race and target time"
        cta="Set Goal"
        href="/profile"
      />
    </div>
  </EmptyDashboard>
  ```
- **Populated**: Full bento grid as described above
- **Error**: Toast notification "Couldn't load dashboard. Pull to refresh." + stale data if available
- **No race set**: Race countdown card changes to "Set your next race" prompt card
- **Rest day**: Today's workout card shows "Rest Day 🧘" with recovery tips

**Interactions**
| Element | Action |
|---------|--------|
| "Start Workout" button | → `/training/log?planDayId={id}` (pre-populated) |
| "View Details" on today's workout | → `/training/plans/{planId}?week={w}&day={d}` |
| Activity ring card | → `/performance` |
| Est. Race Time stat | → `/performance` |
| Streak stat | No navigation (informational) |
| "Continue conversation →" | → `/coach/{conversationId}` |
| Recent activity items | → `/training/log/{workoutLogId}` (view mode) |
| Empty state CTAs | Navigate to respective routes |
| Pull-to-refresh (mobile) | Re-fetch `/api/dashboard` |

**Responsive Behavior**
- **Mobile (<768px)**: Single column. Cards stack vertically. Race countdown + today's workout are full-width. Activity rings show compact (smaller rings). Recent activity shows 3 items max.
- **Tablet (768–1023px)**: 2-column grid. Race countdown spans 2 cols. Other cards 1 col each.
- **Desktop (≥1024px)**: 4-column bento grid as specified. Sidebar visible on left (240px). Content fills remaining space.

**Animations**
- Bento cards: Staggered fade-in on mount (Motion `staggerChildren: 0.05`)
- Race countdown number: Count-up animation from 0 to target (custom hook with `requestAnimationFrame`)
- Activity rings: Animate from 0% to actual % on mount (SVG stroke-dashoffset transition, 1.2s ease-out)
- Streak fire emoji: Subtle pulse animation if streak > 7 days
- Card hover (desktop): Subtle scale(1.01) + shadow elevation
- Recent activity list: AnimatedList entrance (Kokonut Pro) — items slide in one by one

**Dark Mode**: Default theme. Bento cards use `bg-card` with subtle border. Race countdown card uses gradient that works in both modes (darker gradient in dark mode, lighter in light mode). Activity rings use bright saturated colors in both modes.

---

## Screen 3: AI Coach Chat

**Route & Layout**
- Routes:
  - `/coach` — conversation list (mobile) / conversation list + empty state (desktop)
  - `/coach/[conversationId]` — active chat
- Layout: `app/(app)/coach/layout.tsx` — custom chat layout within app shell
- Auth: Authenticated

**User Story**
> "Help me with X — give me training advice, analyze my performance, build a workout."

**Primary Action**: Send a message and get a streaming AI response.

**This is the most complex screen. Full spec follows.**

### 3A. Chat Layout (Desktop)

```
<AppLayout>
  <CoachLayout class="flex h-[calc(100vh-var(--nav-height))]">

    {/* LEFT PANEL: Conversation Sidebar — 280px, desktop only */}
    <aside class="w-[280px] border-r flex flex-col shrink-0 hidden md:flex">

      <div class="p-4">
        <Button class="w-full">           — shadcn/ui
          <Plus class="h-4 w-4 mr-2" />   — Lucide
          New Conversation
        </Button>
      </div>

      <div class="px-4 pb-2">
        <Input                             — shadcn/ui
          placeholder="Search conversations..."
          prefix={<Search class="h-4 w-4" />}
        />
      </div>

      <ScrollArea class="flex-1">          — shadcn/ui
        <ConversationList>                 — Custom
          {conversations.map(conv =>
            <ConversationListItem           — Custom
              key={conv.id}
              title={conv.title}
              preview={conv.lastMessage}
              timestamp={conv.updatedAt}
              isActive={conv.id === activeConvId}
              onClick={() => navigate(`/coach/${conv.id}`)}
            />
          )}
        </ConversationList>
      </ScrollArea>

    </aside>

    {/* RIGHT PANEL: Active Chat */}
    <main class="flex-1 flex flex-col min-w-0">
      {children}                           — Nested route renders here
    </main>

  </CoachLayout>
</AppLayout>
```

### 3B. Chat Layout (Mobile)

```
<AppLayout>
  <CoachMobileLayout>

    {/* /coach route on mobile shows conversation list */}
    <MobileConversationList>
      <header class="sticky top-0 bg-background/80 backdrop-blur p-4">
        <h1>"Coach K"</h1>
        <Button size="icon" variant="ghost">
          <Plus />
        </Button>
      </header>
      <ScrollArea>
        {conversations.map(conv =>
          <ConversationListItem             — navigates to /coach/{id}
            ...
          />
        )}
      </ScrollArea>
    </MobileConversationList>

    {/* /coach/[id] route on mobile shows full-screen chat */}
    <MobileChatView>
      <header class="sticky top-0 bg-background/80 backdrop-blur p-4 flex items-center">
        <Button variant="ghost" size="icon">
          <ChevronLeft />                  — Back to conversation list
        </Button>
        <div class="flex-1 text-center">
          <p class="font-semibold">Coach K</p>
          <p class="text-xs text-muted-foreground">{conversationTitle}</p>
        </div>
        <Button variant="ghost" size="icon">
          <MoreVertical />                 — Options menu
        </Button>
      </header>
      <ChatArea />
      <ChatInput />
    </MobileChatView>

  </CoachMobileLayout>
</AppLayout>
```

### 3C. Chat Area (shared between layouts)

```
<ChatArea class="flex-1 overflow-hidden flex flex-col">

  {/* Message List */}
  <ScrollArea                              — shadcn/ui
    class="flex-1 px-4"
    ref={scrollAreaRef}
  >
    <div class="max-w-3xl mx-auto py-4 space-y-4">

      {/* Suggestion chips (shown when conversation is empty / at start) */}
      {messages.length === 0 && (
        <EmptyChatState>                   — Custom
          <div class="text-center py-12">
            <Bot class="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2>"What can I help you with?"</h2>
            <p class="text-muted-foreground mb-6">
              "I'm Coach K, your AI Hyrox training partner."
            </p>
            <div class="flex flex-wrap gap-2 justify-center">
              <SuggestionChip>             — Custom (Button variant="outline" + rounded-full)
                "Analyze my last race"
              </SuggestionChip>
              <SuggestionChip>
                "Build a sled push workout"
              </SuggestionChip>
              <SuggestionChip>
                "Am I ready for race day?"
              </SuggestionChip>
              <SuggestionChip>
                "What should I do today?"
              </SuggestionChip>
              <SuggestionChip>
                "Create a 12-week training plan"
              </SuggestionChip>
              <SuggestionChip>
                "Help me improve my SkiErg time"
              </SuggestionChip>
            </div>
          </div>
        </EmptyChatState>
      )}

      {/* Message Bubbles */}
      {messages.map(msg => (
        <ChatMessage                       — Custom
          key={msg.id}
          role={msg.role}                  — "user" | "assistant"
          content={msg.content}
          timestamp={msg.createdAt}
          isStreaming={msg.isStreaming}
          isPinned={msg.isPinned}
          feedback={msg.feedback}
        >
          {msg.role === "assistant" && (
            <div class="flex items-center gap-1 mt-2">

              {/* Feedback buttons */}
              <Tooltip content="Helpful">  — shadcn/ui
                <Button
                  variant="ghost" size="icon-sm"
                  onClick={() => feedback(msg.id, "up")}
                  class={msg.feedback === "up" ? "text-green-500" : ""}
                >
                  <ThumbsUp class="h-3.5 w-3.5" />
                </Button>
              </Tooltip>

              <Tooltip content="Not helpful">
                <Button
                  variant="ghost" size="icon-sm"
                  onClick={() => feedback(msg.id, "down")}
                  class={msg.feedback === "down" ? "text-red-500" : ""}
                >
                  <ThumbsDown class="h-3.5 w-3.5" />
                </Button>
              </Tooltip>

              <Tooltip content="Pin message">
                <Button
                  variant="ghost" size="icon-sm"
                  onClick={() => togglePin(msg.id)}
                  class={msg.isPinned ? "text-yellow-500" : ""}
                >
                  <Pin class="h-3.5 w-3.5" />
                </Button>
              </Tooltip>

              <Tooltip content="Copy">
                <Button
                  variant="ghost" size="icon-sm"
                  onClick={() => copyToClipboard(msg.content)}
                >
                  <Copy class="h-3.5 w-3.5" />
                </Button>
              </Tooltip>

            </div>
          )}
        </ChatMessage>
      ))}

      {/* Thinking Indicator */}
      {isThinking && (
        <ChatMessage role="assistant" isThinking>
          <AIStateLoading>                 — Kokonut Free
            {thinkingDuration < 5000
              ? "Coach K is thinking..."
              : "Coach K is warming up... hang tight! 🏋️"
            }
          </AIStateLoading>
        </ChatMessage>
      )}

      <div ref={scrollAnchorRef} />        — Auto-scroll target
    </div>
  </ScrollArea>

  {/* Input Area */}
  <ChatInputArea>                          — Custom wrapper
    <div class="border-t bg-background px-4 py-3">
      <div class="max-w-3xl mx-auto">

        {/* Quick suggestion chips (shown after assistant reply) */}
        {showSuggestions && (
          <div class="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
            {followUpSuggestions.map(s =>
              <SuggestionChip
                key={s}
                onClick={() => sendMessage(s)}
              >
                {s}
              </SuggestionChip>
            )}
          </div>
        )}

        {/* Main Input */}
        <div class="relative flex items-end gap-2">
          <div class="flex-1 relative">
            <Textarea                      — Custom (auto-resize)
              ref={inputRef}
              placeholder="Message Coach K..."
              value={inputValue}
              onChange={setInputValue}
              onKeyDown={handleKeyDown}     — Enter=send, Shift+Enter=newline
              rows={1}
              maxRows={6}
              class="resize-none pr-12"
            />
            {/* Voice input toggle */}
            <Button
              variant="ghost"
              size="icon"
              class="absolute right-2 bottom-2"
              onClick={toggleVoiceInput}
            >
              <Mic class="h-4 w-4" />      — Lucide
            </Button>
          </div>

          {/* Send button */}
          <Button
            size="icon"
            onClick={sendMessage}
            disabled={!inputValue.trim() || isThinking}
          >
            <Send class="h-4 w-4" />       — Lucide
          </Button>
        </div>

        <p class="text-xs text-muted-foreground text-center mt-2">
          "Coach K can make mistakes. Verify important training advice."
        </p>

      </div>
    </div>
  </ChatInputArea>

  {/* Voice Input Overlay (when active) */}
  {isVoiceActive && (
    <VoiceInputOverlay>                    — Custom + Kokonut AI Voice
      <AIVoice>                            — Kokonut Free
        waveform visualization
      </AIVoice>
      <p>Listening...</p>
      <Button onClick={stopVoice}>
        <Square /> Stop
      </Button>
    </VoiceInputOverlay>
  )}

</ChatArea>
```

### Chat Message Bubble Component (Custom Build — Detailed Spec)

```
<ChatMessage role="user" | "assistant">
  <div class={cn(
    "flex gap-3 max-w-[85%]",
    role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
  )}>

    {/* Avatar */}
    {role === "assistant" && (
      <Avatar class="h-8 w-8 shrink-0">   — shadcn/ui
        <AvatarImage src="/coach-k-avatar.svg" />
        <AvatarFallback>K</AvatarFallback>
      </Avatar>
    )}

    {/* Bubble */}
    <div class={cn(
      "rounded-2xl px-4 py-3",
      role === "user"
        ? "bg-primary text-primary-foreground rounded-br-md"
        : "bg-muted rounded-bl-md"
    )}>

      {/* Content: Markdown rendered for assistant, plain text for user */}
      {role === "assistant" ? (
        <MarkdownRenderer                  — Custom (react-markdown + rehype-highlight)
          content={content}
          isStreaming={isStreaming}
        />
      ) : (
        <p class="text-sm whitespace-pre-wrap">{content}</p>
      )}

      {/* Streaming cursor */}
      {isStreaming && (
        <span class="inline-block w-2 h-4 bg-current animate-blink ml-0.5" />
      )}

      {/* Timestamp */}
      <p class={cn(
        "text-[10px] mt-1",
        role === "user" ? "text-primary-foreground/60" : "text-muted-foreground"
      )}>
        {formatTime(timestamp)}
      </p>
    </div>

  </div>

  {/* Action buttons (assistant only, shown below bubble) */}
  {role === "assistant" && !isStreaming && (
    <MessageActions>                       — see above in ChatArea
      ...thumbs up/down, pin, copy
    </MessageActions>
  )}
</ChatMessage>
```

**Data Requirements**

| Trigger | Endpoint | Purpose |
|---------|----------|---------|
| Page mount | `GET /api/conversations?limit=50&offset=0` | Populate sidebar conversation list |
| Select conversation | `GET /api/conversations/{id}/messages?limit=50` | Load message history |
| Send message | `POST /api/chat` body: `{ conversationId, message }` | SSE stream response |
| New conversation | `POST /api/conversations` body: `{ title? }` | Create new, navigate to it |
| Feedback | `PATCH /api/messages/{id}/feedback` body: `{ feedback: "up"|"down"|null }` | Save feedback |
| Pin | `PATCH /api/messages/{id}/pin` body: `{ isPinned: boolean }` | Toggle pin |
| Delete conversation | `DELETE /api/conversations/{id}` | Remove from list |

**SSE Stream Handling** (Detail):
1. User sends message → append user message to local state immediately (optimistic)
2. Set `isThinking = true`
3. `POST /api/chat` → returns SSE stream
4. On first token: set `isThinking = false`, create assistant message in local state with `isStreaming = true`
5. On each token: append to assistant message content, auto-scroll to bottom
6. On `[DONE]` event: set `isStreaming = false`, save final message to server state
7. On error: show error toast, remove thinking indicator, allow retry

**States**
- **Loading (conversation list)**: Skeleton list items (5 shimmer rectangles)
- **Loading (messages)**: `AITextLoading` (Kokonut Free) centered in chat area
- **Empty (no conversations)**: Full empty state with Coach K avatar, welcome text, and suggestion chips
- **Empty (selected conversation, no messages)**: Suggestion chips state as described above
- **Populated**: Messages rendered, input active
- **Streaming**: Assistant message growing token by token, blinking cursor, input disabled
- **Thinking**: Coach K avatar + `AIStateLoading` bubble animation
- **Cold Start (>5s)**: "Coach K is warming up..." text replaces "thinking..."
- **Error (stream failed)**: Error message inline in chat + "Retry" button
- **Error (offline)**: Banner at top "You're offline. Messages will send when you reconnect."

**Interactions**
| Element | Action |
|---------|--------|
| "New Conversation" button | POST new conversation → navigate to it |
| Conversation list item | Navigate to `/coach/{id}`, load messages |
| Conversation list item — long press/right click | Context menu: Rename, Delete |
| Suggestion chip | Insert text into input + auto-send |
| Send button | Send message (if input not empty and not streaming) |
| Enter key | Send message |
| Shift+Enter | Insert newline |
| Mic button | Activate voice input → transcribe → populate input |
| ThumbsUp/Down | PATCH feedback |
| Pin button | PATCH pin status |
| Copy button | Copy message markdown to clipboard → toast "Copied!" |
| Voice "Stop" button | Stop recording → transcribe → populate input |
| Scroll up | Load older messages (pagination) |

**Responsive Behavior**
- **Mobile (<768px)**: 
  - `/coach` shows conversation list full-screen
  - `/coach/[id]` shows chat full-screen with back button
  - Conversation list accessible via back navigation (not drawer — simpler)
  - Input area fixed to bottom above tab bar
  - Message bubbles max-width: 85%
  - Suggestion chips horizontally scrollable
- **Tablet (768–1023px)**: 
  - Two-panel layout: sidebar 240px, chat fills rest
  - Sidebar collapsible via toggle button
- **Desktop (≥1024px)**: 
  - Two-panel: sidebar 280px, chat fills rest
  - Messages max-width: 3xl (768px) centered in chat area

**Animations**
- New message appear: `motion.div` fade-in + slide up from bottom (y: 20 → 0, opacity: 0 → 1, duration: 0.2s)
- Streaming text: No animation per token — just DOM append (performance). Blinking cursor animation via CSS.
- Thinking indicator: `AIStateLoading` Kokonut animation (pulsing dots)
- Conversation list item: Hover background transition (150ms ease)
- Voice input: `AIVoice` Kokonut waveform animation
- Suggestion chips: Stagger fade-in after assistant message completes
- Send button: Brief scale(0.95) on press

**Dark Mode**: 
- User bubbles: `bg-primary` (brand color) — same in both modes
- Assistant bubbles: `bg-muted` — light gray in light mode, dark gray in dark mode
- Code blocks in markdown: Dark theme syntax highlighting always (looks good in both modes)
- Conversation sidebar: `bg-sidebar` token

---

## Screen 4: Training Plan View

**Route & Layout**
- Routes:
  - `/training` — active plan overview
  - `/training/plans/[planId]` — specific plan detail
- Layout: `app/(app)/training/layout.tsx` within app shell
- Auth: Authenticated

**User Story**
> "What's my plan this week? What workout is coming up?"

**Primary Action**: View the current week's workouts → tap "Log This Workout" to start.

**Component Tree**
```
<AppLayout>
  <TrainingPage>

    {/* Plan Header */}
    <div class="mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">{plan.name}</h1>
          <p class="text-muted-foreground">
            Week {currentWeek} of {plan.totalWeeks} · {plan.status}
          </p>
        </div>
        <Popover>                          — shadcn/ui
          <PopoverTrigger>
            <Button variant="ghost" size="icon">
              <MoreVertical />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Button variant="ghost">Edit Plan</Button>
            <Button variant="ghost">Archive Plan</Button>
            <Button variant="ghost">Create New Plan</Button>
            <Button variant="ghost">Ask Coach K to Adjust</Button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Plan Progress Bar */}
      <div class="mt-3">
        <div class="flex justify-between text-sm mb-1">
          <span>{completedDays}/{totalDays} sessions completed</span>
          <span>{Math.round(completedDays/totalDays*100)}%</span>
        </div>
        <Progress value={completedDays/totalDays*100} />  — shadcn/ui
      </div>
    </div>

    {/* Week Selector */}
    <SmoothTab                             — Kokonut Free
      tabs={weeks.map(w => `Week ${w.number}`)}
      activeTab={currentWeek - 1}
      onChange={setCurrentWeek}
    />

    {/* Day Cards */}
    <div class="mt-4 space-y-3">
      {currentWeekDays.map(day => (
        <TrainingDayCard                   — Custom
          key={day.id}
          day={day}
        >
          <Collapsible>                    — shadcn/ui (or custom accordion)
            <CollapsibleTrigger class="w-full">
              <div class="flex items-center justify-between p-4">
                <div class="flex items-center gap-3">

                  {/* Day status indicator */}
                  <div class={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    day.isCompleted ? "bg-green-500/10 text-green-500" :
                    day.isToday ? "bg-primary/10 text-primary ring-2 ring-primary" :
                    day.isRest ? "bg-muted text-muted-foreground" :
                    "bg-muted text-foreground"
                  )}>
                    {day.isCompleted ? <Check /> :
                     day.isRest ? <Coffee /> :
                     getSessionTypeIcon(day.sessionType)}
                  </div>

                  <div>
                    <p class="font-semibold">
                      {day.dayLabel}          — "Monday" / "Day 1"
                      {day.isToday && (
                        <Badge variant="outline" class="ml-2">Today</Badge>
                      )}
                    </p>
                    <p class="text-sm text-muted-foreground">
                      {day.isRest ? "Rest Day" : `${day.title} · ${day.duration}min`}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  {day.isCompleted && (
                    <Badge variant="secondary">
                      <Check class="h-3 w-3 mr-1" /> Done
                    </Badge>
                  )}
                  <ChevronDown class="h-4 w-4 transition-transform" />
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div class="px-4 pb-4 pt-0">
                <Separator class="mb-3" />

                {/* Workout Details */}
                <div class="space-y-2">
                  {day.exercises.map(exercise => (
                    <div class="flex justify-between text-sm">
                      <span>{exercise.name}</span>
                      <span class="text-muted-foreground">
                        {exercise.prescription}
                        {/* e.g., "4×12 @70kg" or "5km @ 5:30/km" */}
                      </span>
                    </div>
                  ))}
                </div>

                {day.notes && (
                  <p class="text-sm text-muted-foreground mt-3 italic">
                    📝 {day.notes}
                  </p>
                )}

                {/* CTAs */}
                <div class="flex gap-2 mt-4">
                  {!day.isCompleted && !day.isRest && (
                    <Button size="sm">
                      <Play class="h-3 w-3 mr-1" />
                      Log This Workout
                    </Button>
                  )}
                  {day.isCompleted && (
                    <Button variant="outline" size="sm">
                      View Log
                    </Button>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </TrainingDayCard>
      ))}
    </div>

  </TrainingPage>
</AppLayout>
```

**Data Requirements**
| Trigger | Endpoint | Purpose |
|---------|----------|---------|
| Page mount | `GET /api/training-plans?status=active` | Get active plan |
| Plan load | `GET /api/training-plans/{id}` | Full plan with weeks and days |
| Week change | Cached from initial load (all weeks loaded) or `GET /api/training-plans/{id}/weeks/{weekNum}` |
| Log workout | Navigate to `/training/log?planDayId={id}` |

**States**
- **Loading**: Skeleton header + 7 skeleton day cards (shimmer rectangles)
- **Empty (no plan)**: 
  ```
  <EmptyPlanState>
    <Dumbbell class="h-16 w-16 text-muted-foreground mx-auto" />
    <h2>"No Active Training Plan"</h2>
    <p>"Create a plan or ask Coach K to build one for you"</p>
    <div class="flex gap-3 mt-4">
      <Button>
        <Bot class="h-4 w-4 mr-2" />
        Ask Coach K
      </Button>
      <Button variant="outline">
        Create Manually
      </Button>
    </div>
  </EmptyPlanState>
  ```
- **Populated**: Full plan view as described
- **Error**: Toast + retry button

**Interactions**
| Element | Action |
|---------|--------|
| Week tabs | Switch displayed week (local state) |
| Day card click | Expand/collapse workout details |
| "Log This Workout" | → `/training/log?planDayId={dayId}` |
| "View Log" | → `/training/log/{workoutLogId}` (read mode) |
| "Edit Plan" | → Edit modal or `/training/plans/{id}/edit` |
| "Archive Plan" | Confirm dialog → PATCH plan status → redirect |
| "Ask Coach K to Adjust" | → `/coach` with pre-filled "Please adjust my training plan..." |
| "Create New Plan" | → `/training/plans/new` or coach flow |

**Responsive Behavior**
- **Mobile**: Full-width. Week tabs horizontally scrollable. Day cards full-width with adequate touch targets.
- **Desktop**: Max-width container (4xl). Week tabs centered. Day cards have hover state.

**Animations**
- Day card expand: Collapsible content height animation (200ms ease)
- Week tab switch: `SmoothTab` built-in sliding indicator animation
- Completed day check: Scale bounce on check icon when newly completed
- Progress bar: Animate width on mount

**Dark Mode**: Day cards use `bg-card`. Completed days have subtle green tint. Rest days use lighter muted background. Today's card has ring/border highlight in brand color.

---

## Screen 5: Workout Logger

**Route & Layout**
- Routes:
  - `/training/log` — new workout log
  - `/training/log/[workoutLogId]` — edit existing or view completed
- Layout: Full-screen modal-style page (within app shell but may hide bottom nav on mobile to maximize space)
- Auth: Authenticated
- Query params: `?planDayId={id}` to pre-populate from training plan

**User Story**
> "Let me record what I just did."

**Primary Action**: Fill in workout details → Save.

**Component Tree**
```
<AppLayout hideBottomNav={true}>           — Custom prop to hide nav during logging
  <WorkoutLogPage>

    {/* Header */}
    <header class="sticky top-0 bg-background/90 backdrop-blur z-10 p-4 border-b">
      <div class="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goBack}>
          <X />                            — Lucide (close)
        </Button>
        <h1>"Log Workout"</h1>
        <Button onClick={save} disabled={!isValid}>
          Save
        </Button>
      </div>
    </header>

    <div class="max-w-2xl mx-auto p-4">

      {/* Mode Toggle */}
      <SmoothTab                           — Kokonut Free
        tabs={["Quick Log", "Detailed Log"]}
        activeTab={mode}
        onChange={setMode}
      />

      {/* ====== QUICK LOG MODE ====== */}
      {mode === "quick" && (
        <QuickLogForm class="mt-4 space-y-4">

          <div>
            <Label>Date</Label>
            <Popover>                      — shadcn/ui
              <PopoverTrigger asChild>
                <Button variant="outline" class="w-full justify-start">
                  <CalendarDays class="h-4 w-4 mr-2" />
                  {selectedDate || "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar                  — react-day-picker
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Session Type</Label>
            <div class="grid grid-cols-3 gap-2 mt-1">
              {["Run", "Strength", "HIIT", "Simulation", "Recovery", "Other"].map(type => (
                <Button                    — shadcn/ui
                  variant={sessionType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSessionType(type)}
                  class="flex flex-col items-center py-3"
                >
                  {getSessionIcon(type)}
                  <span class="text-xs mt-1">{type}</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label>Title / Description</Label>
            <Input                         — shadcn/ui
              placeholder="e.g., 5km easy run, Upper body strength"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" placeholder="45" />
            </div>
            <div>
              <Label>Distance (optional)</Label>
              <div class="flex gap-1">
                <Input type="number" placeholder="5.0" class="flex-1" />
                <Select class="w-16">     — shadcn/ui
                  <SelectItem>km</SelectItem>
                  <SelectItem>mi</SelectItem>
                </Select>
              </div>
            </div>
          </div>

          {/* RPE Slider */}
          <div>
            <Label>How hard was it? (RPE)</Label>
            <RPESlider                     — Custom
              value={rpe}
              onChange={setRpe}
              min={1} max={10}
            >
              {/* Visual: slider with color gradient (green→yellow→red) */}
              {/* Labels at key points: */}
              {/* 1-2: "Very Easy" */}
              {/* 3-4: "Easy" */}
              {/* 5-6: "Moderate" */}
              {/* 7-8: "Hard" */}
              {/* 9: "Very Hard" */}
              {/* 10: "Maximal" */}
              <Slider                      — shadcn/ui
                min={1} max={10} step={1}
                value={[rpe]}
                onValueChange={([v]) => setRpe(v)}
              />
              <div class="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 Easy</span>
                <span>5 Moderate</span>
                <span>10 Max</span>
              </div>
              <p class="text-center text-sm font-medium mt-2">
                {rpe} — {rpeLabel(rpe)}
              </p>
            </RPESlider>
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea                      — shadcn/ui
              placeholder="How did it feel? Any issues?"
              rows={3}
            />
          </div>

        </QuickLogForm>
      )}

      {/* ====== DETAILED LOG MODE ====== */}
      {mode === "detailed" && (
        <DetailedLogForm class="mt-4 space-y-4">

          {/* Same date + session type + title as quick log */}
          {/* ... */}

          {/* Exercise List */}
          <div>
            <div class="flex items-center justify-between mb-2">
              <Label>Exercises</Label>
              <Button variant="ghost" size="sm" onClick={addExercise}>
                <Plus class="h-4 w-4 mr-1" /> Add Exercise
              </Button>
            </div>

            {exercises.map((exercise, i) => (
              <ExerciseEntry               — Custom
                key={exercise.tempId}
                class="border rounded-lg p-3 mb-3"
              >
                <div class="flex items-center justify-between mb-2">
                  <Input                   — Exercise name
                    placeholder="Exercise name"
                    value={exercise.name}
                    class="font-medium border-0 p-0 text-base focus:ring-0"
                  />
                  <Button variant="ghost" size="icon-sm" onClick={() => removeExercise(i)}>
                    <Trash2 class="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                {/* Sets Table */}
                <div class="space-y-2">
                  <div class="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground">
                    <span>Set</span>
                    <span>Weight</span>
                    <span>Reps</span>
                    <span>Time</span>
                    <span></span>
                  </div>
                  {exercise.sets.map((set, j) => (
                    <div class="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-2 items-center">
                      <span class="text-sm text-muted-foreground w-6">{j+1}</span>
                      <Input type="number" placeholder="kg" size="sm" />
                      <Input type="number" placeholder="reps" size="sm" />
                      <Input type="text" placeholder="0:00" size="sm" />
                      <Button variant="ghost" size="icon-sm">
                        <X class="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={() => addSet(i)}>
                    <Plus class="h-3 w-3 mr-1" /> Add Set
                  </Button>

---

## Sources

- [Kokonut UI - Open Source Components](https://kokonutui.com)
- [KokonutUI Pro](https://kokonutui.pro/docs/components/form)
- [Installation - Shadcn UI](https://ui.shadcn.com/docs/installation)
- [kokonut-labs/kokonutui: Collection of UI components. Built ...](https://github.com/kokonut-labs/kokonutui)
- [Docs](https://kokonutui.com/docs)
- [init - Shadcn UI](https://ui.shadcn.com/docs/cli)
- [Kokonut UI's components and demos](https://21st.dev/community/kokonutd)
- [Copy-Paste UI Components for React/Next.js - Kokonutui](https://next.jqueryscript.net/next-js/kokonutui/)
- [Shadcn Installation Guide](https://www.shadcn.io/ui/installation-guide)
- [Kokonut UI -Pro.](https://kokonutui.pro)
- [Installation – shadcn/ui kit for Figma, styled in seconds with tweakcn](https://shadcraft.com/docs/installation-via-shadcn-cli)
- [KokonutUI - Free UI Components to build beautiful websites](https://kokonutui.com/Docs)
- [Docs - How to use CLI - Shadcn Studio](https://shadcnstudio.com/docs/getting-started/how-to-use-shadcn-cli)
- [KokonutUI](https://www.curateduilist.com/websites/kokonut-ui)
- [命令行工具（CLI）](https://www.shadcn-ui.cn/docs/cli)
- [Next.js 16](https://nextjs.org/blog/next-16)
- [Features - UI Components to build beautiful websites - KokonutUI Pro](https://kokonutui.pro/docs/components/features)
- [Next.js Docs: App Router](https://nextjs.org/docs/app)
- [Installation - UI Components to build beautiful websites](https://kokonutui.pro/docs)
- [Next.js 16 is Here: What It Means for Your Workflow](https://dev.to/hashbyt/nextjs-16-is-here-what-it-means-for-your-workflow-1agh)
- [KokonutUI](https://kokonutui.com/docs/components/text)
- [KokonutUI Pro](https://kokonutui.pro/docs/components)
- [Next.js 16: What's new, and what it means for frontend devs](https://blog.logrocket.com/next-js-16-whats-new/)
- [Kokonut UI | Tailwind Resources](https://www.tailwindresources.com/theme/kokonut-labs-kokonutui/)
- [Next.js 16 Full Course | Build and Deploy a Production-Ready Full Stack App](https://www.youtube.com/watch?v=I1V9YWqRIeI)
- [KokonutUI](https://kokonutui.com/docs/components/ai-input)
- [](https://kokonutui.com/docs/components/navbar)
- [Card Flip](https://kokonutui.com/docs/components/card)
- [](https://kokonutui.com/docs/components/tab)
- [KokonutUI](https://kokonutui.com/docs/components/apple-activity-card)
- [Cards - UI Components to build beautiful websites](https://kokonutui.pro/docs/components/card)
- [Pro Calendar Features](https://www.youtube.com/watch?v=0cis5VOXJQU)
- [Featured](https://21st.dev/community/components/kokonutd/bento-grid)
- [KokonutUI Pro](https://kokonutui.pro/docs/components/pricing)
- [Bento box component examples for inspiration - NicelyDone.club](https://nicelydone.club/components/bento-grid)
- [Calendar Card Pro for Home Assistant. Level up your dashboard with this awesome card!](https://www.youtube.com/watch?v=DqfDJSHEX9E)
- [Bento Grid](https://kokonutui.com/docs/components/bento-grid)
- [How to Create Apple Bento Grids using Bento Generator](https://www.youtube.com/watch?v=zpoir4GxSk4)
- [Calendar](https://pro.propeller.in/components/calendar)
- [KokonutUI Pro](https://kokonutui.pro/docs/components/login)

---

## Original Prompt

```
# Phase 5: Screen-by-Screen Frontend Specs — Hyrox AI Coach

> **Role**: You are a frontend architect and UX designer producing the detailed build specs for every screen of the Hyrox AI Coach web application. Each screen spec is the blueprint Claude Code follows to implement the page. You have access to the Kokonut UI Design Guide (Phase 1 output), the database schema (Phase 2 output), and the API spec (Phase 4 output). You are in planning mode — produce specs, wireframe descriptions, and component trees, not code.

---

## Project Context

### Tech Stack
- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Component Libraries**: Kokonut UI (free) + Kokonut UI Pro ($129) + shadcn/ui primitives
- **Animation**: Motion (Framer Motion successor) — bundled with Kokonut
- **Icons**: Lucide React
- **State Management**: (Defined in Phase 4 — reference that document)
- **Data Fetching**: (Defined in Phase 4 — reference that document)

### Component Layer Strategy (from Phase 1 audit)
- **Layer 1 — shadcn/ui**: Button, Input, Select, Dialog, Sheet, Tabs, Progress, Switch, Slider, Checkbox, Radio Group, Label, Separator, Scroll Area, Tooltip, Popover, Command, Toast (sonner)
- **Layer 2 — Kokonut UI Free**: AI Input Selector, AI State Loading, AI Text Loading, AI Voice, AI Input Search, Apple Activity Card, Bento Grid, Smooth Tab, Smooth Drawer, Morphic Navbar, Profile Dropdown, Hold Button, Particle Button, Card Stack, File Upload, Typing Text, Dynamic Text, Shimmer Text, Switch Button
- **Layer 3 — Kokonut UI Pro**: Forms (multi-step form-04, edit profile form-06, schedule form-02), Inputs (10 variants), Cards (9 variants, especially analytics card-08), Calendar Schedule, Animated List, Modals, Login pages (8 variants), FAQ Accordions
- **Layer 4 — Supplementary**: Recharts (charts), TanStack Table (data tables), sonner (toasts), react-day-picker (calendar)
- **Custom builds needed**: Chat message bubbles/list, streaming text renderer, timer/countdown, stepper wizard, slider with labels, multi-select chips, checklist, stat/metric cards, progress rings

### Design Philosophy
Mobile-first responsive web app. Dark mode supported. Every screen answers a question the athlete is asking:
- Dashboard: "What should I do today? Am I on track?"
- AI Coach: "Help me with X"
- Training: "What's my plan this week?"
- Workout Logger: "Let me record what I just did"
- Performance: "Am I getting faster? What are my weak stations?"
- Race Hub: "How did my race go? Am I ready for the next one?"
- Profile: "Update my info"

---

## Navigation Structure

### Primary Navigation (persistent across all screens)
**Mobile (< 768px)**: Bottom tab bar, 5 items
**Desktop (≥ 768px)**: Left sidebar (collapsible) or top nav bar

| Tab | Icon (Lucide) | Route | Label |
|-----|--------------|-------|-------|
| Home | `Home` or `LayoutDashboard` | `/dashboard` | Dashboard |
| Coach | `MessageSquare` or `Bot` | `/coach` | AI Coach |
| Training | `Dumbbell` or `CalendarDays` | `/training` | Training |
| Performance | `TrendingUp` or `BarChart3` | `/performance` | Progress |
| Profile | `User` | `/profile` | Profile |

**Secondary access (not in primary nav):**
- Workout Logger: Launched from Training screen or Dashboard "Start Workout" CTA → `/training/log`
- Race Hub: Accessed from Performance screen or Dashboard → `/races`
- Settings: Accessed from Profile screen → `/profile/settings`

**Component**: Use Kokonut's **Morphic Navbar** for desktop, build a custom bottom tab bar for mobile using Kokonut's animation patterns.

---

## Screen Specs

### For EACH screen, provide:

1. **Route & Layout**: Next.js route path, which layout wraps it, auth requirement
2. **User Story**: What question does this screen answer? What's the primary action?
3. **Component Tree**: Hierarchical breakdown of every UI element, specifying which library each component comes from (Kokonut Free / Kokonut Pro / shadcn / Recharts / Custom)
4. **Data Requirements**: Which API endpoints feed this screen, what data loads on mount vs. on interaction
5. **States**: Loading state, empty state, error state, populated state — describe each
6. **Interactions**: Every clickable/tappable element and what it does
7. **Responsive Behavior**: How the layout changes between mobile (<768px) and desktop (≥1024px)
8. **Animations**: Which Kokonut/Motion animations apply where
9. **Dark Mode**: Any special considerations for dark mode styling

---

## Screens to Spec

### Screen 0: Landing / Auth Pages
- Routes: `/` (landing), `/login`, `/signup`, `/forgot-password`
- Use Kokonut Pro Login pages as base
- Landing page: Brief product pitch → CTA to sign up
- After auth: Redirect to `/onboarding` if no profile exists, else `/dashboard`

### Screen 1: Onboarding / Profile Setup
- Route: `/onboarding`
- Multi-step form wizard (3-5 steps)
- **Step 1**: Name, age/DOB, sex → basic identity
- **Step 2**: Hyrox experience (race count, division, experience leve
```
