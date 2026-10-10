import { dataSourceStatus, getDataDriver } from "@/lib/data";
import { ok } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

let cachedIp: string | null | undefined = undefined;

async function getPublicIp(): Promise<string | null> {
  if (cachedIp !== undefined) return cachedIp;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://api.ipify.org", { signal: controller.signal });
    clearTimeout(t);
    cachedIp = res.ok ? (await res.text()).trim() : null;
  } catch {
    cachedIp = null;
  }
  return cachedIp;
}

/**
 * GET /api/data-source — MongoDB connection state for the status banner.
 */
export async function GET() {
  try {
    await getDataDriver();
  } catch (error) {
    console.warn("[data-source] MongoDB status check failed:", error);
  }
  const status = dataSourceStatus();
  const serverPublicIp = await getPublicIp();
  return ok({ ...status, serverPublicIp });
}
