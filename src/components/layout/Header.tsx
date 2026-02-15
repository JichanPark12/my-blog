"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4 flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold inline-block">My Blog</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/posts"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname?.startsWith("/posts")
                  ? "text-foreground"
                  : "text-foreground/60",
              )}
            >
              Posts
            </Link>
            <Link
              href="/categories"
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname?.startsWith("/categories")
                  ? "text-foreground"
                  : "text-foreground/60",
              )}
            >
              Categories
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            <ModeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
