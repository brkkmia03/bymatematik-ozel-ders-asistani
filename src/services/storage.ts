import type { User } from '../types';

const LEGACY_PREFIX = 'bymatematik_v1_';
const APP_PREFIX = 'bymatematik_v2_';
const ACCOUNTS_KEY = `${APP_PREFIX}accounts`;
const SESSION_KEY = `${APP_PREFIX}active_session`;
const LEGACY_OWNER_KEY = `${APP_PREFIX}legacy_owner`;
const SNAPSHOT_PREFIX = `${APP_PREFIX}safety_snapshot_`;

export interface LocalAccountRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface BackupEnvelope<T = unknown> {
  app: 'bymatematik-ozel-ders-asistani';
  formatVersion: 2;
  exportedAt: string;
  user: { id: string; email: string } | null;
  checksum: string;
  payload: T;
}

const normalizeEmail = (value: string) => value.trim().toLocaleLowerCase('tr-TR');

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

export function listLocalAccounts(): LocalAccountRecord[] {
  const current = safeParse<LocalAccountRecord[]>(localStorage.getItem(ACCOUNTS_KEY));
  if (Array.isArray(current)) return current;

  const legacy = safeParse<LocalAccountRecord>(localStorage.getItem(`${LEGACY_PREFIX}local_account`));
  if (legacy?.id && legacy?.email) {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([legacy]));
    localStorage.setItem(LEGACY_OWNER_KEY, legacy.id);
    return [legacy];
  }
  return [];
}

export function findLocalAccount(email: string): LocalAccountRecord | null {
  const normalized = normalizeEmail(email);
  return listLocalAccounts().find(a => normalizeEmail(a.email) === normalized) || null;
}

export function upsertLocalAccount(account: LocalAccountRecord): void {
  const accounts = listLocalAccounts();
  const index = accounts.findIndex(a => a.id === account.id || normalizeEmail(a.email) === normalizeEmail(account.email));
  if (index >= 0) accounts[index] = account; else accounts.push(account);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function getStoredSessionUser(): User | null {
  const current = safeParse<User>(localStorage.getItem(SESSION_KEY));
  if (current?.id) return current;

  const legacy = safeParse<User>(localStorage.getItem(`${LEGACY_PREFIX}user`));
  if (legacy?.id) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(legacy));
    localStorage.setItem(LEGACY_OWNER_KEY, legacy.id);
    return legacy;
  }
  return null;
}

export function setStoredSessionUser(user: User | null): void {
  if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  else localStorage.removeItem(SESSION_KEY);
}

export function canMigrateLegacyData(userId?: string | null): boolean {
  if (!userId) return false;
  return localStorage.getItem(LEGACY_OWNER_KEY) === userId;
}

export function scopedKey(userId: string, key: string): string {
  return `${APP_PREFIX}u_${userId}_${key}`;
}

export function loadScoped<T>(userId: string | null | undefined, key: string, fallback: T): T {
  if (!userId) return fallback;
  const scoped = safeParse<T>(localStorage.getItem(scopedKey(userId, key)));
  if (scoped !== null) return scoped;

  if (canMigrateLegacyData(userId)) {
    const legacy = safeParse<T>(localStorage.getItem(`${LEGACY_PREFIX}${key}`));
    if (legacy !== null) {
      localStorage.setItem(scopedKey(userId, key), JSON.stringify(legacy));
      return legacy;
    }
  }
  return fallback;
}

export function saveScoped<T>(userId: string | null | undefined, key: string, value: T): void {
  if (!userId) return;
  try { localStorage.setItem(scopedKey(userId, key), JSON.stringify(value)); }
  catch (error) { console.warn(`Veri kaydedilemedi: ${key}`, error); }
}

export function clearScopedUserData(userId: string): void {
  const prefix = `${APP_PREFIX}u_${userId}_`;
  Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k));
}

function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function createBackupEnvelope<T>(payload: T, user: User | null): BackupEnvelope<T> {
  const payloadText = JSON.stringify(payload);
  return {
    app: 'bymatematik-ozel-ders-asistani',
    formatVersion: 2,
    exportedAt: new Date().toISOString(),
    user: user ? { id: user.id, email: user.email } : null,
    checksum: fnv1a(payloadText),
    payload,
  };
}

export function parseBackupEnvelope<T = any>(jsonText: string): { payload: T; isLegacy: boolean } {
  const parsed = JSON.parse(jsonText);
  if (parsed?.app === 'bymatematik-ozel-ders-asistani' && parsed?.formatVersion === 2) {
    if (!parsed.payload || typeof parsed.payload !== 'object') throw new Error('Yedek içeriği eksik.');
    const expected = fnv1a(JSON.stringify(parsed.payload));
    if (parsed.checksum !== expected) throw new Error('Yedek dosyası bütünlük kontrolünden geçemedi.');
    return { payload: parsed.payload as T, isLegacy: false };
  }
  if (parsed && typeof parsed === 'object' && (parsed.students || parsed.teacher || parsed.version)) {
    return { payload: parsed as T, isLegacy: true };
  }
  throw new Error('Desteklenmeyen yedek dosyası.');
}

export function saveSafetySnapshot(userId: string, jsonText: string): void {
  try {
    const key = `${SNAPSHOT_PREFIX}${userId}`;
    const existing = safeParse<Array<{ createdAt: string; data: string }>>(localStorage.getItem(key)) || [];
    const next = [{ createdAt: new Date().toISOString(), data: jsonText }, ...existing].slice(0, 3);
    localStorage.setItem(key, JSON.stringify(next));
  } catch (error) {
    console.warn('Güvenlik anlık görüntüsü oluşturulamadı.', error);
  }
}

export function hasScopedData(userId: string): boolean {
  const prefix = `${APP_PREFIX}u_${userId}_`;
  return Object.keys(localStorage).some(k => k.startsWith(prefix));
}
