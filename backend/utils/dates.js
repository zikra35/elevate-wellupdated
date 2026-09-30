// Date helpers that respect the user's local calendar day.
//
// The frontend sends:
//   - `tzOffset`: the value of `new Date().getTimezoneOffset()` (minutes, UTC - local)
//   - `from` / `to`: local calendar days as YYYY-MM-DD
//
// Date-only fields (MealLog.date, WorkoutLog.date) are stored as UTC midnight of the
// user's local day (e.g. "2026-09-30" -> 2026-09-30T00:00:00Z). Timestamp fields
// (Workout.date, loggedAt, createdAt) are real instants.

const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseTzOffset(value) {
  const n = Number(value);
  // Real offsets are within -14h..+12h
  return Number.isFinite(n) && Math.abs(n) <= 14 * 60 ? n : 0;
}

function isDayString(value) {
  return typeof value === 'string' && DAY_RE.test(value);
}

// "2026-09-30" -> Date at 2026-09-30T00:00:00Z
function dayToUtcDate(day) {
  return new Date(`${day}T00:00:00.000Z`);
}

// Local "today" for a user with the given offset, as YYYY-MM-DD.
function localToday(tzOffset = 0) {
  return new Date(Date.now() - tzOffset * 60000).toISOString().slice(0, 10);
}

// Local calendar day (YYYY-MM-DD) of an instant.
function instantToLocalDay(date, tzOffset = 0) {
  return new Date(new Date(date).getTime() - tzOffset * 60000).toISOString().slice(0, 10);
}

// The instant at which the user's local day begins.
function localDayStartInstant(day, tzOffset = 0) {
  return new Date(dayToUtcDate(day).getTime() + tzOffset * 60000);
}

/**
 * Read `from`, `to` and `tzOffset` from a query string.
 * Returns bounds for both date-only fields and timestamp fields.
 * Missing `from` means "all time"; missing `to` means "up to and including today".
 */
function rangeFromQuery(query = {}) {
  const tzOffset = parseTzOffset(query.tzOffset);
  const from = isDayString(query.from) ? query.from : null;
  const to = isDayString(query.to) ? query.to : localToday(tzOffset);
  const toExclusive = new Date(dayToUtcDate(to).getTime() + DAY_MS).toISOString().slice(0, 10);

  const dayFilter = { $lt: dayToUtcDate(toExclusive) };
  const instantFilter = { $lt: localDayStartInstant(toExclusive, tzOffset) };
  if (from) {
    dayFilter.$gte = dayToUtcDate(from);
    instantFilter.$gte = localDayStartInstant(from, tzOffset);
  }

  return { tzOffset, from, to, dayFilter, instantFilter };
}

module.exports = {
  DAY_MS,
  parseTzOffset,
  isDayString,
  dayToUtcDate,
  localToday,
  instantToLocalDay,
  localDayStartInstant,
  rangeFromQuery,
};
