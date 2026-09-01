import { forwardRef } from 'react';
import { daysUntil, formatKorean, todayKey, weekKeys } from '../lib/date';
import { RATIO_SIZE } from '../lib/presets';
import { cumulativeProgress, heatmap, summarizeToday, summarizeWeek } from '../lib/stats';
import { lookupChapter } from '../lib/toc';
import type { CardStyle, LogEntry, Settings } from '../lib/types';

const DENSITY_SCALE = { compact: 0.86, normal: 1, roomy: 1.12 } as const;

/** 비율마다 세로 여유가 다르므로 본문 숫자 크기와 목록 길이를 따로 준다. */
const LAYOUT = {
  story: { hero: 88, listCap: 14, barMax: 6, heatWeeks: 12, gap: 22, pad: 44, heatCell: 9 },
  square: { hero: 74, listCap: 8, barMax: 4, heatWeeks: 12, gap: 16, pad: 40, heatCell: 9 },
  wide: { hero: 58, listCap: 5, barMax: 3, heatWeeks: 10, gap: 13, pad: 32, heatCell: 7 },
} as const;

function hexToRgba(hex: string, alpha: number): string {
  const v = hex.replace('#', '');
  const full = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export type ShareCardProps = {
  card: CardStyle;
  logs: LogEntry[];
  settings: Settings;
};

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(function ShareCard({ card, logs, settings }, ref) {
  const size = RATIO_SIZE[card.ratio];
  const L = LAYOUT[card.ratio];
  const s = DENSITY_SCALE[card.density];
  const pad = Math.round(L.pad * s);
  const gap = Math.round(L.gap * s);

  const isWeek = card.period === 'week';
  const summary = isWeek ? summarizeWeek(logs) : summarizeToday(logs);
  const days = weekKeys(new Date());
  const periodLabel = isWeek ? '이번 주' : '오늘';
  const rangeLabel = isWeek ? `${formatKorean(days[0])} – ${formatKorean(days[6])}` : formatKorean(todayKey());

  const dday = card.show.dday ? daysUntil(settings.examDate) : null;
  const grid = card.show.heatmap ? heatmap(logs, L.heatWeeks) : [];
  const heatMax = Math.max(1, ...grid.flat().map((c) => c.count));

  const chapters = summary.entries
    .map((e) => lookupChapter(e.chapterId))
    .filter((h): h is NonNullable<typeof h> => !!h);
  const bars = summary.bySubject.slice(0, L.barMax);
  const cumulative = cumulativeProgress(logs);

  const rowGap = Math.round(5 * s);
  const rowHeight = Math.round(12.5 * s * 1.5);
  const heatCell = Math.round(L.heatCell * s);
  const heatGap = Math.round(3 * s);
  const barRowHeight = Math.max(Math.round(12 * s * 1.2), Math.round(7 * s));
  const barGap = Math.round(8 * s);
  const spacerHeight = Math.round(8 * s);
  const commentText = card.comment.trim();

  /*
   * 카드 높이가 고정이라 내용이 넘치면 아래쪽이 잘린다. 모든 블록의 높이를
   * 직접 지정해 두었으므로 합계를 미리 재고, 예산을 넘으면 덜 중요한 블록부터
   * 접는다(단원 목록 → 히트맵 → 전체 진도 → 과목 막대). 닉네임·숫자·코멘트는
   * 언제나 남긴다.
   */
  const budget = size.h - pad * 2;
  const headerHeight = Math.round(15 * s * 1.2) + 3 + Math.round(12 * s * 1.2);
  const heroHeight = Math.round(13 * s * 1.2) + Math.round(2 * s) + Math.round(L.hero * s);
  const cumulativeHeight = Math.round(11.5 * s * 1.2) + Math.round(6 * s) + Math.round(5 * s);
  const heatHeight = 7 * heatCell + 6 * heatGap;
  const commentHeight = commentText ? Math.round(14 * s * 1.45) * (commentText.length > 18 ? 2 : 1) : 0;
  const watermarkHeight = card.show.watermark ? Math.round(10.5 * s * 1.2) : 0;

  let barCount = card.show.subjectBars ? bars.length : 0;
  let showCumulative = card.show.cumulative;
  let showHeat = card.show.heatmap && grid.length > 0;

  const fixedHeight = () => {
    const blocks = [headerHeight, heroHeight, spacerHeight];
    if (barCount > 0) blocks.push(barCount * barRowHeight + (barCount - 1) * barGap);
    if (showCumulative) blocks.push(cumulativeHeight);
    if (showHeat) blocks.push(heatHeight);
    if (commentHeight) blocks.push(commentHeight);
    if (watermarkHeight) blocks.push(watermarkHeight);
    return blocks.reduce((a, b) => a + b, 0) + gap * (blocks.length - 1);
  };

  // 목록을 넣을 자리부터 포기하고, 그래도 모자라면 아래 순서로 접는다.
  const degrade: (() => boolean)[] = [
    () => (showHeat ? ((showHeat = false), true) : false),
    () => (showCumulative ? ((showCumulative = false), true) : false),
    () => (barCount > 1 ? ((barCount -= 1), true) : false),
    () => (barCount === 1 ? ((barCount = 0), true) : false),
  ];
  for (const step of degrade) {
    while (fixedHeight() > budget && step()) {
      /* 한 단계씩 접으며 다시 잰다 */
    }
    if (fixedHeight() <= budget) break;
  }

  const shownBars = bars.slice(0, barCount);
  const barMax = Math.max(1, ...shownBars.map((b) => b.chapters));
  const showList = card.show.chapters && chapters.length > 0;

  // 남은 높이로 목록 줄 수를 정한다. 목록이 생기면 간격도 하나 더 든다.
  const remaining = budget - fixedHeight() - (showList ? gap : 0);
  const capacity = Math.max(0, Math.floor((remaining + rowGap) / (rowHeight + rowGap)));
  let shownCount = Math.min(chapters.length, L.listCap, capacity);
  // 접힌 개수를 알리는 줄도 한 자리를 차지한다.
  if (chapters.length > shownCount && shownCount > 0) shownCount -= 1;
  // 한 줄도 못 넣으면 "외 N단원"만 남아 의미가 없으니 블록을 통째로 접는다.
  if (shownCount < 1) shownCount = 0;
  const shownChapters = chapters.slice(0, shownCount);
  const overflowCount = chapters.length - shownCount;
  const listRows = shownCount > 0 ? shownCount + (overflowCount > 0 ? 1 : 0) : 0;

  return (
    <div
      ref={ref}
      style={{
        width: size.w,
        height: size.h,
        borderRadius: card.radius,
        padding: pad,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap,
        overflow: 'hidden',
        background: `linear-gradient(${card.angle}deg, ${card.bgFrom} 0%, ${card.bgTo} 100%)`,
        color: card.text,
        fontFamily: "Pretendard, system-ui, sans-serif",
        letterSpacing: '-0.01em',
      }}
    >
      {/* 머리말 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: Math.round(15 * s), fontWeight: 700, color: card.accent }}>
            {settings.nickname || 'KMLE'}
          </div>
          <div style={{ fontSize: Math.round(12 * s), color: card.muted, marginTop: 3 }}>{rangeLabel}</div>
        </div>
        {dday !== null ? (
          <div
            style={{
              fontSize: Math.round(12 * s),
              fontWeight: 700,
              color: card.accent,
              border: `1px solid ${hexToRgba(card.accent, 0.35)}`,
              borderRadius: 999,
              padding: `${Math.round(4 * s)}px ${Math.round(11 * s)}px`,
              whiteSpace: 'nowrap',
            }}
          >
            {dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : `D+${-dday}`}
          </div>
        ) : null}
      </div>

      {/* 큰 숫자 */}
      <div>
        <div style={{ fontSize: Math.round(13 * s), color: card.muted, marginBottom: Math.round(2 * s) }}>
          {periodLabel} 푼 단원
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: Math.round(8 * s) }}>
          <span style={{ fontSize: Math.round(L.hero * s), fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {summary.chapters}
          </span>
          <span style={{ fontSize: Math.round(20 * s), fontWeight: 600, color: card.muted }}>단원</span>
          {card.show.questions && summary.questions > 0 ? (
            <span style={{ fontSize: Math.round(17 * s), fontWeight: 600, color: card.accent, marginLeft: Math.round(6 * s) }}>
              {summary.questions}문제
            </span>
          ) : null}
          {card.show.minutes && summary.minutes > 0 ? (
            <span style={{ fontSize: Math.round(14 * s), color: card.muted }}>{summary.minutes}분</span>
          ) : null}
        </div>
      </div>

      {/* 과목별 막대 */}
      {shownBars.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(8 * s) }}>
          {shownBars.map((b) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: Math.round(9 * s) }}>
              <span style={{ width: Math.round(72 * s), fontSize: Math.round(12 * s), color: card.muted, flexShrink: 0 }}>
                {b.name}
              </span>
              <span
                style={{
                  flex: 1,
                  height: Math.round(7 * s),
                  borderRadius: 999,
                  background: hexToRgba(card.text, 0.12),
                  overflow: 'hidden',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    height: '100%',
                    width: `${(b.chapters / barMax) * 100}%`,
                    borderRadius: 999,
                    background: card.accent,
                  }}
                />
              </span>
              <span
                style={{
                  width: Math.round(22 * s),
                  textAlign: 'right',
                  fontSize: Math.round(12 * s),
                  color: card.muted,
                  fontVariantNumeric: 'tabular-nums',
                  flexShrink: 0,
                }}
              >
                {b.chapters}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* 단원 목록 */}
      {showList && listRows > 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: rowGap,
            flex: '0 0 auto',
            height: listRows * rowHeight + Math.max(0, listRows - 1) * rowGap,
            overflow: 'hidden',
          }}
        >
          {shownChapters.map((h, i) => (
            <div
              key={`${h.chapter.id}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: Math.round(7 * s),
                fontSize: Math.round(12.5 * s),
                height: rowHeight,
                lineHeight: `${rowHeight}px`,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flexShrink: 0,
              }}
            >
              <span style={{ color: card.accent, flexShrink: 0 }}>·</span>
              <span style={{ color: card.muted, flexShrink: 0 }}>{h.subject.name}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.chapter.name}</span>
            </div>
          ))}
          {overflowCount > 0 ? (
            <div
              style={{
                fontSize: Math.round(12 * s),
                height: rowHeight,
                lineHeight: `${rowHeight}px`,
                color: card.muted,
                paddingLeft: Math.round(14 * s),
                flexShrink: 0,
              }}
            >
              외 {overflowCount}단원
            </div>
          ) : null}
        </div>
      ) : null}

      <div style={{ flex: '1 1 auto', minHeight: spacerHeight }} />

      {/* 누적 진도 */}
      {showCumulative ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(6 * s) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: Math.round(11.5 * s), color: card.muted }}>
            <span>전체 진도</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {cumulative.done} / {cumulative.total}단원 · {(cumulative.ratio * 100).toFixed(1)}%
            </span>
          </div>
          <span style={{ height: Math.round(5 * s), borderRadius: 999, background: hexToRgba(card.text, 0.12), overflow: 'hidden' }}>
            <span
              style={{
                display: 'block',
                height: '100%',
                width: `${Math.max(cumulative.ratio * 100, cumulative.done > 0 ? 1.5 : 0)}%`,
                borderRadius: 999,
                background: card.accent,
              }}
            />
          </span>
        </div>
      ) : null}

      {/* 히트맵 */}
      {showHeat ? (
        <div style={{ display: 'flex', gap: heatGap }}>
          {grid.map((col, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: heatGap }}>
              {col.map((cell) => (
                <div
                  key={cell.date}
                  style={{
                    width: heatCell,
                    height: heatCell,
                    borderRadius: Math.round(2.5 * s),
                    background:
                      cell.count === 0
                        ? hexToRgba(card.text, 0.09)
                        : hexToRgba(card.accent, 0.3 + 0.7 * Math.min(1, cell.count / heatMax)),
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      ) : null}

      {/* 코멘트 · 워터마크 */}
      {commentText ? (
        <div style={{ fontSize: Math.round(14 * s), fontWeight: 600, color: card.text, lineHeight: 1.45 }}>{commentText}</div>
      ) : null}

      {card.show.watermark ? (
        <div style={{ fontSize: Math.round(10.5 * s), color: hexToRgba(card.muted, 0.75), letterSpacing: '0.04em' }}>
          KMLE SHOWOFF
        </div>
      ) : null}
    </div>
  );
});

export default ShareCard;
