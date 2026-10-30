# API documentation for the mobile (Flutter) team

- `openapi.json` – full OpenAPI 3 spec, generated from the code.
- `postman/AstroSparkles.postman_collection.json` – import into Postman (File → Import).

Regenerate both after any API change (MongoDB must be running):

```
cd api
npm run docs:export
```

Live, interactive docs while the API runs: http://localhost:4000/docs
Response format: `{ "success": true, "data": ... }` or `{ "success": false, "error": { "code", "message" } }`.

## Real-time events (chat)

Connect with Socket.IO to `http://<api-host>/realtime` and pass the login token:

```js
const socket = io('http://localhost:4000/realtime', { auth: { token: accessToken } });
```

| Direction | Event | Payload |
| --- | --- | --- |
| client → server | `consultation:join` | `{ consultationId }` → ack `{ ok, data: { consultation, messages } }` |
| client → server | `message:send` | `{ consultationId, text, clientId? }` → ack `{ ok, data: message }` |
| client → server | `typing` | `{ consultationId }` |
| server → client | `consultation:updated` | consultation object (sent to both user and astrologer on every status change) |
| server → client | `message:new` | message object (to everyone who joined the consultation) |
| server → client | `consultation:warning` | `{ consultationId, secondsLeft, message }` (user, about 1 minute before balance runs out) |
| server → client | `typing` | `{ consultationId, userId }` |

### Consultation flow

1. User: `POST /consultations/request` `{ astrologerId, mode: "chat" }` → status `requested`.
2. Astrologer receives `consultation:updated` and calls `POST /consultations/{id}/accept` (or `/reject`).
   Not answered in 60 seconds → status `missed`.
3. Status `active`: both sides `consultation:join`, then exchange `message:send`.
4. Either side: `POST /consultations/{id}/end`. Billing is per started minute; a new user's
   first chat is free for 5 minutes. The server ends the session itself when the balance runs out.
5. User: `POST /consultations/{id}/review` `{ rating: 1-5, comment? }`.

### Scheduled (prepaid) sessions

1. Slots: `GET /astrologers/{id}/slots?from=YYYY-MM-DD&days=7` (public, up to 14 days ahead). Times are UTC ISO strings;
   show them in the user's zone (the response also gives the astrologer's `timezone`). `available: false` means taken or too soon (under 30 minutes away).
2. Book: `POST /bookings` `{ astrologerId, start, topic? }` with `start` copied exactly from a slot. The full `price` is debited
   from the wallet at once. `409` = someone else just took the slot (pick another); `400` "Insufficient wallet balance" = recharge first.
3. Lists: `GET /bookings/my?scope=upcoming|past|all` (user), `GET /bookings/astrologer` (astrologer). Each booking has `canJoin` and `canCancel`.
4. Join: `POST /bookings/{id}/start` (either side, from 5 minutes before the start until the end) → `{ booking, consultationId }`.
   Safe to call twice. Then use the normal chat flow above with that consultation id; it is `prepaid: true`, so there is no per-minute billing
   and it ends by itself after the booked minutes.
5. Cancel: `POST /bookings/{id}/cancel`. Users up to 2 hours before the start, astrologers any time. Full refund to the wallet.
   Bookings nobody starts are refunded automatically after the slot ends.
6. Astrologer hours: `GET/PUT /astrologers/me/schedule` `{ enabled, slotMinutes: 15|30|45|60, days: [{ day: 0-6, start: "HH:mm", end: "HH:mm" }] }` (IST).

### Admin endpoints

Everything under `/admin/*` needs a token with the `admin` role (the horoscope editor also accepts `editor`).
A blocked account gets `403` "This account is not active" on every authenticated call.
