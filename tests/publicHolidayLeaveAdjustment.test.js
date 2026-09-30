const { describe, it, expect } = require('@jest/globals');
const { calculateLeaveDays } = require('../services/holidayLeaveAdjustment');

describe('public holiday leave adjustment', () => {
  it('counts valid working days while excluding weekends', () => {
    expect(calculateLeaveDays('2026-01-01', '2026-01-05', [])).toBe(3);
  });

  it('excludes newly published or deleted holiday dates correctly', () => {
    expect(calculateLeaveDays('2026-01-01', '2026-01-05', ['2026-01-01'])).toBe(2);
    expect(calculateLeaveDays('2026-01-01', '2026-01-05', ['2026-01-02'])).toBe(2);
  });

  it('excludes weekends while calculating valid leave days', () => {
    expect(calculateLeaveDays('2026-01-03', '2026-01-09', ['2026-01-05'])).toBe(4);
  });
});
