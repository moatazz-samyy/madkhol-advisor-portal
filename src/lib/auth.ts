import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  pages: { signIn: "/ar/login" },
  providers: [
    CredentialsProvider({
      name: "Madkhol Advisor",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;
        const advisor = await prisma.advisor.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });
        if (!advisor) return null;
        const ok = await bcrypt.compare(credentials.password, advisor.passwordHash);
        if (!ok) return null;
        return {
          id: advisor.id,
          name: advisor.name,
          nameAr: advisor.nameAr,
          email: advisor.email,
          licenseNo: advisor.licenseNo,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.advisorId = user.id;
        token.nameAr = (user as { nameAr?: string }).nameAr;
        token.licenseNo = (user as { licenseNo?: string }).licenseNo;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.advisorId = token.advisorId as string;
        session.user.nameAr = token.nameAr as string | undefined;
        session.user.licenseNo = token.licenseNo as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
