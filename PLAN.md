# Talya (working name) — Product Plan v0.3

Talya helps couples hear how their own voice comes across. It analyzes pace, pitch and loudness in short clips and describes how that delivery often lands. It is a mirror for self-awareness, not a referee, a lie detector or therapy.

## Changes from v0.1

1. **Personal baseline is a core v1 feature.** Pitch and loudness mean little without knowing how *this* person sounds when calm. Each user records a neutral clip first. Without a baseline, Talya only reads patterns inside a clip (pace, pitch movement, escalation).
2. **Confidence is capped at "Moderate."** Voice alone cannot confirm emotion. The UI never shows "High."
3. **Each partner analyzes only their own voice by default.** Joint review of a two-person exchange needs consent from both, per request.
4. **Misuse guardrails added** (new section below). The biggest product risk is one partner using the app as ammunition.
5. **Zero-cost architecture.** Analysis runs on the device. No server audio processing, no paid API, no audio storage costs.
6. **Off-the-shelf emotion models are deferred.** Most public speech-emotion models are trained on acted speech and transfer poorly to real conversations. v1 uses transparent acoustic features; a model is added only if testing shows it beats them.

## Decisions (recommended, pending owner sign-off)

| Open question | Recommendation | Why |
|---|---|---|
| Voice only, or text too? | Voice only for v1 | Tone lives in the voice. Text tone is a different, weaker product. |
| Individual or always couple-shared? | Individual first, opt-in sharing | Works for one partner alone, safer, and solo users can still convert. |
| Price | Free: 3 checks/day. Together: $4.99/mo or $29.99/yr per couple; founding couples $19.99 first year | Owner wants scale. Checks cost us nothing (on-device), so the free tier can be generous; charge for history, sharing and the full practice library. |
| Frameworks | Describe ideas like soft starts and repair attempts in our own words | Do not claim Gottman or NVC affiliation or endorsement without a license. |

## Ethics and safety

- Frame every result as "often comes across as," never "you are feeling."
- No "who is right" scores, no partner leaderboards, no comparing partners' scores.
- Never analyze someone's voice without their own account consent.
- Recording laws: some US states require everyone in a conversation to consent to recording. The app must not record conversations covertly.
- Voice data can count as biometric data under some state laws (for example Illinois BIPA). On-device processing and no server audio storage keep risk low; get a legal review before storing any audio server-side.
- Show relationship-safety resources (for example the National Domestic Violence Hotline) in settings, and do not market the app as a fix for abusive or controlling relationships.
- Not a medical or therapeutic product. No diagnostic claims. Age gate 18+.
- One-tap delete of everything, for both partners.

## Free or near-free stack

| Need | Choice | Cost |
|---|---|---|
| Web prototype hosting | GitHub Pages from this repo | $0 |
| Audio analysis | In-browser (Web Audio + `src/analysis.js`) | $0 |
| Waitlist | Free form tool or a GitHub Pages form to a free tier service | $0 |
| Accounts and couple linking (later) | Supabase or Firebase free tier | $0 at small scale |
| Mobile app (later) | Capacitor wrapping the web app first, then decide on native | $0 to build; $99/yr Apple and $25 one-time Google to publish |

## Pricing math (for scale)

At $29.99/yr, after app-store fees (15% for small developers on Apple and Google subscriptions), each paying couple nets about $25/yr. 1,000 paying couples is about $25k/yr; 10,000 is about $250k/yr. At a 5% free-to-paid rate, 10,000 paying couples needs about 200,000 free couples. Costs stay near zero until accounts and sharing need a server.

## Validation (next 4–6 weeks)

1. Publish the prototype on GitHub Pages with live mic recording. (Recording is built; Pages needs to be switched on in repo settings.)
2. Add a waitlist and a 3-question feedback form after each check: *Did this match how you meant it? Did it match how your partner heard it? Would you use this again this week?*
3. Recruit 20–50 couples from relationship communities.
4. Success bar before building accounts: at least 60% say the result "mostly matched," and at least 30% use it again within a week.
5. Only then build accounts, sharing and payments.

## What the current prototype does

- **Check my tone:** records from the microphone or analyzes uploads, on the device. Tone tags, confidence, waveform with pitch, speaker vs listener view, tips, personal baseline.
- **Prep a talk:** builds a soft opening from feeling, situation and request; flags common blame phrases; rehearse it out loud with a tone goal.
- **Practice:** 6 drills with measurable goals (3 free, 3 Together). Slow replay compares two takes. Daily streak.
- **Progress:** weekly stats, tone mix, pace trend against baseline, history, and a shareable weekly card.
- **Our space:** partner invite text, Sunday check-in questions, sharing rules, delete everything.
- **Plans:** Free, Together, Gift a year, counselors and courses. Everything is free during the beta.
- **Installable:** add to home screen on phones; works offline after the first visit.
- Results (never audio) are saved only in the browser.

See `MONETIZATION.md` for revenue streams and growth loops.

Thresholds in `src/analysis.js` are first guesses and must be tuned on real, consented recordings.
