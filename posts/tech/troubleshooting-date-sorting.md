---
title: "트러블슈팅: 배포 시 게시글 정렬이 뒤섞이는 문제 (File System vs Frontmatter)"
description: "Git Clone 및 배포 환경에서 파일 생성 시간(birthtime)이 초기화되어 게시글 정렬이 깨지는 현상을 발견하고, Frontmatter 기반의 명시적 날짜 정렬로 마이그레이션한 과정을 기록합니다."
category: "tech"
tags: ["troubleshooting", "nextjs", "git", "deployment"]
date: "2026-02-12T03:45:00.000Z"
lastModified: "2026-02-12T03:45:00.000Z"
---

## 1. 문제 상황 (The Problem)

로컬 개발 환경에서는 게시글이 최신순으로 잘 정렬되어 있었는데, Vercel에 배포하거나 다른 환경에서 `git clone`을 했을 때 정렬 순서가 뒤섞이는 현상이 발생할 수 있음을 인지했습니다.

### 원인 분석

기존 로직은 파일 시스템의 메타데이터인 `fs.stat.birthtime` (생성 시간)을 기준으로 정렬하고 있었습니다.

```javascript
// scripts/generate-posts-map.mjs (Before)
const stat = await fs.stat(filePath);
return {
  date: stat.birthtime.toISOString(), // OS의 파일 생성 시간 의존
  // ...
};
```
처음에는 정말 잘 한 생각이라고 여겼습니다. 따로 귀찮게 date를 명시할 필요가 없어 보였기 때문입니다. 수정하면 수정된 날짜가 작성하면 작성된 날짜가 되는 것이기 때문입니다.

하지만 문제가 발생했습니다. 배포 환경에서 제대로 정렬되어 보이지 않는 문제가 존재했는데 이는 **Git은 파일의 생성 시간(Creation Time)을 보존하지 않기 때문입니다.**
새로운 환경에서 `git clone`을 하면, 모든 파일의 생성 시간이 "다운로드한 그 시점"으로 초기화됩니다. 이로 인해 모든 글의 날짜가 동일해지거나 의도치 않은 순서로 정렬되는 문제가 발생합니다.

## 2. 해결 방안 (The Solution)

파일 시스템의 메타데이터에 의존하는 대신, **컨텐츠 자체(Frontmatter)에 날짜를 명시**하는 방법으로 전환했습니다.

### 2.1 Frontmatter 업데이트

모든 마크다운 파일 상단에 `date`와 `lastModified` 필드를 추가했습니다.

```yaml
---
title: "Next.js 캐싱의 진화..."
category: "tech"
date: "2026-02-12T03:08:01.368Z" # 명시적 작성일
lastModified: "2026-02-12T03:28:20.682Z" # 명시적 수정일
---
```

### 2.2 생성 스크립트 수정

`scripts/generate-posts-map.mjs`가 Frontmatter의 날짜를 최우선으로 사용하도록로직을 변경했습니다.

```javascript
// scripts/generate-posts-map.mjs (After)
const { data } = matter(fileContent);
const stat = await fs.stat(filePath);

return {
  // Frontmatter에 날짜가 있으면 그것을 쓰고, 없으면 파일 시간(fallback) 사용
  date: data.date
    ? new Date(data.date).toISOString()
    : stat.birthtime.toISOString(),

  lastModified: data.lastModified
    ? new Date(data.lastModified).toISOString()
    : stat.mtime.toISOString(),
};
```

## 3. 결과

이제 배포 환경, 로컬 환경, 혹은 팀원이 새로 레포지토리를 클론하더라도 **항상 동일한 날짜와 정렬 순서** 가 보장됩니다.
환경에 구애받지 않는 빌드 결과물을 만들 수 있게 되었습니다.
