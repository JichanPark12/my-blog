---
title: "Next.js 16 및 Tailwind CSS v4 기반 블로그 아키텍처 기술 명세"
description: "React 19, Next.js 16 Canary, Tailwind CSS v4를 도입하여 구축한 기술 블로그의 아키텍처 결정 사항과 성능 최적화 방법론을 기술합니다."
category: "tech"
tags: ["nextjs", "react", "tailwind", "architecture", "vibe-coding"]
thumbnail: "/images/blog-architecture-thumbnail.jpg"
---

본 문서는 본 블로그를 구성하는 기술 스택과 아키텍처에 대한 기술 명세입니다.
최신 기술인 **Next.js 16 (Canary)**의 도입 배경 및 이를 활용한 성능 최적화 전략을 중점적으로 다룹니다.

## 1. 기술 스택 (Tech Stack)

본 프로젝트는 최신 웹 기술의 선제적 도입과 검증을 목표로 구성되었습니다.

### Next.js 16 & React 19

Next.js 16 도입의 주된 목적은 SSG를 활용하여 블로그의 성능을 극대화하는 것입니다.
특히 기존 **`unstable_cache`** 가 **`use cache`** 지시어로 변경되고 정식 출시됨에 따라 캐싱 전략이 크게
개선되었습니다.

덕분에 기존 API ROUTE를 사용한 캐싱 전략을 대신하여, 함수 단위의 명시적인 캐싱 제어가 가능해졌습니다.

```typescript
// src/lib/posts.ts

export async function getPostBySlug(slug: string) {
  "use cache";
  cacheTag(`posts/${slug}`);
  // ... 파일 시스템 접근 로직
}
```

위 코드는 실행 결과를 캐싱하며, `cacheTag`를 통해 데이터 변경 시 정밀한 캐시 무효화(Invalidation)를 수행합니다. 현재 파일(게시글) 추가 후 재배포 시 캐싱을 vercel에서 관리해주므로 별도의 캐시 무효화 로직은 필요하지 않습니다. 다만 추후 파일 시스템 대신 DB를 사용하게 된다면 캐시 무효화 로직이 필요할 수 있기에 확장성을 고려하여 위와 같이 작성했습니다.

## 2. 아키텍처: 빌드 타임 인덱싱 (Build-time Indexing)

파일 시스템 기반 CMS의 성능 저하 문제를 해결하기 위해 **빌드 타임 전처리(Preprocessing)** 방식을 도입했습니다.

### 메타데이터 생성 스크립트 (`scripts/generate-posts-map.mjs`)

빌드 프로세스 진입 전(`prebuild`) 단계에서 `posts-map.json`을 생성합니다.

1.  `posts` 디렉토리 재귀적 순회
2.  마크다운(`md`, `mdx`) Frontmatter 파싱
3.  Slug를 Key로 하는 Hash Map 구조 생성

```json
{
  "how-we-built-this": {
    "path": "posts/tech/how-we-built-this.md",
    "category": "tech",
    "title": "Next.js 16 및 Tailwind CSS v4 기반 블로그 아키텍처...",
    "date": "2026-02-12T..."
  }
}
```

### O(1) 조회 성능 확보

런타임 환경에서는 파일 시스템 탐색 없이 메모리에 로드된 `posts-map.json`을 참조합니다.
이를 통해 포스트 개수와 무관하게 **O(1)**의 시간 복잡도로 데이터 접근이 가능합니다.

```typescript
// Hash Map 참조를 통한 즉시 접근
const postData = postsMap[slug];
```

## 3. 카테고리 시스템 구조

디렉토리 구조와 카테고리를 1:1로 매핑하는 규칙을 적용하여 관리를 단순화했습니다.

- `posts/tech/post-1.md` → Category: **tech**
- `posts/life/story.md` → Category: **life**
- `posts/daily.md` → Category: **etc** (Root Directory)

스크립트가 파일 경로를 파싱하여 카테고리를 자동 할당하므로, 프론트매터의 중복 입력을 방지하고 정합성을 유지합니다.
