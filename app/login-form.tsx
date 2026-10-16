"use client";

import { FormEvent, useState } from "react";
import { Feather, LockKeyhole, UserRound } from "lucide-react";

export default function LoginForm(){
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const submit=async(event:FormEvent)=>{
    event.preventDefault();setBusy(true);setError("");
    try{
      const response=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username,password})});
      const result=await response.json() as {error?:string};
      if(!response.ok)throw new Error(result.error||"Could not sign in.");
      window.location.href="/admin";
    }catch(reason:any){setError(reason.message||"Could not sign in.");setBusy(false)}
  };
  return <main className="login-page"><section className="login-card"><div className="login-brand"><div className="login-mark"><Feather size={30}/></div><div><span>FEATHER & FLOUR</span><h1>Bakery Studio</h1></div></div><div className="login-copy"><p className="eyebrow">Private business workspace</p><h2>Welcome back.</h2><p>Sign in to manage orders, sales, recipes, inventory, expenses, and reports.</p></div><form onSubmit={submit}><label><span>Username</span><div className="login-input"><UserRound size={18}/><input autoComplete="username" autoCapitalize="none" required value={username} onChange={event=>setUsername(event.target.value)} /></div></label><label><span>Password</span><div className="login-input"><LockKeyhole size={18}/><input type="password" autoComplete="current-password" required value={password} onChange={event=>setPassword(event.target.value)} /></div></label>{error&&<p className="login-error">{error}</p>}<button className="primary large" disabled={busy}>{busy?"Signing in…":"Sign in"}</button></form><small>Authorized Feather & Flour team members only. <a href="/">Return to storefront</a></small></section></main>;
}
