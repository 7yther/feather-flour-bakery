import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";
import { getAppUser, getWorkspaceId } from "@/lib/app-auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  const user = await getAppUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const workspaceId = getWorkspaceId();
  if (!env.BUCKET) return Response.json({ error: "File storage is unavailable" }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a file" }, { status: 400 });
  if (!allowedTypes.has(file.type)) return Response.json({ error: "Use a JPG, PNG, WebP, or PDF file" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: "File must be under 8 MB" }, { status: 400 });
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
  const key = `${workspaceId}/${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { originalName: file.name.slice(0, 200) } });
  return Response.json({ key, url: `/api/file?key=${encodeURIComponent(key)}` });
}

export async function GET(request: Request) {
  const workspaceId = getWorkspaceId();
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!key.startsWith(`${workspaceId}/`) || !env.BUCKET) return new Response("Not found", { status: 404 });
  const user = await getAppUser();
  if (!user) {
    const publicProduct = await getDb().select({ id: s.products.id }).from(s.products).where(and(
      eq(s.products.userId, workspaceId), eq(s.products.active, true), eq(s.products.photoKey, key),
    )).limit(1);
    if (!publicProduct[0]) return new Response("Not found", { status: 404 });
  }
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("etag", object.httpEtag); headers.set("cache-control", user ? "private, max-age=3600" : "public, max-age=3600");
  return new Response(object.body, { headers });
}
