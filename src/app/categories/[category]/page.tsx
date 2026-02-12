import Link from "next/link";
import { getPostsByCategory, getAllCategories } from "@/lib/posts";
import { PostCard } from "@/components/post-card";
import { notFound } from "next/navigation";

interface CategoryPageProps {
  params: Promise<{
    category: string;
  }>;
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  return categories.map((category) => ({
    category: category,
  }));
}

export async function generateMetadata(props: CategoryPageProps) {
  const params = await props.params;
  return {
    title: `${params.category} Posts`,
    description: `Posts in category ${params.category}`,
  };
}

export default async function CategoryPage(props: CategoryPageProps) {
  const params = await props.params;
  const decodeCategory = decodeURIComponent(params.category);
  const { posts, total } = await getPostsByCategory(decodeCategory);

  if (!posts.length) {
    notFound();
  }

  return (
    <div className="container max-w-5xl py-6 lg:py-10">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="inline-block font-heading text-4xl tracking-tight lg:text-5xl capitalize">
            {decodeCategory}
          </h1>
          <p className="text-xl text-muted-foreground">
            {decodeCategory} 카테고리에 {total}개의 글이 있습니다.
          </p>
        </div>
      </div>
      <hr className="my-8" />
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
    </div>
  );
}
