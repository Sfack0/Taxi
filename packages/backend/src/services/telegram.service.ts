import type { Ride } from '@cts/shared';
import logger from '../utils/logger';
import { formatDateGreek, formatPeopleGreek } from './email.service';

// Telegram notification to the drivers via the official Bot API.
// Setup: create a bot with @BotFather (→ TELEGRAM_BOT_TOKEN), add it to a group with
// the drivers (or have each driver press Start), and list the chat ids
// comma-separated in TELEGRAM_CHAT_IDS, e.g. "-1001234567890" or "111111,222222".
const getBotToken = () => process.env.TELEGRAM_BOT_TOKEN || '';

const getChatIds = (): string[] =>
  (process.env.TELEGRAM_CHAT_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Kept deliberately minimal: no customer name/phone and no accept link —
// full details are in the admin email.
const getAdminTelegramText = (ride: Ride): string => {
  const lines = [`🚐 <b>Νέα Κράτηση</b>${ride.isRoundtrip ? ' (με επιστροφή)' : ''}`];
  lines.push(`📍 ${escapeHtml(ride.pickup.address)} → ${escapeHtml(ride.dropoff.address)}`);
  if (ride.scheduledFor) {
    lines.push(`📅 ${formatDateGreek(ride.scheduledFor)}${ride.people ? ` (${formatPeopleGreek(ride.people)})` : ''}`);
  }
  if (ride.isRoundtrip && ride.returnScheduledFor) {
    lines.push(`↩️ Επιστροφή: ${formatDateGreek(ride.returnScheduledFor)}${ride.returnPeople ? ` (${formatPeopleGreek(ride.returnPeople)})` : ''}`);
  }
  lines.push('', 'Δες λεπτομέρειες στο email που στάλθηκε.');
  return lines.join('\n');
};

// Kept short: the booking request awaits this before responding, and the
// Netlify function has a ~10s limit (2 × 3s + 1s worst case).
const REQUEST_TIMEOUT_MS = 3000;
const RETRY_DELAY_MS = 1000;

// Telegram answers { ok: true } only once the message is stored in the chat.
const trySendTelegram = async (chatId: string, text: string): Promise<string | null> => {
  try {
    const res = await fetch(`https://api.telegram.org/bot${getBotToken()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
    if (res.ok && body?.ok) return null;
    return `${res.status} ${body?.description || 'unknown error'}`.slice(0, 300);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

export type NotificationFailure = { recipient: string; error: string };

// Sends with one retry. Returns the error, or null if delivered.
const sendTelegram = async (chatId: string, text: string): Promise<string | null> => {
  let error = await trySendTelegram(chatId, text);
  if (error) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    error = await trySendTelegram(chatId, text);
  }
  if (error) {
    logger.error(`Telegram message to ${chatId} failed: ${error}`);
  }
  return error;
};

// Returns the chats the alert could not be delivered to.
export const sendAdminTelegram = async (ride: Ride): Promise<NotificationFailure[]> => {
  const chatIds = getChatIds();
  if (!getBotToken() || !chatIds.length) return [];

  const text = getAdminTelegramText(ride);
  const results = await Promise.all(
    chatIds.map(async (chatId) => {
      const error = await sendTelegram(chatId, text);
      return error ? { recipient: chatId, error } : null;
    })
  );
  return results.filter((failure): failure is NotificationFailure => failure !== null);
};
