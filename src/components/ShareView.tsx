import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { getFontEmbedCSS, toPng } from 'html-to-image';
import { todayKey } from '../lib/date';
import { PRESETS, RATIO_SIZE, applyPreset } from '../lib/presets';
import type { Store } from '../lib/store';
import type { Density, Period, Ratio } from '../lib/types';
import ShareCard from './ShareCard';
import { Button, Card, ColorInput, Field, SectionTitle, Segmented, Slider, TextInput, Toggle } from './ui';

/** 내보내기 배율. 스토리 기준 540×960 → 1080×1920. */
const PIXEL_RATIO = 2;

/**
 * 웹폰트를 base64로 인라인한 CSS. 1MB 남짓이라 내보낼 때마다 다시 만들면 느리므로
 * 한 번만 계산해 재사용한다.
 */
let fontEmbedCache: Promise<string> | null = null;
function fontEmbedCSS(node: HTMLElement): Promise<string> {
  fontEmbedCache ??= getFontEmbedCSS(node).catch(() => '');
  return fontEmbedCache;
}

export default function ShareView({ store }: { store: Store }) {
  const { state, setCard, setCardShow } = store;
  const card = state.card;
  const size = RATIO_SIZE[card.ratio];

  const cardRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // 미리보기는 실제 크기를 담을 수 없으므로 폭에 맞춰 줄인다.
  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const fit = () => setScale(Math.min(1, frame.clientWidth / size.w));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [size.w]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  async function render(): Promise<Blob | null> {
    const node = cardRef.current;
    if (!node) return null;
    await document.fonts.ready;
    const options = {
      pixelRatio: PIXEL_RATIO,
      width: size.w,
      height: size.h,
      fontEmbedCSS: await fontEmbedCSS(node),
    };
    // 사파리는 첫 호출에서 웹폰트가 빠진 결과를 내놓는 알려진 문제가 있어 두 번 그린다.
    await toPng(node, options);
    const dataUrl = await toPng(node, options);
    const res = await fetch(dataUrl);
    return res.blob();
  }

  const filename = `kmle-${card.period === 'week' ? 'week' : 'today'}-${todayKey()}.png`;

  async function download() {
    setBusy(true);
    try {
      const blob = await render();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setNotice('이미지를 저장했습니다.');
    } catch {
      setNotice('이미지를 만들지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  const canShare = typeof navigator !== 'undefined' && !!navigator.canShare;

  async function share() {
    setBusy(true);
    try {
      const blob = await render();
      if (!blob) return;
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        setNotice('이 브라우저는 이미지 공유를 지원하지 않습니다. 저장을 이용해 주세요.');
      }
    } catch (err) {
      // 공유 시트를 사용자가 닫은 경우는 오류로 알리지 않는다.
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setNotice('공유하지 못했습니다.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 pb-4">
      <div ref={frameRef} className="overflow-hidden">
        <div style={{ height: size.h * scale }} className="mx-auto" >
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: size.w, height: size.h }}>
            <ShareCard ref={cardRef} card={card} logs={state.logs} settings={state.settings} />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="primary" onClick={download} disabled={busy} className="flex-1">
          {busy ? '만드는 중…' : 'PNG 저장'}
        </Button>
        {canShare ? (
          <Button onClick={share} disabled={busy}>
            공유
          </Button>
        ) : null}
      </div>
      {notice ? <p className="text-center text-xs text-white/50">{notice}</p> : null}

      <Card className="space-y-4 p-4">
        <SectionTitle hint={`${size.w * PIXEL_RATIO}×${size.h * PIXEL_RATIO}`}>구도</SectionTitle>
        <Field label="비율">
          <Segmented<Ratio>
            value={card.ratio}
            onChange={(v) => setCard({ ratio: v })}
            options={[
              { value: 'story', label: '9:16' },
              { value: 'square', label: '1:1' },
              { value: 'wide', label: '16:9' },
            ]}
          />
        </Field>
        <Field label="기간">
          <Segmented<Period>
            value={card.period}
            onChange={(v) => setCard({ period: v })}
            options={[
              { value: 'today', label: '오늘' },
              { value: 'week', label: '이번 주' },
            ]}
          />
        </Field>
        <Field label="여백">
          <Segmented<Density>
            value={card.density}
            onChange={(v) => setCard({ density: v })}
            options={[
              { value: 'compact', label: '조밀' },
              { value: 'normal', label: '보통' },
              { value: 'roomy', label: '여유' },
            ]}
          />
        </Field>
        <Slider label="모서리" value={card.radius} min={0} max={64} suffix="px" onChange={(v) => setCard({ radius: v })} />
      </Card>

      <Card className="space-y-3 p-4">
        <SectionTitle>테마</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setCard(applyPreset(card, p))}
              className={`rounded-lg border p-2 text-left transition ${
                card.presetId === p.id ? 'border-violet-400 ring-2 ring-violet-400/25' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <span
                className="mb-1.5 block h-8 rounded"
                style={{ background: `linear-gradient(${p.angle}deg, ${p.bgFrom}, ${p.bgTo})` }}
              />
              <span className="text-[11px] text-white/65">{p.name}</span>
            </button>
          ))}
        </div>
        <div className="space-y-0.5 border-t border-white/[0.07] pt-3">
          <ColorInput label="배경 시작" value={card.bgFrom} onChange={(v) => setCard({ bgFrom: v, presetId: 'custom' })} />
          <ColorInput label="배경 끝" value={card.bgTo} onChange={(v) => setCard({ bgTo: v, presetId: 'custom' })} />
          <ColorInput label="강조색" value={card.accent} onChange={(v) => setCard({ accent: v, presetId: 'custom' })} />
          <ColorInput label="본문 글자" value={card.text} onChange={(v) => setCard({ text: v, presetId: 'custom' })} />
          <ColorInput label="보조 글자" value={card.muted} onChange={(v) => setCard({ muted: v, presetId: 'custom' })} />
          <Slider
            label="그라디언트 각도"
            value={card.angle}
            min={0}
            max={360}
            suffix="°"
            onChange={(v) => setCard({ angle: v, presetId: 'custom' })}
          />
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <SectionTitle>표시 항목</SectionTitle>
        <Toggle label="푼 단원 목록" checked={card.show.chapters} onChange={(v) => setCardShow({ chapters: v })} />
        <Toggle label="과목별 막대" checked={card.show.subjectBars} onChange={(v) => setCardShow({ subjectBars: v })} />
        <Toggle label="기록 히트맵" checked={card.show.heatmap} onChange={(v) => setCardShow({ heatmap: v })} />
        <Toggle label="전체 진도" checked={card.show.cumulative} onChange={(v) => setCardShow({ cumulative: v })} />
        <Toggle label="푼 문항 수" checked={card.show.questions} onChange={(v) => setCardShow({ questions: v })} />
        <Toggle label="공부 시간" checked={card.show.minutes} onChange={(v) => setCardShow({ minutes: v })} />
        <Toggle label="D-day" checked={card.show.dday} onChange={(v) => setCardShow({ dday: v })} />
        <Toggle label="워터마크" checked={card.show.watermark} onChange={(v) => setCardShow({ watermark: v })} />
      </Card>

      <Card className="p-4">
        <SectionTitle>한 줄 코멘트</SectionTitle>
        <TextInput
          maxLength={40}
          placeholder="오늘도 살아남았다"
          value={card.comment}
          onChange={(e) => setCard({ comment: e.target.value })}
        />
      </Card>
    </div>
  );
}
