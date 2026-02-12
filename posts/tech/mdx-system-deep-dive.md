---
title: "Next.js 블로그의 핵심: MDX와 Frontmatter 파이프라인 분석"
description: "gray-matter를 이용한 메타데이터 추출부터 next-mdx-remote를 활용한 RSC 기반 렌더링, 그리고 커스텀 컴포넌트 주입까지의 전체 기술 스택을 상세히 분석합니다."
category: "tech"
tags: ["nextjs", "mdx", "blog", "architecture"]
date: "2026-02-12T05:30:00.000Z"
lastModified: "2026-02-12T05:30:00.000Z"
---

이 블로그는 단순한 텍스트가 아닌, 컴포넌트가 살아있는 **MDX** 를 기반으로 동작합니다.
마크다운 파일을 브라우저에 렌더링하기까지 어떤 기술들이 사용되었고, 어떻게 파이프라인이 구성되어 있는지 정리 해봤습니다.

## 1. 메타데이터 추출: `gray-matter`

모든 마크다운 처리의 시작은 '파싱'입니다.
저의 프로젝트는 빌드 타임에 `scripts/generate-posts-map.mjs`를 실행하여 모든 글의 정보를 수집하는데, 이때 **`gray-matter`**가 핵심적인 역할을 합니다.

### 역할

마크다운 파일 상단의 YAML 형식(Frontmatter)과 본문(Content)을 분리합니다.

```javascript
import matter from "gray-matter";

const fileContent = await fs.readFile(filePath, "utf-8");
const { data, content } = matter(fileContent);

// data: { title: "...", date: "..." } -> 메타데이터 (JSON 인덱싱 용도)
// content: "# Hello..." -> 본문 (나중에 렌더링 용도)
```

이 과정에서 추출된 `data`는 `posts-map.json`에 저장되어, 애플리케이션 전역에서 **O(1)**로 접근 가능한 메타데이터 데이터베이스가 됩니다.

## 2. 렌더링 엔진: `next-mdx-remote`

Next.js App Router 환경(RSC)에서 MDX를 가장 효율적으로 처리하기 위해 **`next-mdx-remote`**를 채택했습니다.

### 선택 이유

- **RSC 호환성**: 클라이언트 컴포넌트(`'use client'`) 없이 서버에서 바로 HTML을 생성하여 내려줍니다.
- **가벼움**: 무거운 번들러 설정 없이, 필요한 시점에 원격(혹은 로컬 파일) 소스를 컴파일합니다.

### 구현 (`src/app/posts/[slug]/page.tsx`)

```tsx
import { MDXRemote } from "next-mdx-remote/rsc";

export default async function PostPage({ params }) {
  const post = await getPostBySlug(params.slug);

  return (
    <div className="prose">
      <MDXRemote
        source={post.content}
        components={components} // 커스텀 컴포넌트 주입
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm], // GitHub Flavored Markdown 지원
            rehypePlugins: [[rehypePrettyCode, { theme: "github-dark" }]], // 코드 하이라이팅
          },
        }}
      />
    </div>
  );
}
```

## 3. 코드 하이라이팅: `rehype-pretty-code`

개발 블로그의 생명은 코드 블럭의 가독성입니다.
단순한 syntax highlighting을 넘어, 라인 넘버링, 특정 라인 강조 등을 지원하기 위해 **`rehype-pretty-code`**를 사용했습니다.
이는 빌드 타임에 code block을 미리 예쁜 HTML로 변환해주므로, 런타임에 JS를 실행할 필요가 없어 성능상 매우 유리합니다.

## 4. 커스텀 컴포넌트 주입 (Hydration)

MDX의 가장 강력한 기능은 마크다운 내부에서 React 컴포넌트를 사용할 수 있다는 점입니다.
`MDXRemote`의 `components` prop을 통해 표준 HTML 태그를 나만의 컴포넌트로 교체할 수 있습니다.

### 이미지 최적화 (`MdxImage`)

표준 `<img>` 태그를 Next.js의 `Image` 컴포넌트로 래핑한 `MdxImage`로 교체하여, 마크다운 내 이미지도 자동으로 최적화(Lazy loading, Resizing)되도록 구현했습니다.

```tsx
const components = {
  // ![alt](src) 문법이 MdxImage 컴포넌트로 변환됨
  img: (props) => <MdxImage {...props} />,
};
```

## 5. 요약

이 블로그의 MDX 파이프라인은 다음과 같이 흐릅니다.

1.  **Build Time**: `gray-matter`가 메타데이터 추출 -> `posts-map.json` 생성.
2.  **Request Time**: `getPostBySlug`가 파일 본문 로드.
3.  **Rendering**: `next-mdx-remote`가 MDX 컴파일 + `rehype-pretty-code`가 코드 변환.
4.  **Injection**: `components` 맵을 통해 `MdxImage` 등 커스텀 컴포넌트 주입.
5.  **Output**: 완성된 HTML(Server Component) 클라이언트로 전송.
