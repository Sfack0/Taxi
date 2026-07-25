// Booking times mean Crete (Europe/Athens) local time, regardless of where the
// customer's browser is. These helpers interpret a picked wall-clock time as
// Europe/Athens and return the correct absolute instant (DST-aware), so a time
// booked from abroad is stored/displayed as the intended Crete time.

/** Minutes that Europe/Athens is ahead of UTC at a given absolute instant. */
const athensOffsetMinutes = (utcMs: number): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Athens',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date(utcMs));
  const p: Record<string, string> = {};
  for (const part of parts) p[part.type] = part.value;
  // Some environments render midnight as '24'; normalise to '00'.
  const hour = p.hour === '24' ? '00' : p.hour;
  const asIfUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +hour, +p.minute, +p.second);
  return Math.round((asIfUTC - utcMs) / 60000);
};

/**
 * Interpret the given wall-clock components as a time in Europe/Athens and
 * return the corresponding Date (absolute instant), independent of browser TZ.
 */
export function athensWallClockToDate(
  year: number, month: number, day: number, hours: number, minutes: number,
): Date {
  const wallAsUTC = Date.UTC(year, month, day, hours, minutes);
  // First approximation, then one correction to settle DST boundaries.
  const offset = athensOffsetMinutes(wallAsUTC);
  let instant = wallAsUTC - offset * 60000;
  const offset2 = athensOffsetMinutes(instant);
  if (offset2 !== offset) instant = wallAsUTC - offset2 * 60000;
  return new Date(instant);
}

/**
 * Combine a picked date (its calendar day) and a picked time (its clock time),
 * both read from the browser's local wall-clock, into a Date representing that
 * wall-clock time in Europe/Athens.
 */
export function combineDateTimeAthens(date: Date, time: Date): Date {
  return athensWallClockToDate(
    date.getFullYear(), date.getMonth(), date.getDate(),
    time.getHours(), time.getMinutes(),
  );
}

/** Reinterpret a single picked Date (local wall-clock) as Europe/Athens time. */
export function localWallClockToAthens(d: Date): Date {
  return athensWallClockToDate(
    d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(),
  );
}
