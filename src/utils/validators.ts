export const normalizePhoneDigits = (value: string) => value.replace(/\D/g, '');

export const isLikelyTurkishPhone = (value?: string): boolean => {
  if (!value?.trim()) return false;
  let digits = normalizePhoneDigits(value);
  if (digits.startsWith('90')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return /^5\d{9}$/.test(digits);
};

export const isValidDateInput = (value?: string): boolean => {
  if (!value) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
};
