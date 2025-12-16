import { Firm } from '@/types';

export function isBusinessHoursOpen(firm: Firm): boolean {
  const now = new Date();
  const tz = firm.timezone || 'America/New_York';

  // Convert current time to firm's timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  // Get day of week (0 = Sunday, 1 = Monday, etc.) in the firm's timezone
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const dayOfWeek = tzDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

  const parts = formatter.formatToParts(now);
  const currentTime = parts
    .filter((p) => p.type === 'hour' || p.type === 'minute')
    .map((p) => p.value)
    .join(':');

  // Check if today is an open day
  if (!firm.open_days.includes(dayOfWeek)) {
    return false;
  }

  // Check if current time is within business hours
  const [openHour, openMinute] = firm.open_time.split(':').map(Number);
  const [closeHour, closeMinute] = firm.close_time.split(':').map(Number);
  const [currentHour, currentMinute] = currentTime.split(':').map(Number);

  const openMinutes = openHour * 60 + openMinute;
  const closeMinutes = closeHour * 60 + closeMinute;
  const currentMinutes = currentHour * 60 + currentMinute;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

