import fs from "fs/promises";
import path from "path";
import matter from "gray-matter";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, "../posts");
const OUTPUT_FILE = path.join(__dirname, "../src/lib/posts-map.json");

async function getPostFiles(dir) {
  const list = await fs.readdir(dir);
  const promises = list.map(async (file) => {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat && stat.isDirectory()) {
      return getPostFiles(filePath);
    } else {
      if (file.endsWith(".md") || file.endsWith(".mdx")) {
        return [filePath];
      } else {
        return [];
      }
    }
  });
  const results = await Promise.all(promises);
  return results.flat();
}

async function generateMap() {
  console.log("Generating posts map...");

  const outputDir = path.dirname(OUTPUT_FILE);
  await fs.mkdir(outputDir, { recursive: true }).catch(() => {});

  const files = await getPostFiles(POSTS_DIR);

  const posts = await Promise.all(
    files.map(async (filePath) => {
      const [fileContent, stat] = await Promise.all([
        fs.readFile(filePath, "utf-8"),
        fs.stat(filePath),
      ]);

      const { data } = matter(fileContent);
      const slug = path.basename(filePath, path.extname(filePath));
      const relativePath = path.relative(path.join(__dirname, ".."), filePath);
      const relativePathFromPosts = path.relative(POSTS_DIR, filePath);
      const category = path.dirname(relativePathFromPosts).split(path.sep)[0];

      return {
        slug,
        date: data.date
          ? new Date(data.date).getTime()
          : stat.birthtime.getTime(),
        postData: {
          path: relativePath,
          category: category === "." ? "etc" : category,
          title: data.title || slug,
          date: data.date
            ? new Date(data.date).toISOString()
            : stat.birthtime.toISOString(),
          lastModified: data.lastModified
            ? new Date(data.lastModified).toISOString()
            : stat.mtime.toISOString(),
          description: data.description || "",
          tags: data.tags || [],
          thumbnail: data.thumbnail,
        },
      };
    }),
  );

  // 정렬하면서 바로 객체 생성
  const sortedMap = Object.fromEntries(
    posts
      .sort((a, b) => b.date - a.date)
      .map(({ slug, postData }) => [slug, postData]),
  );

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(sortedMap, null, 2));
  console.log(
    `Successfully generated posts map at ${OUTPUT_FILE} with ${posts.length} posts.`,
  );
}

generateMap().catch(console.error);
