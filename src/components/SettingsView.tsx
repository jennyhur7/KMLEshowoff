import { useRef } from 'react';
import { todayKey } from '../lib/date';
import { book } from '../lib/toc';
import type { Store } from '../lib/store';
import { Button, Card, Field, SectionTitle, TextInput } from './ui';

export default function SettingsView({ store }: { store: Store }) {
  const { state, setSettings, replaceAll, resetAll } = store;
  const fileRef = useRef<HTMLInputElement>(null);

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kmle-showoff-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importJson(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      if (!confirm('가져오면 현재 기록을 덮어씁니다. 계속할까요?')) return;
      replaceAll(parsed);
      alert('가져왔습니다.');
    } catch {
      alert('읽을 수 없는 파일입니다.');
    }
  }

  const incomplete = book.subjects.filter((s) => s.incomplete);

  return (
    <div className="space-y-5 pb-4">
      <Card className="space-y-4 p-4">
        <SectionTitle>내 정보</SectionTitle>
        <Field label="닉네임" hint="자랑 이미지 위쪽에 표시됩니다.">
          <TextInput
            maxLength={16}
            placeholder="예: 본과4 J"
            value={state.settings.nickname}
            onChange={(e) => setSettings({ nickname: e.target.value })}
          />
        </Field>
        <Field label="국시 날짜" hint="비워두면 D-day를 쓰지 않습니다.">
          <TextInput type="date" value={state.settings.examDate} onChange={(e) => setSettings({ examDate: e.target.value })} />
        </Field>
      </Card>

      <Card className="space-y-4 p-4">
        <SectionTitle hint="단원 수 기준">목표</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="하루">
            <TextInput
              type="number"
              min={0}
              inputMode="numeric"
              value={state.settings.dailyGoal}
              onChange={(e) => setSettings({ dailyGoal: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Field>
          <Field label="한 주">
            <TextInput
              type="number"
              min={0}
              inputMode="numeric"
              value={state.settings.weeklyGoal}
              onChange={(e) => setSettings({ weeklyGoal: Math.max(0, Number(e.target.value) || 0) })}
            />
          </Field>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <SectionTitle hint={`기록 ${state.logs.length}건`}>데이터</SectionTitle>
        <p className="text-xs leading-relaxed text-white/45">
          기록은 이 브라우저에만 저장됩니다. 기기를 바꾸거나 브라우저 데이터를 지우면 사라지니, 가끔 내보내
          두는 편이 안전합니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportJson}>내보내기</Button>
          <Button onClick={() => fileRef.current?.click()}>가져오기</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void importJson(file);
              e.target.value = '';
            }}
          />
          <Button
            variant="danger"
            onClick={() => {
              if (confirm('모든 기록과 설정을 지웁니다. 되돌릴 수 없습니다. 계속할까요?')) resetAll();
            }}
          >
            전체 초기화
          </Button>
        </div>
      </Card>

      <Card className="space-y-2 p-4">
        <SectionTitle hint={book.name}>목차</SectionTitle>
        <p className="text-xs leading-relaxed text-white/45">
          {book.subjects.length}과목 · {book.subjects.reduce((a, s) => a + s.chapters.length, 0)}단원. 출처는{' '}
          {book.source}이며, 단원명만 담고 있습니다.
        </p>
        {incomplete.length > 0 ? (
          <p className="text-xs leading-relaxed text-amber-300/70">
            아래 과목은 원본 목차 뒷부분이 아직 확인되지 않아 단원이 더 있을 수 있습니다 —{' '}
            {incomplete.map((s) => s.name).join(', ')}.
          </p>
        ) : null}
      </Card>
    </div>
  );
}
