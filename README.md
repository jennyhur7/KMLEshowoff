# KMLEshowoff

KMLE를 얼마나 풀었는지 자랑하는 페이지.

목차에서 오늘·이번 주에 푼 단원을 체크하면, 그 기록을 담은 이미지를 만들어 준다.
색·비율·표시 항목은 원하는 대로 바꿀 수 있다.

## 쓰는 법

1. **설정** — 닉네임, 국시 날짜, 하루/한 주 목표를 정한다.
2. **기록** — 과목을 펼쳐 오늘 푼 단원을 체크한다. 문항 수는 적고 싶을 때만 적으면 된다.
3. **대시보드** — 오늘·이번 주 통계, 연속 기록, 히트맵, 과목별 누적 진도를 본다.
4. **자랑** — 비율과 테마를 고르고 PNG로 내려받는다.

## 개발

```bash
npm install
npm run dev        # 개발 서버
npm run build      # 타입 검사 + 프로덕션 빌드
npm run typecheck
```

연기 테스트는 빌드 결과를 띄운 뒤 돌린다. 이미지 내보내기가 실제로 동작하는지
브라우저에서 확인한다.

```bash
npx playwright install chromium   # 처음 한 번
npm run build && npm run preview &
npm run smoke
```

`main`에 푸시하면 GitHub Actions가 GitHub Pages로 배포한다.

## 구조

```
data/toc-shortcut.json   목차 (과목 → 단원). 문항 수 없이 단원명만.
src/lib/                 타입, 목차 색인, 날짜 계산, 통계, localStorage 저장
src/components/          기록·대시보드·자랑·설정 화면과 이미지 카드
public/fonts/            Pretendard 서브셋 (자체 호스팅)
```

### 저장

기록은 브라우저 `localStorage`에만 남는다. 서버도 계정도 없다. 기기를 바꾸거나
브라우저 데이터를 지우면 사라지므로, **설정 → 데이터 → 내보내기**로 가끔 백업해 두는 편이 좋다.

### 목차

`data/toc-shortcut.json`은 shortcutedu.co.kr 문제학습 목차에서 과목·단원명만 옮긴 것이다.
문제 지문이나 해설은 담지 않는다. 아래 과목은 원본 화면 뒷부분을 아직 확인하지 못해
단원이 더 있을 수 있고, JSON에 `"incomplete": true`로 표시해 두었다.

| 과목 | 마지막으로 확인한 단원 |
| --- | --- |
| 산과 각론 | 24. 산과 수기 및 수술 |
| 정신과 | 25. 사법/지역사회 정신의학 |
| 마이너 | 42. 정형외과 ▸ 기타 |
| 예방의학 | 20. 보건의료관리 ▸ 보건사업의 실제 |

소아과총론·소아과각론 I, 부인과는 아직 들어 있지 않다. `마이너`는 원본 화면에서
과목명을 확인하지 못해 임시로 붙인 이름이다.

### 폰트

Pretendard(SIL Open Font License 1.1)를 CDN이 아니라 `public/fonts/`에서 직접 제공한다.
`html-to-image`가 내보낼 때 `@font-face` 규칙을 읽어야 하는데, 교차 출처 스타일시트는
`cssRules` 접근이 막혀 있어 CDN을 쓰면 내보낸 이미지에서 글꼴이 빠진다.
라이선스 전문은 `public/fonts/LICENSE.txt`에 있다.
