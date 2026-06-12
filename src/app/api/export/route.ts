import { getCurrentUser } from "@/lib/auth/session";
import { exportUserData } from "@/lib/settings/repository";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await exportUserData(user.id);

  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="subscription-hub-export.json"',
    },
  });
}
