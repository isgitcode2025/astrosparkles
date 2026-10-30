/**
 * Development seed: an admin account and a few fictional, approved astrologers
 * so the website has data to show. Safe to run more than once.
 *
 *   npm run seed
 *
 * Admin login: phone 9000000001, OTP 123456 (console OTP provider).
 */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../src/app.module';
import { Astrologer, AstrologerStatus, Presence } from '../src/modules/astrologers/astrologer.schema';
import { Product, ProductType } from '../src/modules/shop/shop.schemas';
import { Role, User } from '../src/modules/users/user.schema';

// Sample photos live in the website's public folder (web/public/images/astrologers).
// They are AI-generated stock images from the Stitch mockup, for demo profiles only.
const WEB_URL = process.env.WEB_URL ?? 'http://localhost:3000';
const photo = (file: string) => `${WEB_URL}/images/astrologers/${file}`;

// Fictional sample profiles for local development only. Replace with real astrologers before launch.
/** Sample weekly hours for scheduled sessions: Mon–Sat 10:00–13:00 and 17:00–21:00 IST, 30-minute slots. */
const SAMPLE_SCHEDULE = {
  enabled: true,
  slotMinutes: 30,
  timezone: 'Asia/Kolkata',
  days: [1, 2, 3, 4, 5, 6].flatMap((day) => [
    { day, start: '10:00', end: '13:00' },
    { day, start: '17:00', end: '21:00' },
  ]),
};

const SAMPLE_ASTROLOGERS: Array<Record<string, any>> = [
  {
    phone: '+919000000101', displayName: 'Acharya Devendra Joshi', slug: 'acharya-devendra-joshi', avatarUrl: photo('acharya.jpg'), gender: 'male',
    expertise: ['vedic-astrology', 'prashna-kundli'], concerns: ['marriage', 'career'], languages: ['hi', 'en'],
    experienceYears: 18, rates: { chat: 30, call: 30, video: 45 }, presence: Presence.Online, badges: ['top-rated'],
    ratingAverage: 4.8, ratingCount: 64, consultationCount: 812, qualifications: ['Jyotish Acharya'],
    bioEn: 'Sample profile. Vedic astrologer focusing on marriage timing, career direction and Prashna (horary) questions.',
    bioHi: 'नमूना प्रोफ़ाइल। विवाह के समय, करियर और प्रश्न कुंडली पर केंद्रित वैदिक ज्योतिषी।',
  },
  {
    phone: '+919000000102', displayName: 'Meera Kulkarni', slug: 'meera-kulkarni', avatarUrl: photo('tarot-reader.jpg'), gender: 'female',
    expertise: ['tarot-reading', 'numerology'], concerns: ['love', 'career'], languages: ['en', 'hi', 'mr'],
    experienceYears: 7, rates: { chat: 18, call: 20, video: 0, chatOffer: 12 }, presence: Presence.Online, badges: ['new'],
    ratingAverage: 4.6, ratingCount: 22, consultationCount: 140, qualifications: ['Certified Tarot Reader'],
    bioEn: 'Sample profile. Tarot and numerology reader helping with relationship questions and career choices.',
    bioHi: 'नमूना प्रोफ़ाइल। प्रेम संबंध और करियर के प्रश्नों में टैरो और अंक ज्योतिष से मार्गदर्शन।',
  },
  {
    phone: '+919000000103', displayName: 'Pandit Raghunath Mishra', slug: 'pandit-raghunath-mishra', gender: 'male',
    expertise: ['vedic-astrology', 'lal-kitab', 'vastu'], concerns: ['business', 'health'], languages: ['hi', 'bho'],
    experienceYears: 25, rates: { chat: 50, call: 55, video: 70 }, presence: Presence.Busy, badges: ['celebrity'],
    ratingAverage: 4.9, ratingCount: 131, consultationCount: 2310, qualifications: ['Jyotish Shastri'],
    bioEn: 'Sample profile. Senior Vedic and Lal Kitab astrologer for business, property and family matters.',
    bioHi: 'नमूना प्रोफ़ाइल। व्यापार, संपत्ति और पारिवारिक विषयों के लिए वरिष्ठ वैदिक एवं लाल किताब ज्योतिषी।',
  },
  {
    phone: '+919000000104', displayName: 'Ananya Sen', slug: 'ananya-sen', avatarUrl: photo('vedic-astrologer.jpg'), gender: 'female',
    expertise: ['kp-astrology', 'palmistry'], concerns: ['love', 'marriage', 'education'], languages: ['bn', 'en', 'hi'],
    experienceYears: 9, rates: { chat: 22, call: 25, video: 35 }, presence: Presence.Offline, badges: [],
    ratingAverage: 4.5, ratingCount: 18, consultationCount: 205, qualifications: ['KP Jyotish Diploma'],
    bioEn: 'Sample profile. KP astrology and palmistry for relationships, marriage compatibility and studies.',
    bioHi: 'नमूना प्रोफ़ाइल। संबंध, विवाह मिलान और शिक्षा के लिए केपी ज्योतिष एवं हस्तरेखा।',
  },
  {
    phone: '+919000000105', displayName: 'Swami Harinandan', slug: 'swami-harinandan', gender: 'male',
    expertise: ['spiritual-healing', 'vedic-astrology'], concerns: ['health', 'career'], languages: ['hi'],
    experienceYears: 12, rates: { chat: 15, call: 15, video: 0 }, presence: Presence.Online, badges: [],
    ratingAverage: 4.3, ratingCount: 9, consultationCount: 98, qualifications: [],
    bioEn: 'Sample profile. Combines Vedic astrology with meditation and mantra guidance.',
    bioHi: 'नमूना प्रोफ़ाइल। वैदिक ज्योतिष के साथ ध्यान और मंत्र मार्गदर्शन।',
  },
];

// Sample shop items for local development. Edit prices, text and photos before launch.
const SAMPLE_PRODUCTS = [
  {
    type: ProductType.Pooja, slug: 'navgraha-shanti-pooja', title: 'Navgraha Shanti Pooja', titleHi: 'नवग्रह शांति पूजा', category: 'graha-shanti',
    summary: 'A pooja for all nine planets, performed online in your name by our purohits.',
    description: 'Recommended when several planets are weak or afflicted in the birth chart. Our purohit takes the sankalp with your name and gotra, performs the pooja on the chosen day and shares the recording with you.',
    price: 2100, mrp: 3100, durationMinutes: 45, performedBy: 'Verified purohits',
    includes: ['Sankalp in your name and gotra', 'Navgraha mantra jaap', 'Video recording shared after the pooja'],
  },
  {
    type: ProductType.Pooja, slug: 'mahalakshmi-pooja', title: 'Mahalakshmi Pooja', titleHi: 'महालक्ष्मी पूजा', category: 'prosperity',
    summary: 'For prosperity, steady income and harmony at home.',
    description: 'Performed on an auspicious muhurat with Shri Suktam path and Lakshmi mantra jaap. The recording is shared with you.',
    price: 1500, mrp: 2500, durationMinutes: 30, performedBy: 'Verified purohits',
    includes: ['Sankalp in your name', 'Shri Suktam path', 'Recording shared'],
  },
  {
    type: ProductType.Pooja, slug: 'mangal-dosha-shanti-pooja', title: 'Mangal Dosha Shanti Pooja', titleHi: 'मंगल दोष शांति पूजा', category: 'graha-shanti',
    summary: 'Remedy pooja for Mangal (Manglik) dosha before marriage.',
    description: 'A traditional remedy when Mangal dosha is present in the kundli. Ask an astrologer first if you are unsure whether you need it.',
    price: 2500, durationMinutes: 40, performedBy: 'Verified purohits',
    includes: ['Sankalp in your name', 'Mangal mantra jaap', 'Recording shared'],
  },
  {
    type: ProductType.Course, slug: 'vedic-astrology-basics', title: 'Vedic Astrology Basics', titleHi: 'वैदिक ज्योतिष की मूल बातें', category: 'vedic',
    summary: 'Learn to read a birth chart: signs, houses, planets and nakshatras.',
    description: 'A beginner course in simple Hindi and English. By the end you can read the main points of any kundli.',
    price: 999, mrp: 1999, language: 'Hindi + English', level: 'Beginner', instructor: 'AstroSparkles faculty',
    includes: ['Lifetime access', 'Lesson notes', 'Certificate of completion'],
    lessons: [
      { title: 'What a kundli shows', durationMinutes: 12, freePreview: true },
      { title: 'The 12 signs (rashis)', durationMinutes: 18 },
      { title: 'The 12 houses (bhavas)', durationMinutes: 20 },
      { title: 'The nine planets (grahas)', durationMinutes: 22 },
      { title: 'Nakshatras and dasha', durationMinutes: 25 },
    ],
  },
  {
    type: ProductType.Course, slug: 'numerology-foundation', title: 'Numerology Foundation', titleHi: 'अंक ज्योतिष', category: 'numerology',
    summary: 'Life path, destiny and Lo Shu grid explained step by step.',
    description: 'A short practical course to calculate and interpret the main numbers for yourself and others.',
    price: 699, language: 'Hindi', level: 'Beginner', instructor: 'AstroSparkles faculty',
    includes: ['Lifetime access', 'Practice sheets'],
    lessons: [
      { title: 'Introduction to numerology', durationMinutes: 10, freePreview: true },
      { title: 'Life path and birthday numbers', durationMinutes: 16 },
      { title: 'Name numbers', durationMinutes: 18 },
      { title: 'Lo Shu grid', durationMinutes: 20 },
    ],
  },
];

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const users = app.get<Model<User>>(getModelToken(User.name));
  const astrologers = app.get<Model<Astrologer>>(getModelToken(Astrologer.name));

  await users.updateOne(
    { phone: '+919000000001' },
    { $setOnInsert: { phone: '+919000000001', name: 'Platform Admin' }, $addToSet: { roles: { $each: [Role.User, Role.Admin] } } },
    { upsert: true },
  );

  let code = 1001;
  for (const s of SAMPLE_ASTROLOGERS) {
    const { phone, ...profile } = s;
    const user = await users.findOneAndUpdate(
      { phone },
      { $setOnInsert: { phone, name: profile.displayName, gender: profile.gender }, $addToSet: { roles: { $each: [Role.User, Role.Astrologer] } } },
      { upsert: true, new: true },
    );
    await astrologers.updateOne(
      { userId: user._id },
      { $set: { ...profile, status: AstrologerStatus.Approved, code: `KJ${code++}` } },
      { upsert: true },
    );
    // sample weekly hours, only for profiles that have none yet
    await astrologers.updateOne({ userId: user._id, 'schedule.days.0': { $exists: false } }, { $set: { schedule: SAMPLE_SCHEDULE } });
  }

  const products = app.get<Model<Product>>(getModelToken(Product.name));
  for (const p of SAMPLE_PRODUCTS) await products.updateOne({ slug: p.slug }, { $setOnInsert: p }, { upsert: true });
  // sample card labels for the home page (only when not set yet)
  const badges: Record<string, [string, string]> = {
    'mangal-dosha-shanti-pooja': ['Live Sankalp', 'लाइव संकल्प'],
    'mahalakshmi-pooja': ['Vedic Agni', 'वैदिक अग्नि'],
    'navgraha-shanti-pooja': ['Maha Anushthan', 'महा अनुष्ठान'],
  };
  for (const [slug, [badge, badgeHi]] of Object.entries(badges)) {
    await products.updateOne({ slug, badge: { $exists: false } }, { $set: { badge, badgeHi } });
  }
  // sample pooja photos from the Figma home design (only replaces an empty image or the old mockup photo)
  for (const slug of ['mangal-dosha-shanti-pooja', 'mahalakshmi-pooja', 'navgraha-shanti-pooja']) {
    await products.updateOne(
      { slug, $or: [{ images: { $size: 0 } }, { images: { $size: 1 }, 'images.0': { $regex: '/images/home/puja\\.jpg$' } }] },
      { $set: { images: [`${WEB_URL}/images/home/fig/pooja-${slug}.jpg`] } },
    );
  }

  console.log(`Seeded admin (9000000001), ${SAMPLE_ASTROLOGERS.length} sample astrologers and ${SAMPLE_PRODUCTS.length} sample poojas/courses.`);
  await app.close();
}
run();
