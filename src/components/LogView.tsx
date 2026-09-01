import { useMemo, useState } from 'react';
import { formatKorean, todayKey } from '../lib/date';
import { book, subjectsByCategory } from '../lib/toc';
import type { Store } from '../lib/store';
import type { Subject } from '../lib/types';
import { Button, Card, SectionTitle, TextInput } from './ui';

export default function LogView({ store }: { store: Store }) {
  const { state, toggleChapter, updateEntry, clearDate } = store;
  const [date, setDate] = useState(todayKey);
  const [query, setQuery] = useState('');
  const [openSubject, setOpenSubject] = useState<string | null>(null);

  const onDate = useMemo(() => new Map(state.logs.filter((l) => l.date === date).map((l) => [l.chapterId, l])), [state.logs, date]);
  const everDone = useMemo(() => new Set(state.logs.map((l) => l.chapterId)), [state.logs]);

  const q = query.trim().toLowerCase();
  const matches = (subject: Subject) =>
    !q ||
    subject.name.toLowerCase().includes(q) ||
    subject.chapters.some((c) => c.name.toLowerCase().includes(q) || (c.group ?? '').toLowerCase().includes(q));

  const groups = subjectsByCategory()
    .map((g) => ({ ...g, subjects: g.subjects.filter(matches) }))
    .filter((g) => g.subjects.length > 0);

  // 검색 중에는 결과를 바로 보여줘야 하므로 전부 펼친다.
  const isOpen = (id: string) => (q ? true : openSubject === id);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[10rem]">
            <span className="mb-1.5 block text-xs font-medium text-white/60">날짜</span>
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value || todayKey())} max={todayKey()} />
          </label>
          <Button onClick={() => setDate(todayKey())} disabled={date === todayKey()}>
            오늘로
          </Button>
        </div>
        <p className="mt-3 text-sm text-white/55">
          <span className="text-white/80">{formatKorean(date)}</span> · 푼 단원{' '}
          <span className="font-semibold tabular-nums text-violet-300">{onDate.size}</span>개
          {onDate.size > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (confirm(`${formatKorean(date)} 기록 ${onDate.size}건을 지울까요?`)) clearDate(date);
              }}
              className="ml-3 text-xs text-red-300/70 underline underline-offset-2 hover:text-red-300"
            >
              이 날짜 비우기
            </button>
          ) : null}
        </p>
      </Card>

      <TextInput placeholder="과목·단원 검색 (예: 부정맥, 간담췌)" value={query} onChange={(e) => setQuery(e.target.value)} />

      {groups.length === 0 ? (
        <p className="py-10 text-center text-sm text-white/40">검색 결과가 없습니다.</p>
      ) : null}

      {groups.map((group) => (
        <section key={group.category}>
          <SectionTitle>{group.category}</SectionTitle>
          <div className="space-y-2">
            {group.subjects.map((subject) => {
              const doneToday = subject.chapters.filter((c) => onDate.has(c.id)).length;
              const doneEver = subject.chapters.filter((c) => everDone.has(c.id)).length;
              const open = isOpen(subject.id);
              return (
                <Card key={subject.id}>
                  <button
                    type="button"
                    onClick={() => setOpenSubject(open && !q ? null : subject.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span className="flex-1">
                      <span className="text-sm font-medium text-white">{subject.name}</span>
                      {subject.incomplete ? (
                        <span
                          title="원본 목차 뒷부분이 아직 확인되지 않은 과목입니다."
                          className="ml-2 rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] text-amber-300"
                        >
                          미완
                        </span>
                      ) : null}
                      <span className="mt-0.5 block text-[11px] text-white/40">
                        누적 {doneEver}/{subject.chapters.length}
                        {doneToday > 0 ? <span className="ml-2 text-violet-300">오늘 +{doneToday}</span> : null}
                      </span>
                    </span>
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
                      <span
                        className="block h-full rounded-full bg-violet-500 transition-all"
                        style={{ width: `${(doneEver / subject.chapters.length) * 100}%` }}
                      />
                    </span>
                    <span className={`text-white/30 transition ${open ? 'rotate-180' : ''}`}>▾</span>
                  </button>

                  {open ? (
                    <ul className="border-t border-white/[0.07]">
                      {subject.chapters
                        .filter((c) => !q || c.name.toLowerCase().includes(q) || (c.group ?? '').toLowerCase().includes(q) || subject.name.toLowerCase().includes(q))
                        .map((chapter, i) => {
                          const entry = onDate.get(chapter.id);
                          const checked = !!entry;
                          return (
                            <li key={chapter.id} className="flex items-center gap-3 px-4 py-2 hover:bg-white/[0.02]">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={checked}
                                onClick={() => toggleChapter(date, chapter.id)}
                                className={`grid h-5 w-5 shrink-0 place-items-center rounded border text-[11px] transition ${
                                  checked ? 'border-violet-400 bg-violet-500 text-white' : 'border-white/20 text-transparent hover:border-white/40'
                                }`}
                              >
                                ✓
                              </button>
                              <span className="flex-1 text-sm leading-snug">
                                <span className="mr-1.5 tabular-nums text-white/25">{i + 1}</span>
                                {chapter.group ? <span className="mr-1 text-white/40">{chapter.group} ›</span> : null}
                                <span className={checked ? 'text-white' : everDone.has(chapter.id) ? 'text-white/70' : 'text-white/50'}>
                                  {chapter.name}
                                </span>
                                {!checked && everDone.has(chapter.id) ? <span className="ml-1.5 text-[10px] text-emerald-400/70">완료</span> : null}
                              </span>
                              {checked ? (
                                <input
                                  type="number"
                                  min={0}
                                  inputMode="numeric"
                                  placeholder="문항"
                                  value={entry.questions ?? ''}
                                  onChange={(e) =>
                                    updateEntry(date, chapter.id, {
                                      questions: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)),
                                    })
                                  }
                                  className="w-16 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-right text-xs tabular-nums text-white outline-none focus:border-violet-400/60"
                                />
                              ) : null}
                            </li>
                          );
                        })}
                    </ul>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>
      ))}

      <p className="pb-4 text-center text-[11px] text-white/25">
        전체 {book.subjects.length}과목 · {book.subjects.reduce((a, s) => a + s.chapters.length, 0)}단원
      </p>
    </div>
  );
}
