import fetch from "node-fetch";

export async function fetchNewsSignals({ query, from, pageSize = 5 }) {
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  if (!NEWS_API_KEY) throw new Error("Missing NEWS_API_KEY");

  const url = new URL("https://newsapi.org/v2/everything");
  url.searchParams.set("q", query);
  url.searchParams.set("sortBy", "publishedAt");
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("language", "en");
  if (from) url.searchParams.set("from", from.toISOString());
  url.searchParams.set("apiKey", NEWS_API_KEY);

  const resp = await fetch(url.toString());
  if (!resp.ok) throw new Error(`NewsAPI failed: ${resp.status} ${resp.statusText}`);

  const data = await resp.json();
  const articles = data.articles || [];

  return articles.map((a) => ({
    source: "newsapi",
    headline: a.title || "",
    description: a.description || "",
    url: a.url,
    publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
    author: a.source?.name || "",
  }));
}
