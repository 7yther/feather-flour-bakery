import BakeryApp from "../bakery-app";
import LoginForm from "../login-form";
import { getAppUser } from "@/lib/app-auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getAppUser();
  if (!user) return <LoginForm />;
  return <BakeryApp userName={user.displayName} signOutPath="/api/auth/logout" />;
}
