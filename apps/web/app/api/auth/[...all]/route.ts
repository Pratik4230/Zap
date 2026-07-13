import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuth } from "@/lib/auth";

const handler = async (request: Request) => {
  const { env } = getCloudflareContext();
  return getAuth(env).handler(request);
};

export { handler as GET, handler as POST };
