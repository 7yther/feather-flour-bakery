import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!env.BUCKET) return Response.json({ error: "File storage is unavailable" }, { status: 503 });
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choose a file" }, { status: 400 });
  if (!allowedTypes.has(file.type)) return Response.json({ error: "Use a JPG, PNG, WebP, or PDF file" }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return Response.json({ error: "File must be under 8 MB" }, { status: 400 });
  const extension = file.name.split(".").pop()?.replace(/[^a-z0-9]/gi, "").slice(0, 8) || "bin";
  const key = `${user.userId}/${crypto.randomUUID()}.${extension}`;
  await env.BUCKET.put(key, file.stream(), { httpMetadata: { contentType: file.type }, customMetadata: { originalName: file.name.slice(0, 200) } });
  return Response.json({ key, url: `/api/file?key=${encodeURIComponent(key)}` });
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return new Response("Sign in required", { status: 401 });
  const key = new URL(request.url).searchParams.get("key") || "";
  if (!key.startsWith(`${user.userId}/`) || !env.BUCKET) return new Response("Not found", { status: 404 });
  const object = await env.BUCKET.get(key);
  if (!object) return new Response("Not found", { status: 404 });
  const headers = new Headers(); object.writeHttpMetadata(headers); headers.set("etag", object.httpEtag); headers.set("cache-control", "private, max-age=3600");
  return new Response(object.body, { headers });
}
