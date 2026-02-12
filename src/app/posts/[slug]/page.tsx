import { getAllPosts, getPostBySlug } from "@/lib/posts";
import remarkGfm from "remark-gfm";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { formatDate } from "@/lib/posts";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MdxImage } from "@/components/mdx-image";
import rehypePrettyCode from "rehype-pretty-code";

interface PostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata(props: PostPageProps) {
  const params = await props.params;
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      images: post.thumbnail ? [{ url: post.thumbnail }] : [],
    },
  };
}

const components = {
  img: (props: React.ComponentProps<"img">) => (
    <MdxImage
      {...props}
      alt={(props.alt as string) || ""}
      src={(props.src as string) || ""}
    />
  ),
  Image: (props: React.ComponentProps<"img">) => (
    <MdxImage
      {...props}
      alt={(props.alt as string) || ""}
      src={(props.src as string) || ""}
    />
  ),
};

export default async function PostPage(props: PostPageProps) {
  "use cache";
  const params = await props.params;
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container max-w-3xl py-6 lg:py-10">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="capitalize">
              {post.category}
            </Badge>
          </div>
        </div>
        <h1 className="mt-2 inline-block font-heading text-4xl leading-tight lg:text-5xl">
          {post.title}
        </h1>
        {post.thumbnail && (
          <div className="mt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.thumbnail}
              alt={post.title}
              className="rounded-md border bg-muted"
            />
          </div>
        )}
        <div className="mt-4 flex space-x-4 text-sm text-muted-foreground">
          <time dateTime={post.date}>작성: {formatDate(post.date)}</time>
          {post.date !== post.lastModified && (
            <time dateTime={post.lastModified}>
              (수정: {formatDate(post.lastModified)})
            </time>
          )}
        </div>
      </div>
      <hr className="my-8" />
      <div className="prose prose-zinc max-w-none dark:prose-invert">
        <MDXRemote
          source={post.content}
          components={components}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [
                [
                  rehypePrettyCode,
                  {
                    theme: "github-dark",
                    keepBackground: true,
                  },
                ],
              ],
            },
          }}
        />
      </div>
      <div className="mt-10 flex justify-center">
        <Button asChild variant="ghost">
          <Link href="/posts">목록으로 돌아가기</Link>
        </Button>
      </div>
    </article>
  );
}
