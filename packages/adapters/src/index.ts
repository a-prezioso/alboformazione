import { env } from '@alboformazione/config';
import { MockInstitutionalSsoAdapter, MockZoomAdapter, MockPaymentAdapter } from './mock';
import type { InstitutionalSsoAdapter, ZoomAdapter, PaymentAdapter } from './types';

export * from './types';
export * from './certificate';
export { MockInstitutionalSsoAdapter, MockZoomAdapter, MockPaymentAdapter };

// Factory — `mock` for the POC. A `live` branch would construct the real
// Zoom S2S / Stripe / institutional-SSO adapters from secrets.
export function ssoAdapter(): InstitutionalSsoAdapter {
  return new MockInstitutionalSsoAdapter();
}

export function zoomAdapter(): ZoomAdapter {
  return new MockZoomAdapter();
}

export function paymentAdapter(): PaymentAdapter {
  return new MockPaymentAdapter();
}

export function adapterMode(): 'mock' | 'live' {
  return env().ADAPTER_MODE;
}
