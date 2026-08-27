import { scrapeMatches, scrapeNews } from "../lib/sky";
import { scrapeLatestTransfers } from "../lib/transfermarkt";

export const dynamic = "force-dynamic";

function MatchStatus({ match }) {
  if (match.status === "LIVE") return <span className="status live">● {match.minute ? `${match.minute}'` : "CANLI"}</span>;
  if (match.status === "HALF_TIME") return <span className="status live">DEVRE</span>;
  if (match.status === "FINISHED") return <span className="status">MS</span>;
  return <span className="status">{match.time || "Yakında"}</span>;
}

function Score({ match }) {
  if (typeof match.homeScore === "number" && typeof match.awayScore === "number") {
    return <strong className="score">{match.homeScore}<span>-</span>{match.awayScore}</strong>;
  }
  return <strong className="versus">VS</strong>;
}

export default async function Home() {
  const [matchesResult, newsResult, transfersResult] = await Promise.allSettled([
    scrapeMatches(),
    scrapeNews(),
    scrapeLatestTransfers()
  ]);

  const matches = matchesResult.status === "fulfilled" ? matchesResult.value : [];
  const news = newsResult.status === "fulfilled" ? newsResult.value : [];
  const transfers = transfersResult.status === "fulfilled" ? transfersResult.value : [];

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
            <p>Canlı skorlar, son transferler ve futbol haberleri.</p>
          </div>
        </section>

        <div className="wrap mainGrid">
          <section id="maclar" className="panel">
            <div className="sectionHead">
              <div><span className="eyebrow">MAÇ MERKEZİ</span><h2>Bugünün maçları</h2></div>
              <span className="liveBadge">● CANLI</span>
            </div>
            <div className="matches">
              {!matches.length && <div className="empty">Şu anda maç verisi alınamadı.</div>}
              {matches.map((match) => (
                <a className="match" href={match.source} target="_blank" rel="noreferrer" key={match.id}>
                  <div className="league">{match.league}</div>
                  <div className="matchRow">
                    <div className="team home">{match.home}</div>
                    <div className="scoreArea"><Score match={match} /><MatchStatus match={match} /></div>
                    <div className="team away">{match.away}</div>
                  </div>
                </a>
              ))}
            </div>
            <div className="sourceNote">Maç verisi: Sky Sports</div>
          </section>

          <aside className="sidebar">
            <div className="miniCard"><span className="eyebrow">CANLI</span><strong>{matches.filter(m => m.status === "LIVE").length}</strong><p>devam eden maç</p></div>
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
                  {item.marketValue && <div className="marketValue">Piyasa değeri: {item.marketValue}</div>}
                </div>
              </a>
            ))}
          </div>
          <div className="sourceNote standaloneNote">Transfer verisi ve oyuncu fotoğrafları: Transfermarkt. Kartlar kaynak oyuncu profiline gider.</div>
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
          <div className="sourceNote standaloneNote">Haber kaynağı: Sky Sports. Haber bağlantıları özgün kaynağa gider.</div>
        </section>
      </main>

      <footer><div className="wrap">FutbolCanlı • Bağımsız futbol arayüzü</div></footer>
    </>
  );
}
