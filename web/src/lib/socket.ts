"use client";

import { io, type Socket } from "socket.io-client";
import { API_URL } from "./brand";
import { session } from "./api";

let socket: Socket | null = null;
let socketToken: string | null = null;

/** One shared, authenticated connection to the API's realtime namespace. */
export function getSocket(): Socket | null {
  const token = session.get();
  if (!token) return null;
  if (socket && socketToken === token) return socket;
  socket?.disconnect();
  const origin = new URL(API_URL).origin;
  socket = io(`${origin}/realtime`, { auth: { token }, transports: ["websocket", "polling"] });
  socketToken = token;
  // the server closes the connection when the account is blocked: sign out everywhere
  socket.on("session:ended", () => session.clear("blocked"));
  return socket;
}

/** Closes the realtime connection (on logout or when the session ends) so no more events arrive. */
export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}

export type Ack<T> = { ok: true; data: T } | { ok: false; error: string };
