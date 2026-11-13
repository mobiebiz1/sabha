import React, { useState } from 'react';
import { CheckCircle2, Copy, MessageCircle, Phone, Settings2 } from 'lucide-react';
import { buildTelHref, buildWhatsAppRepairUrl, BUSINESS_CONFIG } from '../config/business';
import type { DeviceCategoryId, DeviceModelSpec } from '../data/devices';
import type { RepairCategorySpec } from '../data/repairs';

interface BookingSectionProps {
  selectedCategory: DeviceCategoryId;
  selectedModel: DeviceModelSpec;
  selectedIssue: RepairCategorySpec;
  contactPhone: string;
  contactWhatsapp: string;
  onUpdateContact: (phone: string, whatsapp: string) => void;
  onEditSelection: (targetId: string) => void;
}

export function BookingSection({
  selectedCategory,
  selectedModel,
  selectedIssue,
  contactPhone,
  contactWhatsapp,
  onUpdateContact,
  onEditSelection,
}: BookingSectionProps) {
  const [customerName, setCustomerName] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('Today · Afternoon (2:00 PM – 5:00 PM)');
  const [notes, setNotes] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const [showConfig, setShowConfig] = useState(false);

  const deviceLabel =
    selectedCategory === 'iphone'
      ? 'iPhone'
      : selectedCategory === 'macbook'
      ? 'MacBook'
      : selectedCategory === 'ipad'
      ? 'iPad'
      : 'Apple Watch';

  const whatsappUrl = buildWhatsAppRepairUrl({
    device: deviceLabel,
    model: selectedModel.name,
    issue: selectedIssue.title,
    notes,
    customNumber: contactWhatsapp,
  });

  const telHref = buildTelHref(contactPhone);

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const generatedId = `AFX-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketId(generatedId);
    setBookingConfirmed(true);
  };

  const handleCopySummary = async () => {
    const text = `AppleFix Bangalore Diagnostic Request\nRef: ${ticketId || 'Pending'}\nDevice: ${deviceLabel}\nModel: ${selectedModel.name} (${selectedModel.modelCode})\nIssue: ${selectedIssue.title}\nSlot: ${preferredSlot}${notes ? `\nNotes: ${notes}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <section
      id="book-repair"
      className="relative border-t border-white/10 bg-[#0B0E14] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left: Summary & Direct Contact Actions */}
          <div className="space-y-6 lg:col-span-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
                <span>{BUSINESS_CONFIG.serviceCentreLabel}</span>
                <span aria-hidden="true">·</span>
                <span>{BUSINESS_CONFIG.serviceHours}</span>
              </div>
              <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                READY TO GET YOUR DEVICE FIXED?
              </h2>
              <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                Review your selected device configuration below. Book a diagnostic bench slot or send these exact details directly to our Bangalore technicians on WhatsApp or phone.
              </p>
            </div>

            {/* Selected Configuration Summary */}
            <div className="rounded-2xl border border-white/10 bg-[#10141D] p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-display text-sm font-semibold text-white">
                  Diagnostic Selection Summary
                </h3>
                <button
                  type="button"
                  onClick={() => onEditSelection('device-selector')}
                  className="text-xs font-medium text-blue-400 hover:text-blue-300"
                >
                  Edit Selection
                </button>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Device</dt>
                  <dd className="font-semibold text-white">{deviceLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Model</dt>
                  <dd className="text-right font-semibold text-white">
                    {selectedModel.name}{' '}
                    <span className="font-mono text-xs font-normal text-slate-400">
                      ({selectedModel.modelCode})
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Issue</dt>
                  <dd className="font-semibold text-blue-400 text-right">{selectedIssue.title}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Estimated Bench Time</dt>
                  <dd className="font-mono text-xs tabular-nums text-slate-300">
                    {selectedIssue.estimatedBenchTime}
                  </dd>
                </div>
              </dl>

              {/* Direct WhatsApp & Call Actions */}
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#15803D] whitespace-nowrap"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>WhatsApp Us</span>
                </a>
                <a
                  href={telHref}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-[#151A26] px-4 py-3 text-sm font-semibold text-white transition-colors hover:border-blue-400/50 hover:bg-[#1A2130] whitespace-nowrap"
                >
                  <Phone className="h-4 w-4 text-blue-400" />
                  <span>Call AppleFix</span>
                </a>
              </div>

              {/* Configurable Contact Info Panel */}
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Service Desk: <span className="font-mono text-slate-200">{contactPhone}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConfig((v) => !v)}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>{showConfig ? 'Close Config' : 'Configure Contact'}</span>
                  </button>
                </div>

                {showConfig && (
                  <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-white/10 bg-[#0A0D13] p-3.5 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400">
                        Business Phone (tel:)
                      </label>
                      <input
                        type="text"
                        value={contactPhone}
                        onChange={(e) => onUpdateContact(e.target.value, contactWhatsapp)}
                        className="mt-1 w-full rounded-lg border border-white/15 bg-[#121620] px-3 py-1.5 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400">
                        WhatsApp Number (with country code)
                      </label>
                      <input
                        type="text"
                        value={contactWhatsapp}
                        onChange={(e) => onUpdateContact(contactPhone, e.target.value)}
                        className="mt-1 w-full rounded-lg border border-white/15 bg-[#121620] px-3 py-1.5 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Book a Repair Form */}
          <div className="rounded-2xl border border-white/10 bg-[#10141D] p-6 sm:p-8 lg:col-span-6">
            {!bookingConfirmed ? (
              <form onSubmit={handleSubmitBooking} className="space-y-5">
                <div>
                  <h3 className="font-display text-xl font-bold text-white">
                    Book a Diagnostic &amp; Repair Slot
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Reserve a bench inspection at AppleFix Service Centre, Bangalore. Final repair approval happens only after physical inspection.
                  </p>
                </div>

                <div>
                  <label htmlFor="customer-name" className="block text-xs font-medium text-slate-300">
                    Your Name
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#0A0D13] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="preferred-slot" className="block text-xs font-medium text-slate-300">
                    Preferred Visit Window (Bangalore)
                  </label>
                  <select
                    id="preferred-slot"
                    value={preferredSlot}
                    onChange={(e) => setPreferredSlot(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#0A0D13] px-3.5 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option>Today · Morning (10:30 AM – 1:30 PM)</option>
                    <option>Today · Afternoon (2:00 PM – 5:00 PM)</option>
                    <option>Today · Evening (5:00 PM – 7:45 PM)</option>
                    <option>Tomorrow · Morning (10:30 AM – 1:30 PM)</option>
                    <option>Tomorrow · Afternoon (2:00 PM – 5:00 PM)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="repair-notes" className="block text-xs font-medium text-slate-300">
                    Symptom Notes (Optional)
                  </label>
                  <textarea
                    id="repair-notes"
                    rows={3}
                    placeholder="e.g., Dropped yesterday, screen intact but battery drains fast..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#0A0D13] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                >
                  Book a Repair
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-blue-400" />
                  <div>
                    <p className="font-mono text-xs text-blue-400">SLOT SUMMARY · {ticketId}</p>
                    <h3 className="mt-1 font-display text-xl font-bold text-white">
                      Diagnostic Request Prepared for {customerName || 'Guest'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-300">
                      Send this summary via WhatsApp or present reference <span className="font-mono text-white">{ticketId}</span> at the Bangalore service desk.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-[#0A0D13] p-4 text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Device &amp; Model</span>
                    <span className="font-medium text-white">{selectedModel.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected Issue</span>
                    <span className="font-medium text-blue-400">{selectedIssue.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Visit Window</span>
                    <span className="font-medium text-white">{preferredSlot}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#15803D] whitespace-nowrap"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Send Ticket on WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-[#151A26] px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white whitespace-nowrap"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>{copiedSummary ? 'Copied' : 'Copy Summary'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingConfirmed(false)}
                    className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Modify
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
