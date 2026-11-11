import Link from "next/link";
import { BadgeCheck, Download, ArrowUpRight } from "lucide-react";
import { ownedCertificate } from "@/features/certificates/data";
import { formatDate } from "@/lib/rules";
export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await ownedCertificate(id);
  return (
    <div className="shell section narrow">
      <Link href="/dashboard" className="text-link">
        ← My learning
      </Link>
      <div className="detail-section">
        <span className="eyebrow">A MOMENT TO CELEBRATE</span>
        <h1>
          You made it <em>happen.</em>
        </h1>
        <p>Your course is complete. Take this achievement with you.</p>
      </div>
      <article className="certificate">
        <BadgeCheck
          size={44}
          style={{ margin: "0 auto 20px", color: "var(--teal)" }}
        />
        <span className="eyebrow">NIJO LEARN</span>
        <h2>Certificate of Completion</h2>
        <p>This recognizes that</p>
        <h3>{c.learner_name}</h3>
        <p>has successfully completed</p>
        <h3>{c.course_title}</h3>
        <p>
          Issued {formatDate(c.issued_at)} · {c.issuer}
        </p>
        <p className="certificate-code">
          Verification code: {c.verification_code}
        </p>
      </article>
      <div className="actions-row">
        <a
          href={"/certificates/" + id + "/download"}
          className="btn btn-primary"
        >
          <Download size={16} />
          Download PDF
        </a>
        <Link
          href={"/verify/" + c.verification_code}
          className="btn btn-outline"
        >
          Verify certificate <ArrowUpRight size={16} />
        </Link>
      </div>
      <p className="hint">
        The public verification page shows the course, issuer and issue date.
        Your name and email remain private.
      </p>
    </div>
  );
}
