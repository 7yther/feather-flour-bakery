import { requireChatGPTUser, chatGPTSignOutPath } from "./chatgpt-auth";
import BakeryApp from "./bakery-app";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireChatGPTUser("/");
  return <BakeryApp userName={user.displayName} signOutPath={chatGPTSignOutPath("/")} />;
}
