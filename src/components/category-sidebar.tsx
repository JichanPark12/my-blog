import Link from "next/link";
import { getAllCategoriesWithCount } from "@/lib/posts";
import { cn } from "@/lib/utils";

export async function CategorySidebar() {
  const categories = await getAllCategoriesWithCount();

  return (
    <aside className="w-full md:w-64 shrink-0">
      <div className="sticky top-20">
        <h3 className="mb-4 text-lg font-semibold">Categories</h3>
        <nav className="flex flex-col space-y-1">
          {categories.map(({ category, count }) => (
            <Link
              key={category}
              href={`/categories/${category}`}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <span>{category}</span>
              <span className="text-muted-foreground ml-2 text-xs">
                ({count})
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
