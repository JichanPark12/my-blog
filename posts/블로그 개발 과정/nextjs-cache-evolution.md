---
title: "Next.js 캐싱의 진화: unstable_cache에서 use cache까지"
description: "Next.js의 캐싱 전략 변화 과정과 'use cache' 지시어의 등장 배경, 그리고 이를 실제 프로젝트에 어떻게 적용하는지 심도 있게 다룹니다."
category: "tech"
tags: ["nextjs", "caching", "performance", "react"]
date: "2026-02-12T03:08:01.368Z"
lastModified: "2026-02-12T03:28:20.682Z"
---

Next.js를 사용하면서 가장 혼란스럽고도 중요한 부분이 바로 **캐싱(Caching)**입니다.
특히 Next.js 13의 App Router 도입 이후, 캐싱 전략은 계속해서 진화해왔습니다.

오늘은 그 진화의 정점인 Next.js 15~16의 **`use cache`** 지시어와, 그 이전 단계였던 **`unstable_cache`**의 존재 이유에 대해 이야기해보려 합니다.

## 1. 왜 `unstable_cache`가 필요했을까?

Next.js 13+ App Router의 초기 캐싱 시스템은 `fetch` API의 확장에 기반을 두고 있었습니다.

```typescript
// 전통적인 fetch 기반 캐싱
const res = await fetch("https://api.example.com/data", {
  next: { revalidate: 3600 }, // 1시간 캐시
});
```

하지만 모든 데이터가 HTTP 요청(`fetch`)을 통해 오지는 않습니다.
특히 **Server Actions에서 DB에 직접 접근** 하는 경우 `fetch` 옵션을 사용할 수 없었죠.

```typescript
// DB 직접 접근 시 캐싱 불가 문제
export async function getUsers() {
  const users = await db.query("SELECT * FROM users"); // fetch가 아니므로 캐싱 옵션 X
  return users;
}
```

이를 우회하기 위해서 API ROUTE에 해당 내용을 넣는 방식도 존재했었습니다.

```typescript
// src/api/posts/route.ts
export async function GET() {
  const users = await db.query("SELECT * FROM users");
  return NextResponse.json(users);
}
```

하지만 이는 API ROUTE를 사용하는 것과 동일한 효과를 가져였기에 서버 액션의 장점이 없어지는 셈이였습니다.

이러한 상황을 해결하기 위해 등장한 것이 바로 **`unstable_cache`**입니다.
함수 실행 결과 자체를 캐싱할 수 있게 해주는 래퍼(Wrapper)였습니다.

```typescript
import { unstable_cache } from "next/cache";

const getCachedUsers = unstable_cache(
  async () => {
    return await db.query("SELECT * FROM users");
  },
  ["users-key"], // 캐시 키
  { revalidate: 3600 },
);
```

이름에 `unstable`이 붙어있음에도 불구하고, `fetch`를 사용하지 않는 서버 로직의 캐싱을 위해서는 선택의 여지가 없는 필수 기능이었습니다.

## 2. 게임 체인저: `"use cache"`

Next.js 16 (Canary) 및 React 19와 함께 **`"use cache"`** 지시어가 등장했습니다.
이것은 단순히 `unstable_cache`의 이름을 바꾼 것이 아니라, 컴파일러 레벨에서 캐싱을 통합한 개념입니다.

### 더 이상 래퍼(Wrapper)는 필요 없다

함수 최상단에 `"use cache"`만 선언하면, 해당 함수는 자동으로 캐싱 가능한 단위가 됩니다.

```typescript
export async function getUsers() {
  "use cache";
  cacheTag("users"); // 태그 설정도 직관적

  const users = await db.query("SELECT * FROM users");
  return users;
}
```

이제 Server Action이든, 일반 유틸리티 함수든, 파일 시스템 접근이든 상관없이 `"use cache"` 하나로 통일된 캐싱 전략을 가져갈 수 있습니다.

## 3. 핵심 개념: cacheLife & cacheTag

`"use cache"`와 함께 도입된 두 가지 중요한 개념이 있습니다.

### cacheLife (캐시 수명)

기존의 `revalidate` 숫자를 대체하는 더 직관적인 프로필 기반 설정입니다.

```typescript
import { unstable_cacheLife as cacheLife } from 'next/cache';

export async function getData() {
  "use cache";
  cacheLife("hours"); // seconds, minutes, days, weeks, max 등 프로필 사용
  return await db.query(...);
}
```

### cacheTag (캐시 무효화)

온디맨드 재검증(On-demand Revalidation)을 위한 태그 설정입니다.

```typescript
import { revalidateTag } from "next/cache";

// 데이터 조회
export async function getPost(slug) {
  "use cache";
  cacheTag(`post-${slug}`);
  return await db.post.findUnique({ where: { slug } });
}

// 데이터 수정 (Server Action)
export async function updatePost(slug, data) {
  await db.post.update({ where: { slug }, data });
  revalidateTag(`post-${slug}`, "max"); // 해당 태그의 캐시만 정확히 제거
}

export async function updateProduct() {
  await db.products.update(...)
  updateTag('products')
}
```

## 4.revalidateTag vs updateTag

Next.js 15+에서는 캐시 무효화를 위해 두 가지 선택지가 제공됩니다. 상황에 맞는 적절한 함수를 선택하는 것이 사용자 경험(UX)과 성능의 균형을 맞추는 핵심입니다.

### revalidateTag (Eventual Consistency)

- **동작 방식**: 해당 태그의 캐시를 "Stale(상한)" 상태로 마킹합니다.
- **사용자 경험**: 다음 요청 시 **여전히 캐시된 예전 데이터(Stale Data)**를 즉시 보여줍니다. 그리고 백그라운드에서 조용히 새로운 데이터를 가져와 캐시를 갱신합니다.
- **사용처**: 블로그 글 수정, 상품 목록 갱신 등 "즉시성"보다 "응답 속도"가 중요한 경우.
- **특징**: 사용자는 대기 시간 없이 빠른 응답을 받지만, 아주 잠시 동안 예전 데이터를 볼 수 있습니다.

```typescript
// 일반적인 데이터 갱신
await db.post.update(...);
revalidateTag("posts","max"); // 다음 방문자는 예전 글을 보고, 그 뒤에 갱신됨
```

### updateTag (Strong Consistency)

- **동작 방식**: 해당 태그의 캐시를 **즉시 삭제(Purge)** 합니다.
- **사용자 경험**: 다음 요청 시 캐시가 없으므로, 서버에서 **새로운 데이터를 가져올 때까지 대기(Blocking)** 해야 합니다.
- **사용처**: 마이페이지 수정, 장바구니 업데이트 등 사용자가 자신이 행한 결과를 **즉시 확인**해야 하는 경우 (Read-Your-Own-Writes).
- **특징**: 데이터의 정확성이 보장되지만, 네트워크 요청 시간만큼 응답이 느려질 수 있습니다. **Server Action** 내부에서만 사용할 수 있습니다.

```typescript
// 사용자 프로필 수정 (Server Action)
export async function updateProfile(formData) {
  "use server";
  await db.user.update(...);
  updateTag("user-profile"); // 사용자는 즉시 변경된 프로필을 봐야 함!
}
```

## 5. 마치며

`unstable_cache`는 과도기적 해결책이었고, `"use cache"`는 완성형 솔루션입니다.
이제 개발자는 "이 데이터를 어떻게 캐싱할까?"를 고민하기보다, "어떤 함수를 캐싱할까?"에 집중하면 됩니다.

사실상 모든 데이터가 정적 데이터인 저의 블로그 프로젝트 역시 파일 시스템 접근 비용을 줄이기 위해 이 `"use cache"`를 적극적으로 활용하고 있습니다.
