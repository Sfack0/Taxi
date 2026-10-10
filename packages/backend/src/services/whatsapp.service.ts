import type { Ride } from '@cts/shared';
import logger from '../utils/logger';
import { formatDateGreek, formatPeopleGreek } from './email.service';

// WhatsApp notification to the drivers via CallMeBot (free, personal-use API).
// Setup: each phone sends "I allow callmebot to send me messages" to the CallMeBot
// WhatsApp number and receives its own API key. CALLMEBOT_RECIPIENTS lists them as
// comma-separated phone:apikey pairs, e.g. "+306911111111:123456,+306922222222:654321".
const getRecipients = (): { phone: string; apikey: string }[] =>
  (process.env.CALLMEBOT_RECIPIENTS || '')
    .split(',')
    .map((entry) => entry.trim().split(':').map((part) => part.trim()))
    .filter(([phone, apikey]) => phone && apikey)
    .map(([phone, apikey]) => ({ phone, apikey }));

// Kept deliberately minimal: the message passes through a third-party service,
// so no customer name/phone and no accept link — full details are in the admin email.
const getAdminWhatsAppText = (ride: Ride): string => {
  const lines = [`🚐 *Νέα Κράτηση*${ride.isRoundtrip ? ' (με επιστροφή)' : ''}`];
  lines.push(`📍 ${ride.pickup.address} → ${ride.dropoff.address}`);
  if (ride.scheduledFor) {
    lines.push(`📅 ${formatDateGreek(ride.scheduledFor)}${ride.people ? ` (${formatPeopleGreek(ride.people)})` : ''}`);
  }
  if (ride.isRoundtrip && ride.returnScheduledFor) {
    lines.push(`↩️ Επιστροφή: ${formatDateGreek(ride.returnScheduledFor)}${ride.returnPeople ? ` (${formatPeopleGreek(ride.returnPeople)})` : ''}`);
  }
  lines.push('', 'Δες λεπτομέρειες στο email που στάλθηκε.');
  return lines.join('\n');
};

const RETRY_DELAY_MS = 2000;

// CallMeBot sometimes answers 200 with an error in the body, so success is only
// "queued"/"sent" in the response text.
const trySendWhatsApp = async (phone: string, apikey: string, text: string): Promise<string | null> => {
  const params = new URLSearchParams({ phone, apikey, text });

  try {
    const res = await fetch(`https://api.callmebot.com/whatsapp.php?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    });
    const body = (await res.text()).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (res.ok && /queued|sent/i.test(body)) return null;
    return `${res.status} ${body}`.slice(0, 300);
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

export type WhatsAppFailure = { phone: string; error: string };

// Sends with one retry. Returns the error, or null if delivered to CallMeBot.
const sendWhatsApp = async (phone: string, apikey: string, text: string): Promise<string | null> => {
  let error = await trySendWhatsApp(phone, apikey, text);
  if (error) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    error = await trySendWhatsApp(phone, apikey, text);
  }
  if (error) {
    logger.error(`CallMeBot WhatsApp to ${phone} failed: ${error}`);
  }
  return error;
};

// Returns the phones the alert could not be delivered to.
export const sendAdminWhatsApp = async (ride: Ride): Promise<WhatsAppFailure[]> => {
  const recipients = getRecipients();
  if (!recipients.length) return [];

  const text = getAdminWhatsAppText(ride);
  const results = await Promise.all(
    recipients.map(async ({ phone, apikey }) => {
      const error = await sendWhatsApp(phone, apikey, text);
      return error ? { phone, error } : null;
    })
  );
  return results.filter((failure): failure is WhatsAppFailure => failure !== null);
};
