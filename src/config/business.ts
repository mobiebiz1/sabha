export const PHONE_NUMBER = '7799112494';
export const COUNTRY_CODE = '+91';
export const WHATSAPP_NUMBER = '917799112494';

export interface BusinessConfig {
  brandName: string;
  city: string;
  serviceCentreLabel: string;
  countryCode: string;
  phoneNumber: string;
  phoneDisplay: string;
  phoneHref: string;
  whatsappNumber: string;
  whatsappBaseUrl: string;
  serviceHours: string;
  isConfiguredFromEnv: boolean;
}

const LEGACY_PLACEHOLDER_PATTERN = /80\s*0000\s*0000|8000000000/;

function sanitizeEnvPhone(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || LEGACY_PLACEHOLDER_PATTERN.test(trimmed)) return undefined;
  return trimmed;
}

const rawPhone = sanitizeEnvPhone(import.meta.env.VITE_APPLEFIX_PHONE as string | undefined);
const rawWhatsapp = sanitizeEnvPhone(import.meta.env.VITE_APPLEFIX_WHATSAPP as string | undefined);
const rawCentre = (import.meta.env.VITE_APPLEFIX_ADDRESS as string | undefined)?.trim();

export function normalizeDisplayPhone(phone?: string): string {
  const cleaned = (phone || PHONE_NUMBER).trim();
  if (!cleaned || LEGACY_PLACEHOLDER_PATTERN.test(cleaned)) return PHONE_NUMBER;
  return cleaned;
}

export function buildTelHref(phone?: string): string {
  const candidate = (phone || PHONE_NUMBER).trim();
  if (!candidate || LEGACY_PLACEHOLDER_PATTERN.test(candidate)) {
    return `tel:${COUNTRY_CODE}${PHONE_NUMBER}`;
  }
  const stripped = candidate.replace(/[^\d+]/g, '');
  if (!stripped) {
    return `tel:${COUNTRY_CODE}${PHONE_NUMBER}`;
  }
  if (stripped.startsWith('+')) {
    return `tel:${stripped}`;
  }
  const digits = stripped.replace(/\D/g, '');
  const ccDigits = COUNTRY_CODE.replace(/\D/g, '');
  if (digits.length === 10) {
    return `tel:${COUNTRY_CODE}${digits}`;
  }
  if (digits.startsWith(ccDigits) && digits.length === ccDigits.length + 10) {
    return `tel:+${digits}`;
  }
  return `tel:${stripped}`;
}

export function normalizeWhatsappNumber(whatsapp?: string): string {
  const candidate = (whatsapp || WHATSAPP_NUMBER).trim();
  if (!candidate || LEGACY_PLACEHOLDER_PATTERN.test(candidate)) {
    return WHATSAPP_NUMBER;
  }
  const digits = candidate.replace(/\D/g, '');
  if (!digits) return WHATSAPP_NUMBER;
  const ccDigits = COUNTRY_CODE.replace(/\D/g, '');
  if (digits.length === 10) {
    return `${ccDigits}${digits}`;
  }
  return digits;
}

const resolvedPhoneDisplay = normalizeDisplayPhone(rawPhone);
const resolvedWhatsappNumber = normalizeWhatsappNumber(rawWhatsapp);

export const BUSINESS_CONFIG: BusinessConfig = {
  brandName: 'AppleFix',
  city: 'Bangalore',
  serviceCentreLabel: rawCentre || 'AppleFix Service Centre, Bangalore',
  countryCode: COUNTRY_CODE,
  phoneNumber: PHONE_NUMBER,
  phoneDisplay: resolvedPhoneDisplay,
  phoneHref: buildTelHref(resolvedPhoneDisplay),
  whatsappNumber: resolvedWhatsappNumber,
  whatsappBaseUrl: `https://wa.me/${resolvedWhatsappNumber}`,
  serviceHours: 'Mon – Sun · 10:00 AM – 8:00 PM IST',
  isConfiguredFromEnv: Boolean(rawPhone || rawWhatsapp),
};

const CONTACT_STORAGE_KEY = 'applefix_business_contact_v2';

export interface StoredBusinessContact {
  phoneDisplay: string;
  whatsappNumber: string;
}

export function getStoredBusinessContact(): StoredBusinessContact {
  try {
    const raw = localStorage.getItem(CONTACT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredBusinessContact>;
      return {
        phoneDisplay: normalizeDisplayPhone(parsed.phoneDisplay),
        whatsappNumber: normalizeWhatsappNumber(parsed.whatsappNumber),
      };
    }
  } catch {
    // ignore storage read errors
  }
  return {
    phoneDisplay: BUSINESS_CONFIG.phoneDisplay,
    whatsappNumber: BUSINESS_CONFIG.whatsappNumber,
  };
}

export function saveStoredBusinessContact(contact: StoredBusinessContact): void {
  try {
    localStorage.setItem(
      CONTACT_STORAGE_KEY,
      JSON.stringify({
        phoneDisplay: normalizeDisplayPhone(contact.phoneDisplay),
        whatsappNumber: normalizeWhatsappNumber(contact.whatsappNumber),
      })
    );
  } catch {
    // ignore storage write errors
  }
}

export function buildWhatsAppRepairUrl(params: {
  device?: string;
  model?: string;
  issue?: string;
  notes?: string;
  customNumber?: string;
}): string {
  const number = normalizeWhatsappNumber(params.customNumber);
  const device = params.device?.trim();
  const model = params.model?.trim();
  const issue = params.issue?.trim();
  const notes = params.notes?.trim();

  const hasSelection = Boolean(device && (model || issue));

  const lines: string[] = hasSelection
    ? [
        'Hello AppleFix, I would like to enquire about repairing my device.',
        '',
        `Device: ${device}`,
        ...(model ? [`Model: ${model}`] : []),
        ...(issue ? [`Issue: ${issue}`] : []),
        ...(notes ? [`Notes: ${notes}`] : []),
        '',
        'Please share the repair details and estimated cost.',
      ]
    : [
        'Hello AppleFix, I would like to enquire about repairing my device.',
        ...(notes ? ['', `Notes: ${notes}`] : []),
        '',
        'Please share the repair details and availability.',
      ];

  const encoded = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${number}?text=${encoded}`;
}
