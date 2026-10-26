export const LEGAL_NOTICE_VERSION = '2026-10-26';

export interface LegalConsentRecord {
  acceptedAt: string;
  noticeVersion: string;
  privacyPolicyVersion: string;
  termsVersion: string;
}

export function createLegalConsentRecord(): LegalConsentRecord {
  const acceptedAt = new Date().toISOString();
  return {
    acceptedAt,
    noticeVersion: LEGAL_NOTICE_VERSION,
    privacyPolicyVersion: LEGAL_NOTICE_VERSION,
    termsVersion: LEGAL_NOTICE_VERSION,
  };
}

const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

export const legalContactEmail: string =
  metaEnv.VITE_LEGAL_CONTACT_EMAIL || 'paulhoehne411@gmail.com';

export const legalOperatorName: string =
  metaEnv.VITE_LEGAL_OPERATOR_NAME || 'Paul Höhne (Privates, nicht-kommerzielles Hobbyprojekt)';

export const legalOperatorAddress: string =
  metaEnv.VITE_LEGAL_OPERATOR_ADDRESS || 'Häuser Weg 9, 61267 Neu-Anspach, Deutschland';
