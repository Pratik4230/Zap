import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createAuth } from "@/lib/auth";

const handler = async (request: Request) => {
  const { env } = getCloudflareContext();
  return createAuth(env.DB).handler(request);
};

export { handler as GET, handler as POST };
