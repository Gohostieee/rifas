import { NextRequest, NextResponse } from "next/server";

// Store the admin password in an environment variable for security
// For now, using a default password - should be set via ADMIN_PASSWORD env var
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}







