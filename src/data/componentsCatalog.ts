export type IPhonePartId =
  | 'back_glass'
  | 'camera_module'
  | 'camera_brackets'
  | 'shield_plate'
  | 'display_panel'
  | 'display_flex'
  | 'battery'
  | 'logic_board'
  | 'taptic_engine'
  | 'top_speaker'
  | 'middle_frame'
  | 'bottom_speaker'
  | 'charging_port'
  | 'antenna_modules'
  | 'titanium_frame';

export interface ComponentSpec {
  id: IPhonePartId;
  order: number;
  name: string;
  shortLabel: string;
  subsystem: string;
  role: string;
  inspectionNote: string;
  explodedY: number;
  side: 'left' | 'right';
}

export const IPHONE_COMPONENTS: ComponentSpec[] = [
  {
    id: 'back_glass',
    order: 1,
    name: 'Back Glass (With Camera Rings)',
    shortLabel: 'Back Glass',
    subsystem: 'Rear Enclosure & Wireless',
    role: 'Color-infused frosted rear glass with precision sapphire-rimmed camera bezel and MagSafe alignment window.',
    inspectionNote: 'Technicians inspect for hairline fractures, moisture ingress paths, and MagSafe coil integrity before removal.',
    explodedY: 3.15,
    side: 'right',
  },
  {
    id: 'camera_module',
    order: 2,
    name: 'Triple Pro Camera Module',
    shortLabel: 'Camera Module',
    subsystem: 'Optical Imaging Array',
    role: 'Main 48MP sensor-shift OIS, Ultra Wide, and Telephoto optical barrels paired with LiDAR scanner optics.',
    inspectionNote: 'Checked for OIS rattle, lens flare scratches, dust spots on the sensor, and B2B connector oxidation.',
    explodedY: 2.68,
    side: 'right',
  },
  {
    id: 'camera_brackets',
    order: 3,
    name: 'Camera Brackets & TrueDepth Sensors',
    shortLabel: 'Brackets & Sensors',
    subsystem: 'Optical Alignment & Face ID',
    role: 'Precision stamped retaining brackets, Face ID infrared flood illuminator, and optical stabilization mounts.',
    inspectionNote: 'Face ID dot-projector flexes are tested without disturbance; never replaced unless hardware diagnostics confirm failure.',
    explodedY: 2.22,
    side: 'right',
  },
  {
    id: 'shield_plate',
    order: 4,
    name: 'EMI & Thermal Shield Plate',
    shortLabel: 'Shield Plate',
    subsystem: 'Connector Retention',
    role: 'Micro-fastened stainless steel cover that secures B2B flex connectors and dissipates localized processor heat.',
    inspectionNote: 'Every micro-screw length and torque point is mapped on a magnetic tray so no long screw damages board layers.',
    explodedY: 1.76,
    side: 'right',
  },
  {
    id: 'display_panel',
    order: 5,
    name: 'ProMotion OLED Display Panel',
    shortLabel: 'OLED Display',
    subsystem: 'Visual & Touch Interface',
    role: 'LTPO OLED panel with Ceramic Shield cover glass, capacitive multi-touch digitizer, and Dynamic Island cutout.',
    inspectionNote: 'Tested for touch grid dead zones, OLED burn-in, flex cable tears, and ambient light sensor transfer compatibility.',
    explodedY: 1.28,
    side: 'right',
  },
  {
    id: 'display_flex',
    order: 6,
    name: 'Display Flex & Driver Connectors',
    shortLabel: 'Display Flexes',
    subsystem: 'High-Speed Signal Bus',
    role: 'Dual-layer polyimide ribbon cables carrying 120Hz display data, touch telemetry, and front sensor signals.',
    inspectionNote: 'Inspected under magnification for micro-creases, corrosion on gold pins, or torn grounding foam.',
    explodedY: 0.78,
    side: 'right',
  },
  {
    id: 'battery',
    order: 7,
    name: 'Lithium-Ion Battery Cell',
    shortLabel: 'Battery',
    subsystem: 'Power Delivery & BMS',
    role: 'High-density Li-ion cell with integrated Battery Management System (BMS) monitoring temperature, voltage, and cycle health.',
    inspectionNote: 'Checked for swelling, cycle count, internal resistance, and adhesive release strip condition before safe extraction.',
    explodedY: 0.28,
    side: 'right',
  },
  {
    id: 'logic_board',
    order: 8,
    name: 'Main Logic Board (SoC & NAND)',
    shortLabel: 'Logic Board',
    subsystem: 'Core Compute Architecture',
    role: 'Stacked multi-layer PCB housing the Apple-silicon SoC, unified memory, NAND flash storage, PMIC, and RF baseband.',
    inspectionNote: 'Thermal camera and DC bench power supply trace short circuits, PMIC rails, and interposer solder joints before micro-soldering.',
    explodedY: -0.24,
    side: 'right',
  },
  {
    id: 'taptic_engine',
    order: 9,
    name: 'Taptic Engine Linear Actuator',
    shortLabel: 'Taptic Engine',
    subsystem: 'Haptic Feedback',
    role: 'Electromagnetic linear resonant actuator delivering crisp, low-latency mechanical haptics across system interactions.',
    inspectionNote: 'Tested for loose mounting screws, rattling coil springs, or disconnected lower interconnect flex.',
    explodedY: -0.74,
    side: 'left',
  },
  {
    id: 'top_speaker',
    order: 10,
    name: 'Top Earpiece Speaker & Sensor Module',
    shortLabel: 'Top Speaker',
    subsystem: 'Front Acoustics',
    role: 'Upper stereo acoustic chamber combined with proximity and ambient light sensor assembly.',
    inspectionNote: 'Acoustic mesh is cleaned ultrasonically first; many low-volume complaints resolve without replacing the speaker.',
    explodedY: -1.18,
    side: 'right',
  },
  {
    id: 'middle_frame',
    order: 11,
    name: 'Structural Middle Frame & MagSafe Ring',
    shortLabel: 'Middle Frame',
    subsystem: 'Internal Chassis & Wireless',
    role: 'CNC-milled structural mid-plate integrating wireless charging coil, graphite thermal pads, and internal standoffs.',
    inspectionNote: 'Checked for chassis bend or warpage that can stress OLED glass or crack logic board interposer pads.',
    explodedY: -1.66,
    side: 'right',
  },
  {
    id: 'bottom_speaker',
    order: 12,
    name: 'Bottom Loudspeaker Acoustic Box',
    shortLabel: 'Bottom Speaker',
    subsystem: 'Lower Acoustics',
    role: 'Resonance-tuned speaker enclosure with protective water-resistant mesh and spring contact pads.',
    inspectionNote: 'Inspected for metallic dust accumulation on the magnet diaphragm and cleaned prior to considering module swap.',
    explodedY: -2.14,
    side: 'left',
  },
  {
    id: 'charging_port',
    order: 13,
    name: 'USB-C Charging Port & Mic Flex',
    shortLabel: 'Charging Port',
    subsystem: 'Power & Data I/O',
    role: 'USB-C (or Lightning) dock assembly integrated with primary call microphones and barometer pressure vent.',
    inspectionNote: 'Port lint compaction and pin oxidation are checked under microscope first—a thorough clean often avoids replacement.',
    explodedY: -2.6,
    side: 'right',
  },
  {
    id: 'antenna_modules',
    order: 14,
    name: '5G mmWave & Sub-6 Antenna Modules',
    shortLabel: 'Antenna Modules',
    subsystem: 'RF & Wireless Connectivity',
    role: 'Coaxial antenna arrays and RF feedlines supporting 5G, Wi-Fi, Bluetooth, Ultra Wideband, and NFC.',
    inspectionNote: 'Coaxial U.FL plugs and antenna grounding clips are inspected for impact detachment after drops.',
    explodedY: -3.02,
    side: 'right',
  },
  {
    id: 'titanium_frame',
    order: 15,
    name: 'Grade-5 Titanium Outer Chassis',
    shortLabel: 'Titanium Frame',
    subsystem: 'Exterior Structural Armor',
    role: 'Precision-machined titanium perimeter band bonded to aluminum sub-frame with recessed button switches and IP68 gasket channel.',
    inspectionNote: 'Perimeter seal groove is meticulously stripped of old adhesive and prepped for factory-spec water-resistant re-sealing.',
    explodedY: -3.48,
    side: 'right',
  },
];

export interface ScrollChapter {
  id: string;
  range: [number, number];
  eyebrow: string;
  title: string;
  description: string;
  highlightedIds: IPhonePartId[];
  cameraY: number;
  cameraZ: number;
  explosionTarget: number;
}

export const SCROLL_CHAPTERS: ScrollChapter[] = [
  {
    id: 'overview',
    range: [0, 0.16],
    eyebrow: 'Full Architecture',
    title: 'Precision Layer-by-Layer Engineering',
    description:
      'Every flagship phone packs 15+ tightly layered modules inside an 8.25 mm titanium enclosure. Scroll to separate each layer and inspect what technicians see.',
    highlightedIds: ['back_glass', 'display_panel', 'titanium_frame'],
    cameraY: 0.1,
    cameraZ: 9.2,
    explosionTarget: 0.72,
  },
  {
    id: 'optics',
    range: [0.16, 0.34],
    eyebrow: 'Upper Assembly',
    title: 'Back Glass, Triple Optics & Shield Plates',
    description:
      'Behind the matte rear glass sits the sensor-shift Pro camera array, TrueDepth brackets, and micro-screwed steel EMI shields protecting delicate B2B connectors.',
    highlightedIds: ['back_glass', 'camera_module', 'camera_brackets', 'shield_plate'],
    cameraY: 2.25,
    cameraZ: 6.4,
    explosionTarget: 1.0,
  },
  {
    id: 'display_power',
    range: [0.34, 0.54],
    eyebrow: 'Front & Energy Core',
    title: 'ProMotion OLED Panel & Lithium-Ion Cell',
    description:
      'The OLED display connects via dual high-speed ribbon flexes directly over the battery cell. Safe battery isolation is always the first electrical step inside.',
    highlightedIds: ['display_panel', 'display_flex', 'battery'],
    cameraY: 0.72,
    cameraZ: 6.1,
    explosionTarget: 1.0,
  },
  {
    id: 'compute',
    range: [0.54, 0.75],
    eyebrow: 'Core Compute & Haptics',
    title: 'Main Logic Board, Taptic Engine & Middle Frame',
    description:
      'The stacked PCB houses the SoC, NAND storage, and power management ICs alongside the Taptic Engine and CNC-machined structural middle frame.',
    highlightedIds: ['logic_board', 'taptic_engine', 'top_speaker', 'middle_frame'],
    cameraY: -0.95,
    cameraZ: 6.2,
    explosionTarget: 1.0,
  },
  {
    id: 'io_chassis',
    range: [0.75, 1.0],
    eyebrow: 'Lower I/O & Enclosure',
    title: 'USB-C Port, Acoustic Chambers & Titanium Band',
    description:
      'At the base sit the bottom loudspeaker, modular USB-C dock flex, 5G antenna modules, and the Grade-5 titanium outer frame sealed with a fresh perimeter gasket.',
    highlightedIds: ['bottom_speaker', 'charging_port', 'antenna_modules', 'titanium_frame'],
    cameraY: -2.65,
    cameraZ: 6.5,
    explosionTarget: 1.0,
  },
];
