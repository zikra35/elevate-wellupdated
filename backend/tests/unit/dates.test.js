const {
  parseTzOffset,
  isDayString,
  dayToUtcDate,
  instantToLocalDay,
  localDayStartInstant,
  rangeFromQuery,
} = require('../../utils/dates');

describe('utils/dates', () => {
  test('parseTzOffset accepts real offsets and rejects junk', () => {
    expect(parseTzOffset('-300')).toBe(-300);
    expect(parseTzOffset(-300)).toBe(-300);
    expect(parseTzOffset('abc')).toBe(0);
    expect(parseTzOffset(99999)).toBe(0);
    expect(parseTzOffset(undefined)).toBe(0);
  });

  test('isDayString only accepts YYYY-MM-DD', () => {
    expect(isDayString('2026-09-30')).toBe(true);
    expect(isDayString('2026-9-30')).toBe(false);
    expect(isDayString('2026-09-30T00:00:00Z')).toBe(false);
    expect(isDayString(undefined)).toBe(false);
  });

  test('dayToUtcDate stores a local day as UTC midnight', () => {
    expect(dayToUtcDate('2026-09-30').toISOString()).toBe('2026-09-30T00:00:00.000Z');
  });

  test('instantToLocalDay uses the user timezone, not UTC', () => {
    // 2026-09-30 20:30 UTC is already 2026-10-01 in Pakistan (UTC+5, offset -300)
    expect(instantToLocalDay('2026-09-30T20:30:00Z', -300)).toBe('2026-10-01');
    expect(instantToLocalDay('2026-09-30T20:30:00Z', 0)).toBe('2026-09-30');
  });

  test('localDayStartInstant gives local midnight as an instant', () => {
    // Local midnight in Pakistan is 19:00 UTC the previous day
    expect(localDayStartInstant('2026-10-01', -300).toISOString()).toBe('2026-09-30T19:00:00.000Z');
  });

  test('rangeFromQuery builds inclusive day ranges', () => {
    const r = rangeFromQuery({ from: '2026-09-24', to: '2026-09-30', tzOffset: '-300' });
    expect(r.dayFilter.$gte.toISOString()).toBe('2026-09-24T00:00:00.000Z');
    expect(r.dayFilter.$lt.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(r.instantFilter.$gte.toISOString()).toBe('2026-09-23T19:00:00.000Z');
    expect(r.instantFilter.$lt.toISOString()).toBe('2026-09-30T19:00:00.000Z');
  });

  test('rangeFromQuery without from means all time', () => {
    const r = rangeFromQuery({ to: '2026-09-30' });
    expect(r.from).toBeNull();
    expect(r.dayFilter.$gte).toBeUndefined();
    expect(r.dayFilter.$lt.toISOString()).toBe('2026-10-01T00:00:00.000Z');
  });
});
