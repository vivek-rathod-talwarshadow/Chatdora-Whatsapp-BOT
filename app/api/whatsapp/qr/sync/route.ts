import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { syncLocalQrBusiness } from "@/lib/whatsapp/localQrSync";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId } = (await request.json()) as { businessId?: string };
    if (!businessId) {
      return NextResponse.json({ error: "Missing businessId" }, { status: 400 });
    }

    const result = await syncLocalQrBusiness({
      businessId,
      userId: user.id
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to sync QR conversations"
      },
      { status: 500 }
    );
  }
}
