import { scrapeMatches } from "../../../lib/sky";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const matches = await scrapeMatches();
    return Response.json(
      { ok: true, source: "Sky Sports", updatedAt: new Date().toISOString(), matches },
      { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } }
    );
  } catch (error) {
    return Response.json({ ok: false, error: error.message, matches: [] }, { status: 500 });
  }
}
