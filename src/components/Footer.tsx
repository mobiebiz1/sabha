import { MessageCircle, Phone } from 'lucide-react';
import {
  buildTelHref,
  buildWhatsAppRepairUrl,
  BUSINESS_CONFIG,
  normalizeDisplayPhone,
} from '../config/business';

interface FooterProps {
  onNavigate: (id: string) => void;
  contactPhone?: string;
  contactWhatsapp?: string;
  selectedDevice?: string;
  selectedModel?: string;
  selectedIssue?: string;
}

export function Footer({
  onNavigate,
  contactPhone = BUSINESS_CONFIG.phoneDisplay,
  contactWhatsapp = BUSINESS_CONFIG.whatsappNumber,
  selectedDevice,
  selectedModel,
  selectedIssue,
}: FooterProps) {
  const displayPhone = normalizeDisplayPhone(contactPhone);
  const telHref = buildTelHref(contactPhone);
  const whatsappUrl = buildWhatsAppRepairUrl({
    device: selectedDevice,
    model: selectedModel,
    issue: selectedIssue,
    customNumber: contactWhatsapp,
  });

  return (
    <footer className="border-t border-white/10 bg-[#07090D] py-10 text-xs text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div className="space-y-1.5">
          <p className="font-display text-sm font-bold text-slate-200">
            {BUSINESS_CONFIG.brandName}
          </p>
          <p>
            {BUSINESS_CONFIG.serviceCentreLabel} · Independent Diagnostic &amp; Repair Engineering
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-slate-300">
            <a
              href={telHref}
              className="inline-flex items-center gap-1.5 font-mono font-semibold text-blue-300 transition-colors hover:text-white"
            >
              <Phone className="h-3.5 w-3.5 text-blue-400" />
              <span>Call {displayPhone}</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 transition-colors hover:text-emerald-300"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp {displayPhone}</span>
            </a>
          </div>
          <p className="text-[11px] text-slate-500">
            AppleFix is an independent service centre and is not affiliated with or endorsed by Apple Inc.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-6" aria-label="Footer navigation">
          <a
            href="#hero-explorer"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('hero-explorer');
            }}
            className="hover:text-white transition-colors"
          >
            3D Explorer
          </a>
          <a
            href="#device-selector"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('device-selector');
            }}
            className="hover:text-white transition-colors"
          >
            Devices
          </a>
          <a
            href="#repair-walkthrough"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('repair-walkthrough');
            }}
            className="hover:text-white transition-colors"
          >
            Repair Sequence
          </a>
          <a
            href="#book-repair"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('book-repair');
            }}
            className="hover:text-white transition-colors"
          >
            Book Repair
          </a>
        </nav>
      </div>
    </footer>
  );
}
