export function CustomerTrustSection() {
  const pillars = [
    {
      index: '01',
      title: 'What Each Component Does',
      description:
        'Explore the exact purpose of every subsystem—from the Li-ion BMS and dual-layer OLED flexes to the Taptic Engine and stacked logic board—in plain engineering language.',
    },
    {
      index: '02',
      title: 'Which Component May Cause the Issue',
      description:
        'See how identical symptoms can stem from different parts. A black screen could be a fractured OLED panel, an unseated display flex, or a shorted motherboard backlight line.',
    },
    {
      index: '03',
      title: 'What Technicians Inspect First',
      description:
        'Not every repair requires a new component. Compacted charging port lint, blocked speaker meshes, loose brackets, or recoverable firmware errors are checked before recommending parts.',
    },
    {
      index: '04',
      title: 'Which Part May Need Replacement',
      description:
        'Hardware replacement is recommended only when bench amperage profiling, thermal imaging, or physical inspection confirms irreversible wear or component failure.',
    },
    {
      index: '05',
      title: 'What Happens During the Repair',
      description:
        'Walk through controlled perimeter heating, battery-first electrical isolation, stretch-release adhesive safety, and factory-spec seal restoration before handing over your device.',
    },
  ];

  return (
    <section
      id="customer-trust"
      className="relative border-t border-white/10 bg-[#090B0F] py-20 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-400">
            <span>Engineering Transparency</span>
            <span aria-hidden="true">·</span>
            <span>AppleFix Diagnostic Standard</span>
          </div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            KNOW WHAT&apos;S INSIDE. KNOW WHAT NEEDS REPAIR.
          </h2>
          <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
            We believe hardware service should never be a black box. Before any technician opens your device, you can understand how it is structured, what is tested first, and why a specific repair is recommended.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-5">
          {pillars.map((item) => (
            <div
              key={item.index}
              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0F131C] p-5"
            >
              <div>
                <span className="font-mono text-xs font-semibold tabular-nums text-blue-400">
                  {item.index}
                </span>
                <h3 className="mt-3 font-display text-base font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-xs leading-relaxed text-slate-400 sm:text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
