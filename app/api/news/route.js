import { scrapeNews } from "../../../lib/sky";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const articles = await scrapeNews();
    return Response.json(
      { ok: true, source: "Sky Sports", updatedAt: new Date().toISOString(), articles },
      { headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" } }
    );
  } catch (error) {
    return Response.json({ ok: false, error: error.message, articles: [] }, { status: 500 });
  }
}
