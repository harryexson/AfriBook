import { describe, it, expect } from 'vitest';

describe('Example Test Suite', () => {
  describe('Math Operations', () => {
    it('should add two numbers correctly', () => {
      expect(1 + 2).toBe(3);
    });

    it('should handle floating point', () => {
      expect(0.1 + 0.2).toBeCloseTo(0.3);
    });
  });

  describe('String Operations', () => {
    it('should concatenate strings', () => {
      expect('hello' + ' ' + 'world').toBe('hello world');
    });

    it('should handle template literals', () => {
      const name = 'AfriBook';
      expect(`Welcome to ${name}`).toBe('Welcome to AfriBook');
    });
  });

  describe('Array Operations', () => {
    it('should map correctly', () => {
      const arr = [1, 2, 3];
      expect(arr.map((x) => x * 2)).toEqual([2, 4, 6]);
    });

    it('should filter correctly', () => {
      const arr = [1, 2, 3, 4, 5];
      expect(arr.filter((x) => x > 3)).toEqual([4, 5]);
    });
  });
});
