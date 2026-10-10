import { cookies } from "next/headers";
import { handleError, ok, requireCsrf } from "@/lib/api-helpers";
import { SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCsrf(req);
    const store = await cookies();
    store.delete(SESSION_COOKIE);
    return ok({ loggedOut: true });
  } catch (e) {
    return handleError(e);
  }
}
