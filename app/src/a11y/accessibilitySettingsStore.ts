import { Preferences } from "@capacitor/preferences";
import {
  ACCESSIBILITY_SETTINGS_KEY,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  type AccessibilitySettings,
} from "./settings";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isDirectionFormat(
  value: unknown,
): value is AccessibilitySettings["directionFormat"] {
  return value === "clock" || value === "left-right" || value === "degrees";
}

export async function loadAccessibilitySettings(): Promise<AccessibilitySettings> {
  const { value } = await Preferences.get({ key: ACCESSIBILITY_SETTINGS_KEY });
  if (value === null) {
    return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("Kayıtlı erişilebilirlik ayarları okunamadı.");
  }

  if (!isRecord(parsed)) {
    throw new Error("Kayıtlı erişilebilirlik ayarlarının biçimi geçersiz.");
  }

  const settings = {
    ...DEFAULT_ACCESSIBILITY_SETTINGS,
    ...parsed,
  } as AccessibilitySettings;
  const numericValues = [
    settings.speechRate,
    settings.musicVolume,
    settings.effectsVolume,
    settings.directionVolume,
    settings.speechVolume,
    settings.vibrationIntensity,
  ];

  if (
    !numericValues.every((item) => typeof item === "number" && Number.isFinite(item)) ||
    typeof settings.vibrationEnabled !== "boolean" ||
    !isDirectionFormat(settings.directionFormat)
  ) {
    throw new Error("Kayıtlı erişilebilirlik ayarlarının değeri geçersiz.");
  }

  if (
    settings.speechRate < 0.5 ||
    settings.speechRate > 2 ||
    [
      settings.musicVolume,
      settings.effectsVolume,
      settings.directionVolume,
      settings.speechVolume,
      settings.vibrationIntensity,
    ].some((item) => item < 0 || item > 100)
  ) {
    throw new Error("Kayıtlı erişilebilirlik ayarları izin verilen aralıkta değil.");
  }

  return settings;
}

export async function saveAccessibilitySettings(
  settings: AccessibilitySettings,
): Promise<void> {
  await Preferences.set({
    key: ACCESSIBILITY_SETTINGS_KEY,
    value: JSON.stringify(settings),
  });
}
