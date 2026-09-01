import { addDays, dateKey, startOfWeek, weekKeys } from './date';
import { book, lookupChapter } from './toc';
import type { LogEntry } from './types';

export type Summary = {
  chapters: number;
  questions: number;
  minutes: number;
  /** 단원 수 기준 내림차순 */
  bySubject: { id: string; name: string; chapters: number; questions: number }[];
  entries: LogEntry[];
};

export function summarize(logs: LogEntry[], dates: string[]): Summary {
  const set = new Set(dates);
  const entries = logs.filter((l) => set.has(l.date));

  const perSubject = new Map<string, { chapters: number; questions: number }>();
  let questions = 0;
  let minutes = 0;

  for (const entry of entries) {
    questions += entry.questions ?? 0;
    minutes += entry.minutes ?? 0;
    const hit = lookupChapter(entry.chapterId);
    if (!hit) continue;
    const bucket = perSubject.get(hit.subject.id) ?? { chapters: 0, questions: 0 };
    bucket.chapters += 1;
    bucket.questions += entry.questions ?? 0;
    perSubject.set(hit.subject.id, bucket);
  }

  const bySubject = book.subjects
    .filter((s) => perSubject.has(s.id))
    .map((s) => ({ id: s.id, name: s.name, ...perSubject.get(s.id)! }))
    .sort((a, b) => b.chapters - a.chapters || a.name.localeCompare(b.name, 'ko'));

  return { chapters: entries.length, questions, minutes, bySubject, entries };
}

export function summarizeToday(logs: LogEntry[], today = dateKey(new Date())): Summary {
  return summarize(logs, [today]);
}

export function summarizeWeek(logs: LogEntry[], base = new Date()): Summary {
  return summarize(logs, weekKeys(base));
}

/** 단원 단위 누적 진도. 같은 단원을 여러 날 풀어도 하나로 센다. */
export function cumulativeProgress(logs: LogEntry[]) {
  const done = new Set<string>();
  for (const l of logs) done.add(l.chapterId);

  const bySubject = book.subjects.map((s) => {
    const count = s.chapters.reduce((acc, c) => acc + (done.has(c.id) ? 1 : 0), 0);
    return { id: s.id, name: s.name, done: count, total: s.chapters.length };
  });

  const total = bySubject.reduce((acc, s) => acc + s.total, 0);
  const doneCount = bySubject.reduce((acc, s) => acc + s.done, 0);
  return { done: doneCount, total, ratio: total ? doneCount / total : 0, bySubject, doneIds: done };
}

export type HeatCell = { date: string; count: number };

/** 최근 `weeks`주치를 월요일 시작 주 단위로 반환한다. 마지막 열이 이번 주. */
export function heatmap(logs: LogEntry[], weeks = 12, base = new Date()): HeatCell[][] {
  const counts = new Map<string, number>();
  for (const l of logs) counts.set(l.date, (counts.get(l.date) ?? 0) + 1);

  const thisWeekStart = startOfWeek(base);
  const firstStart = addDays(thisWeekStart, -7 * (weeks - 1));

  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const key = dateKey(addDays(firstStart, w * 7 + d));
      return { date: key, count: counts.get(key) ?? 0 };
    }),
  );
}

/** 오늘부터 거꾸로 세는 연속 기록일. 오늘 기록이 없으면 어제까지 이어진 것도 인정한다. */
export function streak(logs: LogEntry[], base = new Date()): number {
  const days = new Set(logs.map((l) => l.date));
  let cursor = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  if (!days.has(dateKey(cursor))) {
    cursor = addDays(cursor, -1);
    if (!days.has(dateKey(cursor))) return 0;
  }
  let count = 0;
  while (days.has(dateKey(cursor))) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}
