// Adapter contracts — the production seams of the POC.
// Mock implementations live alongside; `live` implementations would call the
// real external services (Zoom S2S OAuth, Stripe, the Association SSO).

export type MembershipStatus = 'associato' | 'non_associato';

export interface InstitutionalProfile {
  email: string;
  displayName: string;
  membership: MembershipStatus;
  economicTier: string;
  roles: string[]; // member | formatore | operatore | admin
}

export interface InstitutionalSsoAdapter {
  /** Verify identity + membership + roles against the institutional site. */
  verify(email: string): Promise<InstitutionalProfile | null>;
}

export interface ZoomMeeting {
  meetingId: string;
  joinUrl: string;
  startUrl: string;
}

export interface ZoomAttendee {
  email: string;
  joinedAt: string;
  leftAt: string;
  minutes: number;
}

export interface ZoomAdapter {
  createMeeting(input: { topic: string; startAt: Date; durationMin: number }): Promise<ZoomMeeting>;
  getJoinUrl(meetingId: string, email: string): Promise<string>;
  attendanceLog(meetingId: string): Promise<ZoomAttendee[]>;
  recordingUrl(meetingId: string): Promise<string | null>;
}

export interface CheckoutSession {
  checkoutId: string;
  redirectUrl: string;
}

export interface PaymentAdapter {
  createCheckout(input: { orderId: string; amount: number; description: string }): Promise<CheckoutSession>;
  confirm(checkoutId: string): Promise<{ paid: boolean }>;
}
