import Link from "next/link";
import { BadgeCheck, CircleX } from "lucide-react";
import { db, configured } from "@/lib/supabase/server";
import { formatDate } from "@/lib/rules";
export default async function VerifyCode({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  let record: {
    valid: boolean;
    course_title: string;
    issuer: string;
    issued_at: string;
  } | null = null;
  if (configured() && /^[0-9a-f]{32}$/.test(code)) {
    const { data, error } = await (
      await db()
    ).rpc("verify_certificate", { p_code: code });
    if (error)
      throw new Error("Certificate verification is temporarily unavailable.");
    record = data?.[0] || null;
  }
  return (
    <div className="shell section narrow">
      <div
        className="auth-card"
        style={{ maxWidth: "100%", textAlign: "center" }}
      >
        {record ? (
          <>
            <BadgeCheck
              size={48}
              style={{ margin: "0 auto 22px", color: "var(--teal)" }}
            />
            <span className="eyebrow">VERIFIED COURSE COMPLETION</span>
            <h1>Achievement confirmed.</h1>
            <p>This certificate was issued by {record.issuer}.</p>
            <h2 style={{ fontSize: 30 }}>{record.course_title}</h2>
            <p>Issued {formatDate(record.issued_at)}</p>
            <p className="certificate-code">{code}</p>
            <p className="hint">
              Learner identity is private. Verification confirms a record of
              course completion, not professional accreditation.
            </p>
          </>
        ) : (
          <>
            <CircleX
              size={43}
              style={{ margin: "0 auto 22px", color: "#8d5647" }}
            />
            <h1>Certificate not found.</h1>
            <p>
              {configured()
                ? "We couldn’t match this code. Check every character and try again."
                : "Connect your Supabase database to verify certificate records."}
            </p>
          </>
        )}
        <Link href="/verify" className="btn btn-outline">
          Check another code
        </Link>
      </div>
    </div>
  );
}
