import { scrapeMatches, scrapeNews } from "../lib/sky";
import { scrapeLatestTransfers } from "../lib/transfermarkt";

export const dynamic = "force-dynamic";

function MatchStatus({ match }) {
  if (match.status === "LIVE") return <span className="status live">● {match.minute ? `${match.minute}'` : "CANLI"}</span>;
  if (match.status === "HALF_TIME") return <span className="status live">DEVRE</span>;
  if (match.status === "FINISHED") return <span className="status">MS</span>;
  return <span className="status">{match.time ? `Bugün • ${match.time}` : "Yakında"}</span>;
}

function Score({ match }) {
  if (typeof match.homeScore === "number" && typeof match.awayScore === "number") {
    return <strong className="score">{match.homeScore}<span>-</span>{match.awayScore}</strong>;
  }
  return <strong className="versus">VS</strong>;
}

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const selectedLeague = params?.league || "all";

  const [matchesResult, newsResult, transfersResult] = await Promise.allSettled([
    scrapeMatches(),
    scrapeNews(),
    scrapeLatestTransfers()
  ]);

  const allMatches = matchesResult.status === "fulfilled" ? matchesResult.value : [];
  const news = newsResult.status === "fulfilled" ? newsResult.value : [];
  const transfers = transfersResult.status === "fulfilled" ? transfersResult.value : [];
  const leagues = [...new Set(allMatches.map(m => m.league).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const matches = selectedLeague === "all" ? allMatches : allMatches.filter(m => m.league === selectedLeague);

  return (
    <>
      <header className="header">
        <div className="wrap nav">
          <div className="logo"><span>F</span>FutbolCanlı</div>
          <nav>
            <a href="#maclar">Maçlar</a>
            <a href="#transferler">Transferler</a>
            <a href="#haberler">Haberler</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="wrap">
            <span className="eyebrow">FUTBOL MERKEZİ</span>
            <h1>Futbolun nabzı<br />burada atıyor.</h1>
            <p>Lig seç, canlı skorları takip et, son transferleri ve haberleri gör.</p>
          </div>
        </section>

        <div className="wrap mainGrid">
          <section id="maclar" className="panel">
            <div className="sectionHead matchHead">
              <div><span className="eyebrow">MAÇ MERKEZİ</span><h2>Bugünün maçları</h2></div>
              <span className="liveBadge">● CANLI</span>
            </div>

            <form className="leagueFilter" method="GET" action="/">
              <label htmlFor="league">Lig seç</label>
              <div className="leagueFilterRow">
                <select id="league" name="league" defaultValue={selectedLeague}>
                  <option value="all">Tüm ligler</option>
                  {leagues.map(league => <option value={league} key={league}>{league}</option>)}
                </select>
                <button type="submit">Göster</button>
                {selectedLeague !== "all" && <a href="/#maclar">Temizle</a>}
              </div>
            </form>

            <div className="matches">
              {!matches.length && <div className="empty">Bu lig için şu anda maç bulunamadı.</div>}
              {matches.map((match) => {
                const active = match.status === "LIVE" || match.status === "HALF_TIME";
                const completed = match.status === "FINISHED";
                return (
                  <a className={`match ${active ? "matchLive" : ""}`} href={match.source} target="_blank" rel="noreferrer" key={match.id}>
                    <div className="league">{match.league}</div>
                    <div className="matchRow">
                      <div className="team home">{match.home}</div>
                      <div className={`scoreArea ${(active || completed) ? "scoreBoard" : ""} ${active ? "scoreBoardLive" : ""}`}>
                        <Score match={match} />
                        <MatchStatus match={match} />
                      </div>
                      <div className="team away">{match.away}</div>
                    </div>
                  </a>
                );
              })}
            </div>
            <div className="sourceNote">Maç verisi: Sky Sports</div>
          </section>

          <aside className="sidebar">
            <div className="miniCard"><span className="eyebrow">CANLI</span><strong>{allMatches.filter(m => m.status === "LIVE").length}</strong><p>devam eden maç</p></div>
            <div className="miniCard"><span className="eyebrow">LİG</span><strong>{leagues.length}</strong><p>listelenen lig</p></div>
            <div className="miniCard"><span className="eyebrow">TRANSFER</span><strong>{transfers.length}</strong><p>son transfer</p></div>
          </aside>
        </div>

        <section id="transferler" className="wrap transferSection">
          <div className="sectionHead cleanHead">
            <div><span className="eyebrow">TRANSFERMARKT</span><h2>Son transferler</h2></div>
          </div>

          <div className="transferGrid">
            {!transfers.length && <div className="empty transferEmpty">Şu anda Transfermarkt verisi alınamadı.</div>}
            {transfers.map((item) => (
              <a className="transferCard" href={item.profileUrl || item.sourceUrl} target="_blank" rel="noreferrer" key={item.id}>
                <div className="playerPhotoWrap">
                  {item.photo ? <img className="playerPhoto" src={item.photo} alt={item.playerName} /> : <div className="playerFallback">⚽</div>}
                </div>
                <div className="transferBody">
                  <div className="playerTop">
                    <div>
                      <h3>{item.playerName}</h3>
                      <p>{[item.position, item.age ? `${item.age} yaş` : ""].filter(Boolean).join(" • ")}</p>
                    </div>
                    <span className="feeBadge">{item.fee}</span>
                  </div>
                  <div className="clubMove">
                    <span>{item.leavingClub || "-"}</span>
                    <b>→</b>
                    <span>{item.joiningClub || "-"}</span>
                  </div>
                  <div className="transferMeta">
                    {item.transferDate && <span className="transferDate">📅 {item.transferDate}</span>}
                    {item.marketValue && <span>Piyasa değeri: {item.marketValue}</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
          <div className="sourceNote standaloneNote">Transfer verisi ve oyuncu fotoğrafları: Transfermarkt.</div>
        </section>

        <section id="haberler" className="wrap newsSection">
          <div className="sectionHead cleanHead"><div><span className="eyebrow">SON GELİŞMELER</span><h2>Futbol haberleri</h2></div></div>
          <div className="newsGrid">
            {!news.length && <div className="empty">Şu anda haber verisi alınamadı.</div>}
            {news.map((item) => (
              <a className="newsCard" href={item.url} target="_blank" rel="noreferrer" key={item.id}>
                <div className="newsImage">{item.image ? <img src={item.image} alt="" /> : <div className="imageFallback">FC</div>}</div>
                <div className="newsBody"><div className="newsMeta">{item.category || "Futbol"}</div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}<span className="readMore">Habere git →</span></div>
              </a>
            ))}
          </div>
          <div className="sourceNote standaloneNote">Haber kaynağı: Sky Sports.</div>
        </section>
      </main>

      <footer><div className="wrap">FutbolCanlı • Bağımsız futbol arayüzü</div></footer>
    </>
  );
}
