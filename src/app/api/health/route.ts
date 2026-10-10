import { getDataDriver } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await getDataDriver();
    return Response.json({ ok: true, datastore: "mongo", mongo: "ok" });
  } catch {
    return Response.json(
      { ok: false, datastore: "mongo", mongo: "unavailable" },
      { status: 503 },
    );
  }
}
