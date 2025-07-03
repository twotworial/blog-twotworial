import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints"; // Impor spesifik untuk PageObjectResponse

export const notion = new Client({ auth: process.env.NOTION_TOKEN });
export const n2m = new NotionToMarkdown({ notionClient: notion });

export interface Post {
  id: string;
  title: string;
  slug: string;
  coverImage?: string;
  description: string;
  date: string; // ISO string format
  content: string;
  author?: string;
  tags?: string[];
  category?: string;
  wordCount: number; // Menambahkan ini agar bisa digunakan
}

export async function getDatabaseStructure() {
  const database = await notion.databases.retrieve({
    database_id: process.env.NOTION_DATABASE_ID!,
  });
  return database;
}

export function getWordCount(content: string): number {
  const cleanText = content
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleanText.split(" ").length;
}

export async function fetchPublishedPosts() {
  const posts = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      and: [
        {
          property: "Status",
          status: {
            equals: "Published",
          },
        },
      ],
    },
    sorts: [
      // --- PERBAIKAN PENGURUTAN DI SINI ---
      // Pilihan 1: Jika Anda ingin mengurutkan berdasarkan properti "Created time" bawaan Notion
      // Ini adalah properti bawaan Notion yang mencatat kapan halaman dibuat.
      {
        property: "Created time", // Gunakan nama properti Notion yang sesungguhnya
        direction: "descending",
      },

      // Pilihan 2: Jika Anda punya properti Notion bertipe "Date" yang persis bernama "Published Date"
      // Jika Anda membuat kolom di Notion bernama "Published Date" dan tipenya adalah "Date"
      // Anda bisa menggunakan ini, tapi pastikan namanya persis sama.
      // {
      //   property: "Published Date", // Gunakan nama properti Notion yang sesungguhnya
      //   direction: "descending",
      // },

      // Pilihan 3: Jika Anda ingin mengurutkan berdasarkan properti "Last edited time" bawaan Notion
      // Ini adalah properti bawaan Notion yang mencatat kapan halaman terakhir diubah.
      // {
      //   property: "Last edited time", // Gunakan nama properti Notion yang sesungguhnya
      //   direction: "descending",
      // },
    ],
  });

  return posts;
}

export async function getPost(pageId: string): Promise<Post | null> {
  try {
    const page = (await notion.pages.retrieve({
      page_id: pageId,
    })) as PageObjectResponse;
    const mdBlocks = await n2m.pageToMarkdown(pageId);
    const { parent: contentString } = n2m.toMarkdownString(mdBlocks);

    // Get first paragraph for description (excluding empty lines)
    const paragraphs = contentString
      .split("\n")
      .filter((line: string) => line.trim().length > 0);
    const firstParagraph = paragraphs[0] || "";
    const description =
      firstParagraph.slice(0, 160) + (firstParagraph.length > 160 ? "..." : "");

    const properties = page.properties as any; // Cast ke any sementara untuk akses mudah

    // Dapatkan tanggal dari Notion. Prioritaskan properti 'Published Date' jika ada
    // Jika tidak, gunakan 'Created time' bawaan Notion.
    const rawDate =
      properties["Published Date"]?.date?.start ||
      (page as any).created_time; // Mengakses 'created_time' dari respons halaman

    const post: Post = {
      id: page.id,
      title: properties.Title.title[0]?.plain_text || "Untitled",
      slug:
        properties.Slug?.formula?.string || // Coba properti 'Slug' formula dulu
        properties.Title.title[0]?.plain_text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") ||
        "untitled",
      coverImage: properties["Featured Image"]?.files?.[0]?.file?.url || properties["Featured Image"]?.url || undefined, // Menambahkan dukungan untuk 'files' jika itu gallery
      description,
      // Pastikan rawDate adalah string yang valid untuk ISO, atau gunakan fallback
      date: rawDate ? new Date(rawDate).toISOString() : new Date().toISOString(),
      content: contentString,
      author: properties.Author?.people?.[0]?.name,
      tags: properties.Tags?.multi_select?.map((tag: any) => tag.name) || [],
      category: properties.Category?.select?.name,
      wordCount: getWordCount(contentString), // Menambahkan wordCount
    };

    return post;
  } catch (error) {
    console.error(`Error getting post with ID ${pageId}:`, error); // Lebih spesifik di log
    return null;
  }
}
