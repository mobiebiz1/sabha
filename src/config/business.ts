export interface BusinessConfig {
  brandName: string;
  city: string;
  serviceCentreLabel: string;
  phoneDisplay: string;
  phoneHref: string;
  whatsappNumber: string;
  serviceHours: string;
  isConfiguredFromEnv: boolean;
}

const rawPhone = (import.meta.env.VITE_APPLEFIX_PHONE as string | undefined)?.trim();
const rawWhatsapp = (import.meta.env.VITE_APPLEFIX_WHATSAPP as string | undefined)?.trim();
const rawCentre = (import.meta.env.VITE_APPLEFIX_ADDRESS as string | undefined)?.trim();

const fallbackPhone = '+91 80 0000 0000';
const fallbackWhatsapp = '918000000000';

export const BUSINESS_CONFIG: BusinessConfig = {
  brandName: 'AppleFix',
  city: 'Bangalore',
  serviceCentreLabel: rawCentre || 'AppleFix Service Centre, Bangalore',
  phoneDisplay: rawPhone || fallbackPhone,
  phoneHref: `tel:${(rawPhone || fallbackPhone).replace(/[^\d+]/g, '')}`,
  whatsappNumber: (rawWhatsapp || fallbackWhatsapp).replace(/\D/g, ''),
  serviceHours: 'Mon – Sun · 10:00 AM – 8:00 PM IST',
  isConfiguredFromEnv: Boolean(rawPhone || rawWhatsapp),
};

const CONTACT_STORAGE_KEY = 'applefix_business_contact_v1';

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
        phoneDisplay: parsed.phoneDisplay?.trim() || BUSINESS_CONFIG.phoneDisplay,
        whatsappNumber: (parsed.whatsappNumber || BUSINESS_CONFIG.whatsappNumber).replace(/\D/g, ''),
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
        phoneDisplay: contact.phoneDisplay.trim() || BUSINESS_CONFIG.phoneDisplay,
        whatsappNumber: contact.whatsappNumber.replace(/\D/g, '') || BUSINESS_CONFIG.whatsappNumber,
      })
    );
  } catch {
    // ignore storage write errors
  }
}

export function buildTelHref(phone?: string): string {
  const cleaned = (phone || BUSINESS_CONFIG.phoneDisplay).replace(/[^\d+]/g, '');
  return `tel:${cleaned || BUSINESS_CONFIG.phoneHref.replace('tel:', '')}`;
}

export function buildWhatsAppRepairUrl(params: {
  device: string;
  model: string;
  issue: string;
  notes?: string;
  customNumber?: string;
}): string {
  const number = (params.customNumber || BUSINESS_CONFIG.whatsappNumber).replace(/\D/g, '');
  const lines = [
    `Hello AppleFix,`,
    ``,
    `I need assistance with my device.`,
    ``,
    `Device: ${params.device}`,
    `Model: ${params.model}`,
    `Issue: ${params.issue}`,
  ];
  if (params.notes?.trim()) {
    lines.push(`Notes: ${params.notes.trim()}`);
  }
  lines.push(``, `Please help me with the repair.`);
  const encoded = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${number}?text=${encoded}`;
}

