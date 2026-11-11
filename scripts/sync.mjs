#!/usr/bin/env node
// Auto-syncs src/data/auto_synced.json from:
//   1. Medium RSS feed (https://medium.com/feed/@harkanwalbedi)
//   2. GitHub Search API (is:pr is:merged author:harkanwalbedi -user:harkanwalbedi)
// Curated entries in src/data/site.ts take precedence for summaries/metadata;
// any newly published Medium post or newly merged upstream PR appears automatically.

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const OUT_PATH = path.resolve(import.meta.dirname, '../src/data/auto_synced.json');

function fetchText(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      reject(new Error(`Refusing non-HTTPS URL: ${url}`));
      return;
    }
    const req = https.get(
      parsed,
      {
        headers: {
          'User-Agent': 'harkanwalbedi-site-sync/1.0',
          ...headers,
        },
        timeout: 15000,
      },
      (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchText(new URL(res.headers.location, url).href, headers).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      },
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error(`Timeout fetching ${url}`));
    });
  });
}

function stripHtml(raw) {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\u200a/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchMediumPosts() {
  const xml = await fetchText('https://medium.com/feed/@harkanwalbedi');
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  const posts = [];
  for (const item of items) {
    const titleMatch = item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/);
    const linkMatch = item.match(/<link>([^<\s]+)<\/link>/);
    const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const bodyMatch = item.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
    if (!titleMatch || !linkMatch || !dateMatch) continue;

    const cleanUrl = linkMatch[1].split('?')[0];
    const parsedUrl = new URL(cleanUrl);
    if (!parsedUrl.hostname.endsWith('medium.com')) continue;

    const isoDate = new Date(dateMatch[1].trim()).toISOString().slice(0, 10);
    const body = bodyMatch ? bodyMatch[1] : '';
    const h4Match = body.match(/<h4>([\s\S]*?)<\/h4>/i);
    const h4Text = h4Match ? stripHtml(h4Match[1]) : '';
    const partMatch = h4Text.match(/^(Part\s+\d+\s+of\s+\d+)\s*[:\u2014\-]\s*(.+)$/i);

    let part;
    let summary = '';
    if (partMatch) {
      part = partMatch[1];
      summary = partMatch[2];
    } else if (h4Text) {
      summary = h4Text;
    } else {
      const pMatch = body.match(/<p>([\s\S]*?)<\/p>/i);
      summary = pMatch ? stripHtml(pMatch[1]).slice(0, 180) : '';
    }

    posts.push({
      title: stripHtml(titleMatch[1]),
      summary,
      date: isoDate,
      ...(part ? { part } : {}),
      url: cleanUrl,
    });
  }
  return posts;
}

async function fetchMergedPullRequests() {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  const raw = await fetchText(
    'https://api.github.com/search/issues?q=is:pr+is:merged+author:harkanwalbedi+-user:harkanwalbedi&sort=updated&order=desc&per_page=30',
    headers,
  );
  const data = JSON.parse(raw);
  const prs = [];
  for (const item of data.items || []) {
    const repoUrl = item.repository_url || '';
    const parts = repoUrl.split('/repos/')[1]?.split('/');
    if (!parts || parts.length !== 2) continue;
    const [owner, repo] = parts;
    const mergedAt = (item.closed_at || item.updated_at || '').slice(0, 10);
    if (mergedAt < '2026-10-01') continue;
    prs.push({
      owner,
      repo,
      number: item.number,
      summary: item.title,
      mergedAt,
      language: repo === 'llama.cpp' ? 'C++' : 'Python',
    });
  }
  return prs;
}

async function main() {
  let existing = { posts: [], mergedPullRequests: [] };
  if (fs.existsSync(OUT_PATH)) {
    try {
      existing = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
    } catch {
      // ignore malformed cache
    }
  }

  let posts = existing.posts;
  let mergedPullRequests = existing.mergedPullRequests;

  try {
    posts = await fetchMediumPosts();
    console.log(`Synced ${posts.length} Medium post(s).`);
  } catch (err) {
    console.warn(`Keeping cached Medium posts (${err.message}).`);
  }

  try {
    mergedPullRequests = await fetchMergedPullRequests();
    console.log(`Synced ${mergedPullRequests.length} merged upstream PR(s).`);
  } catch (err) {
    console.warn(`Keeping cached merged PRs (${err.message}).`);
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify({ posts, mergedPullRequests }, null, 2) + '\n');
}

main();
