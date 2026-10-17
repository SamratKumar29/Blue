const THEME_KEY = 'blue-theme';

export function applyAppearance() {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', localStorage.getItem(THEME_KEY) === 'dark');
}

export function toggleTheme() {
  const next = localStorage.getItem(THEME_KEY) === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', next === 'dark');
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('blue-theme-change'));
  return next;
}