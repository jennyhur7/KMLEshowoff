export type Chapter = {
  id: string;
  name: string;
  /** 소화기·마이너·예방의학처럼 화면에 상위 분류가 있는 과목에만 존재 */
  group?: string;
};

export type Subject = {
  id: string;
  name: string;
  category: string;
  chapters: Chapter[];
  /** 원본 목차를 끝까지 확인하지 못한 과목 */
  incomplete?: boolean;
};

export type Book = {
  id: string;
  name: string;
  source: string;
  subjects: Subject[];
};

export type LogEntry = {
  id: string;
  /** 로컬 기준 YYYY-MM-DD */
  date: string;
  chapterId: string;
  /** 선택 입력. 목차에 문항 수가 없으므로 사용자가 직접 적을 때만 채워진다. */
  questions?: number;
  minutes?: number;
};

export type Settings = {
  nickname: string;
  /** YYYY-MM-DD. 비어 있으면 D-day를 쓰지 않는다. */
  examDate: string;
  /** 하루 목표 단원 수 */
  dailyGoal: number;
  /** 한 주 목표 단원 수 */
  weeklyGoal: number;
};

export type Ratio = 'story' | 'square' | 'wide';
export type Density = 'compact' | 'normal' | 'roomy';
export type Period = 'today' | 'week';

export type CardStyle = {
  ratio: Ratio;
  period: Period;
  presetId: string;
  bgFrom: string;
  bgTo: string;
  angle: number;
  accent: string;
  text: string;
  muted: string;
  density: Density;
  radius: number;
  comment: string;
  show: {
    chapters: boolean;
    subjectBars: boolean;
    heatmap: boolean;
    cumulative: boolean;
    dday: boolean;
    questions: boolean;
    minutes: boolean;
    watermark: boolean;
  };
};

export type AppState = {
  version: 1;
  settings: Settings;
  logs: LogEntry[];
  card: CardStyle;
};
