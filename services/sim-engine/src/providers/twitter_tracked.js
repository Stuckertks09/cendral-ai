import axios from "axios";

/**
 * Tracked-account ingest uses an app bearer token.
 * Set TWITTER_BEARER_TOKEN in env.
 */
export async function fetchTrackedAccountTweets({ handle, sinceId = null, maxResults = 5 }) {
  const bearer = process.env.TWITTER_BEARER_TOKEN;
  if (!bearer) throw new Error("Missing TWITTER_BEARER_TOKEN");

  // Resolve user id
  const userRes = await axios.get(
    `https://api.twitter.com/2/users/by/username/${encodeURIComponent(handle)}`,
    { headers: { Authorization: `Bearer ${bearer}` } }
  );

  const userId = userRes?.data?.data?.id;
  if (!userId) throw new Error(`Unable to resolve Twitter user id for @${handle}`);

  const params = {
    max_results: Math.min(maxResults, 100),
    "tweet.fields": "created_at,text",
    exclude: "retweets,replies",
  };
  if (sinceId) params.since_id = sinceId;

  const tweetsRes = await axios.get(`https://api.twitter.com/2/users/${userId}/tweets`, {
    headers: { Authorization: `Bearer ${bearer}` },
    params,
  });

  const tweets = tweetsRes?.data?.data || [];

  return tweets.map((t) => ({
    source: "twitter",
    headline: (t.text || "").slice(0, 140),
    description: t.text || "",
    url: `https://twitter.com/${handle}/status/${t.id}`,
    publishedAt: t.created_at ? new Date(t.created_at) : new Date(),
    author: handle,
    tweetId: t.id,
  }));
}
