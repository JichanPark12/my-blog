import Link from "next/link";
import { getAllCategoriesWithCount } from "@/lib/posts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Categories - My Blog",
  description: "Browse posts by category",
};

export default async function CategoriesPage() {
  const categories = await getAllCategoriesWithCount();

  return (
    <div className="space-y-10">
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10">
        <div className="container mx-auto px-4 flex max-w-5xl flex-col items-start gap-4 text-center sm:text-left">
          <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl">
            Categories
          </h1>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            주제별로 글을 모아보세요.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(({ category, count }) => (
            <Link key={category} href={`/categories/${category}`}>
              <Card className="h-full transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between capitalize">
                    {category}
                    <Badge variant="secondary">{count}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {count}개의 포스트가 있습니다.
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
