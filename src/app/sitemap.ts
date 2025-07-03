// src/app/sitemap.ts
import { fetchPublishedPosts, getPost } from "@/lib/notion";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-site.com";

  const posts = await fetchPublishedPosts();
  // allPosts di sini akan jadi (Post | null | undefined)[]
  const allPosts = (await Promise.all(posts.results.map((p) => getPost(p.id)))).filter(Boolean);

  const postEntries = allPosts.map((post) => ({
    url: `${siteUrl}/posts/${post!.slug}`, // Perbaikan: Tambahkan '!'
    lastModified: new Date(post!.date),    // Perbaikan: Tambahkan '!'
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...postEntries,
  ];
}
