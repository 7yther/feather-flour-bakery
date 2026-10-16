import { clearSession } from "@/lib/app-auth";

export async function GET(request:Request){
  await clearSession();
  return Response.redirect(new URL("/",request.url),303);
}

export async function POST(request:Request){
  await clearSession();
  return Response.redirect(new URL("/",request.url),303);
}
