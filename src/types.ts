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
