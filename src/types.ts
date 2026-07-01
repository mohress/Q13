export interface Task {
  id: string;
  title: string;
  time: string; // HH:MM (24h)
  endTime: string; // HH:MM (24h)
  duration: number; // minutes
  description: string;
  priority: "high" | "medium" | "low";
  isAutoPrintEnabled?: boolean;
}

export interface PrinterSettings {
  connected: boolean;
  deviceName: string | null;
  lineWidth: number; // 32 for 58mm, 48 for 80mm
  density: number; // 1 to 5
  headerText: string;
  footerText: string;
  autoPrintOnlyHigh: boolean;
  paperFeedLines: number;
  printMode: "text" | "raster";
  bleChunkSize?: number; // Chunk size in bytes (e.g. 20, 40, 64)
  bleDelayMs?: number; // Delay between chunks in ms
  bleStripeMode?: "continuous" | "stripes"; // Printing graphics mode (all at once vs stripes)
  bleStripeHeight?: number; // Height of each stripe if in stripes mode
  graphicsProtocol?: "gs_v_0" | "esc_asterisk"; // Standard Raster vs Legacy Bit Image
  hasCutter?: boolean; // Set to true if the printer has a physical automatic cutter
}

export interface PrintedSlip {
  id: string;
  title: string;
  timeStr: string;
  endTimeStr: string;
  priority: "high" | "medium" | "low";
  description: string;
  timestamp: string;
  textLines: string[];
}
