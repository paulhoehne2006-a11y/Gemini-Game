export const LEGAL_NOTICE_VERSION = '2026-10-15';

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

export const legalContactEmail =
  import.meta.env.VITE_LEGAL_CONTACT_EMAIL || '[CONFIGURE_LEGAL_CONTACT_EMAIL]';

export const legalOperatorName =
  import.meta.env.VITE_LEGAL_OPERATOR_NAME || '[CONFIGURE_LEGAL_OPERATOR_NAME]';
