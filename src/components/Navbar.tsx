import { Menu, MessageCircle, Phone, X } from 'lucide-react';
import { useState } from 'react';
import {
  buildTelHref,
  buildWhatsAppRepairUrl,
  BUSINESS_CONFIG,
  normalizeDisplayPhone,
} from '../config/business';

interface NavbarProps {
  onNavigate: (sectionId: string) => void;
  contactPhone?: string;
  contactWhatsapp?: string;
  selectedDevice?: string;
  selectedModel?: string;
  selectedIssue?: string;
}

export function Navbar({
  onNavigate,
  contactPhone = BUSINESS_CONFIG.phoneDisplay,
  contactWhatsapp = BUSINESS_CONFIG.whatsappNumber,
  selectedDevice,
  selectedModel,
  selectedIssue,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { id: 'hero-explorer', label: 'Explorer' },
    { id: 'device-selector', label: 'Devices' },
    { id: 'repair-walkthrough', label: 'Repair Flow' },
    { id: 'book-repair', label: 'Book Repair' },
  ];

  const displayPhone = normalizeDisplayPhone(contactPhone);
  const telHref = buildTelHref(contactPhone);
  const whatsappUrl = buildWhatsAppRepairUrl({
    device: selectedDevice,
    model: selectedModel,
    issue: selectedIssue,
    customNumber: contactWhatsapp,
  });

  const handleNav = (id: string) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#090B0F]/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#hero-explorer"
          onClick={(e) => {
            e.preventDefault();
            handleNav('hero-explorer');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0"
        >
          AppleFix
        </a>

        {/* Zone 2: 4 concise single-line text links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-8" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleNav(item.id);
              }}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white whitespace-nowrap shrink-0"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Direct Call link + Primary CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={telHref}
            aria-label={`Call AppleFix on ${displayPhone}`}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#121620] px-3 py-2 font-mono text-xs font-semibold text-slate-100 transition-colors hover:border-blue-400/50 hover:text-white whitespace-nowrap shrink-0"
          >
            <Phone className="h-3.5 w-3.5 text-blue-400" />
            <span>{displayPhone}</span>
          </a>
          <button
            type="button"
            onClick={() => handleNav('device-selector')}
            className="hidden sm:inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400 whitespace-nowrap shrink-0"
          >
            Diagnose My Device
          </button>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-slate-200 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-[#0C0F16] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(item.id);
                }}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => handleNav('device-selector')}
              className="mt-1 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Diagnose My Device
            </button>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <a
                href={telHref}
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#151C2B] px-3 py-2.5 text-xs font-semibold text-white"
              >
                <Phone className="h-3.5 w-3.5 text-blue-400" />
                <span>{displayPhone}</span>
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#16A34A] px-3 py-2.5 text-xs font-semibold text-white"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
