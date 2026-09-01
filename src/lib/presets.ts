import type { CardStyle } from './types';

export type Preset = {
  id: string;
  name: string;
  bgFrom: string;
  bgTo: string;
  angle: number;
  accent: string;
  text: string;
  muted: string;
};

export const PRESETS: Preset[] = [
  { id: 'shortcut', name: '숏컷', bgFrom: '#1b1630', bgTo: '#3a2d7a', angle: 160, accent: '#8b7bf5', text: '#ffffff', muted: '#b6b0d8' },
  { id: 'midnight', name: '미드나잇', bgFrom: '#0b0f1c', bgTo: '#16233f', angle: 155, accent: '#5fa8ff', text: '#ffffff', muted: '#93a4c4' },
  { id: 'paper', name: '종이', bgFrom: '#f7f4ec', bgTo: '#e8e2d4', angle: 150, accent: '#8a6d3b', text: '#2b2620', muted: '#7d7566' },
  { id: 'mint', name: '민트', bgFrom: '#06231f', bgTo: '#0d4a3c', angle: 165, accent: '#4ee0b0', text: '#ffffff', muted: '#93cbbb' },
  { id: 'sunset', name: '노을', bgFrom: '#3b1220', bgTo: '#7a2e2a', angle: 150, accent: '#ff9c6e', text: '#ffffff', muted: '#e0ab9c' },
  { id: 'mono', name: '모노', bgFrom: '#141414', bgTo: '#2a2a2a', angle: 160, accent: '#f0f0f0', text: '#ffffff', muted: '#9a9a9a' },
];

export function applyPreset(card: CardStyle, preset: Preset): CardStyle {
  return {
    ...card,
    presetId: preset.id,
    bgFrom: preset.bgFrom,
    bgTo: preset.bgTo,
    angle: preset.angle,
    accent: preset.accent,
    text: preset.text,
    muted: preset.muted,
  };
}

export const RATIO_SIZE = {
  story: { w: 540, h: 960, label: '스토리 9:16' },
  square: { w: 640, h: 640, label: '정사각 1:1' },
  wide: { w: 800, h: 450, label: '와이드 16:9' },
} as const;

export const DEFAULT_CARD: CardStyle = {
  ratio: 'story',
  period: 'today',
  presetId: 'shortcut',
  bgFrom: PRESETS[0].bgFrom,
  bgTo: PRESETS[0].bgTo,
  angle: PRESETS[0].angle,
  accent: PRESETS[0].accent,
  text: PRESETS[0].text,
  muted: PRESETS[0].muted,
  density: 'normal',
  radius: 28,
  comment: '',
  show: {
    chapters: true,
    subjectBars: true,
    heatmap: true,
    cumulative: true,
    dday: true,
    questions: true,
    minutes: false,
    watermark: true,
  },
};
