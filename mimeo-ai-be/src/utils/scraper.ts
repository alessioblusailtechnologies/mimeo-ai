import * as cheerio from 'cheerio';
import { tavily } from '@tavily/core';
import { config } from '../config/index.js';

export interface ScrapedContent {
  url: string;
  title: string;
  content: string;
  error?: string;
}

// ─── URL Scraping (for direct URLs) ───

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MimeoAI/1.0; +https://mimeo.ai)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });

    if (!response.ok) {
      return { url, title: '', content: '', error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    $('script, style, nav, footer, header, aside, iframe, noscript, svg, form, [role="navigation"], [role="banner"], [role="contentinfo"]').remove();

    const title = $('meta[property="og:title"]').attr('content')
      || $('title').text().trim()
      || $('h1').first().text().trim()
      || '';

    const mainSelectors = [
      'article', 'main', '[role="main"]',
      '.post-content', '.article-content', '.entry-content',
      '.post-body', '.article-body', '.content-body',
    ];

    let contentText = $('body').text();
    for (const selector of mainSelectors) {
      const el = $(selector).first();
      if (el.length > 0 && el.text().trim().length > 100) {
        contentText = el.text();
        break;
      }
    }

    const content = contentText
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n+/g, '\n\n')
      .trim()
      .slice(0, 5000);

    if (content.length < 50) {
      return { url, title, content: '', error: 'Content too short or not extractable' };
    }

    return { url, title, content };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scraping failed';
    return { url, title: '', content: '', error: message };
  }
}

export async function scrapeUrls(urls: string[]): Promise<ScrapedContent[]> {
  const unique = [...new Set(urls)].slice(0, 5);
  return Promise.all(unique.map(scrapeUrl));
}

export function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"'{}|\\^`\[\](),]+/g;
  return [...new Set(text.match(urlRegex) || [])];
}

export function formatScrapedForPrompt(results: ScrapedContent[]): string {
  const successful = results.filter(r => r.content && !r.error);
  if (successful.length === 0) return '';

  const parts = successful.map(r =>
    `--- Content from: ${r.url} ---\nTitle: ${r.title}\n\n${r.content}\n--- End ---`
  );

  return `\n\nHere is reference content scraped from the provided URLs:\n\n${parts.join('\n\n')}`;
}

// ─── Tavily Web Search ───

let tavilyClient: ReturnType<typeof tavily> | null = null;

function getTavilyClient() {
  if (!tavilyClient) {
    tavilyClient = tavily({ apiKey: config.ai.tavilyApiKey });
  }
  return tavilyClient;
}

export interface WebSearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export async function webSearch(query: string, maxResults = 5): Promise<WebSearchResult[]> {
  try {
    const client = getTavilyClient();
    const response = await client.search(query, {
      maxResults,
      searchDepth: 'advanced',
      includeAnswer: false,
    });

    return (response.results || []).map(r => ({
      title: r.title || '',
      url: r.url || '',
      content: r.content || '',
      score: r.score || 0,
    }));
  } catch (err: unknown) {
    console.error('[Tavily] Search failed:', err instanceof Error ? err.message : err);
    return [];
  }
}

export function formatSearchResultsForPrompt(results: WebSearchResult[]): string {
  if (results.length === 0) return '';

  const parts = results.map((r, i) =>
    `--- Source ${i + 1}: ${r.title} (${r.url}) ---\n${r.content}\n--- End ---`
  );

  return parts.join('\n\n');
}
