// backend/src/modules/catalog/isbn-lookup.service.ts
// Best-effort metadata enrichment via the Open Library API. Any failure returns
// null - it never throws, so a flaky third party can't break catalog creation.
import { logger } from '../../config/logger';

export interface IsbnLookupResult {
  isbn: string;
  title?: string;
  author?: string;
  publisher?: string;
  year?: number;
  subjects?: string[];
  cover_url?: string;
}

export async function lookupIsbn(isbn: string): Promise<IsbnLookupResult | null> {
  const clean = isbn.replace(/[^0-9Xx]/g, '');
  if (!clean) return null;

  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const json = (await res.json()) as Record<string, OpenLibraryBook>;
    const book = json[`ISBN:${clean}`];
    if (!book) return null;

    const yearMatch = book.publish_date?.match(/\d{4}/);
    return {
      isbn: clean,
      title: book.title,
      author: book.authors?.map((a) => a.name).join(', '),
      publisher: book.publishers?.map((p) => p.name).join(', '),
      year: yearMatch ? parseInt(yearMatch[0], 10) : undefined,
      subjects: book.subjects?.map((s) => s.name).slice(0, 8),
      cover_url: book.cover?.large ?? book.cover?.medium ?? book.cover?.small,
    };
  } catch (err) {
    logger.warn(`ISBN lookup failed for ${clean}: ${(err as Error).message}`);
    return null;
  }
}

interface OpenLibraryBook {
  title?: string;
  publish_date?: string;
  authors?: { name: string }[];
  publishers?: { name: string }[];
  subjects?: { name: string }[];
  cover?: { small?: string; medium?: string; large?: string };
}
