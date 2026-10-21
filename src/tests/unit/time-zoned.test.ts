import { describe, it, expect } from 'vitest';
import { zonedWallTimeToUtc } from '@/lib/time';

describe('zonedWallTimeToUtc', () => {
  it.each([
    // [zone, y, m, d, h, min, expected UTC]
    ['Africa/Lagos', 2026, 11, 3, 10, 0, '2026-11-03T09:00:00.000Z'], // UTC+1
    ['Africa/Blantyre', 2026, 11, 3, 10, 0, '2026-11-03T08:00:00.000Z'], // UTC+2
    ['Africa/Johannesburg', 2026, 11, 3, 14, 30, '2026-11-03T12:30:00.000Z'],
    ['America/New_York', 2026, 1, 15, 9, 0, '2026-01-15T14:00:00.000Z'], // EST
    ['America/New_York', 2026, 7, 15, 9, 0, '2026-07-15T13:00:00.000Z'], // EDT
    ['Europe/London', 2026, 7, 1, 12, 0, '2026-07-01T11:00:00.000Z'], // BST
    ['America/Toronto', 2026, 12, 1, 18, 0, '2026-12-01T23:00:00.000Z'],
  ])('%s %i-%i-%i %i:%i', (zone, y, m, d, h, min, expected) => {
    expect(zonedWallTimeToUtc(y as number, m as number, d as number, h as number, min as number, zone as string).toISOString()).toBe(expected);
  });

  it('handles the morning after a spring-forward DST change', () => {
    // US clocks jump 02:00 → 03:00 on 2026-03-08; 09:00 that day is EDT.
    expect(zonedWallTimeToUtc(2026, 3, 8, 9, 0, 'America/New_York').toISOString()).toBe('2026-03-08T13:00:00.000Z');
  });
});
