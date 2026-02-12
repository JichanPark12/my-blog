import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const posts = await getAllPosts();
  // Get recent 5 posts
  const recentPosts = posts.slice(0, 5);

  return (
    <div className="space-y-10">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            JichanPark Tech Blog
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Next.js와 shadcn/ui 그리고 바이브 코딩으로 만든 나만의 블로그입니다.
            개발 이야기와 일상을 기록합니다.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link href="/posts">모든 글 보기</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="https://github.com" target="_blank" rel="noreferrer">
                GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">최근 게시글</h2>
          <Link href="/posts" className="text-sm font-medium hover:underline">
            전체 보기
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recentPosts.map((post) => (
            <div key={post.slug} className="h-full">
              <Link href={`/posts/${post.slug}`} className="block h-full">
                <PostCard post={post} />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
