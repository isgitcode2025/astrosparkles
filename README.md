# AstroSparkles – white-label astrology platform

Website + REST API for an astrology consultation marketplace (chat/call with astrologers, wallet,
free kundli and Vedic tools, horoscope, panchang, poojas and courses). Built to be resold:
brand, colours, logo, payment and call keys are all configuration.

| Folder | What it is | Stack |
| --- | --- | --- |
| `api/` | REST API used by the website and mobile apps | NestJS, MongoDB, Redis |
| `web/` | Public website | Next.js 14, Tailwind CSS |
| `docs/` | OpenAPI spec + Postman collection for the Flutter team | generated |

## Requirements (Windows)

- Node.js 20 or newer
- Docker Desktop
- Git

## Run everything with Docker

```
copy api\.env.example api\.env
docker compose up --build
```

- Website: http://localhost:3000 (Hindi: http://localhost:3000/hi, brand guide: /brand)
- API: http://localhost:4000/api/v1/health
- API docs: http://localhost:4000/docs

## Run without Docker (faster reloads)

Start only the databases with Docker, then the apps with npm:

```
docker compose up mongo redis
cd api && copy .env.example .env && npm install && npm run start:dev
cd web && copy .env.example .env.local && npm install && npm run dev
```

## First-time data (development)

With the stack running, load sample data in a second terminal:

```
docker compose exec api npm run seed
```

This creates an admin account, 5 fictional sample astrologers and 5 sample poojas/courses
(edit their text, prices and photos before launch).

## Logging in during development

- OTP is **not** sent by SMS in development (`OTP_PROVIDER=console`). The code is always **123456**
  and is also printed in the API log.
- Admin test login: mobile **9000000001**, OTP **123456**.

## Razorpay

Without keys in `api/.env`, wallet recharges run in **test mode** (simulated, no money charged).
To use real Razorpay Checkout, add your **test** keys from the Razorpay Dashboard
(Settings → API Keys) to `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`, then restart the API.
For the webhook, point Razorpay to `https://<your-domain>/api/v1/payments/razorpay/webhook`
with events `payment.captured` and `order.paid`, and set `RAZORPAY_WEBHOOK_SECRET`.

## White-label a new client

Edit the `BRAND_*`, `RAZORPAY_*`, `AGORA_*` and `ASTRO_API_*` values in `api/.env`,
and replace the files in `web/public/brand/`. No code changes needed.

## Tests

```
cd api
npm test            # unit tests
npm run test:e2e    # end-to-end tests (needs MongoDB running)
```

## What's built so far

| Area | Website pages | API |
| --- | --- | --- |
| Home page (updated Stitch design) | `/`, `/hi` (live astrologers, zodiac strip, 12 free readings, consult by concern, poojas, live stats, FAQ) | `/astrologers/stats`, `/consultations/reviews/recent`, `/newsletter/subscribe` |
| Tarot | `/tarot` (free 3-card reading) | – |
| Join as astrologer | `/join-astrologer` (application form, status) | `/astrologers/apply`, `/astrologers/me/profile` |
| Brand & config | `/brand` | `/config/brand`, `/config/master`, `/config/public-keys` |
| Login & sign-up | `/login`, `/signup` (Stitch auth designs: mobile OTP, name/email on sign-up, Google button when `GOOGLE_CLIENT_IDS` is set) | `/auth/otp/send`, `/auth/otp/verify`, `/auth/google` |
| Profile | – | `/users/me` (get, update, delete) |
| Astrologers | `/astrologers` (filters, sort), `/astrologer/[slug]` (Stitch detail design: profile, follow/share, reviews with replies and rating breakdown, gifts, fee card) | list, profile, apply, presence, admin review, follow/unfollow, `/consultations/reviews/astrologer/{id}`, review reply, `/astrologers/{id}/gifts` |
| Wallet | `/wallet` (balance card, packs, GST, Razorpay, history) | balance, transactions, create-order, verify-payment, webhook |
| Chat consultations | Start chat on profile, `/consultation/[id]` (waiting, live chat, timer, end, review), `/consultations` (history) | request, accept, reject, cancel, end, messages, review, active, history |
| Astrologer dashboard | `/astro-dashboard` (online/offline, live requests, earnings, upcoming bookings with Start, weekly hours editor, history with review replies) | incoming, earnings, astrologer history, presence, `/astrologers/me/schedule` |
| Scheduled sessions | **Book Session** on the astrologer profile (date tabs, slot grid, pay from wallet), `/bookings` (join, cancel) | `/astrologers/{id}/slots`, `/bookings`, `/bookings/my`, `/bookings/astrologer`, `/bookings/{id}/cancel`, `/bookings/{id}/start` |
| Admin panel | `/admin` (overview and 14-day chart), `/admin/astrologers`, `/admin/users`, `/admin/consultations`, `/admin/bookings`, `/admin/payments`, `/admin/shop`, `/admin/reviews`, `/admin/horoscope`, `/admin/subscribers` | `/admin/*` (admin role) |
| Real-time | – | Socket.IO namespace `/realtime` (see `docs/README.md`) |
| Free kundli | `/free-kundli` (place search, North/South chart, planets, dasha, Mangal dosha) | `/astro/kundli`, `/places/search` |
| Kundli matching | `/kundli-matching` (guna milan out of 36, Mangal dosha for both) | `/astro/matching` |
| Panchang | `/panchang` (any city and date, choghadiya, Rahu kaal) | `/astro/panchang` |
| Horoscope | `/horoscope`, `/horoscope/[sign]` (daily/weekly/monthly, English/Hindi) | `/horoscope`, `/horoscope/{sign}` |
| Horoscope editor | `/admin/horoscope` (admin or editor role) | `/admin/horoscope` |
| Poojas & courses | `/shop`, `/shop/[slug]` (book pooja / buy course), `/shop/orders`, `/shop/my-courses`, `/shop/learn/[slug]` | `/shop/*`, admin `/admin/shop/*` (products, orders, pooja status, recording link, refund) |
| Calculators | `/calculators/numerology`, `/calculators/lo-shu-grid`, `/calculators/love` | `/calculators/*` (computed on our server, free) |

## Home page settings (white-label)

The header strip, app store buttons and footer social icons come from `api/.env`:

```
BRAND_SHORT_TAGLINE=Vedic Astrology & Live Consultations
BRAND_ANNOUNCEMENT=New here? Your first chat with any astrologer is free for 5 minutes.   # empty value hides the strip
BRAND_ANNOUNCEMENT_LABEL=Welcome offer
BRAND_APP_ANDROID_URL=          # empty shows "Coming soon"
BRAND_APP_IOS_URL=
BRAND_SOCIAL_FACEBOOK=          # empty icons are hidden
BRAND_SOCIAL_INSTAGRAM=
BRAND_SOCIAL_YOUTUBE=
BRAND_SOCIAL_X=
```

The logo mark is `web/public/brand/logo-mark.svg`. Home page photos are in `web/public/images/home/`
(stock images from the Stitch mockup; replace them with your own). The seed gives three sample astrologers
photos from `web/public/images/astrologers/`; real astrologers' photos come from their profiles. Colours (including the lighter and darker tints the
design uses) are worked out from the `BRAND_COLOR_*` values. Icons use Font Awesome Free (bundled, no CDN).

## Astrology data (Navamsha)

Kundli, matching and panchang come from the Navamsha API. Put the key in `api/.env` only
(never in `.env.example` or Git):

```
ASTRO_API_BASE_URL=https://api.navamsha.in/api/v1
ASTRO_API_KEY=your-key
```

Every identical request is cached in MongoDB for 30 days (`ASTRO_CACHE_DAYS`) to save credits.

To check the connection and save sample responses (used to fine-tune how results are shown):

```
docker compose exec api npm run astro:probe
```

The responses are written to `docs/navamsha-samples/`.

Birth places come from an offline city database (GeoNames data, CC BY 4.0, via the
`all-the-cities` package) with time zones from `geo-tz`, so no paid geocoding API is needed.
Add "Place data © GeoNames" to the site's credits page before launch.

## Admin panel

Log in with the admin number (**9000000001**, OTP 123456) and open **/admin** (also in the account menu → *Admin panel*).

- **Overview**: recharges, platform share, consultations, users, astrologers online, pooja/course sales, gifts, upcoming bookings and a 14-day chart. "Today" counts from midnight IST.
- **Astrologers**: review applications (approve with a commission %, or reject with a reason), edit commission, badges and listing weight, suspend or reinstate.
- **Users**: search by name, phone or email; credit or debit a wallet with a note (written to the ledger); block or unblock (a blocked account is signed out within 30 seconds and cannot log in); give the **editor** or **admin** role. The person must log out and in again for a new role to show.
- **Consultations, Bookings, Payments & ledger**: everything that happened, with filters.
- **Poojas & courses**: schedule pooja orders, mark them performed, add the recording link and a note (the devotee sees them in *My orders*), refund; edit the catalogue or add a new pooja/course.
- **Reviews**: hide abusive reviews (they leave the public pages and the rating) or restore them.
- **Horoscope**: the editor screen (editors only see this page).
- **Subscribers**: newsletter list with CSV export.

## Testing a chat locally

1. Open a normal browser window, log in as a sample astrologer: mobile **9000000101**, OTP 123456.
   Header → **Dashboard** → make sure the status is **Online**.
2. Open a private/incognito window, log in with any other mobile number.
   Go to **Astrologers** → *Acharya Devendra Joshi* → **CHAT**.
3. In the astrologer window, click **Accept**. Chat from both windows.
4. A new user's first chat is free for 5 minutes. After that the user needs wallet balance
   (in test mode, recharge on `/wallet` without real payment).

Voice and video calls show "Soon" until Agora is connected.

## Testing a scheduled session locally

1. Sample astrologers get weekly hours when you run the seed (Mon–Sat 10:00–13:00 and 17:00–21:00 IST, 30-minute slots).
   An astrologer can change them on **/astro-dashboard → Schedule**.
2. As a user with wallet balance, open an astrologer profile → **BOOK SESSION**, pick a day and time, and pay.
   The full price (chat rate × slot minutes) is taken from the wallet.
3. The booking shows on **/bookings** (user) and on the astrologer dashboard. Either side can press **Join / Start**
   from 5 minutes before the slot; the chat runs for the prepaid minutes and is not billed per minute.
4. Users can cancel up to 2 hours before the start; astrologers can cancel any time. Both refund in full.
   A booking nobody started is refunded automatically after its slot ends.

