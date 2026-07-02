// src/lib/auth-guard.ts

import type { GetServerSidePropsContext } from "next";
import { parse } from "cookie";

export interface UserData {
  token: string;
  fullName: string;
  email: string | null;
  userId: number;
  role: string;
  phone: string | null;
}

// This function is ONLY called inside getServerSideProps → context.req is always defined there
export function requireSuperAdmin(context: GetServerSidePropsContext) {
  // Defensive: if for some weird reason req is missing (should never happen in real SSR)
  const cookieHeader = context.req.headers.cookie;

  if (!cookieHeader) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  const cookies = parse(cookieHeader);
  const userCookie = cookies["user"];

  if (!userCookie) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  let user: UserData;
  try {
    user = JSON.parse(userCookie) as UserData;
  } catch (e) {
    console.error("Corrupted user cookie:", e);
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  if (user.role !== "SUPER_ADMIN") {
    return {
      redirect: { destination: "/dashboard", permanent: false },
    };
  }

  // Everything OK – pass user to the page (optional, but useful)
  return { props: { user } };
}