import * as cheerio from "cheerio";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36";

async function getHtml(url) {
  const res = await fetch(url, {
    cache: "no-store",
    headers: {
      "user-agent": UA,
      "accept-language": "en-GB,en;q=0.9,tr;q=0.8",
      accept: "text/html,application/xhtml+xml"
    }
  });
  if (!res.ok) throw new Error(`Kaynak alınamadı: ${res.status}`);
  return res.text();
}

const clean = (s = "") => s.replace(/\s+/g, " ").trim();
const absoluteUrl = (href = "") => !href ? "" : href.startsWith("http") ? href : `https://www.skysports.com${href.startsWith("/") ? "" : "/"}${href}`;

function normalizeImage(value = "") {
  const raw = clean(value);
  if (!raw) return "";
  const first = raw.split(",")[0].trim().split(/\s+/)[0];
  if (!first) return "";
  if (first.startsWith("//")) return `https:${first}`;
  if (first.startsWith("http")) return first;
  if (first.startsWith("/")) return `https://www.skysports.com${first}`;
  return first;
}

function pickImage($, card, node) {
  const img = card.find("img").first();
  const source = card.find("picture source").first();
  const nodeImg = node.find("img").first();

  const candidates = [
    img.attr("src"),
    img.attr("data-src"),
    img.attr("data-original"),
    img.attr("data-lazy-src"),
    img.attr("srcset"),
    img.attr("data-srcset"),
    source.attr("srcset"),
    source.attr("data-srcset"),
    nodeImg.attr("src"),
    nodeImg.attr("data-src"),
    nodeImg.attr("srcset")
  ];

  for (const candidate of candidates) {
    const image = normalizeImage(candidate || "");
    if (image && !image.startsWith("data:")) return image;
  }

  const style = card.attr("style") || "";
  const bg = style.match(/url\(["']?([^"')]+)["']?\)/i)?.[1] || "";
  return normalizeImage(bg);
}

export async function scrapeMatches() {
  const url = "https://www.skysports.com/football-scores-fixtures";
  const html = await getHtml(url);
  const $ = cheerio.load(html);
  const matches = [];
  const seen = new Set();

  const selectors = [".fixres__item", ".matches__item", "[data-testid*='fixture']"];
  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const node = $(el);
      const text = clean(node.text());
      const names = [];
      node.find(".swap-text__target,.matches__participant-name,.fixres__team,[class*='team-name'],[class*='participant']").each((__, t) => {
        const n = clean($(t).text());
        if (n && !names.includes(n)) names.push(n);
      });
      if (names.length < 2) return;

      const nums = [];
      node.find(".matches__teamscores-side,.fixres__score,[class*='score']").each((__, s) => {
        const n = clean($(s).text());
        if (/^\d{1,2}$/.test(n)) nums.push(Number(n));
      });

      const time = text.match(/\b([01]?\d|2[0-3])[:.]\d{2}\s*(am|pm)?\b/i)?.[0] || "";
      const minute = text.match(/\b(\d{1,3})['’]\b/)?.[1] || null;
      const status = /\bFT\b|Full Time/i.test(text) ? "FINISHED" : /\bHT\b|Half Time/i.test(text) ? "HALF_TIME" : minute ? "LIVE" : "SCHEDULED";
      const league = clean(node.closest("section,div").find("h2,h3,h4").first().text()) || "Futbol";
      const href = node.find("a").first().attr("href") || node.attr("href") || url;
      const id = `${names[0]}-${names[1]}-${time}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      if (seen.has(id)) return;
      seen.add(id);
      matches.push({
        id,
        league,
        home: names[0],
        away: names[1],
        homeScore: nums.length >= 2 ? nums[0] : null,
        awayScore: nums.length >= 2 ? nums[1] : null,
        time,
        status,
        minute: minute ? Number(minute) : null,
        source: absoluteUrl(href)
      });
    });
    if (matches.length) break;
  }

  return matches.slice(0, 60);
}

export async function scrapeNews() {
  const url = "https://www.skysports.com/football/news";
  const html = await getHtml(url);
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  $("a[href*='/football/news/']").each((_, a) => {
    const node = $(a);
    const href = absoluteUrl(node.attr("href"));
    if (!href || seen.has(href)) return;

    let card = node.closest("article,li");
    if (!card.length) card = node.closest("div");

    const title = clean(node.find("h1,h2,h3,h4").first().text()) || clean(card.find("h1,h2,h3,h4").first().text()) || clean(node.attr("aria-label")) || clean(node.text());
    if (!title || title.length < 12 || title.length > 220) return;

    const image = pickImage($, card, node);
    seen.add(href);

    items.push({
      id: href,
      title,
      description: clean(card.find("p").first().text()),
      image,
      category: "Futbol",
      url: href,
      source: "Sky Sports"
    });
  });

  return items.slice(0, 30);
}
