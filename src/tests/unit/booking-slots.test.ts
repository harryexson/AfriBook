import { describe, it, expect } from 'vitest';
import { generateTimeSlots } from '@/components/marketplace/BookingCalendar';

const evening = new Date(2026, 9, 17, 21, 0); // 9pm on 17 Oct

describe('generateTimeSlots', () => {
  it('keeps every slot on a future date available, even late in the day', () => {
    const slots = generateTimeSlots('08:00', '19:00', 45, evening, new Date(2026, 9, 19));
    expect(slots.length).toBe(11);
    expect(slots.every((s) => s.available)).toBe(true);
    expect(slots[0].time).toBe('08:00');
    expect(slots.at(-1)?.time).toBe('18:00');
  });

  it("marks only today's earlier slots as past", () => {
    const noon = new Date(2026, 9, 17, 12, 10);
    const slots = generateTimeSlots('08:00', '19:00', 45, noon, new Date(2026, 9, 17));
    expect(slots.find((s) => s.time === '11:00')?.available).toBe(false);
    expect(slots.find((s) => s.time === '13:00')?.available).toBe(true);
  });

  it('yields no slots for a closed day', () => {
    expect(generateTimeSlots('00:00', '00:00', 45, evening, new Date(2026, 9, 18))).toHaveLength(0);
  });
});
