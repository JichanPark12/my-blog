import { formatDate, PostMetadata } from "@/lib/posts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PostCardProps {
  post: PostMetadata;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="flex flex-col h-70 transition-colors hover:bg-muted/50">
      <CardHeader>
        <div className="flex gap-2 mb-2">
          <Badge variant="secondary" className="capitalize">
            {post.category}
          </Badge>
        </div>
        {/* Link removed from here, parent handles it */}
        <CardTitle className="line-clamp-2 md:text-2xl">{post.title}</CardTitle>
        <CardDescription className="line-clamp-2 ">
          {post.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1"></CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        {/* <div className="ml-auto flex gap-2">
          {post.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div> */}
      </CardFooter>
    </Card>
  );
}
