import type { DutyAssignment } from './types.js';

/**
 * Format a Date object into ICS local datetime format: YYYYMMDDTHHMMSS
 */
function formatIcsDateTime(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Format a Date object into UTC timestamp: YYYYMMDDTHHMMSSZ
 */
function formatUtcTimestamp(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  const seconds = pad(date.getUTCSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape text for RFC 5545 iCalendar format
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Fold lines according to RFC 5545 (max 75 octets per line)
 */
function foldLine(line: string): string {
  const maxLength = 75;
  if (line.length <= maxLength) {
    return line;
  }
  const chunks: string[] = [];
  chunks.push(line.substring(0, maxLength));
  let i = maxLength;
  while (i < line.length) {
    chunks.push(` ${line.substring(i, i + maxLength - 1)}`);
    i += maxLength - 1;
  }
  return chunks.join('\r\n');
}

/**
 * Calculate match end time (default 50 minutes for standard waterpolo match slot)
 */
function getMatchDates(duty: DutyAssignment): { start: Date; end: Date } {
  const [yearStr, monthStr, dayStr] = duty.date.split('-');
  const [hourStr, minStr] = duty.time.split(':');

  const start = new Date(
    parseInt(yearStr, 10),
    parseInt(monthStr, 10) - 1,
    parseInt(dayStr, 10),
    parseInt(hourStr, 10),
    parseInt(minStr, 10),
    0,
  );

  // Default waterpolo match duration: 50 minutes
  const end = new Date(start.getTime() + 50 * 60 * 1000);
  return { start, end };
}

/**
 * Generate a complete RFC 5545 iCalendar string for a list of duties
 */
export function generateIcs(
  personName: string,
  duties: DutyAssignment[],
): string {
  const now = new Date();
  const dtStamp = formatUtcTimestamp(now);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//De Linge PCG//W-Rooster Kalender//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(`W-rooster ${personName}`)}`,
    'X-WR-TIMEZONE:Europe/Amsterdam',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Amsterdam',
    'X-LIC-LOCATION:Europe/Amsterdam',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'END:VTIMEZONE',
  ];

  for (const duty of duties) {
    const { start, end } = getMatchDates(duty);
    const startStr = formatIcsDateTime(start);
    const endStr = formatIcsDateTime(end);
    const uid = `${duty.id}@w-rooster.delinge-pcg.nl`;

    const rolesSummary = duty.roles.join(' & ');
    const rolesDetail = duty.roles.join(', ');
    const summary = `${rolesSummary}: ${duty.homeTeam} - ${duty.awayTeam}`;
    const description = `Dienst: ${rolesDetail}\nWedstrijd: ${duty.homeTeam} vs ${duty.awayTeam}\nDatum: ${duty.date}\nTijd: ${duty.time}\nZwembad: ${duty.pool}`;
    const location = duty.pool || 'Zwembad';

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART;TZID=Europe/Amsterdam:${startStr}`);
    lines.push(`DTEND;TZID=Europe/Amsterdam:${endStr}`);
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);
    lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    lines.push(`LOCATION:${escapeIcsText(location)}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('TRANSP:OPAQUE');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}

/**
 * Trigger download of the generated .ics file in browser
 */
export function downloadIcsFile(
  personName: string,
  duties: DutyAssignment[],
): void {
  const icsContent = generateIcs(personName, duties);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const sanitizedName = personName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-');
  const filename = `w-rooster-${sanitizedName}.ics`;

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
