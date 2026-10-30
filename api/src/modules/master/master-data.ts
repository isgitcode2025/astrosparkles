/**
 * Default reference data. Admin panel will manage these later; for now they ship as defaults
 * so web and mobile can build filters and forms against stable slugs.
 */
export const EXPERTISE = [
  { slug: 'vedic-astrology', en: 'Vedic Astrology', hi: 'वैदिक ज्योतिष' },
  { slug: 'kp-astrology', en: 'KP Astrology', hi: 'केपी ज्योतिष' },
  { slug: 'lal-kitab', en: 'Lal Kitab', hi: 'लाल किताब' },
  { slug: 'nadi-astrology', en: 'Nadi Astrology', hi: 'नाड़ी ज्योतिष' },
  { slug: 'prashna-kundli', en: 'Prashna Kundli', hi: 'प्रश्न कुंडली' },
  { slug: 'numerology', en: 'Numerology', hi: 'अंक ज्योतिष' },
  { slug: 'tarot-reading', en: 'Tarot Reading', hi: 'टैरो रीडिंग' },
  { slug: 'palmistry', en: 'Palmistry', hi: 'हस्तरेखा' },
  { slug: 'vastu', en: 'Vastu Shastra', hi: 'वास्तु शास्त्र' },
  { slug: 'face-reading', en: 'Face Reading', hi: 'मुख ज्योतिष' },
  { slug: 'spiritual-healing', en: 'Spiritual Healing', hi: 'आध्यात्मिक उपचार' },
] as const;

/** Life problems users pick on the home page; each maps to a set of skills. */
export const CONCERNS = [
  { slug: 'love', en: 'Love & Relationship', hi: 'प्रेम और रिश्ते' },
  { slug: 'marriage', en: 'Marriage', hi: 'विवाह' },
  { slug: 'career', en: 'Career & Job', hi: 'करियर और नौकरी' },
  { slug: 'business', en: 'Business & Money', hi: 'व्यापार और धन' },
  { slug: 'health', en: 'Health & Family', hi: 'स्वास्थ्य और परिवार' },
  { slug: 'education', en: 'Education', hi: 'शिक्षा' },
] as const;

export const LANGUAGES = [
  { code: 'hi', en: 'Hindi', hi: 'हिन्दी' },
  { code: 'en', en: 'English', hi: 'अंग्रेज़ी' },
  { code: 'bho', en: 'Bhojpuri', hi: 'भोजपुरी' },
  { code: 'bn', en: 'Bengali', hi: 'बांग्ला' },
  { code: 'mr', en: 'Marathi', hi: 'मराठी' },
  { code: 'gu', en: 'Gujarati', hi: 'गुजराती' },
  { code: 'pa', en: 'Punjabi', hi: 'पंजाबी' },
  { code: 'ta', en: 'Tamil', hi: 'तमिल' },
  { code: 'te', en: 'Telugu', hi: 'तेलुगु' },
  { code: 'kn', en: 'Kannada', hi: 'कन्नड़' },
] as const;

/** Gifts users can send to an astrologer from their wallet (price in rupees, GST included). */
export const GIFTS = [
  { slug: 'heart', en: 'Love Heart', hi: 'दिल', emoji: '❤️', price: 31 },
  { slug: 'rose', en: 'Red Rose', hi: 'गुलाब', emoji: '🌹', price: 41 },
  { slug: 'teddy', en: 'Teddy', hi: 'टेडी', emoji: '🧸', price: 61 },
  { slug: 'cookies', en: 'Cookies', hi: 'कुकीज़', emoji: '🍪', price: 71 },
  { slug: 'chocolate', en: 'Chocolate', hi: 'चॉकलेट', emoji: '🍫', price: 81 },
  { slug: 'cupcake', en: 'Cupcake', hi: 'कपकेक', emoji: '🧁', price: 101 },
  { slug: 'gift-box', en: 'Gift Box', hi: 'उपहार', emoji: '🎁', price: 121 },
  { slug: 'mug', en: 'Mug', hi: 'मग', emoji: '☕', price: 131 },
  { slug: 'diya', en: 'Diya', hi: 'दीया', emoji: '🪔', price: 141 },
  { slug: 'bouquet', en: 'Bouquet', hi: 'गुलदस्ता', emoji: '💐', price: 151 },
  { slug: 'rudraksh-mala', en: 'Rudraksh Mala', hi: 'रुद्राक्ष माला', emoji: '📿', price: 171 },
  { slug: 'shankh', en: 'Shankh', hi: 'शंख', emoji: '🐚', price: 181 },
  { slug: 'prasad', en: 'Prasad', hi: 'प्रसाद', emoji: '🍯', price: 201 },
  { slug: 'om', en: 'Om Blessing', hi: 'ॐ आशीर्वाद', emoji: '🕉️', price: 501 },
  { slug: 'dakshina', en: 'Dakshina', hi: 'दक्षिणा', emoji: '✨', price: 1001 },
] as const;

export const EXPERTISE_SLUGS = EXPERTISE.map((e) => e.slug) as string[];
export const CONCERN_SLUGS = CONCERNS.map((c) => c.slug) as string[];
export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code) as string[];
export const GIFT_SLUGS = GIFTS.map((g) => g.slug) as string[];
