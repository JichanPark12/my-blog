import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/post-card";

export const metadata = {
  title: "Blog Posts",
  description: "All posts on the blog",
};

export default async function PostsPage() {
  const posts = await getAllPosts();

  return (
    <div className="container max-w-5xl py-6 lg:py-10">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="inline-block font-heading text-4xl tracking-tight lg:text-5xl">
            Blog
          </h1>
          <p className="text-xl text-muted-foreground">모든 글 목록입니다.</p>
        </div>
      </div>
      <hr className="my-8" />
      {posts?.length ? (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="group block"
            >
              <article className="flex flex-col space-y-2">
                <PostCard post={post} />
              </article>
            </Link>
          ))}
        </div>
      ) : (
        <p>No posts published.</p>
      )}
    </div>
  );
}
