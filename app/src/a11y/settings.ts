export type DirectionAnnouncementFormat = "clock" | "left-right" | "degrees";

export interface AccessibilitySettings {
  speechRate: number;
  musicVolume: number;
  effectsVolume: number;
  directionVolume: number;
  speechVolume: number;
  vibrationEnabled: boolean;
  vibrationIntensity: number;
  directionFormat: DirectionAnnouncementFormat;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  speechRate: 1,
  musicVolume: 60,
  effectsVolume: 80,
  directionVolume: 80,
  speechVolume: 90,
  vibrationEnabled: true,
  vibrationIntensity: 50,
  directionFormat: "clock",
};

export const ACCESSIBILITY_SETTINGS_KEY = "blind-space-accessibility-settings";
