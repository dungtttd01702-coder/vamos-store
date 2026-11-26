const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';
const VIETNAM_OFFSET = '+07:00';
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ISO_DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const VN_PARTS_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: VIETNAM_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

/**
 * Return current instant as a UTC Date.
 * @returns {Date}
 */
function nowUtc() {
  return new Date();
}

/**
 * Validate and normalize an input into a UTC Date clone.
 * @param {Date|string|number} value
 * @param {string} [label]
 * @returns {Date}
 */
function toUtcDate(value, label = 'timestamp') {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error(`Invalid ${label}: Date is NaN`);
    }
    return new Date(value.getTime());
  }
  if (value === null || value === undefined || value === '') {
    throw new Error(`Invalid ${label}: missing value`);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${label}: "${value}"`);
  }
  return parsed;
}

/**
 * Convert an optional timestamp value to ISO-8601 UTC string (`Z`).
 * @param {Date|string|number|null|undefined} value
 * @returns {string|null}
 */
function toUtcISOString(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return toUtcDate(value).toISOString();
}

/**
 * Add an exact number of 24-hour UTC days (`days * 86400s`).
 * @param {Date|string|number} dateInput
 * @param {number} days
 * @returns {Date}
 */
function addDaysUtc(dateInput, days) {
  const base = toUtcDate(dateInput, 'dateInput');
  const numDays = Number(days);
  if (!Number.isFinite(numDays)) {
    throw new Error(`Invalid days count: ${days}`);
  }
  return new Date(base.getTime() + numDays * MS_PER_DAY);
}

/**
 * Extract zero-padded Vietnam calendar & clock parts using IANA Asia/Ho_Chi_Minh.
 * Never depends on Node.js OS/process timezone.
 * @param {Date|string|number} dateInput
 * @returns {{ year: string, month: string, day: string, hour: string, minute: string, second: string, millisecond: number }}
 */
function getVietnamParts(dateInput) {
  const date = toUtcDate(dateInput, 'dateInput');
  const map = {};
  for (const part of VN_PARTS_FORMATTER.formatToParts(date)) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }
  return {
    year: map.year,
    month: map.month,
    day: map.day,
    hour: map.hour,
    minute: map.minute,
    second: map.second,
    millisecond: date.getUTCMilliseconds()
  };
}

/**
 * Format an instant into Vietnam calendar date `YYYY-MM-DD`.
 * @param {Date|string|number} [dateInput]
 * @returns {string}
 */
function getVietnameseCalendarDate(dateInput = nowUtc()) {
  const p = getVietnamParts(dateInput);
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Generate `YYMMDD` order code date prefix using Asia/Ho_Chi_Minh calendar date.
 * @param {Date|string|number} [dateInput]
 * @returns {string}
 */
function getVietnameseOrderDatePrefix(dateInput = nowUtc()) {
  const p = getVietnamParts(dateInput);
  return `${p.year.slice(-2)}${p.month}${p.day}`;
}

/**
 * Parse a `YYYY-MM-DD` HTML date input under Asia/Ho_Chi_Minh into UTC instants:
 * - `startUtc`: 00:00:00.000 Asia/Ho_Chi_Minh of that date
 * - `endExclusiveUtc`: 00:00:00.000 Asia/Ho_Chi_Minh of the next calendar day
 * Never uses `new Date('YYYY-MM-DD')` UTC-midnight parsing.
 * @param {string} value
 * @returns {{ calendarDate: string, nextCalendarDate: string, startUtc: Date, endExclusiveUtc: Date }}
 */
function parseVietnameseDateInput(value) {
  if (typeof value !== 'string') {
    throw new Error('Ngày nhập không hợp lệ (yêu cầu định dạng YYYY-MM-DD).');
  }
  const trimmed = value.trim();
  const match = ISO_DATE_ONLY_RE.exec(trimmed);
  if (!match) {
    throw new Error(`Ngày "${value}" không đúng định dạng YYYY-MM-DD.`);
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  const checkUtc = new Date(Date.UTC(year, month - 1, day));
  if (
    checkUtc.getUTCFullYear() !== year ||
    checkUtc.getUTCMonth() !== month - 1 ||
    checkUtc.getUTCDate() !== day
  ) {
    throw new Error(`Ngày "${trimmed}" không tồn tại trên lịch.`);
  }

  const nextCalendar = new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  const startUtc = new Date(`${trimmed}T00:00:00.000${VIETNAM_OFFSET}`);
  const endExclusiveUtc = new Date(`${nextCalendar}T00:00:00.000${VIETNAM_OFFSET}`);

  if (getVietnameseCalendarDate(startUtc) !== trimmed) {
    throw new Error(`Không thể chuyển đổi ngày "${trimmed}" sang múi giờ ${VIETNAM_TIMEZONE}.`);
  }

  return {
    calendarDate: trimmed,
    nextCalendarDate: nextCalendar,
    startUtc,
    endExclusiveUtc
  };
}

/**
 * Format instant for UI as `dd/MM/yyyy` in `Asia/Ho_Chi_Minh`.
 * @param {Date|string|number|null|undefined} dateInput
 * @returns {string}
 */
function formatVietnameseDate(dateInput) {
  if (dateInput === null || dateInput === undefined || dateInput === '') return '';
  const p = getVietnamParts(dateInput);
  return `${p.day}/${p.month}/${p.year}`;
}

/**
 * Format instant for UI as `HH:mm dd/MM/yyyy` (or `HH:mm:ss dd/MM/yyyy`) in `Asia/Ho_Chi_Minh`.
 * @param {Date|string|number|null|undefined} dateInput
 * @param {{ withSeconds?: boolean }} [options]
 * @returns {string}
 */
function formatVietnameseDateTime(dateInput, options = {}) {
  if (dateInput === null || dateInput === undefined || dateInput === '') return '';
  const p = getVietnamParts(dateInput);
  const timePart = options.withSeconds
    ? `${p.hour}:${p.minute}:${p.second}`
    : `${p.hour}:${p.minute}`;
  return `${timePart} ${p.day}/${p.month}/${p.year}`;
}

/**
 * Format voucher end timestamp in `Asia/Ho_Chi_Minh`.
 * When end timestamp falls exactly on `00:00:00.000` ICT (end-exclusive admin date boundary),
 * formats the inclusive last minute (`23:59 dd/MM/yyyy` of the selected end date).
 * @param {Date|string|number|null|undefined} endDateInput
 * @returns {string}
 */
function formatVietnameseVoucherEnd(endDateInput) {
  if (endDateInput === null || endDateInput === undefined || endDateInput === '') return '';
  const dt = toUtcDate(endDateInput, 'end_date');
  const p = getVietnamParts(dt);
  if (p.hour === '00' && p.minute === '00' && p.second === '00' && p.millisecond === 0) {
    return formatVietnameseDateTime(new Date(dt.getTime() - 1));
  }
  return formatVietnameseDateTime(dt);
}

module.exports = {
  VIETNAM_TIMEZONE,
  MS_PER_DAY,
  nowUtc,
  toUtcDate,
  toUtcISOString,
  addDaysUtc,
  getVietnamParts,
  getVietnameseCalendarDate,
  getVietnameseOrderDatePrefix,
  parseVietnameseDateInput,
  formatVietnameseDate,
  formatVietnameseDateTime,
  formatVietnameseVoucherEnd
};
