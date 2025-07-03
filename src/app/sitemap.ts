import { fetchPublishedPosts, getPost } from "@/lib/notion";
import type { MetadataRoute } from "next"; // Impor tipe ini untuk validasi lebih baik

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://your-site.com";

  // Memastikan fetchPublishedPosts mengembalikan data yang benar untuk sitemap
  // dan getPost tidak gagal untuk ID tertentu
  const posts = await fetchPublishedPosts();

  // Filter out null/undefined results immediately if getPost might return them
  const allPosts = (await Promise.all(
    posts.results.map((p) => getPost(p.id))
  )).filter(Boolean); // Filter(Boolean) akan menghapus null, undefined, false, 0, ""

  const postEntries = allPosts.map((post) => ({
    url: `${siteUrl}/posts/${post.slug}`,
    // Perbaikan: gunakan 'new Date()' dengan 'n' kecil
    // Pastikan 'post.date' adalah format yang valid untuk konstruktor Date (misal: ISO string, timestamp)
    lastModified: new Date(post.date),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: siteUrl,
      // Perbaikan: gunakan 'new Date()' dengan 'n' kecil
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...postEntries,
  ];
}
