import fontkit from "@pdf-lib/fontkit";
import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import { formatDate } from "../../lib/rules";
import type { Certificate } from "../courses/types";
export async function generateCertificatePdf(c: Certificate) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([842, 595]);
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(
      await fs.readFile(
        path.join(process.cwd(), "assets/fonts/NotoSans-Regular.ttf"),
      ),
      { subset: true },
    ),
    bold = font;
  const navy = rgb(0.08, 0.17, 0.21),
    teal = rgb(0.09, 0.43, 0.4);
  const safe = (s: string) => s;
  const text = (
    value: string,
    y: number,
    size: number,
    color = navy,
    strong = false,
  ) => {
    const f = strong ? bold : font;
    const s = safe(value);
    const fitted = Math.min(size, 730 / Math.max(f.widthOfTextAtSize(s, 1), 1));
    page.drawText(s, {
      x: (842 - f.widthOfTextAtSize(s, fitted)) / 2,
      y,
      size: fitted,
      font: f,
      color,
    });
  };
  page.drawRectangle({
    x: 0,
    y: 0,
    width: 842,
    height: 595,
    color: rgb(0.975, 0.98, 0.95),
  });
  page.drawRectangle({
    x: 24,
    y: 24,
    width: 794,
    height: 547,
    borderColor: teal,
    borderWidth: 1,
  });
  page.drawRectangle({
    x: 32,
    y: 32,
    width: 778,
    height: 531,
    borderColor: rgb(0.78, 0.84, 0.75),
    borderWidth: 0.5,
  });
  text("NIJO LEARN", 504, 15, teal, true);
  text("Certificate of Completion", 438, 35, navy);
  text("This recognizes that", 389, 12);
  text(c.learner_name, 342, 31, teal, true);
  text("has successfully completed", 304, 12);
  text(c.course_title, 259, 25, navy, true);
  text("Issued " + formatDate(c.issued_at) + "  |  " + c.issuer, 207, 11);
  text("Proof of course completion", 174, 10);
  text("Verification code: " + c.verification_code, 119, 9);
  text(
    new URL(
      "/verify/" + c.verification_code,
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    ).href,
    99,
    9,
    teal,
  );
  text("Small steps. Real possibilities.", 61, 9);
  pdf.setTitle(c.course_title + " — Certificate of Completion");
  pdf.setAuthor("Nijo Learn");
  return pdf.save();
}
