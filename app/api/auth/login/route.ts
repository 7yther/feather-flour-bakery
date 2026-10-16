import { authenticate, createSession } from "@/lib/app-auth";

export async function POST(request:Request){
  try{
    const body=await request.json().catch(()=>({})) as Record<string,unknown>;
    const user=await authenticate(body.username,body.password);
    if(!user)return Response.json({error:"Invalid username or password."},{status:401});
    await createSession(user,new URL(request.url).protocol==="https:");
    return Response.json({ok:true});
  }catch(error){
    console.error("Login failed",error);
    return Response.json({error:"Sign-in is temporarily unavailable. Please try again."},{status:500});
  }
}
