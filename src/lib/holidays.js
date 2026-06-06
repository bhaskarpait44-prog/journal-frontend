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

export const getTargetDayInMonth = (year, month, target) => {
  const d = new Date(year, month + 1, 0); // Last day
  let diff = d.getDay() - target;
  if (diff < 0) diff += 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split('T')[0];
};

export function getAllAvailableExpiries(symbol, fromDate = new Date()) {
  // Ensure fromDate is a valid Date object
  let baseDate = fromDate instanceof Date ? fromDate : new Date(fromDate);
  if (isNaN(baseDate.getTime())) baseDate = new Date();

  const sym = symbol.toUpperCase();
  const expiries = new Set();
  const WEEKLY_INDICES = ['NIFTY', 'SENSEX'];
  const NSE_INDICES = ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'];
  const targetDay = NSE_INDICES.includes(sym) ? 2 : 4; // 2=Tue, 4=Thu

  // If today is expiry day and after 3:30 PM IST, skip today
  let adjustedFromDate = new Date(baseDate);
  const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  const hours = nowIST.getHours();
  const minutes = nowIST.getMinutes();
  
  if (hours > 15 || (hours === 15 && minutes >= 30)) {
    const d1 = baseDate.toISOString().split('T')[0];
    const d2 = nowIST.toISOString().split('T')[0];
    if (d1 === d2) {
      adjustedFromDate.setDate(adjustedFromDate.getDate() + 1);
    }
  }

  const todayStr = adjustedFromDate.toISOString().split('T')[0];

  // 1. Weekly (If applicable) - Add next 5 weeklies
  if (WEEKLY_INDICES.includes(sym) || ['BANKNIFTY', 'FINNIFTY', 'MIDCPNIFTY'].includes(sym)) {
    let d = new Date(adjustedFromDate);
    let diff = targetDay - d.getDay();
    if (diff < 0) diff += 7;
    d.setDate(d.getDate() + diff);
    
    for (let i = 0; i < 5; i++) {
      const temp = new Date(d);
      temp.setDate(temp.getDate() + (i * 7));
      expiries.add(temp.toISOString().split('T')[0]);
    }
  }

  // 2. Next 3 Monthly Expiries
  let mCount = 0;
  let mOffset = 0;
  while (mCount < 3) {
    const m = adjustedFromDate.getMonth() + mOffset;
    const y = adjustedFromDate.getFullYear();
    const exp = getTargetDayInMonth(y, m, targetDay);
    if (exp >= todayStr) {
      expiries.add(exp);
      mCount++;
    }
    mOffset++;
  }

  // 3. Next 3 Quarterly Expiries (Mar, Jun, Sep, Dec)
  const quarters = [2, 5, 8, 11]; // Month indices
  let qCount = 0;
  let yearOffset = 0;
  while (qCount < 3) {
    for (const qMonth of quarters) {
      const qYear = adjustedFromDate.getFullYear() + yearOffset;
      const exp = getTargetDayInMonth(qYear, qMonth, targetDay);
      if (exp >= todayStr) {
        expiries.add(exp);
        qCount++;
        if (qCount >= 3) break;
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
      const lYear = adjustedFromDate.getFullYear() + lYearOffset;
      const exp = getTargetDayInMonth(lYear, lMonth, targetDay);
      expiries.add(exp);
      lCount++;
      if (lCount >= 2) break;
    }
    lYearOffset++;
  }

  return Array.from(expiries).sort((a, b) => new Date(a) - new Date(b));
}
