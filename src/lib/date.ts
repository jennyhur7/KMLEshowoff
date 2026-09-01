/** Date를 로컬 기준 YYYY-MM-DD로. toISOString은 UTC라 하루가 밀릴 수 있어 쓰지 않는다. */
export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return dateKey(new Date());
}

export function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

/** 월요일을 주의 시작으로 본다. */
export function startOfWeek(d: Date): Date {
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const shift = (start.getDay() + 6) % 7;
  return addDays(start, -shift);
}

export function weekKeys(d: Date): string[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i)));
}

/** 시험일까지 남은 일수. 오늘이면 0, 지났으면 음수. */
export function daysUntil(examDate: string): number | null {
  if (!examDate) return null;
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = parseKey(examDate).getTime() - base.getTime();
  return Math.round(diff / 86_400_000);
}

export function formatKorean(key: string): string {
  const d = parseKey(key);
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${weekday})`;
}
