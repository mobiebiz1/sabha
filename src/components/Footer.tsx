import { BUSINESS_CONFIG } from '../config/business';

interface FooterProps {
  onNavigate: (id: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#07090D] py-10 text-xs text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div className="space-y-1">
          <p className="font-display text-sm font-bold text-slate-200">
            {BUSINESS_CONFIG.brandName}
          </p>
          <p>
            {BUSINESS_CONFIG.serviceCentreLabel} · Independent Diagnostic &amp; Repair Engineering
          </p>
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
