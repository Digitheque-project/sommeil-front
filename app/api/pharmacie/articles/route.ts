import { NextRequest, NextResponse } from "next/server";

// Le backend pharmacie n'autorise pas l'origine sommeil-front dans ses
// en-têtes CORS (préflight rejeté par le navigateur). CORS ne s'applique
// qu'aux appels initiés par un navigateur : en relayant la requête depuis ce
// serveur Next.js, l'appel devient serveur-à-serveur et n'y est pas soumis.
// Le navigateur n'appelle plus que cette route, sur sa propre origine.
const PHARMACIE_URL =
  process.env.NEXT_PUBLIC_PHARMACIE_URL || "https://pharmacie-back-1.onrender.com";

export async function GET(request: NextRequest) {
  const upstreamUrl = `${PHARMACIE_URL}/articles/stock-sale-prices?${request.nextUrl.searchParams.toString()}`;

  const headers: Record<string, string> = {};
  const authorization = request.headers.get("authorization");
  const accessToken = request.headers.get("access-token");
  if (authorization) headers["Authorization"] = authorization;
  if (accessToken) headers["access-token"] = accessToken;

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      headers,
      signal: AbortSignal.timeout(45000),
    });
    const body = await upstreamRes.text();
    return new NextResponse(body, {
      status: upstreamRes.status,
      headers: { "Content-Type": upstreamRes.headers.get("content-type") || "application/json" },
    });
  } catch {
    return NextResponse.json(
      { message: "Le catalogue pharmacie n'a pas pu être joint." },
      { status: 502 },
    );
  }
}
