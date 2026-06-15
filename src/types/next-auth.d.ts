import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      advisorId: string;
      nameAr?: string;
      licenseNo?: string;
    } & DefaultSession["user"];
  }
  interface User extends DefaultUser {
    nameAr?: string;
    licenseNo?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    advisorId?: string;
    nameAr?: string;
    licenseNo?: string;
  }
}
