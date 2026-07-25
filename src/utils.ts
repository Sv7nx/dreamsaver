import type { UserData } from './types';

export const STORAGE_KEY = 'dreamsaver_data';

export function loadData(): UserData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveData(data: UserData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function daysLeftInMonth(): number {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return daysInMonth - today.getDate() + 1;
}