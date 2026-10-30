/**
 * Central configuration. Every client-specific value (brand, keys, contacts)
 * comes from environment variables so the same codebase can be resold
 * white-label. Later the brand block will also be editable from the admin panel.
 */
export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',

  mongo: { uri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/kundlijano' },
  redis: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },

  brand: {
    name: process.env.BRAND_NAME ?? 'AstroSparkles',
    tagline: process.env.BRAND_TAGLINE ?? 'Vedic astrology, kundli and live consultations',
    /** Short line under the logo in the header. */
    shortTagline: process.env.BRAND_SHORT_TAGLINE ?? 'Vedic Astrology & Live Consultations',
    logoUrl: process.env.BRAND_LOGO_URL ?? '/brand/logo.svg',
    logoMarkUrl: process.env.BRAND_LOGO_MARK_URL ?? '/brand/logo-mark.svg',
    colors: {
      primary: process.env.BRAND_COLOR_PRIMARY ?? '#3B1F6E',
      primaryDark: process.env.BRAND_COLOR_PRIMARY_DARK ?? '#24124A',
      accent: process.env.BRAND_COLOR_ACCENT ?? '#E8912D',
      gold: process.env.BRAND_COLOR_GOLD ?? '#D4A93C',
      background: process.env.BRAND_COLOR_BG ?? '#FFF9F0',
      text: process.env.BRAND_COLOR_TEXT ?? '#1E1630',
    },
    fonts: {
      heading: process.env.BRAND_FONT_HEADING ?? 'Poppins',
      body: process.env.BRAND_FONT_BODY ?? 'Mukta',
    },
    supportEmail: process.env.BRAND_SUPPORT_EMAIL ?? 'support@example.com',
    supportPhone: process.env.BRAND_SUPPORT_PHONE ?? '',
    whatsapp: process.env.BRAND_WHATSAPP ?? '',
    languages: (process.env.BRAND_LANGUAGES ?? 'en,hi').split(','),
    defaultLanguage: process.env.BRAND_DEFAULT_LANGUAGE ?? 'en',
    currency: process.env.BRAND_CURRENCY ?? 'INR',
    /** Optional strip above the header, e.g. a launch offer. Set to empty to hide it. */
    announcement: process.env.BRAND_ANNOUNCEMENT ?? 'New here? Your first chat with any astrologer is free for 5 minutes.',
    announcementLabel: process.env.BRAND_ANNOUNCEMENT_LABEL ?? 'Welcome offer',
    /** Store links for the app banner; empty shows "coming soon". */
    appLinks: {
      android: process.env.BRAND_APP_ANDROID_URL ?? '',
      ios: process.env.BRAND_APP_IOS_URL ?? '',
    },
    /** Social profiles shown in the footer; empty ones are hidden. */
    social: {
      facebook: process.env.BRAND_SOCIAL_FACEBOOK ?? '',
      instagram: process.env.BRAND_SOCIAL_INSTAGRAM ?? '',
      youtube: process.env.BRAND_SOCIAL_YOUTUBE ?? '',
      x: process.env.BRAND_SOCIAL_X ?? '',
    },
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
  },
  agora: {
    appId: process.env.AGORA_APP_ID ?? '',
    appCertificate: process.env.AGORA_APP_CERTIFICATE ?? '',
  },
  astrologyApi: {
    provider: process.env.ASTRO_API_PROVIDER ?? 'navamsha',
    baseUrl: process.env.ASTRO_API_BASE_URL || 'https://api.navamsha.in/api/v1',
    apiKey: process.env.ASTRO_API_KEY ?? '',
    ayanamsha: process.env.ASTRO_AYANAMSHA ?? 'lahiri',
    timeoutMs: parseInt(process.env.ASTRO_API_TIMEOUT_MS ?? '15000', 10),
    // identical requests are served from MongoDB for this many days (saves API credits)
    cacheDays: parseInt(process.env.ASTRO_CACHE_DAYS ?? '30', 10),
  },
  otp: {
    // 'console' prints the code in the API log (development); 'msg91' sends a real SMS
    provider: process.env.OTP_PROVIDER ?? 'console',
    devFixedCode: process.env.OTP_DEV_FIXED_CODE ?? '123456',
    length: 6,
    ttlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? '300', 10),
    maxAttempts: 5,
    msg91AuthKey: process.env.MSG91_AUTH_KEY ?? '',
    msg91TemplateId: process.env.MSG91_TEMPLATE_ID ?? '',
  },
  google: {
    // comma-separated OAuth client IDs (web, Android, iOS) accepted for Google sign-in
    clientIds: (process.env.GOOGLE_CLIENT_IDS ?? '').split(',').filter(Boolean),
  },
  wallet: {
    gstPercent: parseFloat(process.env.WALLET_GST_PERCENT ?? '18'),
    minRecharge: parseInt(process.env.WALLET_MIN_RECHARGE ?? '50', 10),
    maxRecharge: parseInt(process.env.WALLET_MAX_RECHARGE ?? '100000', 10),
    // recharge packs shown in the app: amount credited + optional bonus %
    packs: process.env.WALLET_PACKS ?? '100:0,200:0,500:5,1000:10,2000:10,5000:15',
  },
  consultation: {
    // first chat for a new user is free for this many minutes (0 disables)
    freeMinutes: parseInt(process.env.CONSULT_FREE_MINUTES ?? '5', 10),
    // user needs balance for at least this many minutes to start a paid consultation
    minBalanceMinutes: parseInt(process.env.CONSULT_MIN_BALANCE_MINUTES ?? '5', 10),
    // astrologer must accept within this time or the request is marked missed
    requestTimeoutSeconds: parseInt(process.env.CONSULT_REQUEST_TIMEOUT_SECONDS ?? '60', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  },
});
