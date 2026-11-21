// The PC app's token, shown in Settings after the PIN. POST { pin, rotate? } -> { token }.
// Rotating cuts off the old token at once (the PC app then needs the new one).
import { NextRequest } from "next/server";
import { checkPin, json } from "@/lib/live/auth";
import { engineToken, rotateEngineToken } from "@/lib/live/secrets";
import { getStore } from "@/lib/live/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const store = getStore();
  if (!store) return json({ error: "no storage connected" }, 503);
  const body = (await req.json().catch(() => ({}))) as { pin?: string; rotate?: boolean };
  if (!(await checkPin(store, body.pin)).ok) return json({ error: "wrong PIN" }, 401);
  return json({ token: body.rotate ? await rotateEngineToken(store) : await engineToken(store) });
}
