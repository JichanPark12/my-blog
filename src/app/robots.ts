import { MetadataRoute } from "next";

const BASE_URL = "https://my-blog-example.com"; // TODO: Replace with actual domain

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/private/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
