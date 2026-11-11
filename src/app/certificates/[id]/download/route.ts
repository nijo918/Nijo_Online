import { ownedCertificate } from "@/features/certificates/data";
import { generateCertificatePdf } from "@/features/certificates/pdf";
export const runtime = "nodejs";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const certificate = await ownedCertificate(id);
  const bytes = await generateCertificatePdf(certificate);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        'attachment; filename="nijo-learn-certificate.pdf"',
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}
