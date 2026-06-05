/**
 * NSE/BSE Trading Holidays 2024-2025
 * Format: YYYY-MM-DD
 */
export const TRADING_HOLIDAYS = [
  // 2024
  '2024-01-22', // Ram Mandir Inauguration (Special Holiday)
  '2024-01-26', // Republic Day
  '2024-03-08', // Mahashivratri
  '2024-03-25', // Holi
  '2024-03-29', // Good Friday
  '2024-04-11', // Id-ul-Fitr
  '2024-04-17', // Shri Ram Navami
  '2024-05-01', // Maharashtra Day
  '2024-05-20', // General Elections (Lok Sabha)
  '2024-06-17', // Bakri Id
  '2024-07-17', // Muharram
  '2024-08-15', // Independence Day
  '2024-10-02', // Mahatma Gandhi Jayanti
  '2024-11-01', // Diwali Laxmi Pujan (Muhurat trading is separate, but regular hours are closed)
  '2024-11-15', // Guru Nanak Jayanti
  '2024-12-25', // Christmas

  // 2025 (Projected)
  '2025-01-26', // Republic Day
  '2025-02-26', // Mahashivratri
  '2025-03-14', // Holi
  '2025-03-31', // Id-ul-Fitr
  '2025-04-10', // Mahavir Jayanti
  '2025-04-14', // Dr. Ambedkar Jayanti
  '2025-04-18', // Good Friday
  '2025-05-01', // Maharashtra Day
  '2025-08-15', // Independence Day
  '2025-10-02', // Mahatma Gandhi Jayanti
  '2025-10-21', // Diwali
  '2025-11-05', // Guru Nanak Jayanti
  '2025-12-25', // Christmas

  // 2026
  '2026-01-26', // Republic Day
  '2026-02-16', // Mahashivratri
  '2026-03-05', // Holi
  '2026-03-20', // Id-ul-Fitr
  '2026-04-01', // Mahavir Jayanti
  '2026-04-03', // Good Friday
  '2026-04-14', // Dr. Ambedkar Jayanti
  '2026-05-01', // Maharashtra Day
  '2026-05-27', // Id-ul-Zuha (Bakri Id)
  '2026-08-15', // Independence Day
  '2026-10-02', // Mahatma Gandhi Jayanti
  '2026-10-20', // Dussehra
  '2026-11-09', // Diwali Laxmi Pujan
  '2026-11-24', // Guru Nanak Jayanti
  '2026-12-25', // Christmas
];

/**
 * Checks if a date is a weekend (Saturday/Sunday)
 */
export function isWeekend(date) {
  const d = new Date(date);
  const day = d.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

/**
 * Checks if a date is a trading holiday
 */
export function isHoliday(dateString) {
  return TRADING_HOLIDAYS.includes(dateString);
}

/**
 * Adjusts a date to the previous trading day if it falls on a weekend or holiday
 */
export function getPreviousTradingDay(dateString) {
  let date = new Date(dateString);
  
  // Decrease date until it's a trading day
  while (true) {
    const isoDate = date.toISOString().split('T')[0];
    if (!isWeekend(date) && !isHoliday(isoDate)) {
      return isoDate;
    }
    date.setDate(date.getDate() - 1);
  }
}

/**
 * Generates all valid exchange expiries for a symbol:
 * - Weekly (Benchmark indices)
 * - Monthly (Next 3 months)
 * - Quarterly (Next 3 quarters: Mar, Jun, Sep, Dec)
 * - Half-Yearly / Long-term (Next 2 semi-annuals: Jun, Dec)
 */
export function getAllAvailableExpiries(symbol, fromDate = new Date()) {
  const sym = symbol.toUpperCase();
  const date = new Date(fromDate);
  const expiries = new Set();

  const WEEKLY_INDICES = ['NIFTY', 'SENSEX'];
  const NSE_INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
  const targetDay = NSE_INDICES.includes(sym) ? 2 : 4; // 2=Tue, 4=Thu

  const getTargetDayInMonth = (year, month, target) => {
    const d = new Date(year, month + 1, 0); // Last day
    let diff = d.getDay() - target;
    if (diff < 0) diff += 7;
    d.setDate(d.getDate() - diff);
    return d.toISOString().split('T')[0];
  };

  // 1. Weekly (If applicable)
  if (WEEKLY_INDICES.includes(sym)) {
    let d = new Date(date);
    let diff = targetDay - d.getDay();
    if (diff < 0) diff += 7;
    d.setDate(d.getDate() + diff);
    expiries.add(d.toISOString().split('T')[0]);
  }

  // 2. Next 3 Monthly Expiries
  for (let i = 0; i < 3; i++) {
    const m = date.getMonth() + i;
    const y = date.getFullYear();
    const exp = getTargetDayInMonth(y, m, targetDay);
    // Only add if it hasn't passed (for current month)
    if (new Date(exp) >= new Date(date.toISOString().split('T')[0])) {
      expiries.add(exp);
    }
  }

  // 3. Next 3 Quarterly Expiries (Mar, Jun, Sep, Dec)
  const quarters = [2, 5, 8, 11]; // Month indices
  let qCount = 0;
  let yearOffset = 0;
  while (qCount < 3) {
    for (const qMonth of quarters) {
      const qYear = date.getFullYear() + yearOffset;
      const exp = getTargetDayInMonth(qYear, qMonth, targetDay);
      if (new Date(exp) >= new Date(date.toISOString().split('T')[0]) && qCount < 3) {
        if (!expiries.has(exp)) {
          expiries.add(exp);
          qCount++;
        }
      }
    }
    yearOffset++;
  }

  // 4. Long Term / Half-Yearly (Next 2: Jun, Dec of future years)
  const longTerms = [5, 11];
  let lCount = 0;
  let lYearOffset = 1;
  while (lCount < 2) {
    for (const lMonth of longTerms) {
      const lYear = date.getFullYear() + lYearOffset;
      const exp = getTargetDayInMonth(lYear, lMonth, targetDay);
      if (!expiries.has(exp)) {
        expiries.add(exp);
        lCount++;
      }
    }
    lYearOffset++;
  }

  return Array.from(expiries).sort((a, b) => new Date(a) - new Date(b));
}
