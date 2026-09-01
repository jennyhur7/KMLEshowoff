import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_CARD } from './presets';
import { isKnownChapter } from './toc';
import type { AppState, CardStyle, LogEntry, Settings } from './types';

const KEY = 'kmle-showoff/v1';

export const DEFAULT_SETTINGS: Settings = {
  nickname: '',
  examDate: '',
  dailyGoal: 5,
  weeklyGoal: 30,
};

function emptyState(): AppState {
  return { version: 1, settings: { ...DEFAULT_SETTINGS }, logs: [], card: { ...DEFAULT_CARD } };
}

/** 저장된 값은 이전 버전이거나 손상됐을 수 있으므로 필드 단위로 되살린다. */
function reviveState(input: unknown): AppState {
  const base = emptyState();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Partial<AppState>;

  const logs = Array.isArray(raw.logs)
    ? raw.logs.filter(
        (l): l is LogEntry =>
          !!l && typeof l.id === 'string' && typeof l.date === 'string' && typeof l.chapterId === 'string' && isKnownChapter(l.chapterId),
      )
    : [];

  return {
    version: 1,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    card: { ...base.card, ...(raw.card ?? {}), show: { ...base.card.show, ...(raw.card?.show ?? {}) } },
    logs,
  };
}

function load(): AppState {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? reviveState(JSON.parse(stored)) : emptyState();
  } catch {
    // 사생활 보호 모드 등에서 localStorage 접근 자체가 예외를 던진다.
    return emptyState();
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // 저장에 실패해도 이번 세션은 계속 쓸 수 있게 둔다.
    }
  }, [state]);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const setCard = useCallback((patch: Partial<CardStyle>) => {
    setState((s) => ({ ...s, card: { ...s.card, ...patch } }));
  }, []);

  const setCardShow = useCallback((patch: Partial<CardStyle['show']>) => {
    setState((s) => ({ ...s, card: { ...s.card, show: { ...s.card.show, ...patch } } }));
  }, []);

  /** 같은 날 같은 단원은 하나만 둔다. 이미 있으면 지우고(토글 해제) 없으면 추가한다. */
  const toggleChapter = useCallback((date: string, chapterId: string) => {
    setState((s) => {
      const existing = s.logs.find((l) => l.date === date && l.chapterId === chapterId);
      if (existing) return { ...s, logs: s.logs.filter((l) => l !== existing) };
      const entry: LogEntry = { id: `${date}:${chapterId}`, date, chapterId };
      return { ...s, logs: [...s.logs, entry] };
    });
  }, []);

  const updateEntry = useCallback((date: string, chapterId: string, patch: Partial<Omit<LogEntry, 'id' | 'date' | 'chapterId'>>) => {
    setState((s) => ({
      ...s,
      logs: s.logs.map((l) => (l.date === date && l.chapterId === chapterId ? { ...l, ...patch } : l)),
    }));
  }, []);

  const clearDate = useCallback((date: string) => {
    setState((s) => ({ ...s, logs: s.logs.filter((l) => l.date !== date) }));
  }, []);

  const replaceAll = useCallback((next: AppState) => setState(reviveState(next)), []);

  const resetAll = useCallback(() => setState(emptyState()), []);

  return { state, setSettings, setCard, setCardShow, toggleChapter, updateEntry, clearDate, replaceAll, resetAll };
}

export type Store = ReturnType<typeof useAppState>;
