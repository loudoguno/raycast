export interface MenuBarItem {
  title: string;
  processName: string;
  bundleId: string | null;
  position: [number, number];
  size: [number, number];
  pid: number;
  menuBarIndex: number;
}

export interface ScanResult {
  permitted: boolean;
  items: MenuBarItem[];
}
