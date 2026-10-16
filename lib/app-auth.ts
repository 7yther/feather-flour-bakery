import "server-only";

import { cookies } from "next/headers";
import { env } from "cloudflare:workers";
import { and, eq, gt, lt } from "drizzle-orm";
import { getDb } from "@/db";
import * as s from "@/db/schema";

const COOKIE_NAME = "ff_session";
const ITERATIONS = 100_000;
const SESSION_DAYS = 30;

export type AppUser = { id:string; username:string; displayName:string; role:"owner"|"staff" };

const bytesToBase64 = (bytes:Uint8Array) => {
  let binary="";
  for(const byte of bytes) binary+=String.fromCharCode(byte);
  return btoa(binary);
};

const base64ToBytes = (value:string) => {
  const binary=atob(value);
  return Uint8Array.from(binary,(char)=>char.charCodeAt(0));
};

const randomToken = (size=32) => {
  const bytes=crypto.getRandomValues(new Uint8Array(size));
  return bytesToBase64(bytes).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");
};

const digest = async(value:string) => bytesToBase64(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))));

export const normalizeUsername = (value:unknown) => String(value??"").trim().toLowerCase().replace(/[^a-z0-9._-]/g,"").slice(0,32);

export async function hashPassword(password:string,salt=bytesToBase64(crypto.getRandomValues(new Uint8Array(16)))) {
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:base64ToBytes(salt),iterations:ITERATIONS},key,256);
  return `pbkdf2$${ITERATIONS}$${salt}$${bytesToBase64(new Uint8Array(bits))}`;
}

export async function verifyPassword(password:string,stored:string) {
  const [kind,iterations,salt,expected]=stored.split("$");
  if(kind!=="pbkdf2"||!iterations||!salt||!expected)return false;
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
  const bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:base64ToBytes(salt),iterations:Number(iterations)},key,256);
  const actual=bytesToBase64(new Uint8Array(bits));
  if(actual.length!==expected.length)return false;
  let mismatch=0;
  for(let i=0;i<actual.length;i++)mismatch|=actual.charCodeAt(i)^expected.charCodeAt(i);
  return mismatch===0;
}

const workspaceSetting = () => env.BAKERY_WORKSPACE_ID || process.env.BAKERY_WORKSPACE_ID;
const adminUsernameSetting = () => env.INITIAL_ADMIN_USERNAME || process.env.INITIAL_ADMIN_USERNAME;
const adminPasswordSetting = () => env.INITIAL_ADMIN_PASSWORD_HASH || process.env.INITIAL_ADMIN_PASSWORD_HASH;

export const getWorkspaceId = () => workspaceSetting()?.trim() || "feather-flour-bakery";

export async function authenticate(usernameValue:unknown,passwordValue:unknown) {
  const username=normalizeUsername(usernameValue);
  const password=String(passwordValue??"");
  if(!username||!password)return null;
  const db=getDb();
  let account=(await db.select().from(s.appUsers).where(eq(s.appUsers.username,username)).limit(1))[0];
  const initialPasswordHash=adminPasswordSetting();
  if(!account&&username===normalizeUsername(adminUsernameSetting())&&initialPasswordHash&&await verifyPassword(password,initialPasswordHash)){
    const stamp=new Date().toISOString();
    account={id:crypto.randomUUID(),username,displayName:"Shane Warren",passwordHash:initialPasswordHash,role:"owner",active:true,createdAt:stamp,updatedAt:stamp};
    await db.insert(s.appUsers).values(account).onConflictDoNothing();
    account=(await db.select().from(s.appUsers).where(eq(s.appUsers.username,username)).limit(1))[0];
  }
  if(!account||!account.active||!await verifyPassword(password,account.passwordHash))return null;
  return {id:account.id,username:account.username,displayName:account.displayName,role:account.role} satisfies AppUser;
}

export async function createSession(user:AppUser,secure:boolean) {
  const db=getDb();
  const token=randomToken();
  const stamp=new Date();
  const expires=new Date(stamp.getTime()+SESSION_DAYS*24*60*60*1000);
  await db.delete(s.appSessions).where(lt(s.appSessions.expiresAt,stamp.toISOString()));
  await db.insert(s.appSessions).values({id:crypto.randomUUID(),userId:user.id,tokenHash:await digest(token),expiresAt:expires.toISOString(),createdAt:stamp.toISOString()});
  const jar=await cookies();
  jar.set(COOKIE_NAME,token,{httpOnly:true,secure,sameSite:"lax",path:"/",expires});
}

export async function getAppUser():Promise<AppUser|null> {
  const token=(await cookies()).get(COOKIE_NAME)?.value;
  if(!token)return null;
  const db=getDb();
  const session=(await db.select().from(s.appSessions).where(and(eq(s.appSessions.tokenHash,await digest(token)),gt(s.appSessions.expiresAt,new Date().toISOString()))).limit(1))[0];
  if(!session)return null;
  const account=(await db.select().from(s.appUsers).where(and(eq(s.appUsers.id,session.userId),eq(s.appUsers.active,true))).limit(1))[0];
  return account?{id:account.id,username:account.username,displayName:account.displayName,role:account.role}:null;
}

export async function clearSession() {
  const jar=await cookies();
  const token=jar.get(COOKIE_NAME)?.value;
  if(token)await getDb().delete(s.appSessions).where(eq(s.appSessions.tokenHash,await digest(token)));
  jar.delete(COOKIE_NAME);
}
