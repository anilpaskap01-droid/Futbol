import * as cheerio from "cheerio";

const URL = "https://www.transfermarkt.com/statistik/neuestetransfers";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function clean(value = "") {
  return value.replace(/\s+/g, " ").trim();
}

function absoluteUrl(href = "") {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `https://www.transfermarkt.com${href.startsWith("/") ? "" : "/"}${href}`;
}

function imageUrl(node) {
  const src =
    node.attr("data-src") ||
    node.attr("src") ||
    node.attr("data-original") ||
    "";

  if (!src) return "";
  if (src.startsWith("//")) return `https:${src}`;
  return src;
}

export async function scrapeLatestTransfers() {
  const res = await fetch(URL, {
    cache: "no-store",
    headers: {
      "user-agent": UA,
      "accept-language": "en-US,en;q=0.9,tr;q=0.8",
      accept: "text/html,application/xhtml+xml",
      referer: "https://www.transfermarkt.com/"
    }
  });

  if (!res.ok) {
    throw new Error(`Transfermarkt alınamadı: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const transfers = [];
  const seen = new Set();

  $("table.items > tbody > tr").each((_, row) => {
    const tr = $(row);
    const cells = tr.children("td");
    if (cells.length < 5) return;

    const playerLink = tr.find("a[href*='/profil/spieler/']").first();
    const playerName = clean(playerLink.text());
    if (!playerName || seen.has(playerName)) return;

    const playerHref = absoluteUrl(playerLink.attr("href"));
    const photoNode = tr.find("img.bilderrahmen-fixed, img.bilderrahmen-fixed-mit-rundung, td img").first();
    const photo = imageUrl(photoNode);

    const position = clean(
      tr.find("table.inline-table tr").eq(1).find("td").last().text()
    );

    const ageText = clean(cells.eq(1).text());
    const age = /^\d{1,2}$/.test(ageText) ? ageText : "";

    const clubs = [];
    tr.find("a.vereinprofil_tooltip, a[href*='/startseite/verein/']").each((__, club) => {
      const name = clean($(club).attr("title") || $(club).text());
      if (name && !clubs.includes(name)) clubs.push(name);
    });

    const leavingClub = clubs[0] || clean(cells.eq(cells.length - 3).text());
    const joiningClub = clubs[1] || clean(cells.eq(cells.length - 2).text());

    const feeCandidates = [];
    cells.each((__, cell) => {
      const text = clean($(cell).text());
      if (/€|free transfer|loan transfer|\?|^-$/i.test(text)) feeCandidates.push(text);
    });
    const fee = feeCandidates.at(-1) || clean(cells.last().text()) || "-";

    const marketValue = clean(
      tr.find("td.rechts").filter((__, cell) => /€/.test($(cell).text())).first().text()
    );

    seen.add(playerName);
    transfers.push({
      id: playerHref || `${playerName}-${leavingClub}-${joiningClub}`,
      playerName,
      position,
      age,
      photo,
      leavingClub,
      joiningClub,
      fee,
      marketValue,
      profileUrl: playerHref,
      sourceUrl: URL
    });
  });

  return transfers.slice(0, 24);
}
