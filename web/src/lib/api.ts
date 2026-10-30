import { API_URL } from "./brand";

export type ApiError = { code: string; message: string };
type Envelope<T> = { success: true; data: T } | { success: false; error: ApiError };

export class ApiRequestError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export const TOKEN_KEY = "kj_token";
const REASON_KEY = "kj_signout_reason";

/** Why the session ended; the login page shows a matching message. */
export type SignOutReason = "logout" | "expired" | "blocked";

/**
 * Client-side token storage (localStorage). Wrapped because storage can be unavailable.
 * Every change fires a "kj-session" event in this tab; other tabs see the browser's "storage" event.
 */
export const session = {
  get(): string | null {
    try {
      return typeof window === "undefined" ? null : window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.sessionStorage.removeItem(REASON_KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent("kj-session", { detail: { signedIn: true } }));
  },
  clear(reason: SignOutReason = "logout") {
    const had = session.get() !== null;
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.setItem(REASON_KEY, reason);
    } catch {
      /* ignore */
    }
    if (had) window.dispatchEvent(new CustomEvent("kj-session", { detail: { signedIn: false, reason } }));
  },
  /** Reads and forgets the last sign-out reason (for the login page banner). */
  takeReason(): SignOutReason | null {
    try {
      const r = window.sessionStorage.getItem(REASON_KEY) as SignOutReason | null;
      window.sessionStorage.removeItem(REASON_KEY);
      return r;
    } catch {
      return null;
    }
  },
};

/** Fetch from the API and unwrap { success, data }. Throws ApiRequestError with the API's message. */
export async function api<T>(
  path: string,
  init: RequestInit & { auth?: boolean; revalidate?: number } = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (init.auth) {
    const token = session.get();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
      ...(init.revalidate !== undefined ? { next: { revalidate: init.revalidate } } : {}),
    });
  } catch {
    throw new ApiRequestError(0, "NETWORK", "Could not reach the server. Please check your connection and try again.");
  }
  let body: Envelope<T> | null = null;
  try {
    body = (await res.json()) as Envelope<T>;
  } catch {
    /* non-JSON */
  }
  if (!res.ok || !body || body.success === false) {
    const err = body && body.success === false ? body.error : { code: "NETWORK", message: "Something went wrong" };
    if (init.auth && typeof window !== "undefined") {
      // the server no longer accepts this session: sign out everywhere at once
      if (res.status === 401) session.clear("expired");
      else if (res.status === 403 && /not active/i.test(err.message)) session.clear("blocked");
      else if (res.status === 403) window.dispatchEvent(new Event("kj-forbidden"));
    }
    throw new ApiRequestError(res.status, err.code, err.message);
  }
  return body.data;
}

// ---------- shared types ----------

export type Rates = { chat: number; call: number; video: number; chatOffer?: number; callOffer?: number; videoOffer?: number };

export type AstrologerCard = {
  id: string;
  slug: string;
  displayName: string;
  avatarUrl: string | null;
  gender?: string;
  expertise: string[];
  languages: string[];
  experienceYears: number;
  rates: Rates;
  badges: string[];
  presence: "online" | "busy" | "offline";
  rating: { average: number; count: number };
  consultationCount: number;
};

export type AstrologerProfile = AstrologerCard & {
  code?: string;
  bioEn: string;
  bioHi: string;
  concerns: string[];
  qualifications: string[];
  followerCount: number;
  verified: boolean;
};

export type Paged<T> = { items: T[]; page: number; limit: number; total: number; hasMore: boolean };

export type MasterItem = { slug: string; en: string; hi: string };
export type GiftItem = { slug: string; en: string; hi: string; emoji: string; price: number };
export type Master = { expertise: MasterItem[]; concerns: MasterItem[]; languages: { code: string; en: string; hi: string }[]; gifts?: GiftItem[] };

export type PublicReviewItem = {
  id: string;
  name: string;
  rating: number;
  comment: string | null;
  mode: "chat" | "call" | "video";
  createdAt: string;
  reply: string | null;
  repliedAt: string | null;
};
export type AstrologerReviews = Paged<PublicReviewItem> & {
  summary: { average: number; count: number; breakdown: Record<string, number>; consultationsLast7Days: number };
};

export type Me = {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  walletBalance: number;
  freeConsultationAvailable: boolean;
  profileComplete: boolean;
  roles: string[];
};

export type Consultation = {
  id: string;
  userId: string;
  astrologerId: string;
  astrologerUserId: string;
  userName?: string;
  astrologerName: string;
  mode: "chat" | "call" | "video";
  status: "requested" | "active" | "completed" | "rejected" | "missed" | "cancelled";
  ratePerMin: number;
  freeMinutes: number;
  maxMinutes: number;
  requestedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  endReason: string | null;
  billedMinutes: number;
  amount: number;
  astrologerEarning: number;
  intake: {
    name?: string;
    gender?: string;
    topic?: string;
    birth?: { dateOfBirth?: string; timeOfBirth?: string; place?: string };
  } | null;
  review: { rating: number; comment?: string; reply?: string | null } | null;
  myRole?: "user" | "astrologer";
  prepaid?: boolean;
  bookingId?: string | null;
};

export type ChatMessage = {
  id: string;
  consultationId: string;
  sender: "user" | "astrologer" | "system";
  text: string;
  clientId: string | null;
  createdAt: string;
};

export type ProductCard = {
  id: string;
  type: "pooja" | "course";
  slug: string;
  title: string;
  titleHi: string | null;
  summary: string;
  image: string | null;
  category: string | null;
  badge: string | null;
  badgeHi: string | null;
  price: number;
  mrp: number | null;
  discountPercent: number;
  durationMinutes: number | null;
  language: string | null;
  level: string | null;
  lessonCount: number;
};

export type ProductDetail = ProductCard & {
  description: string;
  images: string[];
  includes: string[];
  performedBy: string | null;
  instructor: string | null;
  lessons: { id: string; title: string; durationMinutes: number; freePreview: boolean; videoUrl: string | null }[];
  enrolled: boolean;
};

export type ShopOrder = {
  id: string;
  orderNumber: string;
  type: "pooja" | "course";
  title: string;
  amount: number;
  status: "paid" | "cancelled" | "refunded";
  pooja: {
    sankalpName: string;
    gotra?: string;
    preferredDate?: string;
    wishes?: string;
    status: "scheduled" | "performed";
    scheduledAt?: string;
    performedAt?: string;
    recordingUrl?: string;
    noteToUser?: string;
  } | null;
  createdAt: string;
};

// ---------- scheduled sessions ----------

export type Slot = { start: string; end: string; available: boolean };
export type SlotDay = { date: string; weekday: number; slots: Slot[] };
export type SlotsResponse = {
  astrologerId: string;
  enabled: boolean;
  slotMinutes: number;
  timezone: string;
  ratePerMin: number;
  price: number;
  days: SlotDay[];
};
export type Booking = {
  id: string;
  astrologerId: string;
  astrologerName: string;
  userName: string;
  mode: "chat";
  start: string;
  end: string;
  minutes: number;
  ratePerMin: number;
  amount: number;
  astrologerEarning: number;
  status: "confirmed" | "started" | "completed" | "cancelled" | "expired";
  topic: string | null;
  consultationId: string | null;
  cancelledBy: "user" | "astrologer" | "system" | null;
  refunded: number;
  canJoin: boolean;
  canCancel: boolean;
};
export type WeeklySchedule = {
  enabled: boolean;
  slotMinutes: 15 | 30 | 45 | 60;
  timezone: string;
  days: { day: number; start: string; end: string }[];
};

export const fmtSlotTime = (iso: string, tz = "Asia/Kolkata") =>
  new Date(iso).toLocaleTimeString("en-IN", { timeZone: tz, hour: "numeric", minute: "2-digit" });
export const fmtSlotDate = (iso: string, tz = "Asia/Kolkata") =>
  new Date(iso).toLocaleDateString("en-IN", { timeZone: tz, weekday: "short", day: "numeric", month: "short" });
