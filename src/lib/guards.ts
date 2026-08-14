import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth";

// Returns the session or a ready-to-return 401 response.
export function requireAuth():
  | { session: SessionPayload; error: null }
  | { session: null; error: NextResponse } {
  const session = getSession();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }
  return { session, error: null };
}

export function requireCustomer():
  | { session: SessionPayload; error: null }
  | { session: null; error: NextResponse } {
  const result = requireAuth();
  if (result.error) return result;
  if (result.session.role !== "CUSTOMER") {
    return {
      session: null,
      error: NextResponse.json({ error: "Customer access required" }, { status: 403 }),
    };
  }
  return result;
}

export function requireWalker():
  | { session: SessionPayload; error: null }
  | { session: null; error: NextResponse } {
  const result = requireAuth();
  if (result.error) return result;
  if (result.session.role !== "WALKER") {
    return {
      session: null,
      error: NextResponse.json({ error: "Walker access required" }, { status: 403 }),
    };
  }
  return result;
}

export function requireAdmin():
  | { session: SessionPayload; error: null }
  | { session: null; error: NextResponse } {
  const result = requireAuth();
  if (result.error) return result;
  if (result.session.role !== "ADMIN") {
    return {
      session: null,
      error: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
    };
  }
  return result;
}
