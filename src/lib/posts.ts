import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import postsMapData from "./posts-map.json";
import { cacheTag } from "next/cache";

export interface PostMetadata {
  slug: string;
  category: string;
  title: string;
  date: string;
  lastModified: string;
  description: string;
  tags: string[];
  thumbnail?: string;
  // Map specific
  path?: string;
}

export interface Post extends PostMetadata {
  content: string;
}

const postsMap = postsMapData as unknown as Record<
  string,
  PostMetadata & { path: string }
>;

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// 1. 모든 포스트 가져오기 (메타데이터만) - O(1) from Map
export async function getAllPosts(): Promise<PostMetadata[]> {
  "use cache";
  cacheTag("posts");
  return Object.keys(postsMap).map((slug) => {
    const data = postsMap[slug];
    return {
      slug,
      category: data.category,
      title: data.title,
      date: data.date,
      lastModified: data.lastModified,
      description: data.description,
      tags: data.tags,
      thumbnail: data.thumbnail,
    };
  });
}

// 2. 슬러그로 단일 포스트 가져오기 (본문 포함) - O(1) Access
export async function getPostBySlug(slug: string): Promise<Post | null> {
  "use cache";
  cacheTag(`posts/${slug}`);

  const data = postsMap[slug];
  if (!data) return null;

  const projectRoot = process.cwd();

  const fullPath = path.join(projectRoot, data.path!);
  try {
    const fileContent = await fs.readFile(fullPath, "utf-8");
    const { content } = matter(fileContent);

    return {
      slug,
      category: data.category,
      title: data.title,
      date: data.date,
      lastModified: data.lastModified,
      description: data.description,
      tags: data.tags,
      thumbnail: data.thumbnail,
      content,
    };
  } catch (error) {
    console.error(`Error reading post file: ${fullPath}`, error);
    return null;
  }
}

export async function getPostsByCategory(
  category: string,
): Promise<{ posts: PostMetadata[]; total: number }> {
  "use cache";
  cacheTag(`posts/${category}`);

  const allPosts = await getAllPosts();
  const posts = allPosts.filter((post) => post.category === category);
  return {
    posts,
    total: posts.length,
  };
}

export async function getAllCategoriesWithCount(): Promise<
  { category: string; count: number }[]
> {
  "use cache";
  cacheTag("categoriesCounts");

  const categoryCount: Record<string, number> = {};
  Object.values(postsMap).forEach((post) => {
    if (post.category) {
      categoryCount[post.category] = (categoryCount[post.category] || 0) + 1;
    }
  });

  return Object.entries(categoryCount)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getAllCategories(): Promise<string[]> {
  "use cache";
  cacheTag("categories");

  const categories = new Set<string>();
  Object.values(postsMap).forEach((post) => {
    if (post.category) {
      categories.add(post.category);
    }
  });
  return Array.from(categories);
}
