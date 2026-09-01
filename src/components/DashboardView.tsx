import { useMemo } from 'react';
import { daysUntil, formatKorean, todayKey, weekKeys } from '../lib/date';
import { cumulativeProgress, heatmap, streak, summarizeToday, summarizeWeek } from '../lib/stats';
import type { Store } from '../lib/store';
import { Card, SectionTitle, Stat } from './ui';

function Goal({ label, done, goal }: { label: string; done: number; goal: number }) {
  const ratio = goal > 0 ? Math.min(1, done / goal) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-xs">
        <span className="text-white/60">{label}</span>
        <span className="tabular-nums text-white/45">
          <span className={done >= goal && goal > 0 ? 'font-semibold text-emerald-400' : 'text-white/80'}>{done}</span> / {goal}단원
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${done >= goal && goal > 0 ? 'bg-emerald-400' : 'bg-violet-500'}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardView({ store }: { store: Store }) {
  const { logs, settings } = store.state;

  const today = useMemo(() => summarizeToday(logs), [logs]);
  const week = useMemo(() => summarizeWeek(logs), [logs]);
  const cumulative = useMemo(() => cumulativeProgress(logs), [logs]);
  const grid = useMemo(() => heatmap(logs, 12), [logs]);
  const run = useMemo(() => streak(logs), [logs]);
  const dday = daysUntil(settings.examDate);

  const thisWeek = weekKeys(new Date());
  const max = Math.max(1, ...grid.flat().map((c) => c.count));

  if (logs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-white/60">아직 기록이 없습니다.</p>
        <p className="mt-1 text-xs text-white/35">‘기록’ 탭에서 오늘 푼 단원을 체크해 보세요.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5 pb-4">
      <section>
        <SectionTitle hint={formatKorean(todayKey())}>오늘</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <Stat value={today.chapters} unit="단원" label="푼 단원" />
          <Stat value={today.questions || '—'} unit={today.questions ? '문제' : undefined} label="푼 문항" />
          <Stat value={run} unit="일" label="연속 기록" />
        </div>
      </section>

      <section>
        <SectionTitle hint={`${formatKorean(thisWeek[0])} ~ ${formatKorean(thisWeek[6])}`}>이번 주</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <Stat value={week.chapters} unit="단원" label="푼 단원" />
          <Stat value={week.questions || '—'} unit={week.questions ? '문제' : undefined} label="푼 문항" />
          <Stat value={week.bySubject.length} unit="과목" label="다룬 과목" />
        </div>
      </section>

      <Card className="space-y-4 p-4">
        <SectionTitle>목표</SectionTitle>
        <Goal label="오늘" done={today.chapters} goal={settings.dailyGoal} />
        <Goal label="이번 주" done={week.chapters} goal={settings.weeklyGoal} />
        {dday !== null ? (
          <p className="pt-1 text-xs text-white/45">
            국시까지{' '}
            <span className="font-semibold text-violet-300">
              {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : `D+${-dday}`}
            </span>
          </p>
        ) : null}
      </Card>

      <Card className="p-4">
        <SectionTitle hint="최근 12주">기록 히트맵</SectionTitle>
        <div className="flex gap-[3px] overflow-x-auto pb-1">
          {grid.map((col, i) => (
            <div key={i} className="flex flex-col gap-[3px]">
              {col.map((cell) => {
                const level = cell.count === 0 ? 0 : Math.ceil((cell.count / max) * 4);
                const bg = ['bg-white/[0.06]', 'bg-violet-500/25', 'bg-violet-500/45', 'bg-violet-500/70', 'bg-violet-400'][level];
                return (
                  <div
                    key={cell.date}
                    title={`${cell.date} · ${cell.count}단원`}
                    className={`h-3 w-3 shrink-0 rounded-[3px] ${bg}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-white/30">세로 한 칸이 하루(위가 월요일), 가로 한 칸이 한 주입니다.</p>
      </Card>

      <Card className="p-4">
        <SectionTitle hint={`${cumulative.done} / ${cumulative.total}단원 · ${(cumulative.ratio * 100).toFixed(1)}%`}>
          과목별 누적 진도
        </SectionTitle>
        <ul className="space-y-2">
          {cumulative.bySubject.map((s) => (
            <li key={s.id} className="flex items-center gap-3">
              <span className="w-24 shrink-0 truncate text-xs text-white/65">{s.name}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-violet-500" style={{ width: `${(s.done / s.total) * 100}%` }} />
              </span>
              <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-white/40">
                {s.done}/{s.total}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
