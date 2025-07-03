// src/app/sitemap.ts
import { fetchPublishedPosts, getPost } from "@/lib/notion";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-site.com";

  const posts = await fetchPublishedPosts();

  // Memastikan hasil dari Promise.all hanya berisi Post yang valid (non-null)
  const rawPosts = await Promise.all(
    posts.results.map((p) => getPost(p.id))
  );

  // Perbaikan: Gunakan type guard kustom untuk menyaring null/undefined
  // Ini memberi tahu TypeScript bahwa 'post' di dalam array 'allPosts' tidak akan pernah null.
  const allPosts = rawPosts.filter((post): post is NonNullable<typeof post> => post !== null && post !== undefined);

  const postEntries = allPosts.map((post) => ({
    // Tidak perlu lagi '!' karena TypeScript sudah tahu 'post' tidak null/undefined
    url: `${siteUrl}/posts/${post.slug}`,
    // Pastikan 'post.date' adalah string format ISO valid untuk new Date()
    lastModified: new Date(post.date),
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
