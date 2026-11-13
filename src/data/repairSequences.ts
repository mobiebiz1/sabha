import type { DeviceCategoryId, DeviceModelSpec } from './devices';
import { resolveManifestEntry } from './assetManifest';
import { REPAIR_CATEGORIES, type RepairCategoryId, type RepairCategorySpec, type RepairStep } from './repairs';

export interface WorkshopHotspot {
  id: string;
  label: string;
  detail: string;
  xPct: number;
  yPct: number;
  primary?: boolean;
}

export interface WorkshopVisualFrame {
  assetId: string;
  imageSrc: string;
  videoSrc?: string;
  alt: string;
  caption: string;
  cameraAngleLabel: string;
  focusZoom: number;
  panOrigin: string;
  hotspots?: WorkshopHotspot[];
}

export interface ResolvedRepairStep extends RepairStep {
  assetId: string;
  narrationEn: string;
  narrationHi: string;
  visualFrame?: WorkshopVisualFrame;
}

export function formatViewerModelTitle(model: DeviceModelSpec): string {
  return model.name
    .replace('13"', '13-INCH')
    .replace('13.6"', '13.6-INCH')
    .replace('15.3"', '15.3-INCH')
    .replace('14"', '14-INCH')
    .replace('16"', '16-INCH')
    .replace('11"', '11-INCH')
    .replace('12.9"', '12.9-INCH')
    .toUpperCase();
}

function makeVisualFrame(
  assetId: string,
  caption: string,
  focusZoom: number,
  panOrigin: string,
  hotspots?: WorkshopHotspot[]
): WorkshopVisualFrame | undefined {
  const entry = resolveManifestEntry(assetId);
  if (!entry) return undefined;
  return {
    assetId: entry.assetId,
    imageSrc: entry.imageSrc,
    videoSrc: entry.videoSrc,
    alt: entry.alt,
    caption,
    cameraAngleLabel: entry.cameraAngleLabel,
    focusZoom,
    panOrigin,
    hotspots,
  };
}

function formatSpeechAction(action: string): string {
  const trimmed = action.trim();
  if (!trimmed) return 'complete this step cleanly.';
  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

/**
 * Returns device-relevant repair categories with localized titles/descriptions
 * while keeping the full 14-category diagnostic suite for iPhone.
 */
export function getRepairCategoriesForDevice(categoryId: DeviceCategoryId): RepairCategorySpec[] {
  if (categoryId === 'iphone') return REPAIR_CATEGORIES;

  if (categoryId === 'macbook') {
    const allowed: RepairCategoryId[] = [
      'battery',
      'display',
      'charging_port',
      'logic_board',
      'water_damage',
      'loudspeaker',
      'microphone',
      'camera',
      'taptic_engine',
      'buttons',
      'software',
      'power_boot',
    ];
    return REPAIR_CATEGORIES.filter((c) => allowed.includes(c.id)).map((c) => {
      if (c.id === 'display') {
        return {
          ...c,
          title: 'Retina Display Assembly',
          symptomSummary: 'Cracked LCD/Mini-LED panel, stage-light flex wear, backlight bleed, or dead screen.',
        };
      }
      if (c.id === 'charging_port') {
        return {
          ...c,
          title: 'USB-C / MagSafe 3 Port',
          symptomSummary: 'Loose Thunderbolt socket, 5V stuck negotiation, or liquid-damaged I/O board.',
        };
      }
      if (c.id === 'taptic_engine') {
        return {
          ...c,
          title: 'Force Touch Trackpad & Taptic',
          shortTitle: 'Trackpad',
          symptomSummary: 'Unresponsive Force Touch click, erratic cursor, or trackpad ribbon damage.',
        };
      }
      if (c.id === 'buttons') {
        return {
          ...c,
          title: 'Power / Touch ID & Function Keys',
          shortTitle: 'Keys & Power',
          symptomSummary: 'Unresponsive Touch ID power key, sticky scissor keys, or damaged keyboard backlight.',
        };
      }
      return c;
    });
  }

  if (categoryId === 'ipad') {
    const allowed: RepairCategoryId[] = [
      'display',
      'battery',
      'charging_port',
      'camera',
      'loudspeaker',
      'logic_board',
      'water_damage',
      'face_id',
      'buttons',
      'power_boot',
      'software',
    ];
    return REPAIR_CATEGORIES.filter((c) => allowed.includes(c.id)).map((c) => {
      if (c.id === 'display') {
        return {
          ...c,
          title: 'Display & Touch Glass Replacement',
          shortTitle: 'Display & Glass',
          symptomSummary: 'Shattered front glass, dead touch zones, Apple Pencil skips, or Tandem OLED/LCD damage.',
        };
      }
      if (c.id === 'loudspeaker') {
        return {
          ...c,
          title: 'Quad Speaker System',
          shortTitle: 'Speakers',
          symptomSummary: 'Distorted landscape stereo sound, silent corner speaker, or buzzing enclosure.',
        };
      }
      if (c.id === 'face_id') {
        return {
          ...c,
          title: 'Face ID / Touch ID Sensor',
          shortTitle: 'Biometrics',
          symptomSummary: 'TrueDepth Face ID failure or top-button Touch ID sensor not responding.',
        };
      }
      if (c.id === 'buttons') {
        return {
          ...c,
          title: 'Power & Volume Buttons',
          shortTitle: 'Buttons',
          symptomSummary: 'Stuck top power/Touch ID key, jammed volume rockers, or crushed corner switch flex.',
        };
      }
      return c;
    });
  }

  // Apple Watch
  const watchAllowed: RepairCategoryId[] = [
    'battery',
    'display',
    'taptic_engine',
    'loudspeaker',
    'charging_port',
    'buttons',
    'water_damage',
    'logic_board',
    'power_boot',
  ];
  return REPAIR_CATEGORIES.filter((c) => watchAllowed.includes(c.id)).map((c) => {
    if (c.id === 'display') {
      return {
        ...c,
        title: 'OLED / Sapphire Display Replacement',
        shortTitle: 'OLED Display',
        symptomSummary: 'Cracked Ion-X or sapphire crystal, unresponsive touch, or lifted screen gasket.',
      };
    }
    if (c.id === 'taptic_engine') {
      return {
        ...c,
        title: 'Digital Crown, Action Button & Taptic',
        shortTitle: 'Crown & Taptic',
        symptomSummary: 'Stiff Digital Crown scroll, jammed Action button, or missing wrist haptic taps.',
      };
    }
    if (c.id === 'loudspeaker') {
      return {
        ...c,
        title: 'Speaker & Microphone',
        shortTitle: 'Speaker & Mic',
        symptomSummary: 'Muffled watch call audio, siren chamber blockage, or Siri microphone failure.',
      };
    }
    if (c.id === 'charging_port') {
      return {
        ...c,
        title: 'Magnetic Fast Charging Coil',
        shortTitle: 'Charging Coil',
        symptomSummary: 'Overheating puck, intermittent wireless charging, or rear crystal coil damage.',
      };
    }
    if (c.id === 'buttons') {
      return {
        ...c,
        title: 'Side Button, Crown & Action Key',
        shortTitle: 'Buttons',
        symptomSummary: 'Stuck side button, jammed orange Action button, or Digital Crown encoder failure.',
      };
    }
    if (c.id === 'logic_board') {
      return {
        ...c,
        title: 'S-Series SiP / Internal Diagnosis',
        shortTitle: 'SiP Diagnosis',
        symptomSummary: 'Boot loop on Apple logo, dead optical heart array, or SiP rail failure.',
      };
    }
    return c;
  });
}

// ============================================================================
// 1. IPHONE SEQUENCES (10-STEP BATTERY + DISPLAY + ALL 15 CATEGORIES)
// ============================================================================
function buildIPhoneBatterySequence(model: DeviceModelSpec): ResolvedRepairStep[] {
  const isDualEntry =
    model.id.includes('14-plus') ||
    model.id === 'iphone-14' ||
    model.id.includes('15') ||
    model.id.includes('16') ||
    model.id.includes('17') ||
    model.id.includes('18');
  const isElectricAdhesive = model.id.includes('16') || model.id.includes('17') || model.id.includes('18');
  const isClassicSe = model.visualVariant === 'iphone-se-classic';

  return [
    {
      stepNumber: 1,
      assetId: 'iphone-15-pro-exterior',
      title: 'Initial Device Inspection',
      explanation: `We place your ${model.name} (${model.modelCode}) onto an ESD-grounded silicone mat and connect it to a digital ${model.portType} diagnostic analyzer. Technicians inspect the ${model.chassisMaterial.toLowerCase()} perimeter for screen separation and measure charging wattage and cycle health before opening.`,
      technicianAction: `Check ${model.portType} charging draw, chassis flatness, and maximum battery capacity telemetry.`,
      safetyNote: 'If any cell swelling is present, the device is discharged below 25% prior to opening.',
      narrationEn: `Today, we're demonstrating a battery replacement on the ${model.name}. First, we inspect the device on our anti-static mat.`,
      narrationHi: `आज हम ${model.name} की बैटरी रिप्लेसमेंट दिखा रहे हैं। सबसे पहले, हम एंटी-स्टैटिक मैट पर डिवाइस की जाँच करते हैं।`,
      pose: {
        explosionFactor: 0.05,
        screenLiftAngle: 0,
        backGlassLift: 0,
        batteryLift: 0,
        batteryState: 'old',
        focusPart: 'battery',
        cameraPreset: 'front_angle',
        tool: 'diagnostic_dock',
      },
      visualFrame: makeVisualFrame(
        'iphone-15-pro-exterior',
        `${model.name} initial chassis & ${model.portType} diagnostic telemetry check`,
        1.05,
        '48% 52%'
      ),
    },
    {
      stepNumber: 2,
      assetId: 'iphone-15-pro-opening',
      title: 'Correct Screw Removal',
      explanation: `Using a precision 0.8mm P2 Pentalobe screwdriver, technicians unscrew the two security screws flanking the ${model.portType} port and place them into a mapped magnetic tray.`,
      technicianAction: 'Remove twin P2 Pentalobe base screws with torque-controlled driver.',
      safetyNote: 'Correct P2 driver bit geometry prevents stripping anodized titanium or aluminum screw heads.',
      narrationEn: 'Next, we remove the bottom Pentalobe security screws and place them on a magnetic mat.',
      narrationHi: 'अब हम नीचे के दोनों पेंटालोब स्क्रू सावधानी से हटाकर मैग्नेटिक मैट पर रखते हैं।',
      pose: {
        explosionFactor: 0.08,
        screenLiftAngle: 0,
        backGlassLift: 0,
        batteryLift: 0,
        batteryState: 'old',
        focusPart: 'titanium_frame',
        cameraPreset: 'lower_io',
        tool: 'pentalobe_driver',
      },
      visualFrame: makeVisualFrame(
        'iphone-15-pro-opening',
        'P2 Pentalobe base screw removal onto mapped tray',
        1.08,
        '55% 68%'
      ),
    },
    {
      stepNumber: 3,
      assetId: 'iphone-15-pro-opening',
      title: 'Controlled Heating & Chassis Opening',
      explanation: isDualEntry
        ? `Because ${model.name} features a dual-entry service architecture, controlled perimeter warmth softens the factory seal while a suction cup opener and thin triangular pick cleanly release the enclosure without stressing the front OLED.`
        : `Controlled warmth softens the perimeter adhesive on your ${model.name}. Using a precision suction opener and thin opening pick, technicians lift the ${isClassicSe ? 'Retina display' : 'OLED display'} along its hinge edge.`,
      technicianAction: 'Apply regulated perimeter heat and release factory adhesive using suction lifter and opening pick.',
      safetyNote: 'Pick insertion depth is strictly limited to 2mm so internal antenna or sensor flexes stay untouched.',
      narrationEn: 'Now we apply gentle warmth and separate the enclosure smoothly using a suction cup.',
      narrationHi: 'अब हम किनारों को हल्का गर्म करके सक्शन कप से केसिंग को धीरे से खोलते हैं।',
      pose: {
        explosionFactor: 0.16,
        screenLiftAngle: 0.65,
        backGlassLift: isDualEntry ? 0.35 : 0,
        batteryLift: 0,
        batteryState: 'old',
        focusPart: 'display_panel',
        cameraPreset: 'internal_top',
        tool: 'suction_opener',
      },
      visualFrame: makeVisualFrame(
        'iphone-15-pro-opening',
        'Precision suction cup and ESD opening pick perimeter separation',
        1.04,
        '50% 48%'
      ),
    },
    {
      stepNumber: 4,
      assetId: 'iphone-15-pro-battery-connector',
      title: 'Flex Cable Protection & Shield Removal',
      explanation: 'All internal tri-point (Y000) EMI shield plate brackets covering the logic board connectors are unfastened and mapped by exact screw length. Exposed display and sensor flexes are carefully supported.',
      technicianAction: 'Unscrew EMI connector cover plates and inspect surrounding flex ribbons.',
      safetyNote: 'Every shield screw has a specific thread length—mixing them can damage PCB layers underneath.',
      narrationEn: 'We remove the metallic EMI shield plates and organize every screw by length.',
      narrationHi: 'हम मेटल शील्ड प्लेट हटाकर हर स्क्रू को उसकी लंबाई के अनुसार अलग रखते हैं।',
      pose: {
        explosionFactor: 0.22,
        screenLiftAngle: 0.85,
        shieldRemoved: true,
        backGlassLift: 0,
        batteryLift: 0,
        batteryState: 'old',
        focusPart: 'shield_plate',
        cameraPreset: 'internal_top',
        tool: 'pentalobe_driver',
      },
      visualFrame: makeVisualFrame(
        'iphone-15-pro-battery-connector',
        'Internal hardware map — click any subsystem marker to inspect',
        1.03,
        '50% 50%',
        [
          {
            id: 'battery',
            label: 'Li-Ion Battery Cell (Target)',
            detail: `${model.name} battery cell scheduled for replacement.`,
            xPct: 44,
            yPct: 55,
            primary: true,
          },
          {
            id: 'bms_connector',
            label: 'Battery B2B Connector',
            detail: 'Isolated first using a non-conductive ESD nylon spudger before touching any other ribbon.',
            xPct: 60,
            yPct: 55,
          },
          {
            id: 'logic_board',
            label: `${model.chip} Logic Board`,
            detail: 'Houses SoC, NAND storage, and Face ID pairing—remains completely untouched.',
            xPct: 58,
            yPct: 38,
          },
          {
            id: 'taptic_engine',
            label: 'Taptic Engine',
            detail: 'Linear haptic actuator at the base, cleared safely during adhesive extraction.',
            xPct: 50,
            yPct: 82,
          },
        ]
      ),
    },
    {
      stepNumber: 5,
      assetId: 'iphone-15-pro-battery-connector',
      title: 'Battery Connector Isolation',
      explanation: 'Using a non-conductive black ESD nylon spudger, the battery board-to-board (B2B) power connector is lifted straight up first to cut all voltage to the logic board before further work.',
      technicianAction: 'Disconnect the battery B2B plug with an anti-static nylon spudger.',
      safetyNote: 'Never use metal tweezers near live battery pins; ESD nylon prevents short circuits.',
      narrationEn: 'Before touching anything else, we disconnect the battery connector first with a nylon spudger.',
      narrationHi: 'सबसे पहले हम नायलॉन स्पजर से बैटरी कनेक्टर को अलग करते हैं ताकि पावर बंद हो जाए।',
      pose: {
        explosionFactor: 0.25,
        screenLiftAngle: 0.88,
        shieldRemoved: true,
        flexDetached: true,
        backGlassLift: 0,
        batteryLift: 0,
        batteryState: 'old',
        focusPart: 'display_flex',
        cameraPreset: 'logic_board',
        tool: 'esd_spudger',
      },
      visualFrame: makeVisualFrame(
        'iphone-15-pro-battery-connector',
        'ESD nylon spudger disconnecting the battery B2B connector safely',
        1.12,
        '58% 55%'
      ),
    },
    {
      stepNumber: 6,
      assetId: 'iphone-15-pro-battery-removal',
      title: 'Old Battery Adhesive Release',
      explanation: isElectricAdhesive
        ? `On ${model.name}, Apple uses ionic-liquid electrically releasable battery adhesive. Technicians apply controlled low-voltage DC current between the battery tab and chassis to debond the adhesive smoothly without prying.`
        : `Technicians grip the white factory stretch-release adhesive tabs beneath the ${model.name} battery using curved anti-static tweezers and pull slowly at a shallow angle to unwind each strip cleanly.`,
      technicianAction: isElectricAdhesive
        ? 'Apply controlled debonding current to release ionic battery adhesive cleanly.'
        : 'Wind and extract factory stretch-release adhesive tabs smoothly without tearing.',
      safetyNote: 'Zero metal prying beneath the lithium pouch—prevents cell puncture or thermal events.',
      narrationEn: isElectricAdhesive
        ? 'Now we apply controlled low-voltage current to release the battery adhesive cleanly.'
        : 'Next, we slowly pull the stretch-release adhesive tabs beneath the old battery.',
      narrationHi: isElectricAdhesive
        ? 'अब हम लो-वोल्टेज करंट से बैटरी का एडहेसिव सुरक्षित रूप से छुड़ाते हैं।'
        : 'अब हम पुरानी बैटरी के नीचे लगी स्ट्रेच-रिलीज़ टेप को धीरे से बाहर निकालते हैं।',
      pose: {
        explosionFactor: 0.28,
        screenLiftAngle: 0.92,
        screenRemoved: true,
        shieldRemoved: true,
        flexDetached: true,
        backGlassLift: 0,
        batteryLift: 0.45,
        batteryState: 'old',
        focusPart: 'battery',
        cameraPreset: 'battery_bay',
        tool: 'precision_tweezers',
      },
      visualFrame: makeVisualFrame(
        'iphone-15-pro-battery-removal',
        'Controlled adhesive tab extraction with anti-static precision tweezers',
        1.08,
        '52% 48%'
      ),
    },
    {
      stepNumber: 7,
      assetId: 'iphone-15-pro-battery-removal',
      title: 'Old Battery Removal',
      explanation: 'Once all adhesive tension has cleared, the depleted Li-ion battery lifts cleanly out of the titanium/aluminum recess without stressing the Taptic Engine or wireless charging coil beneath.',
      technicianAction: 'Lift depleted battery cell clear of the mid-frame and inspect bay cleanliness.',
      safetyNote: 'Aged or swollen batteries are placed immediately into an ESD fire-safe containment bin.',
      narrationEn: 'With the adhesive released, the old battery lifts straight out cleanly.',
      narrationHi: 'टेप हटने के बाद पुरानी बैटरी आसानी से बाहर निकल आती है।',
      pose: {
        explosionFactor: 0.3,
        screenLiftAngle: 0.92,
        screenRemoved: true,
        shieldRemoved: true,
        flexDetached: true,
        backGlassLift: 0,
        batteryLift: 1.15,
        batteryState: 'old',
        focusPart: 'battery',
        cameraPreset: 'battery_bay',
        tool: 'precision_tweezers',
      },
      visualFrame: makeVisualFrame(
        'iphone-15-pro-battery-removal',
        'Lifting worn battery clear of the mid-frame cavity',
        1.04,
        '42% 56%'
      ),
    },
    {
      stepNumber: 8,
      assetId: 'iphone-15-pro-battery-installation',
      title: 'New Battery Installation',
      explanation: 'Fresh OEM-spec adhesive strips are aligned inside the clean chassis bay. The new tested replacement Li-ion battery is seated flat, and its BMS flex connector clicks cleanly into the logic board.',
      technicianAction: 'Apply new adhesive strips, seat fresh battery cell, and connect BMS flex.',
      safetyNote: 'Light pressure is applied solely to rigid perimeter edges—never over the soft pouch center.',
      narrationEn: 'Now we seat the fresh replacement battery and click its connector back into place.',
      narrationHi: 'अब हम नई बैटरी को फ्रेम में बैठाकर उसका कनेक्टर वापस जोड़ते हैं।',
      pose: {
        explosionFactor: 0.24,
        screenLiftAngle: 0.9,
        screenRemoved: true,
        shieldRemoved: true,
        flexDetached: false,
        backGlassLift: 0,
        batteryLift: 0.2,
        batteryState: 'new',
        focusPart: 'battery',
        cameraPreset: 'battery_bay',
        tool: 'esd_spudger',
      },
      visualFrame: makeVisualFrame(
        'iphone-15-pro-battery-installation',
        'Seating fresh OEM-grade battery pack and locking BMS connector',
        1.06,
        '76% 68%'
      ),
    },
    {
      stepNumber: 9,
      assetId: 'iphone-16-pro-display-install',
      title: 'Shield Torque, Gasket & Reassembly',
      explanation: 'Old chassis adhesive residue is cleaned completely, every EMI shield bracket is fastened with its exact screws, a new perimeter water-resistance gasket is laid, and the enclosure is pressed closed.',
      technicianAction: 'Reinstall all EMI brackets, apply fresh perimeter water seal, and torque P2 base screws.',
      safetyNote: 'A fresh perimeter seal restores dust and splash resistance.',
      narrationEn: 'We refit all shield plates, lay a fresh perimeter water seal, and close the frame evenly.',
      narrationHi: 'हम सभी मेटल शील्ड कसते हैं, नया वॉटर-रेसिस्टेंट सील लगाते हैं और फोन बंद करते हैं।',
      pose: {
        explosionFactor: 0.06,
        screenLiftAngle: 0.14,
        shieldRemoved: false,
        flexDetached: false,
        backGlassLift: 0,
        batteryLift: 0,
        batteryState: 'new',
        focusPart: 'titanium_frame',
        cameraPreset: 'front_angle',
        tool: 'adhesive_press',
      },
      visualFrame: makeVisualFrame(
        'iphone-16-pro-display-install',
        'Perimeter water-resistance gasket seating & uniform press alignment',
        1.05,
        '52% 58%'
      ),
    },
    {
      stepNumber: 10,
      assetId: 'iphone-15-pro-final-testing',
      title: 'Final Diagnostics & Calibration',
      explanation: `On the diagnostic bench, we verify sustained ${model.portType} fast charging, thermal stability, touch/OLED uniformity, Face ID / Touch ID, audio, and applicable iOS battery configuration checks.`,
      technicianAction: `Run full ${model.portType} PD wattage test, cycle telemetry verification, and multi-point QC.`,
      safetyNote: 'Model-specific iOS battery health & pairing behavior is explained clearly prior to handover.',
      narrationEn: 'Finally, we verify fast charging, thermal balance, and battery health calibration.',
      narrationHi: 'आखिर में, हम फास्ट चार्जिंग, तापमान और बैटरी हेल्थ की पूरी जाँच करते हैं।',
      pose: {
        explosionFactor: 0,
        screenLiftAngle: 0,
        shieldRemoved: false,
        flexDetached: false,
        backGlassLift: 0,
        batteryLift: 0,
        batteryState: 'new',
        focusPart: 'all',
        cameraPreset: 'final_front',
        tool: 'diagnostic_dock',
      },
      visualFrame: makeVisualFrame(
        'iphone-15-pro-final-testing',
        `${model.name} final ${model.portType} charging & system verification`,
        1.04,
        '50% 54%'
      ),
    },
  ];
}

function buildIPhoneDisplaySequence(model: DeviceModelSpec): ResolvedRepairStep[] {
  const isPro16Or17 = model.visualVariant === 'iphone-16-pro' || model.visualVariant === 'iphone-17-pro';
  return [
    {
      stepNumber: 1,
      assetId: 'iphone-16-pro-exterior',
      title: 'Display, Chassis & TrueDepth Inspection',
      explanation: `We check your ${model.name} (${model.screenSize}) for frame corner bends—which can crack a fresh panel if left uncorrected—and test Face ID / Touch ID and ${model.portType} current draw.`,
      technicianAction: 'Verify chassis flatness, TrueDepth sensor health, and standby power draw.',
      safetyNote: 'Shattered glass is masked with protective film so glass dust cannot reach camera optics.',
      narrationEn: `Today, we're demonstrating a display replacement on the ${model.name}. First, we inspect frame alignment and sensor health.`,
      narrationHi: `आज हम ${model.name} की डिस्प्ले रिप्लेसमेंट दिखा रहे हैं। सबसे पहले हम फ्रेम और सेंसर की जाँच करते हैं।`,
      pose: {
        explosionFactor: 0.05,
        screenLiftAngle: 0,
        backGlassLift: 0,
        batteryLift: 0,
        focusPart: 'display_panel',
        cameraPreset: 'front_angle',
        tool: 'diagnostic_dock',
      },
      visualFrame: makeVisualFrame(
        'iphone-16-pro-exterior',
        `${model.name} pre-service frame & display telemetry check`,
        1.04,
        '48% 50%'
      ),
    },
    {
      stepNumber: 2,
      assetId: 'iphone-16-pro-display-opening',
      title: 'Controlled 78.5°C Heating & OLED Lift',
      explanation: `After removing the two bottom P2 screws, your ${model.name} sits on a 78.5°C temperature-regulated separator fixture. A precision suction lifter opens the display smoothly without pulling sensor cables.`,
      technicianAction: 'Soften perimeter adhesive on regulated thermal fixture and lift display along hinge.',
      safetyNote: isPro16Or17
        ? 'Extra care around ultra-thin 6.3"/6.9" OLED borders and side Camera Control flex routing.'
        : 'Controlled heat protects internal TrueDepth and FaceTime camera components.',
      narrationEn: 'Next, we warm the perimeter seal gently and lift the OLED screen with a suction opener.',
      narrationHi: 'अब हम किनारों की गोंद को हल्का गर्म करके सक्शन टूल से डिस्प्ले को धीरे से उठाते हैं।',
      pose: {
        explosionFactor: 0.16,
        screenLiftAngle: 0.72,
        backGlassLift: 0,
        batteryLift: 0,
        focusPart: 'display_panel',
        cameraPreset: 'internal_top',
        tool: 'suction_opener',
      },
      visualFrame: makeVisualFrame(
        'iphone-16-pro-display-opening',
        'Controlled 78.5°C separator lift & organized EMI shield mat',
        1.05,
        '50% 52%'
      ),
    },
    {
      stepNumber: 3,
      assetId: 'iphone-15-pro-battery-connector',
      title: 'Isolate Battery & Unclip Display Flexes',
      explanation: 'All EMI shields are mapped onto the magnetic tray. With an ESD nylon spudger, the battery B2B plug is disconnected first, followed by the display and front sensor flex ribbons.',
      technicianAction: 'Remove shield brackets, disconnect battery power first, then unclip OLED flexes.',
      safetyNote: 'Disconnecting the battery before unclipping OLED flexes prevents backlight filter shorts.',
      narrationEn: 'We disconnect the battery connector first, then unclip the display and sensor flex ribbons.',
      narrationHi: 'हम पहले बैटरी कनेक्टर अलग करते हैं और फिर डिस्प्ले व सेंसर केबल निकालते हैं।',
      pose: {
        explosionFactor: 0.28,
        screenLiftAngle: 0.9,
        shieldRemoved: true,
        flexDetached: true,
        backGlassLift: 0,
        batteryLift: 0,
        focusPart: 'display_flex',
        cameraPreset: 'internal_top',
        tool: 'esd_spudger',
      },
      visualFrame: makeVisualFrame(
        'iphone-15-pro-battery-connector',
        'ESD spudger isolating battery rail before unclipping display flex',
        1.06,
        '54% 52%',
        [
          {
            id: 'display_flex',
            label: 'OLED Display Flex Cable',
            detail: 'Unclipped only after the battery power rail is safely isolated.',
            xPct: 58,
            yPct: 48,
            primary: true,
          },
          {
            id: 'battery_b2b',
            label: 'Battery Power Connector',
            detail: 'Disconnected first with non-conductive ESD nylon spudger.',
            xPct: 60,
            yPct: 58,
          },
        ]
      ),
    },
    {
      stepNumber: 4,
      assetId: 'iphone-16-pro-display-install',
      title: 'Sensor Transfer, Gasket Seal & OLED Calibration',
      explanation: `Any paired ambient/proximity sensor flex is transferred carefully to the replacement ${model.screenSize} panel. A new waterproof perimeter seal is applied and a full RGB multi-touch & 120Hz uniformity pattern is verified.`,
      technicianAction: 'Install fresh gasket, seat replacement OLED, and verify RGB color & multi-touch grid.',
      safetyNote: 'Original paired TrueDepth biometrics and True Tone remain intact.',
      narrationEn: 'Finally, we transfer the sensors, lay a fresh seal, fit the new OLED panel, and test touch response.',
      narrationHi: 'आखिर में हम सेंसर लगाकर नया सील बैठाते हैं और नया डिस्प्ले फिट करके टच टेस्ट करते हैं।',
      pose: {
        explosionFactor: 0.08,
        screenLiftAngle: 0.15,
        shieldRemoved: false,
        flexDetached: false,
        backGlassLift: 0,
        batteryLift: 0,
        focusPart: 'display_panel',
        cameraPreset: 'final_front',
        tool: 'adhesive_press',
      },
      visualFrame: makeVisualFrame(
        'iphone-16-pro-display-install',
        '120Hz ProMotion OLED calibrated test pattern & perimeter seal fitment',
        1.06,
        '52% 52%'
      ),
    },
  ];
}

function buildIPhoneOtherSequence(
  model: DeviceModelSpec,
  issue: RepairCategorySpec
): ResolvedRepairStep[] {
  return issue.steps.map((step, idx) => {
    const assetId =
      idx === 0
        ? 'iphone-15-pro-exterior'
        : idx === issue.steps.length - 1
        ? 'iphone-15-pro-final-testing'
        : idx === 1
        ? 'iphone-15-pro-opening'
        : 'iphone-15-pro-internals';

    const cleanExplanation = step.explanation
      .replace(/iPhone/g, model.name)
      .replace(/USB-C or Lightning|USB-C\/Lightning/g, model.portType);

    const isFirst = idx === 0;
    const isLast = idx === issue.steps.length - 1;
    const narrationEn = isFirst
      ? `Today, we're demonstrating a ${issue.title.toLowerCase()} on the ${model.name}. First, we run a full bench inspection.`
      : isLast
      ? 'Finally, we reassemble the device cleanly and complete all diagnostic checks.'
      : `Next, for ${step.title.toLowerCase()}, we ${formatSpeechAction(step.technicianAction)}`;
    const narrationHi = isFirst
      ? `आज हम ${model.name} के लिए ${issue.shortTitle} सेवा दिखा रहे हैं। सबसे पहले, हम डिवाइस की पूरी जाँच करते हैं।`
      : isLast
      ? 'आखिर में हम डिवाइस को बंद करके सभी अंतिम जाँच पूरी करते हैं।'
      : `अगला कदम, ${step.title}। हम यह चरण सावधानीपूर्वक पूरा करते हैं।`;

    return {
      ...step,
      assetId,
      explanation: cleanExplanation,
      narrationEn,
      narrationHi,
      visualFrame: makeVisualFrame(
        assetId,
        `${model.name} · ${step.title}`,
        idx === 0 || idx === issue.steps.length - 1 ? 1.04 : 1.09,
        '50% 52%'
      ),
    };
  });
}

// ============================================================================
// 2. MACBOOK SEQUENCES (INTEL + APPLE SILICON)
// ============================================================================
function buildMacBookBatterySequence(model: DeviceModelSpec): ResolvedRepairStep[] {
  const isM1Air = model.id === 'mba-13-m1-2020';
  const isIntel = model.chip.toLowerCase().includes('intel');
  const isPro = model.id.startsWith('mbp-');
  const batteryCapacity = isM1Air
    ? '49.9 Wh 4-cell Li-ion polymer battery'
    : isPro
    ? 'high-capacity 6-cell Li-ion polymer battery'
    : '52.6 Wh / 66.5 Wh multi-cell Li-ion polymer battery';
  const screwCount = isM1Air || isIntel ? '10 precision P5 Pentalobe screws' : '8 precision P5 Pentalobe screws';
  const coolingNote = isIntel
    ? 'active cooling fan, copper heat-pipe, and Intel/T2 logic board'
    : isPro
    ? 'dual thermal blowers and Apple Silicon heat-pipe assembly'
    : `fanless ${model.chip} logic board and matte black aluminum heat spreader`;

  return [
    {
      stepNumber: 1,
      assetId: 'macbook-air-m1-2020-inspection',
      title: 'Initial Device Inspection',
      explanation: `Display the ${model.name} (${model.modelCode}) on an ESD-safe repair bench mat. Technicians inspect the ${model.chassisMaterial.toLowerCase()} enclosure for trackpad bulge or bottom-cover bow, read macOS battery cycle count, and measure ${model.portType} charging intake before removing a single screw.`,
      technicianAction: `Verify ${model.chip} power rail health, battery cycle telemetry, and chassis flatness on the ESD mat.`,
      safetyNote: 'If internal cell swelling is suspected, the battery is safely discharged below 25% prior to opening.',
      narrationEn: `Today, we're demonstrating a battery replacement on the ${model.name}. First, we check enclosure flatness and power draw.`,
      narrationHi: `आज हम ${model.name} की बैटरी रिप्लेसमेंट दिखा रहे हैं। सबसे पहले, हम बॉडी और चार्जिंग पावर की जाँच करते हैं।`,
      pose: {
        explosionFactor: 0.05,
        screenLiftAngle: 0,
        backGlassLift: 0,
        batteryLift: 0,
        batteryState: 'old',
        focusPart: 'battery',
        cameraPreset: 'front_angle',
        tool: 'diagnostic_dock',
      },
      visualFrame: makeVisualFrame(
        'macbook-air-m1-2020-inspection',
        `${model.name} chassis alignment & charging telemetry inspection`,
        1.05,
        '50% 52%'
      ),
    },
    {
      stepNumber: 2,
      assetId: 'macbook-air-m1-2020-p5-screws',
      title: 'Remove Bottom Case Screws',
      explanation: `The ${model.name} is placed face-down on a soft microfiber ESD pad. Using a torque-calibrated P5 Pentalobe driver, technicians unscrew the ${screwCount} around the bottom plate perimeter and map every screw by exact length.`,
      technicianAction: 'Unfasten all P5 Pentalobe perimeter screws cleanly with calibrated downward driver control.',
      safetyNote: 'Rear hinge-side screws are longer than front edge screws—strict length mapping prevents thread damage.',
      narrationEn: 'Next, we remove the precision bottom-cover screws and organize them by length.',
      narrationHi: 'अब हम नीचे के कवर के सभी स्क्रू खोलकर उनकी लंबाई के अनुसार अलग रखते हैं।',
      pose: {
        explosionFactor: 0.1,
        screenLiftAngle: 0,
        backGlassLift: 0.12,
        batteryLift: 0,
        batteryState: 'old',
        focusPart: 'titanium_frame',
        cameraPreset: 'lower_io',
        tool: 'pentalobe_driver',
      },
      visualFrame: makeVisualFrame(
        'macbook-air-m1-2020-p5-screws',
        'Precision P5 Pentalobe disassembly with length-mapped screw layout',
        1.08,
        '54% 58%'
      ),
    },
    {
      stepNumber: 3,
      assetId: 'macbook-air-m1-2020-open-cover',
      title: 'Open the MacBook',
      explanation: 'Once all P5 screws are mapped, technicians gently disengage the rear hinge-side retention clips and lift the machined aluminum bottom cover cleanly away—without prying against the display clutch.',
      technicianAction: 'Release internal retaining clips cleanly and lift off the aluminum bottom case.',
      safetyNote: 'Smooth horizontal clip release prevents warping the thin anodized aluminum plate.',
      narrationEn: 'With the screws removed, we release the retention clips and lift the bottom plate away.',
      narrationHi: 'स्क्रू निकलने के बाद हम क्लिप्स छुड़ाकर एल्युमिनियम बॉटम कवर को अलग करते हैं।',
      pose: {
        explosionFactor: 0.2,
        screenLiftAngle: 0,
        backGlassLift: 0.85,
        batteryLift: 0,
        batteryState: 'old',
        focusPart: 'middle_frame',
        cameraPreset: 'battery_bay',
        tool: 'esd_spudger',
      },
      visualFrame: makeVisualFrame(
        'macbook-air-m1-2020-open-cover',
        'Clean aluminum bottom-plate removal exposing internal hardware',
        1.06,
        '50% 48%'
      ),
    },
    {
      stepNumber: 4,
      assetId: 'macbook-air-m1-2020-internal-layout',
      title: 'Internal Component Inspection',
      explanation: `With the bottom cover removed, the exact internal layout of your ${model.name} is visible: the ${batteryCapacity} sits alongside the ${coolingNote}, stereo speaker chambers, and trackpad ribbon flex. Tap any marker to inspect each part.`,
      technicianAction: 'Inspect battery cells for distortion, check liquid indicators, and locate the BMS header.',
      safetyNote: `Only the battery subsystem is serviced; your ${model.chip} logic board and storage stay completely undisturbed.`,
      narrationEn: 'Inside, you can see the battery cells, logic board, speakers, and trackpad ribbon.',
      narrationHi: 'अंदर आप बैटरी पैक, लॉजिक बोर्ड, स्पीकर्स और ट्रैकपैड केबल साफ देख सकते हैं।',
      pose: {
        explosionFactor: 0.3,
        screenLiftAngle: 0,
        backGlassLift: 1.05,
        batteryLift: 0.05,
        batteryState: 'old',
        focusPart: 'battery',
        cameraPreset: 'battery_bay',
        tool: 'none',
      },
      visualFrame: makeVisualFrame(
        'macbook-air-m1-2020-internal-layout',
        'Interactive hardware map — click or tap any internal component marker',
        1.03,
        '50% 50%',
        [
          {
            id: 'battery',
            label: '4-Cell Li-Ion Battery (Target)',
            detail: `${batteryCapacity}. Primary component scheduled for replacement.`,
            xPct: 50,
            yPct: 62,
            primary: true,
          },
          {
            id: 'logic_board',
            label: `${model.chip} Logic Board & Thermal Unit`,
            detail: `Houses CPU/SoC, memory, and storage with ${coolingNote}. Stays untouched during battery swap.`,
            xPct: 50,
            yPct: 24,
          },
          {
            id: 'bms_connector',
            label: 'Battery BMS Power Plug',
            detail: 'Disconnected first with a non-conductive ESD spudger to isolate 11.4V battery power.',
            xPct: 48,
            yPct: 37,
          },
          {
            id: 'trackpad_flex',
            label: 'Trackpad Ribbon Flex',
            detail: 'Crosses the center battery channel; detached safely prior to pulling adhesive tabs.',
            xPct: 50,
            yPct: 76,
          },
          {
            id: 'speakers',
            label: 'Stereo Speaker Chambers',
            detail: 'Acoustic enclosures flanking the battery bay.',
            xPct: 16,
            yPct: 60,
          },
        ]
      ),
    },
    {
      stepNumber: 5,
      assetId: 'macbook-air-m1-2020-disconnect-battery',
      title: 'Disconnect Battery',
      explanation: 'Before touching the trackpad cable or battery cells, technicians lift the Battery Management Board (BMS) locking tab and gently pry up the battery power connector using a non-conductive ESD nylon spudger.',
      technicianAction: 'Isolate battery power at the BMS logic-board header and detach the crossing trackpad flex.',
      safetyNote: 'Metal tools are prohibited near the BMS header—ESD nylon prevents live rail shorts.',
      narrationEn: 'Before anything else, we lift the battery connector to isolate power safely.',
      narrationHi: 'सबसे पहले हम नायलॉन स्पजर से बैटरी कनेक्टर अलग करके पावर सप्लाई बंद करते हैं।',
      pose: {
        explosionFactor: 0.34,
        screenLiftAngle: 0,
        backGlassLift: 1.1,
        flexDetached: true,
        batteryLift: 0.08,
        batteryState: 'old',
        focusPart: 'display_flex',
        cameraPreset: 'logic_board',
        tool: 'esd_spudger',
      },
      visualFrame: makeVisualFrame(
        'macbook-air-m1-2020-disconnect-battery',
        'ESD-safe isolation of battery BMS power connector before cell removal',
        1.1,
        '54% 46%'
      ),
    },
    {
      stepNumber: 6,
      assetId: 'macbook-air-m1-2020-remove-battery',
      title: 'Remove Old Battery',
      explanation: 'Technicians unfasten the central BMS screw and smoothly pull each factory stretch-release adhesive tab horizontally beneath the cells—allowing the depleted battery to lift out intact without prying against the trackpad glass.',
      technicianAction: 'Extract stretch-release adhesive strips at a low angle and remove the worn battery pack.',
      safetyNote: 'Zero bending, prying, or puncturing of lithium cells.',
      narrationEn: 'Next, we pull the stretch-release adhesive tabs cleanly and remove the old battery.',
      narrationHi: 'इसके बाद हम स्ट्रेच-रिलीज़ टेप खींचकर पुरानी बैटरी को बिना मोड़े बाहर निकालते हैं।',
      pose: {
        explosionFactor: 0.38,
        screenLiftAngle: 0,
        backGlassLift: 1.15,
        flexDetached: true,
        batteryLift: 0.85,
        batteryState: 'old',
        focusPart: 'battery',
        cameraPreset: 'battery_bay',
        tool: 'precision_tweezers',
      },
      visualFrame: makeVisualFrame(
        'macbook-air-m1-2020-remove-battery',
        'Controlled stretch-release removal — zero bending or cell stress',
        1.07,
        '48% 54%'
      ),
    },
    {
      stepNumber: 7,
      assetId: 'macbook-air-m1-2020-install-battery',
      title: 'Install Replacement Battery',
      explanation: 'The aluminum lower tray is wiped clean of adhesive residue. Fresh high-bond battery strips are aligned, the replacement OEM-grade battery is seated flat, the trackpad ribbon is re-latched, and the BMS power connector is clicked firmly into place.',
      technicianAction: 'Align new battery pack flat, re-seat trackpad flex, and reconnect the BMS header.',
      safetyNote: 'Pressure is applied solely along rigid inter-cell frames—never over soft Li-ion pouches.',
      narrationEn: 'We align the new replacement battery, seat the trackpad cable, and reconnect power.',
      narrationHi: 'अब हम नई बैटरी को सही जगह बैठाते हैं, ट्रैकपैड केबल जोड़ते हैं और पावर कनेक्ट करते हैं।',
      pose: {
        explosionFactor: 0.32,
        screenLiftAngle: 0,
        backGlassLift: 1.1,
        flexDetached: false,
        batteryLift: 0.2,
        batteryState: 'new',
        focusPart: 'battery',
        cameraPreset: 'battery_bay',
        tool: 'esd_spudger',
      },
      visualFrame: makeVisualFrame(
        'macbook-air-m1-2020-install-battery',
        'Seating calibrated replacement battery & securing BMS power connector',
        1.08,
        '50% 52%'
      ),
    },
    {
      stepNumber: 8,
      assetId: 'macbook-air-m1-2020-final-test',
      title: 'Final Testing and Reassembly',
      explanation: `The aluminum bottom cover is snapped back flush and all ${screwCount} are torqued evenly. The ${model.name} is opened and connected to a USB-C Power Delivery analyzer to verify 100% battery health telemetry, normal thermal readings, and trackpad/keyboard responsiveness.`,
      technicianAction: 'Torque bottom cover screws, verify macOS battery health (100%), and validate USB-C PD wattage.',
      safetyNote: 'Released with documented charging current curve and AppleFix warranty coverage.',
      narrationEn: 'Finally, we secure the bottom cover and verify battery health and fast charging.',
      narrationHi: 'आखिर में, हम कवर कसते हैं और 100% बैटरी हेल्थ व फास्ट चार्जिंग की पुष्टि करते हैं।',
      pose: {
        explosionFactor: 0,
        screenLiftAngle: 0.1,
        backGlassLift: 0,
        flexDetached: false,
        batteryLift: 0,
        batteryState: 'new',
        focusPart: 'all',
        cameraPreset: 'final_front',
        tool: 'diagnostic_dock',
      },
      visualFrame: makeVisualFrame(
        'macbook-air-m1-2020-final-test',
        `${model.name} final macOS battery health & USB-C PD wattage validation`,
        1.04,
        '50% 48%'
      ),
    },
  ];
}

function buildMacBookGenericSequence(
  model: DeviceModelSpec,
  issue: RepairCategorySpec
): ResolvedRepairStep[] {
  return issue.steps.map((step, idx) => {
    const assetId =
      idx === 0
        ? 'macbook-air-m1-2020-inspection'
        : idx === issue.steps.length - 1
        ? 'macbook-air-m1-2020-final-test'
        : idx === 1
        ? 'macbook-air-m1-2020-p5-screws'
        : idx === 2
        ? 'macbook-air-m1-2020-disconnect-battery'
        : 'macbook-air-m1-2020-internal-layout';

    const cleanExplanation = step.explanation
      .replace(/iPhone/g, model.name)
      .replace(/OLED display|OLED panel/gi, `${model.screenSize} assembly`)
      .replace(/Lightning/g, model.portType)
      .replace(/Face ID/gi, 'Touch ID & lid angle sensor');

    const isFirst = idx === 0;
    const isLast = idx === issue.steps.length - 1;
    const narrationEn = isFirst
      ? `Today, we're demonstrating ${issue.title.toLowerCase()} on the ${model.name}. First, we run a full bench inspection.`
      : isLast
      ? 'Finally, we close the enclosure and complete all macOS diagnostic checks.'
      : `Next, for ${step.title.toLowerCase()}, we ${formatSpeechAction(step.technicianAction)}`;
    const narrationHi = isFirst
      ? `आज हम ${model.name} के लिए ${issue.shortTitle} सेवा दिखा रहे हैं। सबसे पहले, हम पूरी जाँच करते हैं।`
      : isLast
      ? 'आखिर में हम बॉडी बंद करके सभी अंतिम जाँच पूरी करते हैं।'
      : `अगला कदम, ${step.title}। हम इस चरण को सावधानी से पूरा करते हैं।`;

    return {
      ...step,
      assetId,
      explanation: cleanExplanation,
      narrationEn,
      narrationHi,
      visualFrame: makeVisualFrame(
        assetId,
        `${model.name} · ${step.title}`,
        idx === 0 || idx === issue.steps.length - 1 ? 1.04 : 1.08,
        '50% 50%'
      ),
    };
  });
}

// ============================================================================
// 3. IPAD SEQUENCES (PRO M4 TANDEM OLED, AIR, MINI, STANDARD IPAD)
// ============================================================================
function buildIPadSequence(model: DeviceModelSpec, issue: RepairCategorySpec): ResolvedRepairStep[] {
  const isNonLaminated =
    model.visualVariant === 'ipad-standard-home' || model.visualVariant === 'ipad-standard-modern';
  const isProM4 = model.visualVariant === 'ipad-pro-m4';
  const biometricName = model.id.includes('pro') ? 'TrueDepth Face ID' : 'Touch ID sensor';

  if (issue.id === 'display') {
    return [
      {
        stepNumber: 1,
        assetId: 'ipad-pro-m4-inspection',
        title: 'Enclosure Flatness & Digitizer Inspection',
        explanation: `Your ${model.name} (${model.modelCode}) is placed on a wide ESD bench mat. Because ${isProM4 ? 'its 5.1mm ultra-thin aluminum body' : 'an iPad aluminum frame'} can bend in backpacks, technicians check corner flatness and ${model.portType} current draw before heating.`,
        technicianAction: `Check aluminum frame straightness, ${biometricName}, and ${model.portType} diagnostic draw.`,
        safetyNote: 'Any bent chassis corners are precision-straightened first so new glass does not lift or crack.',
        narrationEn: `Today, we're demonstrating a display replacement on the ${model.name}. First, we check frame straightness and charging power.`,
        narrationHi: `आज हम ${model.name} की डिस्प्ले रिप्लेसमेंट दिखा रहे हैं। सबसे पहले, हम फ्रेम और चार्जिंग पावर की जाँच करते हैं।`,
        pose: {
          explosionFactor: 0.05,
          screenLiftAngle: 0,
          backGlassLift: 0,
          batteryLift: 0,
          focusPart: 'display_panel',
          cameraPreset: 'front_angle',
          tool: 'diagnostic_dock',
        },
        visualFrame: makeVisualFrame(
          'ipad-pro-m4-inspection',
          `${model.name} flatness inspection & ${model.portType} power analyzer check`,
          1.05,
          '50% 50%'
        ),
      },
      {
        stepNumber: 2,
        assetId: 'ipad-pro-m4-opening',
        title: 'Controlled Adhesive Softening & Suction Separation',
        explanation: `Using temperature-regulated thermal mats, perimeter glue around the ${model.screenSize} glass is softened evenly. Technicians slice cleanly with thin plastic opening picks while supporting the panel with a precision suction handle—never prying against the thin aluminum edge.`,
        technicianAction: 'Apply controlled perimeter heat and separate adhesive smoothly using plastic picks and suction cup.',
        safetyNote: isNonLaminated
          ? 'Standard iPad models use a separate top glass digitizer over the LCD—picks never touch the exposed LCD surface.'
          : 'Picks enter no deeper than 3mm to protect quad speaker chambers and antenna flexes.',
        narrationEn: 'Next, we apply gentle perimeter heat and lift the glass cleanly using opening picks.',
        narrationHi: 'अब हम किनारों को हल्का गर्म करके प्लास्टिक पिक से डिस्प्ले को सुरक्षित अलग करते हैं।',
        pose: {
          explosionFactor: 0.18,
          screenLiftAngle: 0.45,
          backGlassLift: 0,
          batteryLift: 0,
          focusPart: 'display_panel',
          cameraPreset: 'internal_top',
          tool: 'suction_opener',
        },
        visualFrame: makeVisualFrame(
          'ipad-pro-m4-opening',
          'Controlled perimeter pick separation & suction lift on ESD bench',
          1.06,
          '52% 54%'
        ),
      },
      {
        stepNumber: 3,
        assetId: 'ipad-pro-m4-internals',
        title: 'Isolate Dual-Cell Battery & Central Logic Board',
        explanation: `Inside your ${model.name}, two wide symmetrical battery cells flank the central ${model.chip} logic board ${isProM4 ? 'covered by a copper-graphite thermal shield' : ''}. Technicians isolate the battery connector first with a non-conductive ESD spudger before detaching the display flexes and transferring the ${biometricName} assembly.`,
        technicianAction: 'Unfasten central EMI shield screws, isolate battery rail with ESD spudger, and unclip display flexes.',
        safetyNote: 'Never unplug display or Face ID ribbons with battery power still connected.',
        narrationEn: 'Inside, we isolate the battery connector first with a nylon spudger before unclipping display cables.',
        narrationHi: 'अंदर हम सबसे पहले स्पजर से बैटरी कनेक्टर अलग करते हैं और फिर डिस्प्ले केबल निकालते हैं।',
        pose: {
          explosionFactor: 0.34,
          screenLiftAngle: 0.72,
          shieldRemoved: true,
          flexDetached: true,
          backGlassLift: 0,
          batteryLift: 0,
          focusPart: 'logic_board',
          cameraPreset: 'logic_board',
          tool: 'esd_spudger',
        },
        visualFrame: makeVisualFrame(
          'ipad-pro-m4-internals',
          'Interactive iPad internal layout — click any component hotspot',
          1.04,
          '50% 50%',
          [
            {
              id: 'battery',
              label: 'Symmetrical Dual-Cell Battery',
              detail: 'Two wide flat Li-ion cells spanning left and right of the central logic board.',
              xPct: 33,
              yPct: 54,
            },
            {
              id: 'logic_board',
              label: `${model.chip} Central Logic Board`,
              detail: isProM4
                ? 'Central M4 board with copper-graphite thermal shield and battery B2B header.'
                : `Central ${model.chip} motherboard with display & USB-C flex sockets.`,
              xPct: 50,
              yPct: 50,
              primary: true,
            },
            {
              id: 'bms_spudger',
              label: 'Battery Connector Isolation',
              detail: 'ESD nylon spudger cuts power cleanly before touching display ribbons.',
              xPct: 60,
              yPct: 50,
            },
            {
              id: 'landscape_sensors',
              label: `Landscape ${biometricName} & Camera`,
              detail: 'Positioned along the long bezel; preserved original to keep biometrics working.',
              xPct: 50,
              yPct: 16,
            },
            {
              id: 'quad_speakers',
              label: 'Quad Corner Speaker Chambers',
              detail: 'Four corner acoustic enclosures kept dust-free during sealing.',
              xPct: 31,
              yPct: 18,
            },
          ]
        ),
      },
      {
        stepNumber: 4,
        assetId: 'ipad-pro-m4-inspection',
        title: 'Fresh Perimeter Seal, Display Press & Apple Pencil QC',
        explanation: `Old adhesive is stripped clean from the aluminum bezel ledge. Fresh iPad-grade structural perimeter tape is applied, the replacement ${model.screenSize} display is clamped evenly under bench weights, and touch, Apple Pencil latency, ${biometricName}, and quad speakers are tested.`,
        technicianAction: 'Clean bezel channels, lay fresh perimeter adhesive, clamp evenly, and verify Apple Pencil & touch.',
        safetyNote: 'Controlled bench clamping ensures zero edge light bleed or glass lift.',
        narrationEn: 'Finally, we clean old adhesive, clamp the new display evenly, and verify touch and Apple Pencil.',
        narrationHi: 'आखिर में हम पुराना गोंद साफ कर नया डिस्प्ले लगाते हैं और टच व Apple Pencil टेस्ट करते हैं।',
        pose: {
          explosionFactor: 0,
          screenLiftAngle: 0,
          backGlassLift: 0,
          batteryLift: 0,
          focusPart: 'all',
          cameraPreset: 'final_front',
          tool: 'adhesive_press',
        },
        visualFrame: makeVisualFrame(
          'ipad-pro-m4-inspection',
          `Final ${model.screenSize} touch, Apple Pencil, and ${model.portType} verification`,
          1.04,
          '50% 50%'
        ),
      },
    ];
  }

  if (issue.id === 'battery') {
    return [
      {
        stepNumber: 1,
        assetId: 'ipad-pro-m4-inspection',
        title: 'Initial Inspection & Cycle Telemetry',
        explanation: `We test your ${model.name} (${model.connectivity ?? 'Wi-Fi'}) on an ESD mat, measuring ${model.portType} fast-charging current and checking whether the large display shows upward lift from cell swelling.`,
        technicianAction: `Measure ${model.portType} amperage draw and check battery cycle count.`,
        safetyNote: 'Swollen dual-cell packs are discharged carefully before thermal opening.',
        narrationEn: `Today, we're demonstrating a battery replacement on the ${model.name}. First, we check charging draw and cycle telemetry.`,
        narrationHi: `आज हम ${model.name} की बैटरी रिप्लेसमेंट दिखा रहे हैं। सबसे पहले, हम चार्जिंग करंट और बैटरी साइकिल की जाँच करते हैं।`,
        pose: {
          explosionFactor: 0.05,
          screenLiftAngle: 0,
          backGlassLift: 0,
          batteryLift: 0,
          batteryState: 'old',
          focusPart: 'battery',
          cameraPreset: 'front_angle',
          tool: 'diagnostic_dock',
        },
        visualFrame: makeVisualFrame(
          'ipad-pro-m4-inspection',
          `${model.name} pre-repair ${model.portType} power & chassis check`,
          1.05,
          '50% 50%'
        ),
      },
      {
        stepNumber: 2,
        assetId: 'ipad-pro-m4-opening',
        title: 'Safe Display Separation & Flex Unclip',
        explanation: `Using regulated perimeter warmth, plastic opening picks, and suction handles, technicians lift the ${model.screenSize} display cleanly without stressing delicate ribbons or bending the housing.`,
        technicianAction: 'Soften perimeter adhesive and separate front display assembly cleanly.',
        safetyNote: 'Display ribbons are disconnected immediately after isolating battery power.',
        narrationEn: 'Next, we warm the perimeter seal gently and lift the display assembly carefully.',
        narrationHi: 'अब हम किनारों की सील को हल्का गर्म करके डिस्प्ले को सावधानी से उठाते हैं।',
        pose: {
          explosionFactor: 0.2,
          screenLiftAngle: 0.55,
          backGlassLift: 0,
          batteryLift: 0,
          batteryState: 'old',
          focusPart: 'display_panel',
          cameraPreset: 'internal_top',
          tool: 'suction_opener',
        },
        visualFrame: makeVisualFrame(
          'ipad-pro-m4-opening',
          'Safe perimeter display opening with plastic picks & suction lifter',
          1.06,
          '52% 54%'
        ),
      },
      {
        stepNumber: 3,
        assetId: 'ipad-pro-m4-internals',
        title: 'Isolate Dual-Cell Battery & Safe Cell Extraction',
        explanation: `Inside your ${model.name}, the dual symmetrical battery cells sit beside the central ${model.chip} logic board. Technicians isolate the battery connector with an ESD spudger, release factory stretch-tabs / isopropyl debonding safely, and fit fresh replacement cells.`,
        technicianAction: 'Isolate battery connector, remove depleted dual-cell pack, and seat new tested cells.',
        safetyNote: 'Never pry directly beneath aluminum back enclosures containing antenna bands.',
        narrationEn: 'Inside, we isolate the battery connector, safely remove the dual cells, and install the new battery.',
        narrationHi: 'अंदर हम बैटरी कनेक्टर अलग करके पुरानी सेल्स बाहर निकालते हैं और नई बैटरी फिट करते हैं।',
        pose: {
          explosionFactor: 0.36,
          screenLiftAngle: 0.85,
          screenRemoved: true,
          shieldRemoved: true,
          flexDetached: true,
          backGlassLift: 0,
          batteryLift: 0.65,
          batteryState: 'new',
          focusPart: 'battery',
          cameraPreset: 'battery_bay',
          tool: 'esd_spudger',
        },
        visualFrame: makeVisualFrame(
          'ipad-pro-m4-internals',
          'Dual-cell iPad battery isolation & central logic board inspection',
          1.05,
          '50% 50%'
        ),
      },
      {
        stepNumber: 4,
        assetId: 'ipad-pro-m4-inspection',
        title: 'Perimeter Re-Sealing & Sustained Charging Test',
        explanation: `A fresh structural bezel seal is applied, the display is pressed uniformly under bench fixtures, and your ${model.name} is verified under sustained ${model.portType} charging load.`,
        technicianAction: 'Re-seal bezel cleanly and verify charging wattage, Apple Pencil, and speakers.',
        safetyNote: 'Full multi-point diagnostic checklist completed before handover.',
        narrationEn: 'Finally, we apply a fresh perimeter seal, close the screen, and confirm stable fast charging.',
        narrationHi: 'आखिर में हम नया सील लगाकर डिस्प्ले बंद करते हैं और फास्ट चार्जिंग की पुष्टि करते हैं।',
        pose: {
          explosionFactor: 0,
          screenLiftAngle: 0,
          backGlassLift: 0,
          batteryLift: 0,
          batteryState: 'new',
          focusPart: 'all',
          cameraPreset: 'final_front',
          tool: 'diagnostic_dock',
        },
        visualFrame: makeVisualFrame(
          'ipad-pro-m4-inspection',
          'Final sealed iPad charging & touch verification',
          1.04,
          '50% 50%'
        ),
      },
    ];
  }

  return issue.steps.map((step, idx) => {
    const assetId =
      idx === 0 || idx === issue.steps.length - 1
        ? 'ipad-pro-m4-inspection'
        : idx === 1
        ? 'ipad-pro-m4-opening'
        : 'ipad-pro-m4-internals';

    const cleanExplanation = step.explanation
      .replace(/iPhone/g, model.name)
      .replace(/OLED display|OLED panel/gi, `${model.screenSize} display`)
      .replace(/Lightning/g, model.portType)
      .replace(/Face ID/gi, biometricName);

    const isFirst = idx === 0;
    const isLast = idx === issue.steps.length - 1;
    const narrationEn = isFirst
      ? `Today, we're demonstrating ${issue.title.toLowerCase()} on the ${model.name}. First, we inspect the device on our bench mat.`
      : isLast
      ? 'Finally, we re-seal the display cleanly and verify all functions.'
      : `Next, for ${step.title.toLowerCase()}, we ${formatSpeechAction(step.technicianAction)}`;
    const narrationHi = isFirst
      ? `आज हम ${model.name} के लिए ${issue.shortTitle} सेवा दिखा रहे हैं। सबसे पहले, हम डिवाइस की जाँच करते हैं।`
      : isLast
      ? 'आखिर में हम डिस्प्ले को फिर से सील करके सभी फ़ंक्शन की जाँच करते हैं।'
      : `अगला कदम, ${step.title}। हम इस प्रक्रिया को सुरक्षित तरीके से पूरा करते हैं।`;

    return {
      ...step,
      assetId,
      explanation: cleanExplanation,
      narrationEn,
      narrationHi,
      visualFrame: makeVisualFrame(
        assetId,
        `${model.name} · ${step.title}`,
        idx === 0 || idx === issue.steps.length - 1 ? 1.04 : 1.08,
        '50% 50%'
      ),
    };
  });
}

// ============================================================================
// 4. APPLE WATCH MACRO SEQUENCES (ULTRA REAR P5 VS SERIES/SE FRONT OLED)
// ============================================================================
function buildWatchSequence(model: DeviceModelSpec, issue: RepairCategorySpec): ResolvedRepairStep[] {
  const isUltra = model.visualVariant === 'watch-ultra' || model.id.includes('ultra');

  if (issue.id === 'battery') {
    return [
      {
        stepNumber: 1,
        assetId: 'watch-ultra-inspection',
        title: 'Macro Case & Charging Inspection',
        explanation: `Your ${model.name} (${model.modelCode}) is mounted in a precision soft-jaw watch vise under stereo magnification. Technicians test magnetic fast-charging wattage, Digital Crown encoder action, and inspect the ${isUltra ? '49mm titanium bezel & orange Action button' : 'OLED perimeter seal'}.`,
        technicianAction: 'Mount watch safely in ESD vise and test magnetic charger draw and sensor telemetry.',
        safetyNote: 'Soft padded vise jaws prevent scuffing brushed titanium or anodized aluminum cases.',
        narrationEn: `Today, we're demonstrating a battery replacement on the ${model.name}. First, we mount it in a padded vise and test magnetic charging.`,
        narrationHi: `आज हम ${model.name} की बैटरी रिप्लेसमेंट दिखा रहे हैं। सबसे पहले, हम इसे सॉफ्ट वाइस में रखकर मैग्नेटिक चार्जिंग की जाँच करते हैं।`,
        pose: {
          explosionFactor: 0.05,
          screenLiftAngle: 0,
          backGlassLift: 0,
          batteryLift: 0,
          batteryState: 'old',
          focusPart: 'battery',
          cameraPreset: 'front_angle',
          tool: 'diagnostic_dock',
        },
        visualFrame: makeVisualFrame(
          'watch-ultra-inspection',
          `Macro vise inspection of ${model.name} (${model.chip})`,
          1.06,
          '50% 48%'
        ),
      },
      {
        stepNumber: 2,
        assetId: 'watch-ultra-rear-screws',
        title: isUltra ? 'Remove 4 Rear P5 Titanium Corner Screws' : 'Controlled Micro-Heat Front OLED Lift',
        explanation: isUltra
          ? `Unlike standard watches, ${model.name} uses four recessed P5 Pentalobe titanium screws on the rear ceramic crystal housing—allowing technicians to access the battery from the back without risking the bonded flat sapphire crystal.`
          : `On ${model.name}, micro-regulated heat softens the hairline perimeter gasket so the OLED screen lifts smoothly along its micro-hinge without stressing ZIF flex ribbons.`,
        technicianAction: isUltra
          ? 'Unfasten the 4 rear P5 titanium corner screws under magnification.'
          : 'Apply micro-regulated perimeter heat and lift front OLED assembly cleanly.',
        safetyNote: isUltra
          ? 'P5 driver tip is seated straight into each recessed screw to keep the rear ceramic crystal pristine.'
          : 'Ultra-thin OLED flex ribbons require zero tension during initial lift.',
        narrationEn: isUltra
          ? 'Next, we remove the four tiny corner screws on the rear housing under magnification.'
          : 'Next, we apply controlled micro-heat and lift the OLED screen gently under magnification.',
        narrationHi: isUltra
          ? 'अब हम मैक्रो लेंस के नीचे पीछे लगे चारों छोटे स्क्रू सावधानी से हटाते हैं।'
          : 'अब हम माइक्रो हीट से किनारों की सील नरम करके OLED डिस्प्ले को धीरे से उठाते हैं।',
        pose: {
          explosionFactor: 0.18,
          screenLiftAngle: isUltra ? 0.1 : 0.65,
          backGlassLift: isUltra ? 0.5 : 0,
          batteryLift: 0,
          batteryState: 'old',
          focusPart: isUltra ? 'back_glass' : 'display_panel',
          cameraPreset: 'rear_optics',
          tool: isUltra ? 'pentalobe_driver' : 'heating_pad',
        },
        visualFrame: makeVisualFrame(
          'watch-ultra-rear-screws',
          isUltra
            ? 'Extreme macro: micro P5 Pentalobe driver removing rear titanium screws'
            : 'Macro perimeter opening under stereo workshop lighting',
          1.08,
          '52% 48%'
        ),
      },
      {
        stepNumber: 3,
        assetId: 'watch-ultra-internals',
        title: 'Macro Micro-Connector Isolation & Battery Swap',
        explanation: `Under extreme macro magnification, every compact module inside your ${model.name} is visible: the ${model.chip} module, Taptic Engine, orange perimeter seal gasket, and compact watch battery. Using ultra-fine ESD tweezers and a nylon micro-spudger, the battery flex is disconnected first before swapping in a fresh calibrated cell.`,
        technicianAction: 'Unclip micro battery B2B connector with nylon tool, remove worn cell, and seat new battery.',
        safetyNote: 'Zero metal contact near compact SiP capacitors; fresh waterproof seal gasket fitted during close.',
        narrationEn: 'Inside, we disconnect the battery connector first using non-conductive tools and install the new cell.',
        narrationHi: 'अंदर हम पहले बैटरी कनेक्टर अलग करते हैं और फिर नई बैटरी को सुरक्षित जगह बैठाते हैं।',
        pose: {
          explosionFactor: 0.36,
          screenLiftAngle: 0.85,
          shieldRemoved: true,
          flexDetached: true,
          backGlassLift: 0,
          batteryLift: 0.65,
          batteryState: 'new',
          focusPart: 'battery',
          cameraPreset: 'battery_bay',
          tool: 'precision_tweezers',
        },
        visualFrame: makeVisualFrame(
          'watch-ultra-internals',
          'Interactive macro view — tap any internal Apple Watch component',
          1.04,
          '50% 50%',
          [
            {
              id: 'battery',
              label: isUltra ? '542mAh / 564mAh Watch Battery (Target)' : 'Compact Li-Ion Watch Battery',
              detail: 'Primary power cell replaced with a fresh high-cycle tested battery.',
              xPct: 62,
              yPct: 58,
              primary: true,
            },
            {
              id: 'sip_module',
              label: `${model.chip} Module`,
              detail: 'Fully encapsulated System in Package housing CPU, Neural Engine, and storage.',
              xPct: 33,
              yPct: 40,
            },
            {
              id: 'taptic_engine',
              label: 'Watch Taptic Engine',
              detail: 'Precision haptic vibrator unit positioned alongside the battery.',
              xPct: 33,
              yPct: 72,
            },
            {
              id: 'water_gasket',
              label: 'Water-Resistance Seal Gasket',
              detail: 'Inspected and renewed cleanly to maintain splash/water resistance.',
              xPct: 50,
              yPct: 17,
            },
          ]
        ),
      },
      {
        stepNumber: 4,
        assetId: 'watch-ultra-inspection',
        title: 'Gasket Reseal, Fast-Charge & Water-Seal Check',
        explanation: `The ${isUltra ? 'rear ceramic backplate with 4 P5 screws' : 'OLED display with a new perimeter waterproof adhesive ring'} is closed and clamped cleanly. Magnetic fast charging, optical heart sensors, Digital Crown scroll, and speaker output are verified.`,
        technicianAction: 'Restore perimeter water seal, torque fasteners, and verify charging & sensors.',
        safetyNote: 'Returned with verified fast-charge curve and seal integrity audit.',
        narrationEn: 'Finally, we renew the waterproof gasket, secure the case, and test charging and heart sensors.',
        narrationHi: 'आखिर में हम नया वॉटरप्रूफ गास्केट लगाकर केस बंद करते हैं और चार्जिंग व सेंसर की जाँच करते हैं।',
        pose: {
          explosionFactor: 0,
          screenLiftAngle: 0,
          backGlassLift: 0,
          batteryLift: 0,
          batteryState: 'new',
          focusPart: 'all',
          cameraPreset: 'final_front',
          tool: 'diagnostic_dock',
        },
        visualFrame: makeVisualFrame(
          'watch-ultra-inspection',
          `Final sealed ${model.name} fast-charge & sensor verification`,
          1.05,
          '50% 50%'
        ),
      },
    ];
  }

  return issue.steps.map((step, idx) => {
    const assetId =
      idx === 0 || idx === issue.steps.length - 1
        ? 'watch-ultra-inspection'
        : idx === 1
        ? 'watch-ultra-rear-screws'
        : 'watch-ultra-internals';

    const cleanExplanation = step.explanation
      .replace(/iPhone/g, model.name)
      .replace(/USB-C or Lightning|USB-C\/Lightning/g, model.portType)
      .replace(/Face ID/gi, 'Digital Crown & optical sensors');

    const isFirst = idx === 0;
    const isLast = idx === issue.steps.length - 1;
    const narrationEn = isFirst
      ? `Today, we're demonstrating ${issue.title.toLowerCase()} on the ${model.name}. First, we run a macro inspection in our watch vise.`
      : isLast
      ? 'Finally, we renew the waterproof seal and verify sensors and charging.'
      : `Next, for ${step.title.toLowerCase()}, we ${formatSpeechAction(step.technicianAction)}`;
    const narrationHi = isFirst
      ? `आज हम ${model.name} के लिए ${issue.shortTitle} सेवा दिखा रहे हैं। सबसे पहले, हम वॉच की मैक्रो जाँच करते हैं।`
      : isLast
      ? 'आखिर में हम वॉटरप्रूफ सील लगाकर सभी सेंसर और चार्जिंग की जाँच करते हैं।'
      : `अगला कदम, ${step.title}। हम यह कार्य सूक्ष्म मैक्रो उपकरणों से करते हैं।`;

    return {
      ...step,
      assetId,
      explanation: cleanExplanation,
      narrationEn,
      narrationHi,
      visualFrame: makeVisualFrame(
        assetId,
        `${model.name} · ${step.title}`,
        idx === 0 || idx === issue.steps.length - 1 ? 1.05 : 1.09,
        '50% 50%'
      ),
    };
  });
}

// ============================================================================
// PUBLIC RESOLVER
// ============================================================================
export function getResolvedRepairSteps(
  categoryId: DeviceCategoryId,
  model: DeviceModelSpec,
  issue: RepairCategorySpec
): ResolvedRepairStep[] {
  if (categoryId === 'macbook') {
    if (issue.id === 'battery') {
      return buildMacBookBatterySequence(model);
    }
    return buildMacBookGenericSequence(model, issue);
  }

  if (categoryId === 'ipad') {
    return buildIPadSequence(model, issue);
  }

  if (categoryId === 'watch') {
    return buildWatchSequence(model, issue);
  }

  // iPhone
  if (issue.id === 'battery') {
    return buildIPhoneBatterySequence(model);
  }
  if (issue.id === 'display') {
    return buildIPhoneDisplaySequence(model);
  }
  return buildIPhoneOtherSequence(model, issue);
}
