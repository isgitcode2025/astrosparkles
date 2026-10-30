import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection } from 'mongoose';
import * as request from 'supertest';
import * as fixture from './fixtures/navamsha-kundli.json';
import { io, Socket } from 'socket.io-client';
import { AppModule } from './../src/app.module';
import { AllExceptionsFilter } from '../src/common/http-exception.filter';
import { ConsultationsService } from '../src/modules/consultations/consultations.service';
import { ResponseInterceptor } from '../src/common/response.interceptor';

/**
 * End-to-end tests against a real MongoDB (MONGO_URI). Uses a separate database
 * that is dropped before the run. Razorpay runs in mock mode (no keys).
 */
describe('AstroSparkles API (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let baseUrl: string;
  const sockets: Socket[] = [];

  /** Connects to the realtime gateway and records every event it receives. */
  const connect = (token: string) =>
    new Promise<{ socket: Socket; events: { name: string; data: any }[] }>((resolve, reject) => {
      const socket = io(`${baseUrl.replace('[::1]', 'localhost')}/realtime`, { auth: { token }, transports: ['websocket'], forceNew: true });
      const events: { name: string; data: any }[] = [];
      socket.onAny((name, data) => events.push({ name, data }));
      socket.on('connect', () => resolve({ socket, events }));
      socket.on('connect_error', reject);
      sockets.push(socket);
    });
  const waitFor = async (events: { name: string; data: any }[], pred: (e: { name: string; data: any }) => boolean, ms = 3000) => {
    const start = Date.now();
    while (Date.now() - start < ms) {
      const hit = events.find(pred);
      if (hit) return hit;
      await new Promise((r) => setTimeout(r, 25));
    }
    throw new Error('event not received');
  };

  const login = async (phone: string) => {
    await http.post('/api/v1/auth/otp/send').send({ phone }).expect(200);
    const res = await http.post('/api/v1/auth/otp/verify').send({ phone, code: '123456' }).expect(200);
    return res.body.data.accessToken as string;
  };

  beforeAll(async () => {
    process.env.MONGO_URI = (process.env.MONGO_URI ?? 'mongodb://localhost:27017/kundlijano').replace(/\/[^/]*$/, '/kundlijano_e2e');
    process.env.RAZORPAY_KEY_ID = '';
    process.env.RAZORPAY_KEY_SECRET = '';
    process.env.OTP_PROVIDER = 'console';
    process.env.ASTRO_API_KEY = 'test-key';
    process.env.ASTRO_API_BASE_URL = 'https://astro.test/api/v1';
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication({ logger: ['error'] });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.listen(0);
    baseUrl = await app.getUrl();
    await app.get<Connection>(getConnectionToken()).dropDatabase();
    http = request(app.getHttpServer());
  });

  afterAll(async () => {
    sockets.forEach((s) => s.disconnect());
    await app.close();
  });

  describe('config', () => {
    it('returns brand and master data', async () => {
      const brand = await http.get('/api/v1/config/brand').expect(200);
      expect(brand.body.data.name).toBeDefined();
      const master = await http.get('/api/v1/config/master').expect(200);
      expect(master.body.data.expertise.length).toBeGreaterThan(5);
    });

    it('reports mongo connected', async () => {
      const res = await http.get('/api/v1/health').expect(200);
      expect(res.body.data.mongo).toBe('connected');
    });
  });

  describe('auth', () => {
    it('rejects an invalid phone number', async () => {
      const res = await http.post('/api/v1/auth/otp/send').send({ phone: '12345' }).expect(400);
      expect(res.body.success).toBe(false);
    });

    it('rejects a wrong OTP and accepts the right one', async () => {
      await http.post('/api/v1/auth/otp/send').send({ phone: '9811111111' }).expect(200);
      const wrong = await http.post('/api/v1/auth/otp/verify').send({ phone: '9811111111', code: '000000' }).expect(400);
      expect(wrong.body.error.message).toMatch(/Incorrect OTP/);
      const ok = await http.post('/api/v1/auth/otp/verify').send({ phone: '+91 98111 11111', code: '123456' }).expect(200);
      expect(ok.body.data.isNewUser).toBe(true);
      expect(ok.body.data.user.phone).toBe('+919811111111');
    });

    it('blocks a quick resend', async () => {
      await http.post('/api/v1/auth/otp/send').send({ phone: '9822222222' }).expect(200);
      await http.post('/api/v1/auth/otp/send').send({ phone: '9822222222' }).expect(429);
    });

    it('protects /users/me and lets the user update birth details', async () => {
      await http.get('/api/v1/users/me').expect(401);
      const token = await login('9833333333');
      const res = await http
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test User', birth: { dateOfBirth: '1990-01-15', timeOfBirth: '08:30', place: 'Indore' } })
        .expect(200);
      expect(res.body.data.profileComplete).toBe(true);
      await http.patch('/api/v1/users/me').set('Authorization', `Bearer ${token}`).send({ birth: { timeOfBirth: '25:00' } }).expect(400);
    });
  });

  describe('astrologers', () => {
    let userToken: string;
    let adminToken: string;
    let applicationId: string;

    beforeAll(async () => {
      userToken = await login('9844444444');
      // make an admin directly in the database, then issue a token carrying the admin role
      const conn = app.get<Connection>(getConnectionToken());
      await login('9855555555');
      await conn.collection('users').updateOne({ phone: '+919855555555' }, { $addToSet: { roles: 'admin' } });
      const admin = await conn.collection('users').findOne({ phone: '+919855555555' });
      adminToken = await app.get(JwtService).signAsync({ sub: String(admin?._id), roles: admin?.roles });
    });

    it('lets a user apply, then admin approves, then the profile is public', async () => {
      const apply = await http
        .post('/api/v1/astrologers/apply')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          displayName: 'Test Acharya',
          gender: 'male',
          bioEn: 'A test biography that is long enough to pass the fifty character minimum rule.',
          expertise: ['vedic-astrology'],
          concerns: ['career'],
          languages: ['hi'],
          experienceYears: 10,
          rates: { chat: 20, call: 25 },
        })
        .expect(201);
      applicationId = apply.body.data.id;
      expect(apply.body.data.status).toBe('pending');

      await http.get('/api/v1/astrologers/test-acharya').expect(404);
      await http.patch(`/api/v1/admin/astrologers/${applicationId}/review`).set('Authorization', `Bearer ${userToken}`).send({ decision: 'approve' }).expect(403);

      const review = await http
        .patch(`/api/v1/admin/astrologers/${applicationId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'approve', commissionPercent: 40 })
        .expect(200);
      expect(review.body.data.code).toMatch(/^KJ\d+/);

      const profile = await http.get('/api/v1/astrologers/test-acharya').expect(200);
      expect(profile.body.data.displayName).toBe('Test Acharya');
      expect(profile.body.data.verified).toBe(true);
    });

    it('lists with filters', async () => {
      const all = await http.get('/api/v1/astrologers?languages=hi&mode=chat').expect(200);
      expect(all.body.data.total).toBe(1);
      const none = await http.get('/api/v1/astrologers?expertise=tarot-reading').expect(200);
      expect(none.body.data.total).toBe(0);
      await http.get('/api/v1/astrologers?expertise=not-a-skill').expect(400);
    });
  });

  describe('wallet (mock Razorpay)', () => {
    let token: string;

    beforeAll(async () => {
      token = await login('9866666666');
    });

    it('shows packs with GST and bonus', async () => {
      const res = await http.get('/api/v1/wallet/recharge-settings').expect(200);
      expect(res.body.data.mockMode).toBe(true);
      const pack500 = res.body.data.packs.find((p: { amount: number }) => p.amount === 500);
      expect(pack500).toMatchObject({ amount: 500, bonusPercent: 5, bonus: 25, gst: 90, total: 590 });
    });

    it('recharges once even if verify is called twice', async () => {
      const order = await http.post('/api/v1/wallet/create-order').set('Authorization', `Bearer ${token}`).send({ amount: 500 }).expect(201);
      expect(order.body.data.amountPaise).toBe(59000);
      const body = { orderId: order.body.data.orderId, paymentId: 'pay_mock_1', signature: 'mock' };

      const first = await http.post('/api/v1/wallet/verify-payment').set('Authorization', `Bearer ${token}`).send(body).expect(200);
      expect(first.body.data.balance).toBe(525);
      const second = await http.post('/api/v1/wallet/verify-payment').set('Authorization', `Bearer ${token}`).send(body).expect(200);
      expect(second.body.data.alreadyProcessed).toBe(true);
      expect(second.body.data.balance).toBe(525);

      const txns = await http.get('/api/v1/wallet/transactions').set('Authorization', `Bearer ${token}`).expect(200);
      expect(txns.body.data.items.map((t: { reason: string }) => t.reason).sort()).toEqual(['bonus', 'recharge']);
    });

    it('rejects amounts below the minimum and bad signatures', async () => {
      await http.post('/api/v1/wallet/create-order').set('Authorization', `Bearer ${token}`).send({ amount: 10 }).expect(400);
      const order = await http.post('/api/v1/wallet/create-order').set('Authorization', `Bearer ${token}`).send({ amount: 100 }).expect(201);
      await http
        .post('/api/v1/wallet/verify-payment')
        .set('Authorization', `Bearer ${token}`)
        .send({ orderId: order.body.data.orderId, paymentId: 'x', signature: 'forged' })
        .expect(401);
    });
  });

  describe('consultations (chat)', () => {
    let astroToken: string;
    let astroId: string;
    let userToken: string;
    let userSock: Awaited<ReturnType<typeof connect>>;
    let astroSock: Awaited<ReturnType<typeof connect>>;

    beforeAll(async () => {
      const conn = app.get<Connection>(getConnectionToken());
      const astro = await conn.collection('astrologers').findOne({ slug: 'test-acharya' });
      astroId = String(astro?._id);
      const astroUser = await conn.collection('users').findOne({ _id: astro?.userId });
      astroToken = await app.get(JwtService).signAsync({ sub: String(astroUser?._id), roles: astroUser?.roles });
      userToken = await login('9877777777');
      userSock = await connect(userToken);
      astroSock = await connect(astroToken);
    });

    const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

    it('refuses when the astrologer is offline', async () => {
      const res = await http.post('/api/v1/consultations/request').set(auth(userToken)).send({ astrologerId: astroId, mode: 'chat' }).expect(409);
      expect(res.body.error.message).toMatch(/offline/);
    });

    it('runs a free first chat end to end over sockets', async () => {
      await http.patch('/api/v1/astrologers/me/presence').set(auth(astroToken)).send({ presence: 'online' }).expect(200);

      const req = await http.post('/api/v1/consultations/request').set(auth(userToken)).send({ astrologerId: astroId, mode: 'chat' }).expect(201);
      const id = req.body.data.id;
      expect(req.body.data.freeMinutes).toBe(5);
      await waitFor(astroSock.events, (e) => e.name === 'consultation:updated' && e.data.id === id && e.data.status === 'requested');

      await http.post(`/api/v1/consultations/${id}/accept`).set(auth(userToken)).expect(403);
      await http.post(`/api/v1/consultations/${id}/accept`).set(auth(astroToken)).expect(200);
      await waitFor(userSock.events, (e) => e.name === 'consultation:updated' && e.data.status === 'active');

      const profile = await http.get('/api/v1/astrologers/test-acharya').expect(200);
      expect(profile.body.data.presence).toBe('busy');

      const joinU: any = await userSock.socket.emitWithAck('consultation:join', { consultationId: id });
      const joinA: any = await astroSock.socket.emitWithAck('consultation:join', { consultationId: id });
      expect(joinU.ok && joinA.ok).toBe(true);

      const sent: any = await userSock.socket.emitWithAck('message:send', { consultationId: id, text: 'Namaste', clientId: 'c1' });
      expect(sent.ok).toBe(true);
      await waitFor(astroSock.events, (e) => e.name === 'message:new' && e.data.text === 'Namaste');

      const outsider = await connect(await login('9888888888'));
      const denied: any = await outsider.socket.emitWithAck('consultation:join', { consultationId: id });
      expect(denied.ok).toBe(false);

      const end = await http.post(`/api/v1/consultations/${id}/end`).set(auth(userToken)).send({}).expect(200);
      expect(end.body.data).toMatchObject({ status: 'completed', billedMinutes: 1, amount: 0 });
      await http.post(`/api/v1/consultations/${id}/end`).set(auth(astroToken)).send({}).expect(400);

      const msgs = await http.get(`/api/v1/consultations/${id}/messages`).set(auth(userToken)).expect(200);
      expect(msgs.body.data.map((m: any) => m.sender)).toEqual(['system', 'user', 'system']);

      const me = await http.get('/api/v1/users/me').set(auth(userToken)).expect(200);
      expect(me.body.data.freeConsultationAvailable).toBe(false);
    });

    it('needs balance for a paid chat, then bills per minute and pays the astrologer after commission', async () => {
      const low = await http.post('/api/v1/consultations/request').set(auth(userToken)).send({ astrologerId: astroId, mode: 'chat' }).expect(400);
      expect(low.body.error.message).toMatch(/Minimum balance/);

      const order = await http.post('/api/v1/wallet/create-order').set(auth(userToken)).send({ amount: 500 }).expect(201);
      await http.post('/api/v1/wallet/verify-payment').set(auth(userToken)).send({ orderId: order.body.data.orderId, paymentId: 'p', signature: 'mock' }).expect(200);

      const req = await http.post('/api/v1/consultations/request').set(auth(userToken)).send({ astrologerId: astroId, mode: 'chat' }).expect(201);
      const id = req.body.data.id;
      expect(req.body.data).toMatchObject({ freeMinutes: 0, ratePerMin: 20, maxMinutes: 26 });
      await http.post('/api/v1/consultations/request').set(auth(userToken)).send({ astrologerId: astroId, mode: 'chat' }).expect(409);

      await http.post(`/api/v1/consultations/${id}/accept`).set(auth(astroToken)).expect(200);
      const end = await http.post(`/api/v1/consultations/${id}/end`).set(auth(astroToken)).send({}).expect(200);
      expect(end.body.data).toMatchObject({ billedMinutes: 1, amount: 20, astrologerEarning: 12 });

      const bal = await http.get('/api/v1/wallet/balance').set(auth(userToken)).expect(200);
      expect(bal.body.data.balance).toBe(505);

      await http.post(`/api/v1/consultations/${id}/review`).set(auth(userToken)).send({ rating: 4, comment: 'Helpful' }).expect(201);
      await http.post(`/api/v1/consultations/${id}/review`).set(auth(userToken)).send({ rating: 5 }).expect(409);
      const profile = await http.get('/api/v1/astrologers/test-acharya').expect(200);
      expect(profile.body.data.rating).toEqual({ average: 4, count: 1 });
      const recent = await http.get('/api/v1/consultations/reviews/recent').expect(200);
      expect(recent.body.data[0]).toMatchObject({ rating: 4, comment: 'Helpful', astrologerName: expect.any(String) });
      expect(recent.body.data[0]).not.toHaveProperty('userId');
      expect(profile.body.data.presence).toBe('online');

      const earn = await http.get('/api/v1/consultations/astrologer/earnings').set(auth(astroToken)).expect(200);
      expect(earn.body.data.allTime).toMatchObject({ consultations: 2, earning: 12 });

      const hist = await http.get('/api/v1/consultations/my').set(auth(userToken)).expect(200);
      expect(hist.body.data.total).toBe(2);
    });

    it('shows reviews with breakdown and the astrologer reply, follow, and wallet gifts', async () => {
      const hist = await http.get('/api/v1/consultations/my').set(auth(userToken)).expect(200);
      const reviewed = hist.body.data.items.find((c: any) => c.review);
      await http.post(`/api/v1/consultations/${reviewed.id}/review/reply`).set(auth(userToken)).send({ text: 'Thanks!' }).expect(403);
      await http.post(`/api/v1/consultations/${reviewed.id}/review/reply`).set(auth(astroToken)).send({ text: 'Thank you, all the best!' }).expect(201);
      await http.post(`/api/v1/consultations/${reviewed.id}/review/reply`).set(auth(astroToken)).send({ text: 'Again' }).expect(409);

      const rev = await http.get(`/api/v1/consultations/reviews/astrologer/${astroId}?filter=all`).expect(200);
      expect(rev.body.data.summary).toMatchObject({ average: 4, count: 1, breakdown: { '4': 1, '5': 0 }, consultationsLast7Days: 2 });
      expect(rev.body.data.items[0]).toMatchObject({ rating: 4, comment: 'Helpful', reply: 'Thank you, all the best!' });
      expect(rev.body.data.items[0].name).toMatch(/…$/);
      const five = await http.get(`/api/v1/consultations/reviews/astrologer/${astroId}?filter=5`).expect(200);
      expect(five.body.data.total).toBe(0);

      await http.post(`/api/v1/astrologers/${astroId}/follow`).set(auth(userToken)).expect(201);
      const f = await http.post(`/api/v1/astrologers/${astroId}/follow`).set(auth(userToken)).expect(201);
      expect(f.body.data).toEqual({ following: true, followerCount: 1 });
      const u = await http.delete(`/api/v1/astrologers/${astroId}/follow`).set(auth(userToken)).expect(200);
      expect(u.body.data).toEqual({ following: false, followerCount: 0 });

      const master = await http.get('/api/v1/config/master').expect(200);
      expect(master.body.data.gifts.find((g: any) => g.slug === 'rose').price).toBe(41);
      const g = await http.post(`/api/v1/astrologers/${astroId}/gifts`).set(auth(userToken)).send({ gift: 'rose' }).expect(201);
      expect(g.body.data).toMatchObject({ amount: 41, balance: 464 });
      await http.post(`/api/v1/astrologers/${astroId}/gifts`).set(auth(userToken)).send({ gift: 'dakshina' }).expect(400);
      await http.post(`/api/v1/astrologers/${astroId}/gifts`).set(auth(astroToken)).send({ gift: 'rose' }).expect(400);
      const earn = await http.get('/api/v1/consultations/astrologer/earnings').set(auth(astroToken)).expect(200);
      expect(earn.body.data.allTime).toMatchObject({ gifts: 1, giftEarning: 24.6 });

      // put the balance back so the later billing tests see the same numbers
      await app.get<Connection>(getConnectionToken()).collection('users').updateOne({ phone: '+919877777777' }, { $inc: { walletBalancePaise: 4100 } });
    });

    it('lets the astrologer reject and the user cancel', async () => {
      const r1 = await http.post('/api/v1/consultations/request').set(auth(userToken)).send({ astrologerId: astroId, mode: 'chat' }).expect(201);
      await http.post(`/api/v1/consultations/${r1.body.data.id}/reject`).set(auth(astroToken)).expect(200);
      const r2 = await http.post('/api/v1/consultations/request').set(auth(userToken)).send({ astrologerId: astroId, mode: 'chat' }).expect(201);
      const c = await http.post(`/api/v1/consultations/${r2.body.data.id}/cancel`).set(auth(userToken)).expect(200);
      expect(c.body.data.status).toBe('cancelled');
      const active = await http.get('/api/v1/consultations/active').set(auth(userToken)).expect(200);
      expect(active.body.data).toBeNull();
    });
    it('marks unanswered requests missed and ends sessions when the balance runs out', async () => {
      const conn = app.get<Connection>(getConnectionToken());
      const svc = app.get(ConsultationsService);

      const r = await http.post('/api/v1/consultations/request').set(auth(userToken)).send({ astrologerId: astroId, mode: 'chat' }).expect(201);
      await conn.collection('consultations').updateOne({ _id: new (require('mongoose').Types.ObjectId)(r.body.data.id) }, { $set: { requestedAt: new Date(Date.now() - 120_000) } });
      await svc.sweep();
      const missed = await http.get(`/api/v1/consultations/${r.body.data.id}`).set(auth(userToken)).expect(200);
      expect(missed.body.data.status).toBe('missed');

      const r2 = await http.post('/api/v1/consultations/request').set(auth(userToken)).send({ astrologerId: astroId, mode: 'chat' }).expect(201);
      const id = r2.body.data.id;
      await http.post(`/api/v1/consultations/${id}/accept`).set(auth(astroToken)).expect(200);
      const max = r2.body.data.maxMinutes; // 505 / 20 = 25 minutes
      await conn.collection('consultations').updateOne({ _id: new (require('mongoose').Types.ObjectId)(id) }, { $set: { startedAt: new Date(Date.now() - (max + 1) * 60_000) } });
      await svc.sweep();
      const ended = await http.get(`/api/v1/consultations/${id}`).set(auth(userToken)).expect(200);
      expect(ended.body.data).toMatchObject({ status: 'completed', endReason: 'balance_exhausted', billedMinutes: max, amount: max * 20 });
      const bal = await http.get('/api/v1/wallet/balance').set(auth(userToken)).expect(200);
      expect(bal.body.data.balance).toBe(505 - max * 20);
    });
  });

  describe('scheduled sessions (slot booking)', () => {
    let astroToken: string;
    let astroId: string;
    let userToken: string;
    let poorToken: string;
    const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
    const oid = (id: string) => new (require('mongoose').Types.ObjectId)(id);
    const balance = async (t: string) => (await http.get('/api/v1/wallet/balance').set(auth(t)).expect(200)).body.data.balance;
    const firstFree = async (skip = 0) => {
      const res = await http.get(`/api/v1/astrologers/${astroId}/slots?days=3`).expect(200);
      return res.body.data.days.flatMap((d: any) => d.slots).filter((x: any) => x.available)[skip].start as string;
    };

    beforeAll(async () => {
      const conn = app.get<Connection>(getConnectionToken());
      const astro = await conn.collection('astrologers').findOne({ slug: 'test-acharya' });
      astroId = String(astro?._id);
      const astroUser = await conn.collection('users').findOne({ _id: astro?.userId });
      astroToken = await app.get(JwtService).signAsync({ sub: String(astroUser?._id), roles: astroUser?.roles });
      userToken = await login('9811111101');
      poorToken = await login('9811111102');
      await conn.collection('users').updateOne({ phone: '+919811111101' }, { $set: { walletBalancePaise: 100000 } });
    });

    it('lets an astrologer set weekly hours and validates them', async () => {
      const off = await http.get(`/api/v1/astrologers/${astroId}/slots`).expect(200);
      expect(off.body.data.enabled).toBe(false);
      await http.get('/api/v1/astrologers/me/schedule').set(auth(userToken)).expect(403);
      await http.put('/api/v1/astrologers/me/schedule').set(auth(astroToken)).send({ enabled: true, slotMinutes: 30, days: [{ day: 1, start: '10:00', end: '10:20' }] }).expect(400);
      await http
        .put('/api/v1/astrologers/me/schedule')
        .set(auth(astroToken))
        .send({ enabled: true, slotMinutes: 30, days: [{ day: 1, start: '10:00', end: '12:00' }, { day: 1, start: '11:00', end: '13:00' }] })
        .expect(400);
      await http.put('/api/v1/astrologers/me/schedule').set(auth(astroToken)).send({ enabled: true, slotMinutes: 30, days: [{ day: 1, start: '25:00', end: '26:00' }] }).expect(400);
      const days = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, start: '00:00', end: '23:30' }));
      const put = await http.put('/api/v1/astrologers/me/schedule').set(auth(astroToken)).send({ enabled: true, slotMinutes: 30, days }).expect(200);
      expect(put.body.data).toMatchObject({ enabled: true, slotMinutes: 30, timezone: 'Asia/Kolkata' });
      const got = await http.get('/api/v1/astrologers/me/schedule').set(auth(astroToken)).expect(200);
      expect(got.body.data.days).toHaveLength(7);

      const slots = await http.get(`/api/v1/astrologers/${astroId}/slots?days=2`).expect(200);
      expect(slots.body.data).toMatchObject({ enabled: true, slotMinutes: 30, ratePerMin: 20, price: 600 });
      expect(slots.body.data.days).toHaveLength(2);
      const all = slots.body.data.days.flatMap((d: any) => d.slots);
      expect(all.length).toBeGreaterThan(40);
      // nothing inside the next 30 minutes is bookable
      for (const x of all) if (new Date(x.start).getTime() - Date.now() < 29 * 60_000) expect(x.available).toBe(false);
      await http.get(`/api/v1/astrologers/${astroId}/slots?days=20`).expect(400);
    });

    it('books a slot from the wallet, blocks double booking, and refunds a cancel', async () => {
      const start = await firstFree();
      const short = await http.post('/api/v1/bookings').set(auth(poorToken)).send({ astrologerId: astroId, start }).expect(400);
      expect(short.body.error.message).toMatch(/Insufficient/);
      await http.post('/api/v1/bookings').set(auth(userToken)).send({ astrologerId: astroId, start: new Date(Date.now() + 3600_000 + 7 * 60_000).toISOString() }).expect(400);
      await http.post('/api/v1/bookings').set(auth(astroToken)).send({ astrologerId: astroId, start }).expect(400);

      const b = await http.post('/api/v1/bookings').set(auth(userToken)).send({ astrologerId: astroId, start, topic: 'Career' }).expect(201);
      expect(b.body.data).toMatchObject({ status: 'confirmed', minutes: 30, amount: 600, astrologerEarning: 360, topic: 'Career' });
      expect(await balance(userToken)).toBe(400);

      await http.post('/api/v1/bookings').set(auth(userToken)).send({ astrologerId: astroId, start }).expect(409);
      expect(await balance(userToken)).toBe(400);
      expect(await firstFree()).not.toBe(start);

      const mine = await http.get('/api/v1/bookings/my').set(auth(userToken)).expect(200);
      expect(mine.body.data.map((x: any) => x.id)).toContain(b.body.data.id);
      const theirs = await http.get('/api/v1/bookings/astrologer').set(auth(astroToken)).expect(200);
      expect(theirs.body.data[0]).toMatchObject({ id: b.body.data.id, userName: expect.any(String) });
      await http.get('/api/v1/bookings/astrologer').set(auth(userToken)).expect(403);

      const outsider = await login('9811111103');
      await http.post(`/api/v1/bookings/${b.body.data.id}/cancel`).set(auth(outsider)).expect(403);
      // the first free slot may be under 2 hours away: move it out to test the user cancel
      await app.get<Connection>(getConnectionToken()).collection('bookings').updateOne({ _id: oid(b.body.data.id) }, { $set: { start: new Date(Date.now() + 3 * 3600_000), end: new Date(Date.now() + 3.5 * 3600_000) } });
      const c = await http.post(`/api/v1/bookings/${b.body.data.id}/cancel`).set(auth(userToken)).expect(200);
      expect(c.body.data).toMatchObject({ status: 'cancelled', refunded: 600, cancelledBy: 'user' });
      expect(await balance(userToken)).toBe(1000);
      await http.post(`/api/v1/bookings/${b.body.data.id}/cancel`).set(auth(userToken)).expect(400);
    });

    it('only lets the astrologer cancel close to the start time', async () => {
      const b = await http.post('/api/v1/bookings').set(auth(userToken)).send({ astrologerId: astroId, start: await firstFree() }).expect(201);
      await app.get<Connection>(getConnectionToken()).collection('bookings').updateOne({ _id: oid(b.body.data.id) }, { $set: { start: new Date(Date.now() + 3600_000), end: new Date(Date.now() + 5400_000) } });
      const u = await http.post(`/api/v1/bookings/${b.body.data.id}/cancel`).set(auth(userToken)).expect(400);
      expect(u.body.error.message).toMatch(/2 hours/);
      await http.post(`/api/v1/bookings/${b.body.data.id}/start`).set(auth(userToken)).expect(400);
      const a = await http.post(`/api/v1/bookings/${b.body.data.id}/cancel`).set(auth(astroToken)).expect(200);
      expect(a.body.data).toMatchObject({ status: 'cancelled', cancelledBy: 'astrologer' });
      expect(await balance(userToken)).toBe(1000);
    });

    it('starts the prepaid chat at slot time and completes the booking without billing again', async () => {
      const b = await http.post('/api/v1/bookings').set(auth(userToken)).send({ astrologerId: astroId, start: await firstFree() }).expect(201);
      const id = b.body.data.id;
      await app.get<Connection>(getConnectionToken()).collection('bookings').updateOne({ _id: oid(id) }, { $set: { start: new Date(Date.now() - 60_000), end: new Date(Date.now() + 29 * 60_000) } });
      const list = await http.get('/api/v1/bookings/my').set(auth(userToken)).expect(200);
      expect(list.body.data.find((x: any) => x.id === id)).toMatchObject({ canJoin: true, canCancel: false });

      const s = await http.post(`/api/v1/bookings/${id}/start`).set(auth(astroToken)).expect(200);
      const cid = s.body.data.consultationId;
      expect(s.body.data.booking.status).toBe('started');
      const again = await http.post(`/api/v1/bookings/${id}/start`).set(auth(userToken)).expect(200);
      expect(again.body.data.consultationId).toBe(cid);

      const c = await http.get(`/api/v1/consultations/${cid}`).set(auth(userToken)).expect(200);
      expect(c.body.data).toMatchObject({ status: 'active', prepaid: true, bookingId: id, freeMinutes: 0 });
      expect(c.body.data.maxMinutes).toBeGreaterThanOrEqual(30);
      expect(c.body.data.maxMinutes).toBeLessThanOrEqual(39);

      const end = await http.post(`/api/v1/consultations/${cid}/end`).set(auth(userToken)).send({}).expect(200);
      expect(end.body.data).toMatchObject({ status: 'completed', amount: 600, astrologerEarning: 360 });
      expect(await balance(userToken)).toBe(400);
      const past = await http.get('/api/v1/bookings/my?scope=past').set(auth(userToken)).expect(200);
      expect(past.body.data.find((x: any) => x.id === id).status).toBe('completed');
      const profile = await http.get('/api/v1/astrologers/test-acharya').expect(200);
      expect(profile.body.data.presence).toBe('online');
    });

    it('refunds bookings that nobody started', async () => {
      const { BookingsService } = require('../src/modules/consultations/bookings.service');
      await app.get<Connection>(getConnectionToken()).collection('users').updateOne({ phone: '+919811111101' }, { $set: { walletBalancePaise: 100000 } });
      const b = await http.post('/api/v1/bookings').set(auth(userToken)).send({ astrologerId: astroId, start: await firstFree() }).expect(201);
      expect(await balance(userToken)).toBe(400);
      await app.get<Connection>(getConnectionToken()).collection('bookings').updateOne({ _id: oid(b.body.data.id) }, { $set: { start: new Date(Date.now() - 40 * 60_000), end: new Date(Date.now() - 10 * 60_000) } });
      await app.get(BookingsService).sweep();
      await app.get(BookingsService).sweep(); // a second pass must not refund twice
      const past = await http.get('/api/v1/bookings/my?scope=past').set(auth(userToken)).expect(200);
      expect(past.body.data.find((x: any) => x.id === b.body.data.id)).toMatchObject({ status: 'expired', refunded: 600 });
      expect(await balance(userToken)).toBe(1000);
    });
  });

  describe('astrology tools (provider mocked)', () => {
    const realFetch = global.fetch;
    const calls: { path: string; body: any }[] = [];
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><text>chart</text></svg>';

    beforeAll(() => {
      jest.spyOn(global, 'fetch').mockImplementation(async (input: any, init?: any) => {
        const url = String(input);
        if (!url.startsWith('https://astro.test')) return realFetch(input, init);
        const path = url.replace('https://astro.test/api/v1', '');
        const body = JSON.parse(init.body);
        calls.push({ path, body });
        expect(init.headers['X-API-Key']).toBe('test-key');
        const ok = (output: unknown) => new Response(JSON.stringify({ statusCode: 200, output }), { status: 200 });
        if (path === '/kundali/basic') return ok(fixture.basic);
        if (path === '/planets') return ok(fixture.planets);
        if (path === '/dasha/vimshottari') return ok(fixture.dasha);
        if (path === '/dosha/mangal') return ok(fixture.mangal);
        if (path.startsWith('/chart/render')) return ok(svg);
        if (path === '/compatibility/ashtakoot') {
          if (!body.bride) return new Response(JSON.stringify({ detail: [{ loc: ['body', 'bride'], msg: 'Field required' }] }), { status: 422 });
          return ok(fixture.ashtakoot);
        }
        if (path === '/panchang/full') return ok(fixture.panchang);
        if (path === '/panchang/choghadiya') return ok(fixture.choghadiya);
        if (path === '/panchang/inauspicious-periods') return ok(fixture.inauspicious);
        if (path === '/panchang/abhijit-muhurat') return ok(fixture.abhijit);
        return new Response('not found', { status: 404 });
      });
    });

    afterAll(() => (global.fetch as jest.Mock).mockRestore?.());

    const birth = { dateOfBirth: '1992-08-15', timeOfBirth: '06:45', latitude: 22.7196, longitude: 75.8577, timezone: 'Asia/Kolkata', placeName: 'Indore, India' };

    it('searches birth places', async () => {
      const res = await http.get('/api/v1/places/search?q=indo').expect(200);
      expect(res.body.data[0]).toMatchObject({ name: 'Indore', timezone: 'Asia/Kolkata' });
    });

    it('builds a kundli with UTC offset worked out from the time zone, and caches it', async () => {
      const res = await http.post('/api/v1/astro/kundli').send(birth).expect(200);
      expect(res.body.data.summary).toMatchObject({ ascendant: 'Gemini', moonSign: 'Cancer', nakshatra: 'Pushya' });
      expect(res.body.data.planets).toHaveLength(9);
      expect(res.body.data.dasha.periods.length).toBeGreaterThan(0);
      expect(res.body.data.mangalDosha.present).toBe(true);
      const basicCall = calls.find((c) => c.path === '/kundali/basic');
      expect(basicCall?.body).toMatchObject({ year: 1992, month: 8, date: 15, hours: 6, minutes: 45, timezone: 5.5 });

      const before = calls.length;
      await http.post('/api/v1/astro/kundli').send(birth).expect(200);
      expect(calls.length).toBe(before); // all sections served from cache
    });

    it('downloads the kundli as PDF for logged-in users', async () => {
      await http.post('/api/v1/astro/kundli/pdf').send(birth).expect(401);
      const token = await login('9811122233');
      const res = await http.post('/api/v1/astro/kundli/pdf').set('Authorization', `Bearer ${token}`).send({ ...birth, name: 'Ravi' }).buffer(true).expect(200);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-disposition']).toContain('ravi-kundli.pdf');
      expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
    });

    it('validates birth input', async () => {
      await http.post('/api/v1/astro/kundli').send({ ...birth, timeOfBirth: '25:99' }).expect(400);
      await http.post('/api/v1/astro/kundli').send({ dateOfBirth: '1992-08-15', timeOfBirth: '06:45' }).expect(400);
    });

    it('matches two charts with a koota breakdown', async () => {
      const res = await http
        .post('/api/v1/astro/matching')
        .send({ boy: { ...birth, name: 'Ravi' }, girl: { ...birth, dateOfBirth: '1994-03-02', name: 'Priya' } })
        .expect(200);
      expect(res.body.data).toMatchObject({ score: 14, maxScore: 36, verdict: 'not_recommended', nadiDosha: true });
      expect(res.body.data.kootas).toHaveLength(8);
      expect(res.body.data.kootas.find((k: any) => k.key === 'gana')).toMatchObject({ score: 5, max: 6, girl: 'Manushya', boy: 'Deva' });
      expect(res.body.data.boy).toMatchObject({ name: 'Ravi', moonSign: 'Cancer', nakshatra: 'Pushya' });
      expect(res.body.data.mangalDosha.boy.present).toBe(true);
    });

    it('returns panchang for a place id', async () => {
      const place = (await http.get('/api/v1/places/search?q=mumbai').expect(200)).body.data[0];
      const res = await http.get(`/api/v1/astro/panchang?placeId=${place.id}&date=2026-10-24`).expect(200);
      expect(res.body.data).toMatchObject({
        date: '2026-10-24',
        tithi: { name: 'Trayodashi', paksha: 'Shukla' },
        sunrise: '06:30',
        rahuKaal: { start: '09:20', end: '10:45' },
        abhijitMuhurat: { start: '11:48', end: '12:33' },
      });
      expect(res.body.data.choghadiya.day[1]).toMatchObject({ name: 'Shubh', good: true });
    });
  });

  describe('horoscope and calculators', () => {
    let editorToken: string;

    beforeAll(async () => {
      const conn = app.get<Connection>(getConnectionToken());
      await login('9899999999');
      await conn.collection('users').updateOne({ phone: '+919899999999' }, { $addToSet: { roles: 'editor' } });
      const u = await conn.collection('users').findOne({ phone: '+919899999999' });
      editorToken = await app.get(JwtService).signAsync({ sub: String(u?._id), roles: u?.roles });
    });

    it('lets an editor publish and the public read it by English or rashi name', async () => {
      const text = 'A good day for steady work and family time. Avoid hasty money decisions.';
      await http.put('/api/v1/admin/horoscope').send({ sign: 'aries', period: 'daily', date: '2026-10-24', lang: 'en', text }).expect(401);
      await http
        .put('/api/v1/admin/horoscope')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ sign: 'aries', period: 'daily', date: '2026-10-24', lang: 'en', text, luckyNumber: '9', scores: { love: 4 } })
        .expect(200);
      const one = await http.get('/api/v1/horoscope/mesh?period=daily&date=2026-10-24').expect(200);
      expect(one.body.data).toMatchObject({ text, luckyNumber: '9', sign: { slug: 'aries' } });
      const all = await http.get('/api/v1/horoscope?date=2026-10-24').expect(200);
      expect(all.body.data.items).toHaveLength(12);
      expect(all.body.data.items.filter((i: any) => i.text).length).toBe(1);
      const weekly = await http.get('/api/v1/horoscope/aries?period=weekly&date=2026-10-24').expect(200);
      expect(weekly.body.data).toMatchObject({ periodKey: '2026-W43', text: null });
    });

    it('computes numerology and lo shu locally', async () => {
      const n = await http.post('/api/v1/calculators/numerology').send({ dateOfBirth: '1992-08-15', fullName: 'Ravi' }).expect(200);
      expect(n.body.data).toMatchObject({ lifePath: 8, destiny: 5 });
      const l = await http.post('/api/v1/calculators/lo-shu-grid').send({ dateOfBirth: '1992-08-15' }).expect(200);
      expect(l.body.data.missing).toEqual([3, 4, 7]);
    });
  });

  describe('shop (poojas and courses)', () => {
    let admin: string;
    let buyer: string;
    let poojaId: string;
    let courseId: string;

    beforeAll(async () => {
      const conn = app.get<Connection>(getConnectionToken());
      await login('9877700001');
      await conn.collection('users').updateOne({ phone: '+919877700001' }, { $addToSet: { roles: 'admin' } });
      const a = await conn.collection('users').findOne({ phone: '+919877700001' });
      admin = await app.get(JwtService).signAsync({ sub: String(a?._id), roles: a?.roles });
      buyer = await login('9877700002');
      const pooja = await http.post('/api/v1/admin/shop/products').set('Authorization', `Bearer ${admin}`).send({
        type: 'pooja', slug: 'test-pooja', title: 'Test Pooja', summary: 'For tests', price: 1100, mrp: 2100, includes: ['Recording'],
      }).expect(201);
      poojaId = pooja.body.data.id;
      const course = await http.post('/api/v1/admin/shop/products').set('Authorization', `Bearer ${admin}`).send({
        type: 'course', slug: 'test-course', title: 'Test Course', summary: 'For tests', price: 500,
        lessons: [{ title: 'Intro', videoUrl: 'https://videos.example.com/a.mp4', freePreview: true }, { title: 'Paid lesson', videoUrl: 'https://videos.example.com/b.mp4' }],
      }).expect(201);
      courseId = course.body.data.id;
      await http.post('/api/v1/admin/shop/products').set('Authorization', `Bearer ${buyer}`).send({ type: 'pooja', slug: 'x-x-x', title: 'x', summary: 'x', price: 1 }).expect(403);
    });

    const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

    it('lists products and hides paid course videos', async () => {
      const list = await http.get('/api/v1/shop/products?type=pooja').expect(200);
      expect(list.body.data.find((p: any) => p.slug === 'test-pooja')).toMatchObject({ price: 1100, mrp: 2100, discountPercent: 48 });
      const c = await http.get('/api/v1/shop/products/test-course').expect(200);
      expect(c.body.data.lessons.map((l: any) => l.videoUrl)).toEqual(['https://videos.example.com/a.mp4', null]);
      expect(c.body.data.enrolled).toBe(false);
    });

    it('asks for a recharge when the wallet is short, then books a pooja', async () => {
      const short = await http.post('/api/v1/shop/orders').set(auth(buyer)).send({ productId: poojaId, pooja: { sankalpName: 'Ravi Sharma' } }).expect(400);
      expect(short.body.error.message).toMatch(/add ₹1100 more/);
      const order = await http.post('/api/v1/wallet/create-order').set(auth(buyer)).send({ amount: 2000 }).expect(201);
      await http.post('/api/v1/wallet/verify-payment').set(auth(buyer)).send({ orderId: order.body.data.orderId, paymentId: 'p', signature: 'mock' }).expect(200);

      await http.post('/api/v1/shop/orders').set(auth(buyer)).send({ productId: poojaId }).expect(400);
      const res = await http.post('/api/v1/shop/orders').set(auth(buyer)).send({ productId: poojaId, pooja: { sankalpName: 'Ravi Sharma', gotra: 'Kashyap', preferredDate: '2026-11-02' } }).expect(201);
      expect(res.body.data).toMatchObject({ amount: 1100, status: 'paid', pooja: { status: 'scheduled', sankalpName: 'Ravi Sharma' } });
      expect(res.body.data.orderNumber).toMatch(/^KJ\d{6}-\d{4}$/);
      const bal = await http.get('/api/v1/wallet/balance').set(auth(buyer)).expect(200);
      expect(bal.body.data.balance).toBe(2200 - 1100);

      const done = await http.patch(`/api/v1/admin/shop/orders/${res.body.data.id}/pooja`).set(auth(admin)).send({ status: 'performed', recordingUrl: 'https://videos.example.com/rec.mp4' }).expect(200);
      expect(done.body.data.pooja).toMatchObject({ status: 'performed', recordingUrl: 'https://videos.example.com/rec.mp4' });
    });

    it('sells a course once and unlocks its lessons', async () => {
      await http.get('/api/v1/shop/courses/test-course/learn').set(auth(buyer)).expect(403);
      await http.post('/api/v1/shop/orders').set(auth(buyer)).send({ productId: courseId }).expect(201);
      await http.post('/api/v1/shop/orders').set(auth(buyer)).send({ productId: courseId }).expect(409);
      const learn = await http.get('/api/v1/shop/courses/test-course/learn').set(auth(buyer)).expect(200);
      expect(learn.body.data.lessons[1].videoUrl).toBe('https://videos.example.com/b.mp4');
      const prog = await http.post('/api/v1/shop/courses/test-course/progress').set(auth(buyer)).send({ lessonId: learn.body.data.lessons[0].id, completed: true }).expect(201);
      expect(prog.body.data).toEqual({ completed: 1, totalLessons: 2 });
      const mine = await http.get('/api/v1/shop/my-courses').set(auth(buyer)).expect(200);
      expect(mine.body.data[0]).toMatchObject({ slug: 'test-course', completed: 1 });
      const page = await http.get('/api/v1/shop/products/test-course').set(auth(buyer)).expect(200);
      expect(page.body.data.enrolled).toBe(true);
    });

    it('refunds an order to the wallet', async () => {
      const orders = await http.get('/api/v1/shop/orders').set(auth(buyer)).expect(200);
      const course = orders.body.data.find((o: any) => o.type === 'course');
      await http.post(`/api/v1/admin/shop/orders/${course.id}/refund`).set(auth(admin)).expect(201);
      const bal = await http.get('/api/v1/wallet/balance').set(auth(buyer)).expect(200);
      expect(bal.body.data.balance).toBe(1100);
      await http.get('/api/v1/shop/courses/test-course/learn').set(auth(buyer)).expect(403);
    });
  });

  describe('home page data', () => {
    it('returns live astrologer counts', async () => {
      const r = await http.get('/api/v1/astrologers/stats').expect(200);
      expect(r.body.data).toMatchObject({ total: expect.any(Number), online: expect.any(Number), women: expect.any(Number), consultations: expect.any(Number), maxExperienceYears: expect.any(Number) });
      expect(r.body.data.total).toBeGreaterThan(0);
      expect(typeof r.body.data.byConcern).toBe('object');
    });

    it('subscribes to the newsletter once per email', async () => {
      await http.post('/api/v1/newsletter/subscribe').send({ email: 'Reader@Example.com' }).expect(200);
      await http.post('/api/v1/newsletter/subscribe').send({ email: 'reader@example.com', lang: 'hi' }).expect(200);
      await http.post('/api/v1/newsletter/subscribe').send({ email: 'not-an-email' }).expect(400);
    });

    it('exposes the white-label home settings', async () => {
      const r = await http.get('/api/v1/config/brand').expect(200);
      expect(r.body.data).toMatchObject({ shortTagline: expect.any(String), appLinks: expect.any(Object), social: expect.any(Object) });
    });
  });

  describe('admin panel', () => {
    let admin: string;
    let adminId: string;
    let member: string;
    let memberId: string;
    const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

    beforeAll(async () => {
      const conn = app.get<Connection>(getConnectionToken());
      await login('9822222201');
      await conn.collection('users').updateOne({ phone: '+919822222201' }, { $addToSet: { roles: 'admin' } });
      const a = await conn.collection('users').findOne({ phone: '+919822222201' });
      adminId = String(a?._id);
      admin = await app.get(JwtService).signAsync({ sub: adminId, roles: a?.roles });
      member = await login('9822222202');
      memberId = String((await conn.collection('users').findOne({ phone: '+919822222202' }))?._id);
    });

    it('is for admins only', async () => {
      await http.get('/api/v1/admin/overview').expect(401);
      await http.get('/api/v1/admin/overview').set(auth(member)).expect(403);
    });

    it('returns overview numbers with a 14-day series', async () => {
      const r = await http.get('/api/v1/admin/overview').set(auth(admin)).expect(200);
      const d = r.body.data;
      expect(d.users.total).toBeGreaterThan(5);
      expect(d.astrologers.approved).toBeGreaterThan(0);
      expect(d.consultations.completed).toBeGreaterThan(0);
      expect(d.consultations.gross).toBeGreaterThan(0);
      expect(d.consultations.platformShare).toBeGreaterThan(0);
      expect(d.recharges.total).toBeGreaterThan(0);
      expect(d.subscribers).toBe(1);
      expect(d.daily).toHaveLength(14);
      expect(d.daily[13].recharges).toBeGreaterThan(0);
    });

    it('searches users, adjusts a wallet and blocks / unblocks an account', async () => {
      const r = await http.get('/api/v1/admin/users?q=9822222202').set(auth(admin)).expect(200);
      expect(r.body.data.total).toBe(1);
      expect(r.body.data.items[0]).toMatchObject({ id: memberId, status: 'active', balance: 0 });

      const c = await http.post(`/api/v1/admin/users/${memberId}/wallet`).set(auth(admin)).send({ amount: 50, note: 'Goodwill credit' }).expect(201);
      expect(c.body.data.balance).toBe(50);
      await http.post(`/api/v1/admin/users/${memberId}/wallet`).set(auth(admin)).send({ amount: -80, note: 'Too much' }).expect(400);
      await http.post(`/api/v1/admin/users/${memberId}/wallet`).set(auth(admin)).send({ amount: -20, note: 'Correction' }).expect(201);
      const ledger = await http.get(`/api/v1/admin/transactions?userId=${memberId}`).set(auth(admin)).expect(200);
      expect(ledger.body.data.items.map((t: any) => [t.type, t.amount, t.reason])).toEqual([
        ['debit', 20, 'adjustment'],
        ['credit', 50, 'adjustment'],
      ]);

      await http.patch(`/api/v1/admin/users/${memberId}`).set(auth(admin)).send({ status: 'blocked' }).expect(200);
      const blocked = await http.get('/api/v1/users/me').set(auth(member)).expect(403);
      expect(blocked.body.error.message).toMatch(/not active/);
      await http.post('/api/v1/auth/otp/send').send({ phone: '9822222202' }).expect(200);
      await http.post('/api/v1/auth/otp/verify').send({ phone: '9822222202', code: '123456' }).expect(403);
      await http.patch(`/api/v1/admin/users/${memberId}`).set(auth(admin)).send({ status: 'active', staffRoles: ['editor'] }).expect(200);
      const me = await http.get('/api/v1/users/me').set(auth(member)).expect(200);
      expect(me.body.data.roles).toEqual(expect.arrayContaining(['user', 'editor']));

      await http.patch(`/api/v1/admin/users/${adminId}`).set(auth(admin)).send({ status: 'blocked' }).expect(400);
      await http.patch(`/api/v1/admin/users/${memberId}`).set(auth(admin)).send({ status: 'deleted' }).expect(400);
    });

    it('applies a removed role and a block at once, even with an old token, and closes the blocked user\'s realtime connection', async () => {
      // give the member admin, use it, then take it away: the same token loses access immediately
      await http.patch(`/api/v1/admin/users/${memberId}`).set(auth(admin)).send({ staffRoles: ['admin'] }).expect(200);
      await http.get('/api/v1/admin/overview').set(auth(member)).expect(200);
      await http.patch(`/api/v1/admin/users/${memberId}`).set(auth(admin)).send({ staffRoles: [] }).expect(200);
      await http.get('/api/v1/admin/overview').set(auth(member)).expect(403);

      const live = await connect(member);
      await http.patch(`/api/v1/admin/users/${memberId}`).set(auth(admin)).send({ status: 'blocked' }).expect(200);
      await waitFor(live.events, (e) => e.name === 'session:ended' && e.data.reason === 'blocked');
      const deadline = Date.now() + 3000;
      while (live.socket.connected && Date.now() < deadline) await new Promise((r) => setTimeout(r, 25));
      expect(live.socket.connected).toBe(false);
      // a new connection is refused while blocked
      const again = io(`${baseUrl.replace('[::1]', 'localhost')}/realtime`, { auth: { token: member }, transports: ['websocket'], forceNew: true });
      sockets.push(again);
      const refused = await new Promise<boolean>((resolve) => {
        again.on('disconnect', () => resolve(true));
        setTimeout(() => resolve(!again.connected), 2000);
      });
      expect(refused).toBe(true);
      await http.patch(`/api/v1/admin/users/${memberId}`).set(auth(admin)).send({ status: 'active' }).expect(200);
      await http.get('/api/v1/users/me').set(auth(member)).expect(200);
    });

    it('manages astrologer commission, badges, weight and suspension', async () => {
      const list = await http.get('/api/v1/admin/astrologers?q=test-acharya').set(auth(admin)).expect(200);
      const a = list.body.data.items[0];
      expect(a).toMatchObject({ slug: 'test-acharya', status: 'approved', phone: expect.any(String) });
      const u = await http.patch(`/api/v1/admin/astrologers/${a.id}`).set(auth(admin)).send({ commissionPercent: 30, badges: ['top-rated'], sortWeight: 300 }).expect(200);
      expect(u.body.data).toMatchObject({ commissionPercent: 30, badges: ['top-rated'], sortWeight: 300 });
      await http.patch(`/api/v1/admin/astrologers/${a.id}`).set(auth(admin)).send({ badges: ['fake-badge'] }).expect(400);

      await http.patch(`/api/v1/admin/astrologers/${a.id}`).set(auth(admin)).send({ status: 'suspended' }).expect(200);
      await http.get('/api/v1/astrologers/test-acharya').expect(404);
      await http.patch(`/api/v1/admin/astrologers/${a.id}`).set(auth(admin)).send({ status: 'approved' }).expect(200);
      const back = await http.get('/api/v1/astrologers/test-acharya').expect(200);
      expect(back.body.data.presence).toBe('offline');
    });

    it('lists activity and hides a review from the rating', async () => {
      for (const path of ['consultations', 'payments', 'transactions', 'bookings', 'reviews', 'subscribers']) {
        const r = await http.get(`/api/v1/admin/${path}`).set(auth(admin)).expect(200);
        expect(r.body.data.items.length).toBeGreaterThan(0);
      }
      const paid = await http.get('/api/v1/admin/payments?status=paid').set(auth(admin)).expect(200);
      expect(paid.body.data.items[0]).toMatchObject({ status: 'paid', mock: true, user: expect.any(Object) });
      const done = await http.get('/api/v1/admin/consultations?status=completed&limit=5').set(auth(admin)).expect(200);
      expect(done.body.data.items.every((c: any) => c.status === 'completed')).toBe(true);

      const reviews = await http.get('/api/v1/admin/reviews').set(auth(admin)).expect(200);
      const rv = reviews.body.data.items[0];
      const before = await http.get('/api/v1/astrologers/test-acharya').expect(200);
      expect(before.body.data.rating.count).toBe(1);
      await http.patch(`/api/v1/admin/reviews/${rv.consultationId}`).set(auth(admin)).send({ hidden: true }).expect(200);
      const hidden = await http.get('/api/v1/astrologers/test-acharya').expect(200);
      expect(hidden.body.data.rating).toEqual({ average: 0, count: 0 });
      const recent = await http.get('/api/v1/consultations/reviews/recent').expect(200);
      expect(recent.body.data).toHaveLength(0);
      const h = await http.get('/api/v1/admin/reviews?filter=hidden').set(auth(admin)).expect(200);
      expect(h.body.data.total).toBe(1);
      await http.patch(`/api/v1/admin/reviews/${rv.consultationId}`).set(auth(admin)).send({ hidden: false }).expect(200);
      const restored = await http.get('/api/v1/astrologers/test-acharya').expect(200);
      expect(restored.body.data.rating).toEqual({ average: 4, count: 1 });
    });
  });
});
