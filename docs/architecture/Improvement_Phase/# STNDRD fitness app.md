# STNDRD: Chris Bumstead's fitness app dissected

**STNDRD is a program-first bodybuilding app that combines workout logging, nutrition tracking, community features, and gamification into a single dark-themed platform — but its most instructive lessons for app builders come from both its successes and its well-documented failures.** The app, originally launched as "CBUM Fitness" in November 2021 and rebranded to STNDRD in September 2024, has attracted **100,000+ members** and occupies a distinct niche: it's less a blank-canvas workout logger like Strong or Hevy and more a guided training ecosystem built around a celebrity athlete's methodology. With a **4.6/5 rating on iOS** (3,468+ reviews) but only **3.3/5 on Android** (~1,030 reviews), STNDRD reveals how design choices that thrill one audience can alienate another — making it a rich case study for anyone building a Hyrox-specific training app.

---

## The dark-mode visual system and "slant lines" identity

STNDRD's UI is built on a **deep black background with high-contrast white text**, following modern premium fitness app conventions. The design team works from **Figma specifications**, indicating a professionally documented design system. The most distinctive visual element is a set of **decorative "slant lines"** — angled geometric dividers that run through the interface as a brand signature. These remain static while content scrolls, creating visual depth. The logo itself is a clean, minimalist SVG wordmark reading "STNDRD" in a condensed sans-serif typeface.

The app uses a **tab-based bottom navigation** spanning six primary sections: Dashboard, Workout, Nutrition, Community, Exercise Library, and Workout Logs. The Dashboard serves as the nerve center, displaying a daily workout card with time information, a calendar view showing completion status per day, a nutrition summary, program progress indicators ("X out of X Days"), and habit tracker tiles. The **calendar view** updates in real-time and visually marks completed program days, though users cannot deeply customize their workout schedule — the app determines day order, with reordering added later as a concession to complaints.

Exercise cards within workouts display the exercise name, an HD video demonstration of Chris Bumstead performing the movement, target muscle information, written form cues, set/rep/weight input fields, checkmark icons for completed exercises, a rest timer, a "Replace Exercise" button for equipment swaps, and a notes field. Exercises can be grouped into "Series" (formerly called "Circuits"), and users can **drag-to-reorder exercises** past a visual "finish line" — a distinctive interaction metaphor worth noting for Hyrox app design, where workout order matters significantly.

---

## How workout logging actually works during a session

The active workout experience opens immediately into an **overview mode** — the team removed an earlier 4-second countdown timer that users found unnecessary. Weight input was initially limited to 2 digits (maxing at 99 lbs), which was a widely criticized bug; it has since been expanded to **4 digits with decimal precision** for accurate progressive overload tracking. The app supports standard sets, **AMRAP sets, rest-pause sets, and drop sets** as special set types.

The **rest timer** auto-starts between sets and displays on the iOS lock screen via a **Live Activity widget** — a standout feature that lets users control their workout without unlocking their phone. However, the timer **does not run when the app is backgrounded**, which is one of the most frequently cited complaints. For a Hyrox app where rest periods and transition times are critical, this is an important cautionary detail: background timer execution is non-negotiable.

After completing a workout, users see a **summary page** with logged data and can access **Instagram-shareable filters** for posting workout completions to stories. The app also shows an **exercise history view** displaying previous sets logged for the same exercise on the same day, giving users reference data during their session. Notably, **no automated PR detection or notification system** was found — unlike Strong or Hevy, which celebrate new personal records automatically. The Celebwell reviewer did report hitting PRs for deadlifts, bench, and squats within 6 weeks, but tracking these appears to be manual.

The logging workflow has significant reliability issues: users report **crashes mid-workout that wipe unsaved data**, requiring them to scroll through completed exercises to resume. The app also cuts off background music playback because video demonstrations take audio priority. These pain points suggest that for a Hyrox app, **autosaving every logged set immediately** and **managing audio gracefully alongside exercise demos** should be architectural priorities.

---

## Programs, templates, and the guided-first philosophy

STNDRD's core differentiator is its **program-first approach**. Rather than giving users a blank canvas to build workouts, the app leads with structured, phased programs designed by Bumstead and his strength coach **Justin King**:

- **Legacy Olympia Prep** (7 weeks, Advanced) — Bumstead's exact 5th Mr. Olympia preparation
- **Road to Olympia** (3 weeks, Advanced) — His 6th Olympia prep
- **Push, Pull, Legs** (3 weeks in 3 phases, Intermediate) — Classic PPL with adjustable difficulty
- **Bro Split** (3 weeks in 3 phases, Advanced) — Dedicated muscle group days
- **Legacy Arnold Split** (4 weeks, Advanced) — Arnold-inspired rotating split
- **Legacy Power-Building** (2 weeks, Intermediate) — Powerlifting/hypertrophy hybrid
- **4 Weeks to Open** (4 weeks, Advanced) — Lean bulk for CBum's move to Open Bodybuilding

Programs include progressive overload, difficulty designations (beginner/intermediate/advanced), and phase structures to prevent plateaus. Custom and on-demand workouts exist but feel secondary to the guided programs. This philosophy — "eliminate guesswork from training" — resonates deeply with users who don't want to program for themselves. For a Hyrox app, this validates the **structured-program-first approach** where users follow periodized Hyrox training blocks rather than assembling workouts ad hoc.

The **exercise replacement feature** is a practical standout: when equipment is occupied or unavailable, users can swap an exercise for an alternative targeting the same muscle group directly within the active workout. This kind of contextual flexibility within structured programming is precisely what a Hyrox app would need — where athletes might substitute rowing for skiing or adjust station-specific exercises based on available equipment.

---

## Gamification, community, and the XP leaderboard

Every completed workout in STNDRD earns **XP points** that feed into a **global leaderboard**. This competitive layer was praised by the Celebwell reviewer: "Every workout earns you XP points, and I'm all about that competitive edge." The app awards **badges** for milestones like completing first workouts or finishing entire programs, and runs **timed challenges** (e.g., "Elevate 2025," "4 Weeks to Open") that create urgency and community momentum.

The **community section** includes a social feed with posts, following/follower relationships, and small-group "PODs" where users invite friends via shareable links for accountability. Progress photos with date tracking and before/after comparisons are built in, with the website showcasing "100,000+ Real World Transformations." A **habit tracker** awards medals for consistent nutrition logging and other daily behaviors.

For Hyrox app design, the XP system and challenge framework are directly applicable — Hyrox athletes already think in terms of competition seasons and PB chasing, making gamified progress tracking a natural fit. The POD concept (small accountability groups) could translate well to Hyrox training partners or box communities.

---

## What users love and what drives them away

The praise clusters around three themes: **structured programming that removes decision fatigue** ("I don't even have to think about my workouts, I just open the app and go"), **CBum's personal exercise demonstrations** (200+ HD videos), and the **all-in-one approach** combining workouts, nutrition tracking, and community. One user credited the app with a **27-pound weight loss** in roughly three months. The integrated nutrition tracking draws favorable comparisons to MyFitnessPal, and users appreciate the exercise replacement feature for gym practicality.

The complaints, however, are severe and consistent. **App crashes mid-workout** are the single most damaging issue — "At least once a workout the app would crash, and I would have to resume the workout." **Progress data loss** compounds this: "As soon as I finish my workout, it wipes all the information from my entire lift." The **CBUM-to-STNDRD rebrand** alienated loyal users who lost workout history and found the new interface "a massive downgrade" in usability. The **aggressive paywall** requiring payment before any preview drew sharp criticism: "The fact I have to pay before I even got to see how CbumFitness works — BIGGEST RED FLAG." Users also request an **Apple Watch app** (notably absent), **better workout schedule customization**, and **longer exercise demonstration videos with audio**. The background timer limitation and tri-set programming that assumes access to three machines simultaneously reveal a gap between programming ideals and gym-floor reality.

---

## Design philosophy: from minimalist tracker to comprehensive platform

Chris Bumstead frames STNDRD as a mindset tool: "Lifting weights isn't just about physical strength; it's about pushing boundaries and becoming the best version of yourself." His coach Justin King describes it as "a culmination of everything Chris has learned from ten years in the trenches." The original CBUM Fitness app was praised as **"slick, minimalist, and user-friendly"** — a lean workout tracker that did one thing well. The STNDRD rebrand in September 2024 dramatically expanded scope to include nutrition tracking, community features, gamification, photo challenges, and coaching tiers.

This expansion created a classic **simplicity-versus-feature-depth tension**. The Noob Gains review rated the app **3.5/5**, noting "the UX and UI could be a lot better — the application itself is somewhat limiting. This is an easy fix, as it isn't the quality of the information that's wrong." Heavy ongoing bug-fixing in release notes suggests the team prioritizes feature breadth with rapid iteration, sometimes at the cost of stability. STNDRD is notably **absent from mainstream "best workout app" comparison articles** that feature Strong, Hevy, and Fitbod — it occupies a separate niche as a celebrity-branded guided fitness platform.

The pricing model (~**$17.99/month or $179.99/year**) positions it as premium but slightly cheaper than competitors like RP Hypertrophy and FST-7. A **STNDRD+** tier adds personal coaching with Justin King. The app has no AI-driven features, no data export capability, no Apple Watch integration, and no Apple Health sync confirmed — significant gaps compared to pure workout trackers.

---

## Conclusion: lessons for a Hyrox training app

STNDRD's strongest design decisions — **program-first architecture, exercise replacement within structured workouts, lock-screen live activity widgets, XP gamification, and Instagram-shareable completion screens** — translate directly to Hyrox app needs. Its failures are equally instructive: **background timer execution is essential** (Hyrox athletes live and die by transition times), **autosaving every set immediately** prevents the catastrophic data loss that dominates negative reviews, and **previewing content before paywall** builds trust. The absence of automated PR detection is a missed opportunity that a Hyrox app should seize — automatically celebrating wall ball PRs, ski erg splits, or overall race time improvements. The calendar view works for marking completed days but lacks the richness of showing workout-specific metrics at a glance, which Hyrox athletes would want (e.g., seeing station times or total workout duration on each calendar day). Most importantly, STNDRD proves that athletes want **opinionated, structured programming over blank canvases** — they want someone credible to tell them what to do today, while still giving them enough flexibility to adapt to real-world 