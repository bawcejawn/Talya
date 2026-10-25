# Talya — Monetization and growth plan

Goal: reach scale at a low price, with near-zero running costs, without becoming a product that profits from conflict or from people's voices.

## Why the economics work

- **Each check costs us nothing.** Analysis runs on the user's device. There is no server audio, no paid AI API, and hosting is free on GitHub Pages.
- **One sale covers two people.** Every paying couple is two users, and each partner is a natural invite for the other.
- **Costs only start with accounts.** Linked partners and synced history need a database. Free tiers (Supabase or Firebase) cover the first few thousand couples.

## Revenue streams, in order of priority

| # | Stream | Price (draft) | When | Notes |
|---|---|---|---|---|
| 1 | **Together subscription** | $4.99/mo or $29.99/yr per couple | At launch | Unlimited checks, progress and trends, full drill library, linked partners, share card. |
| 2 | **Founding couples** | $19.99 first year | Pre-launch | Annual prepay. Brings in early cash and proves people will pay. |
| 3 | **Gift a year** | $29.99 | Launch, then push at Valentine's, wedding season and holidays | Engagement, wedding and anniversary gift. Reaches buyers who are not users yet. |
| 4 | **Guided programs** | $9.99–14.99 one-time | 2–3 months after launch | "30 days to calmer conversations," "Before the wedding," "New parents." Built from the drill engine. Also sold separately to non-subscribers. |
| 5 | **Course and church bundles** | ~$10–15 per couple, bulk codes | After accuracy is validated | Premarital courses, marriage ministries and relationship coaches buy codes for their couples. Low sales cost: one leader brings 10–50 couples. |
| 6 | **Counselor tier** | ~$20–40/mo per counselor | Later | Client-consented summaries between sessions. Needs a strong accuracy track record and a legal review. |

### Free tier (stays generous for growth)

3 checks a day, tone tags and tips, personal baseline, conversation prep, and 3 starter drills. Paid features are things that keep value over time (history, trends, streaks, programs), not the basic check.

## What we will not do

- No ads and no selling or sharing voice data, ever. This is a selling point; say it everywhere.
- No using customers' audio to train models without separate, explicit opt-in.
- No hidden affiliate payments for referring people to therapy or other services. If we ever add referrals, disclose them.
- No guilt or fear upsells ("Your relationship is at risk"). No features that score one partner against the other.
- No "dark pattern" cancellations. Cancel in two taps.

## Growth loops (all free)

1. **Partner invite.** Every user has a built-in reason to invite one more person. Track the invite rate.
2. **Weekly share card.** The Progress tab makes a card with your tone mix and streak, and no audio or partner data. Each share carries the link.
3. **Before/after clips.** Short videos of "how I said it" vs "how I meant it" suit TikTok, Instagram Reels and YouTube Shorts. Users can post their own; we post our own examples with actors.
4. **Search pages.** Free articles on GitHub Pages answering real searches: "how to start a hard conversation with your partner," "why does my partner say I sound angry," "repair attempts examples." Each one ends with "try the free tone check."
5. **Community seeding.** Recruiting post (see `RECRUITING.md`), then couples communities and premarital course leaders.
6. **Seasonal pushes.** Valentine's Day and wedding season for gift codes.

## Taking payments without monthly fees

- **Web (first):** Stripe Payment Links or Stripe Checkout. No monthly fee; Stripe takes a per-transaction fee (check the current rate at stripe.com/pricing). Lemon Squeezy or Paddle cost more per sale but handle sales tax for you.
- **Mobile app stores (later):** Apple and Google take 15% of subscriptions for small developers (check current terms). App-store rules on linking to web payments have been changing, so check them before launch.
- **License delivery with no server:** at first, payment pages can issue an unlock code. A real account system replaces this once linked partners ship.

## Numbers to watch

| Metric | What it tells us | Early target |
|---|---|---|
| Activation | Share who record a check **and** set a baseline on day 1 | 50% |
| Result accuracy | Share who say a result "mostly matched" | 60% |
| Week-1 return | Share who come back within 7 days | 30% |
| Partner invite rate | Users who copy or send an invite | 25% |
| Free to paid | Share of active couples who pay | 3–5% |
| Annual mix | Share of paid couples on yearly plans | 60%+ |

## Scale math

At $29.99/yr, after a 15% store fee, each paying couple nets about $25/yr.

| Paying couples | Yearly revenue | Free couples needed at 5% conversion |
|---|---|---|
| 1,000 | ~$25,000 | ~20,000 |
| 10,000 | ~$250,000 | ~200,000 |
| 50,000 | ~$1,250,000 | ~1,000,000 |

Gift codes, programs and bundles add revenue on top without extra free users. These are illustrations, not forecasts. The validation results decide whether any of it is realistic.

## Next money steps

1. Run the beta with 20–50 couples and measure accuracy and week-1 return.
2. Add a founding-couples payment link once at least 30% come back in week 1.
3. Write the first 3 search articles.
4. Approach 3 premarital course leaders with a free pilot for their next group.
