/**
 * Menghitung persentase perubahan antara dua nilai
 */
export const calculatePercentageChange = (val2024, val2025) => {
  if (val2024 === 0) {
    return val2025 > 0 ? 100 : 0;
  }
  return ((val2025 - val2024) / val2024) * 100;
};

