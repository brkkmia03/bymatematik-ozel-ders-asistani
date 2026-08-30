/**
 * UI tarafında hızlı arka arkaya oluşturulan kayıtlarda Date.now() çakışmasını
 * önleyen, tarayıcı destekliyorsa crypto.randomUUID kullanan kimlik üreticisi.
 */
export const createEntityId = (prefix: string): string => {
  const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `${prefix}-${cryptoApi.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};
