// ─────────────────────────────────────────────────────────────────────────────
//  Chat foreground presence → lets the push Edge Function SKIP this device
//  while the chat is on screen, and resume the moment it is backgrounded.
//
//  • visible  → set_push_presence(true) now + heartbeat every 20 s
//  • hidden / pagehide / unmount → set_push_presence(false) immediately
//    (fetch keepalive so it survives the page being suspended on iOS)
//  The server treats a `true` older than 45 s as stale, so a killed app can
//  never block notifications for long even if the hidden event never fired.
// ─────────────────────────────────────────────────────────────────────────────
import { isSupabaseConfigured, SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase";
import { getSessionId } from "./push";

type Persona = "faizan" | "habiba";

const HEARTBEAT_MS = 20_000;
const ANON_KEY = SUPABASE_ANON_KEY;

let lastSent: { fg: boolean; at: number } | null = null;

async function sendPresence(persona: Persona, foreground: boolean): Promise<void> {
  if (!isSupabaseConfigured) return;
  // Collapse duplicate "false" bursts (visibilitychange + pagehide fire together).
  if (lastSent && lastSent.fg === foreground && !foreground && Date.now() - lastSent.at < 1500) return;
  lastSent = { fg: foreground, at: Date.now() };
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/rpc/set_push_presence`, {
      method: "POST",
      keepalive: true, // let it finish while the page is being hidden/unloaded
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        p_session_id: getSessionId(),
        p_persona: persona,
        p_foreground: foreground,
      }),
    });
  } catch {
    /* offline — the server-side staleness window covers us */
  }
}

/**
 * Start reporting presence for the open chat. Returns a stop() that marks the
 * device as background again. `getPersona` is read at send time so identity
 * switches are picked up without restarting.
 */
export function startChatPresence(getPersona: () => Persona): () => void {
  if (typeof document === "undefined" || !isSupabaseConfigured) return () => {};

  let timer: number | null = null;

  const stopHeartbeat = () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
  const goForeground = () => {
    void sendPresence(getPersona(), true);
    stopHeartbeat();
    timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void sendPresence(getPersona(), true);
    }, HEARTBEAT_MS);
  };
  const goBackground = () => {
    stopHeartbeat();
    void sendPresence(getPersona(), false);
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") goForeground();
    else goBackground();
  };
  const onPageHide = () => goBackground();
  const onPageShow = () => {
    if (document.visibilityState === "visible") goForeground();
  };
  const onOnline = () => {
    if (document.visibilityState === "visible") goForeground();
  };

  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("pageshow", onPageShow);
  window.addEventListener("focus", onPageShow);
  window.addEventListener("online", onOnline);
  // Chromium may freeze a backgrounded tab without a visibilitychange.
  document.addEventListener("freeze", onPageHide);
  document.addEventListener("resume", onPageShow);

  if (document.visibilityState === "visible") goForeground();
  else goBackground();

  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("pageshow", onPageShow);
    window.removeEventListener("focus", onPageShow);
    window.removeEventListener("online", onOnline);
    document.removeEventListener("freeze", onPageHide);
    document.removeEventListener("resume", onPageShow);
    goBackground();
  };
}

/** Re-announce presence right away (e.g. after the persona is switched). */
export function refreshChatPresence(persona: Persona): void {
  if (typeof document === "undefined") return;
  void sendPresence(persona, document.visibilityState === "visible");
}
