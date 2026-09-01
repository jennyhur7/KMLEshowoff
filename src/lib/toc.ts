import raw from '../../data/toc-shortcut.json';
import type { Book, Chapter, Subject } from './types';

export const book = raw as Book;

const chapterIndex = new Map<string, { chapter: Chapter; subject: Subject }>();
for (const subject of book.subjects) {
  for (const chapter of subject.chapters) {
    chapterIndex.set(chapter.id, { chapter, subject });
  }
}

export function lookupChapter(id: string) {
  return chapterIndex.get(id);
}

export const totalChapters = chapterIndex.size;

/** 목차에 남아 있는 단원 id만 남긴다. 목차가 갱신되어 사라진 단원의 기록을 거른다. */
export function isKnownChapter(id: string): boolean {
  return chapterIndex.has(id);
}

export function chapterLabel(id: string): string {
  const hit = chapterIndex.get(id);
  if (!hit) return id;
  const { chapter, subject } = hit;
  return chapter.group ? `${subject.name} · ${chapter.group} · ${chapter.name}` : `${subject.name} · ${chapter.name}`;
}

/** 과목을 category(내과/외과/…) 단위로 묶어 목록 UI에 쓴다. */
export function subjectsByCategory(): { category: string; subjects: Subject[] }[] {
  const out: { category: string; subjects: Subject[] }[] = [];
  for (const subject of book.subjects) {
    let bucket = out.find((b) => b.category === subject.category);
    if (!bucket) {
      bucket = { category: subject.category, subjects: [] };
      out.push(bucket);
    }
    bucket.subjects.push(subject);
  }
  return out;
}
