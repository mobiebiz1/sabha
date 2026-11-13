import type { DeviceCategoryId, DeviceModelSpec } from './devices';
import type { RepairCategoryId } from './repairs';

// Bundled workshop photography assets (static ES imports so Vite bundles reliably)
import macbookM1Step1Img from '../assets/images/macbook_m1_step1_inspection_1794577424628.jpg';
import macbookM1Step2Img from '../assets/images/macbook_m1_step2_p5_screws_1794577425745.jpg';
import macbookM1Step3Img from '../assets/images/macbook_m1_step3_lift_cover_1794577427372.jpg';
import macbookM1Step4Img from '../assets/images/macbook_m1_step4_internal_layout_1794577428335.jpg';
import macbookM1Step5Img from '../assets/images/macbook_m1_step5_disconnect_battery_1794577429605.jpg';
import macbookM1Step6Img from '../assets/images/macbook_m1_step6_remove_battery_1794577429796.jpg';
import macbookM1Step7Img from '../assets/images/macbook_m1_step7_install_battery_1794577428293.jpg';
import macbookM1Step8Img from '../assets/images/macbook_m1_step8_reassembly_test_1794577429855.jpg';

import iphone15ProExteriorImg from '../assets/images/iphone_15_pro_exterior_1794578000113.jpg';
import iphone15ProOpeningImg from '../assets/images/iphone_15_pro_opening_1794578001010.jpg';
import iphone15ProInternalsImg from '../assets/images/iphone_15_pro_internals_1794578001939.jpg';
import iphone15ProBatterySwapImg from '../assets/images/iphone_15_pro_battery_swap_1794578001812.jpg';
import iphone16ProDisplayOpenImg from '../assets/images/iphone_16_pro_display_open_1794578002850.jpg';
import iphone16ProDisplayInstallImg from '../assets/images/iphone_16_pro_display_install_1794578003655.jpg';

import ipadProM4InspectionImg from '../assets/images/ipad_pro_m4_inspection_1794578004018.jpg';
import ipadProM4OpeningImg from '../assets/images/ipad_pro_m4_opening_1794578004455.jpg';
import ipadProM4InternalsImg from '../assets/images/ipad_pro_m4_internals_1794578006219.jpg';

import watchUltraInspectionImg from '../assets/images/watch_ultra_inspection_1794578005181.jpg';
import watchUltraRearScrewsImg from '../assets/images/watch_ultra_rear_screws_1794578006234.jpg';
import watchUltraInternalsImg from '../assets/images/watch_ultra_internals_1794578006381.jpg';

export interface WorkshopAssetEntry {
  assetId: string;
  deviceCategory: DeviceCategoryId;
  modelSlug: string;
  stageSlug: string;
  mediaType: 'workshop_frame' | 'video_ready';
  imageSrc: string;
  videoSrc?: string;
  alt: string;
  cameraAngleLabel: string;
}

/**
 * Centralized Model-Specific Asset Manifest.
 * New .mp4/.webm workshop video clips or high-resolution stills can be registered here
 * by assetId without touching UI components.
 */
export const WORKSHOP_ASSET_MANIFEST: Record<string, WorkshopAssetEntry> = {
  // iPhone 15 Pro & Pro Titanium Battery / Dual-Entry Bench Assets
  'iphone-15-pro-exterior': {
    assetId: 'iphone-15-pro-exterior',
    deviceCategory: 'iphone',
    modelSlug: 'iphone-15-pro',
    stageSlug: 'exterior',
    mediaType: 'workshop_frame',
    imageSrc: iphone15ProExteriorImg,
    alt: 'Natural Titanium iPhone 15 Pro connected to digital USB-C PD diagnostic meter on ESD repair mat',
    cameraAngleLabel: 'Overhead Bench · Diagnostic Bridge',
  },
  'iphone-15-pro-opening': {
    assetId: 'iphone-15-pro-opening',
    deviceCategory: 'iphone',
    modelSlug: 'iphone-15-pro',
    stageSlug: 'opening',
    mediaType: 'workshop_frame',
    imageSrc: iphone15ProOpeningImg,
    alt: 'Technician gloved hands using precision suction cup and plastic opening pick on Natural Titanium iPhone 15 Pro',
    cameraAngleLabel: 'Workshop Close-Up · Suction & Pick Separation',
  },
  'iphone-15-pro-battery-connector': {
    assetId: 'iphone-15-pro-battery-connector',
    deviceCategory: 'iphone',
    modelSlug: 'iphone-15-pro',
    stageSlug: 'battery-connector',
    mediaType: 'workshop_frame',
    imageSrc: iphone15ProInternalsImg,
    alt: 'Opened iPhone 15 Pro interior showing A17 Pro board, L-shaped battery, Taptic Engine, and ESD spudger disconnecting battery flex',
    cameraAngleLabel: 'Macro Internal · Battery B2B Isolation',
  },
  'iphone-15-pro-battery-removal': {
    assetId: 'iphone-15-pro-battery-removal',
    deviceCategory: 'iphone',
    modelSlug: 'iphone-15-pro',
    stageSlug: 'battery-removal',
    mediaType: 'workshop_frame',
    imageSrc: iphone15ProBatterySwapImg,
    alt: 'Technician hands using precision tweezers to extract white stretch-release adhesive tabs and lift depleted iPhone 15 Pro battery',
    cameraAngleLabel: 'Bench Close-Up · Stretch-Release Extraction',
  },
  'iphone-15-pro-battery-installation': {
    assetId: 'iphone-15-pro-battery-installation',
    deviceCategory: 'iphone',
    modelSlug: 'iphone-15-pro',
    stageSlug: 'battery-installation',
    mediaType: 'workshop_frame',
    imageSrc: iphone15ProBatterySwapImg,
    alt: 'Fresh replacement L-shaped Li-ion battery positioned alongside opened iPhone 15 Pro titanium frame',
    cameraAngleLabel: 'Bench Close-Up · OEM Cell Alignment',
  },
  'iphone-15-pro-final-testing': {
    assetId: 'iphone-15-pro-final-testing',
    deviceCategory: 'iphone',
    modelSlug: 'iphone-15-pro',
    stageSlug: 'final-testing',
    mediaType: 'workshop_frame',
    imageSrc: iphone15ProExteriorImg,
    alt: 'Reassembled Natural Titanium iPhone 15 Pro passing sustained 28.7W USB-C Power Delivery diagnostics',
    cameraAngleLabel: 'Final QC · USB-C Wattage & BMS Check',
  },

  // iPhone 16 Pro Display & Heated Entry Assets
  'iphone-16-pro-exterior': {
    assetId: 'iphone-16-pro-exterior',
    deviceCategory: 'iphone',
    modelSlug: 'iphone-16-pro',
    stageSlug: 'exterior',
    mediaType: 'workshop_frame',
    imageSrc: iphone15ProExteriorImg,
    alt: 'Titanium iPhone connected to digital USB-C diagnostic bench analyzer prior to display inspection',
    cameraAngleLabel: 'Overhead Bench · Chassis & Display Check',
  },
  'iphone-16-pro-display-opening': {
    assetId: 'iphone-16-pro-display-opening',
    deviceCategory: 'iphone',
    modelSlug: 'iphone-16-pro',
    stageSlug: 'display-opening',
    mediaType: 'workshop_frame',
    imageSrc: iphone16ProDisplayOpenImg,
    alt: 'iPhone 16 Pro on 78.5°C regulated preheater as technician hands lift OLED display with suction opener and ESD spudger',
    cameraAngleLabel: 'Thermal Fixture · Controlled OLED Lift',
  },
  'iphone-16-pro-display-install': {
    assetId: 'iphone-16-pro-display-install',
    deviceCategory: 'iphone',
    modelSlug: 'iphone-16-pro',
    stageSlug: 'display-install',
    mediaType: 'workshop_frame',
    imageSrc: iphone16ProDisplayInstallImg,
    alt: 'Technician aligning brand-new 120Hz ProMotion OLED display on iPhone 16 Pro running calibrated RGB color pattern',
    cameraAngleLabel: 'Bench Verification · 120Hz OLED Color Grid',
  },

  // MacBook Air M1 2020 8-Step Workshop Assets
  'macbook-air-m1-2020-inspection': {
    assetId: 'macbook-air-m1-2020-inspection',
    deviceCategory: 'macbook',
    modelSlug: 'mba-13-m1-2020',
    stageSlug: 'inspection',
    mediaType: 'workshop_frame',
    imageSrc: macbookM1Step1Img,
    alt: 'MacBook Air 13-inch M1 2020 resting on anti-static ESD mat for initial battery and enclosure inspection',
    cameraAngleLabel: 'Overhead Bench · Chassis & PD Check',
  },
  'macbook-air-m1-2020-p5-screws': {
    assetId: 'macbook-air-m1-2020-p5-screws',
    deviceCategory: 'macbook',
    modelSlug: 'mba-13-m1-2020',
    stageSlug: 'p5-screws',
    mediaType: 'workshop_frame',
    imageSrc: macbookM1Step2Img,
    alt: 'Technician hand using P5 Pentalobe precision screwdriver on MacBook Air bottom case screws',
    cameraAngleLabel: 'Close-Up · P5 Pentalobe Disassembly',
  },
  'macbook-air-m1-2020-open-cover': {
    assetId: 'macbook-air-m1-2020-open-cover',
    deviceCategory: 'macbook',
    modelSlug: 'mba-13-m1-2020',
    stageSlug: 'open-cover',
    mediaType: 'workshop_frame',
    imageSrc: macbookM1Step3Img,
    alt: 'Technician hands cleanly lifting the machined aluminum bottom cover off the MacBook Air chassis',
    cameraAngleLabel: 'Workshop View · Bottom Case Removal',
  },
  'macbook-air-m1-2020-internal-layout': {
    assetId: 'macbook-air-m1-2020-internal-layout',
    deviceCategory: 'macbook',
    modelSlug: 'mba-13-m1-2020',
    stageSlug: 'internal-layout',
    mediaType: 'workshop_frame',
    imageSrc: macbookM1Step4Img,
    alt: 'Overhead internal view of MacBook Air M1 showing 4-cell battery, fanless M1 logic board, heat spreader, and speakers',
    cameraAngleLabel: 'Macro Internal · Component Hardware Map',
  },
  'macbook-air-m1-2020-disconnect-battery': {
    assetId: 'macbook-air-m1-2020-disconnect-battery',
    deviceCategory: 'macbook',
    modelSlug: 'mba-13-m1-2020',
    stageSlug: 'disconnect-battery',
    mediaType: 'workshop_frame',
    imageSrc: macbookM1Step5Img,
    alt: 'Technician hand using black ESD nylon spudger to disconnect the MacBook Air battery BMS power connector',
    cameraAngleLabel: 'Macro Close-Up · BMS Power Isolation',
  },
  'macbook-air-m1-2020-remove-battery': {
    assetId: 'macbook-air-m1-2020-remove-battery',
    deviceCategory: 'macbook',
    modelSlug: 'mba-13-m1-2020',
    stageSlug: 'remove-battery',
    mediaType: 'workshop_frame',
    imageSrc: macbookM1Step6Img,
    alt: 'Technician hands carefully removing depleted 4-cell battery using stretch-release adhesive tabs',
    cameraAngleLabel: 'Workshop View · Safe Cell Extraction',
  },
  'macbook-air-m1-2020-install-battery': {
    assetId: 'macbook-air-m1-2020-install-battery',
    deviceCategory: 'macbook',
    modelSlug: 'mba-13-m1-2020',
    stageSlug: 'install-battery',
    mediaType: 'workshop_frame',
    imageSrc: macbookM1Step7Img,
    alt: 'Technician hands seating a fresh 4-cell OEM-grade MacBook battery into the aluminum unibody tray',
    cameraAngleLabel: 'Workshop View · Replacement Cell Fitment',
  },
  'macbook-air-m1-2020-final-test': {
    assetId: 'macbook-air-m1-2020-final-test',
    deviceCategory: 'macbook',
    modelSlug: 'mba-13-m1-2020',
    stageSlug: 'final-test',
    mediaType: 'workshop_frame',
    imageSrc: macbookM1Step8Img,
    alt: 'Reassembled MacBook Air M1 2020 running 100% battery health and USB-C power meter diagnostics',
    cameraAngleLabel: 'Final QC · macOS Telemetry & Wattage',
  },

  // iPad Pro M4 Workshop Assets
  'ipad-pro-m4-inspection': {
    assetId: 'ipad-pro-m4-inspection',
    deviceCategory: 'ipad',
    modelSlug: 'ipad-pro-13-m4-2024',
    stageSlug: 'inspection',
    mediaType: 'workshop_frame',
    imageSrc: ipadProM4InspectionImg,
    alt: 'Ultra-thin Space Black iPad Pro M4 with landscape front camera resting on ESD mat beside USB-C wattage analyzer',
    cameraAngleLabel: 'Overhead Bench · Flatness & USB-C Check',
  },
  'ipad-pro-m4-opening': {
    assetId: 'ipad-pro-m4-opening',
    deviceCategory: 'ipad',
    modelSlug: 'ipad-pro-13-m4-2024',
    stageSlug: 'opening',
    mediaType: 'workshop_frame',
    imageSrc: ipadProM4OpeningImg,
    alt: 'Technician gloved hands using precision suction cup and plastic opening picks along iPad Pro M4 perimeter',
    cameraAngleLabel: 'Bench Close-Up · Controlled Tandem OLED Lift',
  },
  'ipad-pro-m4-internals': {
    assetId: 'ipad-pro-m4-internals',
    deviceCategory: 'ipad',
    modelSlug: 'ipad-pro-13-m4-2024',
    stageSlug: 'internals',
    mediaType: 'workshop_frame',
    imageSrc: ipadProM4InternalsImg,
    alt: 'Opened iPad Pro M4 interior showing two wide symmetrical battery cells, central copper-shielded M4 logic board, and ESD spudger',
    cameraAngleLabel: 'Macro Internal · Dual-Battery & M4 Layout',
  },

  // Apple Watch Ultra Macro Workshop Assets
  'watch-ultra-inspection': {
    assetId: 'watch-ultra-inspection',
    deviceCategory: 'watch',
    modelSlug: 'watch-ultra-1',
    stageSlug: 'inspection',
    mediaType: 'workshop_frame',
    imageSrc: watchUltraInspectionImg,
    alt: '49mm Titanium Apple Watch Ultra with orange Action button mounted in precision anodized watch repair clamp',
    cameraAngleLabel: 'Macro Vise · 49mm Titanium Inspection',
  },
  'watch-ultra-rear-screws': {
    assetId: 'watch-ultra-rear-screws',
    deviceCategory: 'watch',
    modelSlug: 'watch-ultra-1',
    stageSlug: 'rear-screws',
    mediaType: 'workshop_frame',
    imageSrc: watchUltraRearScrewsImg,
    alt: 'Extreme macro shot of micro P5 Pentalobe screwdriver engaging titanium rear corner screw on Apple Watch Ultra',
    cameraAngleLabel: 'Extreme Macro · Rear P5 Titanium Screws',
  },
  'watch-ultra-internals': {
    assetId: 'watch-ultra-internals',
    deviceCategory: 'watch',
    modelSlug: 'watch-ultra-1',
    stageSlug: 'internals',
    mediaType: 'workshop_frame',
    imageSrc: watchUltraInternalsImg,
    alt: 'Extreme macro interior of Apple Watch Ultra showing S-Series SiP, Taptic Engine, 542mAh battery, orange seal, and ESD tweezers',
    cameraAngleLabel: 'Extreme Macro · SiP & Micro-Battery Bay',
  },
};

export function resolveManifestEntry(assetId: string): WorkshopAssetEntry | undefined {
  return WORKSHOP_ASSET_MANIFEST[assetId];
}

export function buildModelAssetKey(
  model: DeviceModelSpec,
  issueId: RepairCategoryId,
  stageSlug: string
): string {
  return `${model.id}::${issueId}::${stageSlug}`;
}
