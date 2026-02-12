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

  // Ensure output directory exists (src/lib)
  const outputDir = path.dirname(OUTPUT_FILE);
  try {
    await fs.access(outputDir);
  } catch {
    await fs.mkdir(outputDir, { recursive: true });
  }

  const files = await getPostFiles(POSTS_DIR);
  const postsMap = {};

  for (const filePath of files) {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const { data } = matter(fileContent);
    const slug = path.basename(filePath, path.extname(filePath));
    const stat = await fs.stat(filePath);

    // Relative path for storage (smaller size)
    const relativePath = path.relative(path.join(__dirname, ".."), filePath);

    // Extract category from directory name (single level)
    const relativePathFromPosts = path.relative(POSTS_DIR, filePath);
    const category = path.dirname(relativePathFromPosts).split(path.sep)[0];

    postsMap[slug] = {
      path: relativePath,
      category: category === "." ? "etc" : category,
      title: data.title || slug,
      date: stat.birthtime.toISOString(),
      lastModified: stat.mtime.toISOString(),
      description: data.description || "",
      tags: data.tags || [],
      thumbnail: data.thumbnail,
    };
  }

  // Sort by date descending (optional, but good for default ordering)
  const sortedSlugs = Object.keys(postsMap).sort((a, b) => {
    return (
      new Date(postsMap[b].date).getTime() -
      new Date(postsMap[a].date).getTime()
    );
  });

  const sortedMap = {};
  sortedSlugs.forEach((slug) => {
    sortedMap[slug] = postsMap[slug];
  });

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(sortedMap, null, 2));
  console.log(
    `Successfully generated posts map at ${OUTPUT_FILE} with ${Object.keys(postsMap).length} posts.`,
  );
}

generateMap().catch(console.error);
