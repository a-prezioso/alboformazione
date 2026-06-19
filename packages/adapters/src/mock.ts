import type {
  InstitutionalSsoAdapter,
  InstitutionalProfile,
  ZoomAdapter,
  ZoomMeeting,
  ZoomAttendee,
  PaymentAdapter,
  CheckoutSession
} from './types';

// ── Mock institutional SSO ──────────────────────────────────────────────────
// Demo directory mirroring the seeded users. In production this calls the
// Association's institutional site to resolve identity + membership.
const DEMO_DIRECTORY: Record<string, InstitutionalProfile> = {
  'mario.rossi@demo.it': { email: 'mario.rossi@demo.it', displayName: 'Mario Rossi', membership: 'associato', economicTier: 'standard', roles: ['member'] },
  'giulia.verdi@demo.it': { email: 'giulia.verdi@demo.it', displayName: 'Giulia Verdi', membership: 'non_associato', economicTier: 'standard', roles: ['member'] },
  'prof.bianchi@demo.it': { email: 'prof.bianchi@demo.it', displayName: 'Prof. Bianchi', membership: 'associato', economicTier: 'standard', roles: ['member', 'formatore'] },
  'operatore@demo.it': { email: 'operatore@demo.it', displayName: 'Operatore Segreteria', membership: 'associato', economicTier: 'standard', roles: ['operatore'] }
};

export class MockInstitutionalSsoAdapter implements InstitutionalSsoAdapter {
  async verify(email: string): Promise<InstitutionalProfile | null> {
    return DEMO_DIRECTORY[email.toLowerCase()] ?? null;
  }
}

// ── Mock Zoom ────────────────────────────────────────────────────────────────
export class MockZoomAdapter implements ZoomAdapter {
  async createMeeting(input: { topic: string; startAt: Date; durationMin: number }): Promise<ZoomMeeting> {
    const id = `MOCK-${Buffer.from(input.topic).toString('hex').slice(0, 10)}`;
    return {
      meetingId: id,
      joinUrl: `https://us02web.zoom.us/j/${id}`,
      startUrl: `https://us02web.zoom.us/s/${id}`
    };
  }
  async getJoinUrl(meetingId: string): Promise<string> {
    return `https://us02web.zoom.us/j/${meetingId}`;
  }
  async attendanceLog(): Promise<ZoomAttendee[]> {
    // In live mode this reads the real participation report.
    return [];
  }
  async recordingUrl(meetingId: string): Promise<string | null> {
    return `https://us02web.zoom.us/rec/${meetingId}`;
  }
}

// ── Mock Payment ─────────────────────────────────────────────────────────────
export class MockPaymentAdapter implements PaymentAdapter {
  async createCheckout(input: { orderId: string; amount: number; description: string }): Promise<CheckoutSession> {
    return {
      checkoutId: `chk_${input.orderId}`,
      // Simulated checkout page served by the app itself.
      redirectUrl: `/checkout/${input.orderId}`
    };
  }
  async confirm(): Promise<{ paid: boolean }> {
    return { paid: true };
  }
}
