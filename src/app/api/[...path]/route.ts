import { NextRequest, NextResponse } from "next/server";

type RouteParams = { path: string[] };
// Next.js expects `params` to be a Promise in route handlers.
type HandlerContext = { params: Promise<RouteParams> };

const hopByHopHeaders = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
]);

const getApiBase = () => {
  // Server-only base URL.
  //
  // Prefer `API_BASE` (server-only). As a convenience for local dev, we also
  // fall back to `NEXT_PUBLIC_API_BASE` since a base URL is not a secret.
  // const base = (process.env.API_BASE ?? process.env.NEXT_PUBLIC_API_BASE ?? "").trim();
  const base = "https://certificate-api.hohitebirhan.com";
  return base.replace(/\/+$/, "");
};

const buildTargetUrl = (req: NextRequest, base: string, pathParts: string[]) => {
  const path = pathParts.map(encodeURIComponent).join("/");
  const url = new URL(`${base}/${path}${req.nextUrl.search}`);
  return url;
};

const proxy = async (req: NextRequest, params: RouteParams) => {
  const base = getApiBase();
  if (!base) {
    return NextResponse.json(
      {
        error: "Missing API_BASE environment variable",
        hint: "Set `API_BASE` (recommended) or `NEXT_PUBLIC_API_BASE` to your backend base URL, e.g. http://localhost:8080/api/v1",
      },
      { status: 500 }
    );
  }

  const path = params.path;
  if (!Array.isArray(path)) {
    return NextResponse.json(
      { error: "Missing route param `path` for /api/[...path] proxy" },
      { status: 400 }
    );
  }
  const targetUrl = buildTargetUrl(req, base, path);

  const headers = new Headers(req.headers);
  for (const h of hopByHopHeaders) headers.delete(h);

  // Preserve content-type, auth, etc. but avoid sending compressed content to the proxy
  // if you plan to inspect/modify it later.
  headers.set("accept-encoding", "identity");

  const init: RequestInit = {
    method: req.method,
    headers,
    cache: "no-store",
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(targetUrl, init);
  } catch (err) {
    const anyErr = err as unknown as { message?: string; code?: string; cause?: unknown };
    const anyCause = anyErr?.cause as { code?: string; message?: string } | undefined;
    const details = {
      message: anyErr?.message ?? "fetch failed",
      code: anyErr?.code,
      cause: anyCause
        ? { message: anyCause.message, code: anyCause.code }
        : undefined,
    };

    console.error("Upstream fetch failed", {
      targetUrl: targetUrl.toString(),
      ...details,
    });

    const isProd = process.env.NODE_ENV === "production";
    return NextResponse.json(
      {
        error: "Upstream fetch failed",
        ...(isProd ? null : { targetUrl: targetUrl.toString(), details }),
        hint: "Check that your backend is running and reachable, and that `API_BASE`/`NEXT_PUBLIC_API_BASE` is correct.",
      },
      { status: 502 }
    );
  }

  const resHeaders = new Headers(upstreamRes.headers);
  for (const h of hopByHopHeaders) resHeaders.delete(h);

  // NextResponse doesn't reliably preserve multi-value set-cookie with a plain Headers copy.
  const setCookies = (() => {
    const maybe = (upstreamRes.headers as unknown as { getSetCookie?: () => string[] })
      .getSetCookie;
    return typeof maybe === "function" ? maybe.call(upstreamRes.headers) : null;
  })();

  const body = await upstreamRes.arrayBuffer();
  const out = new NextResponse(body, {
    status: upstreamRes.status,
    headers: resHeaders,
  });

  if (Array.isArray(setCookies)) {
    out.headers.delete("set-cookie");
    for (const cookie of setCookies) out.headers.append("set-cookie", cookie);
  }

  return out;
};

export async function GET(
  req: NextRequest,
  ctx: HandlerContext
) {
  return proxy(req, await ctx.params);
}
export async function POST(
  req: NextRequest,
  ctx: HandlerContext
) {
  return proxy(req, await ctx.params);
}
export async function PUT(
  req: NextRequest,
  ctx: HandlerContext
) {
  return proxy(req, await ctx.params);
}
export async function PATCH(
  req: NextRequest,
  ctx: HandlerContext
) {
  return proxy(req, await ctx.params);
}
export async function DELETE(
  req: NextRequest,
  ctx: HandlerContext
) {
  return proxy(req, await ctx.params);
}
export async function OPTIONS(
  req: NextRequest,
  ctx: HandlerContext
) {
  return proxy(req, await ctx.params);
}
