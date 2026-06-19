import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface CertificateInput {
  recipientName: string;
  contentTitle: string;
  credits: number;
  mode: 'live' | 'ondemand';
  serial: string;
  issuedAt: Date;
  associationName?: string;
  verifyUrl?: string;
  /** Optional QR PNG bytes (encodes the verifyUrl) embedded bottom-right. */
  qrPng?: Uint8Array;
}

/** Renders an A4 landscape attestato as a PDF (Uint8Array). */
export async function renderCertificate(input: CertificateInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // A4 landscape
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  const navy = rgb(0.07, 0.12, 0.28);
  const gray = rgb(0.3, 0.3, 0.3);

  page.drawRectangle({ x: 20, y: 20, width: width - 40, height: height - 40, borderColor: navy, borderWidth: 2 });

  const center = (text: string, y: number, size: number, f = font, color = navy) => {
    const w = f.widthOfTextAtSize(text, size);
    page.drawText(text, { x: (width - w) / 2, y, size, font: f, color });
  };

  center(input.associationName ?? 'Associazione Professionale', height - 90, 16, bold, gray);
  center('ATTESTATO DI PARTECIPAZIONE', height - 150, 28, bold);
  center('Si attesta che', height - 210, 14, font, gray);
  center(input.recipientName, height - 250, 24, bold);
  center('ha completato con profitto l’attività formativa', height - 295, 14, font, gray);
  center(input.contentTitle, height - 335, 18, bold);
  const modeLabel = input.mode === 'live' ? 'fruizione Live' : 'fruizione in Differita';
  center(`Crediti formativi riconosciuti: ${input.credits} (${modeLabel})`, height - 380, 14);

  page.drawText(`Codice: ${input.serial}`, { x: 60, y: 70, size: 10, font, color: gray });
  page.drawText(`Data: ${input.issuedAt.toLocaleDateString('it-IT')}`, { x: 60, y: 54, size: 10, font, color: gray });
  if (input.verifyUrl) {
    page.drawText(`Verifica: ${input.verifyUrl}`, { x: 60, y: 38, size: 8, font, color: gray });
  }

  if (input.qrPng) {
    try {
      const png = await doc.embedPng(input.qrPng);
      const size = 78;
      page.drawImage(png, { x: width - size - 50, y: 44, width: size, height: size });
    } catch {
      /* ignore QR embedding errors */
    }
  }

  return doc.save();
}
