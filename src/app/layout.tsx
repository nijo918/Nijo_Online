import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { configured } from "@/lib/supabase/server";
import { signOut } from "@/features/auth/actions";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Nijo Learn — A little learning. A world of possibility.",
    template: "%s · Nijo Learn",
  },
  description:
    "Build practical skills with free, self-paced courses. Learn, practice and earn your certificate of completion with Nijo Learn.",
};
export const dynamic = "force-dynamic";
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <header className="site-header">
          <div className="shell header-inner">
            <Brand />
            <nav aria-label="Main navigation">
              <Link href="/courses">Explore courses</Link>
              <Link href="/#how-it-works" className="nav-secondary">
                How it works
              </Link>
              {user ? (
                <>
                  <Link href="/dashboard">My learning</Link>
                  {user.isAdmin && <Link href="/admin">Admin</Link>}
                  <form action={signOut}>
                    <button className="btn btn-quiet">Sign out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/auth/sign-in" className="nav-signin">
                    Sign in
                  </Link>
                  <Link
                    href="/auth/sign-up"
                    className="btn btn-primary btn-small"
                  >
                    Start learning <ArrowUpRight size={16} />
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        {!configured() && (
          <div className="setup-notice">
            Catalog preview · Connect Supabase to enable accounts and saved
            learning.{" "}
            <Link href="/setup">
              Setup guide <ArrowUpRight size={12} />
            </Link>
          </div>
        )}
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="shell footer-top">
            <Brand />
            <p>
              Practical skills.
              <br />
              Possibilities that go further.
            </p>
            <div>
              <Link href="/courses">Explore courses</Link>
              <Link href="/verify">Verify a certificate</Link>
              <Link href="/dashboard">My learning</Link>
            </div>
          </div>
          <div className="shell footer-bottom">
            <span>© {new Date().getFullYear()} Nijo Learn</span>
            <span>Made for curious minds. Open to everyone.</span>
            <span>Learn at your own pace ↗</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
