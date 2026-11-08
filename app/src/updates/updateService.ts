import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";

export const STABLE_APK_URL =
  "https://github.com/metinynci0-pixel/blind-space/releases/latest/download/blind-space.apk";
const UPDATE_MANIFEST_URL =
  "https://raw.githubusercontent.com/metinynci0-pixel/blind-space/main/updates/latest.json";

export interface UpdateManifest {
  schemaVersion: 1;
  contentVersion: string;
  nativeVersion: string;
  bundleUrl: string;
  checksum: string;
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export function compareVersions(left: string, right: string): number {
  const parse = (version: string) => {
    const cleanVersion = version.replace(/^v/, "");
    if (!/^\d+\.\d+\.\d+$/.test(cleanVersion)) {
      throw new Error(`Sürüm numarası geçersiz: ${version}`);
    }
    return cleanVersion.split(".").map(Number);
  };

  const leftParts = parse(left);
  const rightParts = parse(right);
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) {
      return leftParts[index] > rightParts[index] ? 1 : -1;
    }
  }
  return 0;
}

export async function getUpdateManifest(): Promise<UpdateManifest> {
  const response = await fetch(`${UPDATE_MANIFEST_URL}?cache=${Date.now()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Güncelleme bilgisi alınamadı: HTTP ${response.status}.`);
  }

  const candidate: unknown = await response.json();
  if (typeof candidate !== "object" || candidate === null) {
    throw new Error("Güncelleme bilgisi geçersiz.");
  }

  const manifest = candidate as Partial<UpdateManifest>;
  if (
    manifest.schemaVersion !== 1 ||
    typeof manifest.contentVersion !== "string" ||
    typeof manifest.nativeVersion !== "string" ||
    typeof manifest.bundleUrl !== "string" ||
    typeof manifest.checksum !== "string" ||
    !/^[a-f0-9]{64}$/i.test(manifest.checksum)
  ) {
    throw new Error("Güncelleme bilgisi eksik.");
  }

  compareVersions(manifest.contentVersion, manifest.contentVersion);
  compareVersions(manifest.nativeVersion, manifest.nativeVersion);

  const bundleUrl = new URL(manifest.bundleUrl);
  if (
    bundleUrl.protocol !== "https:" ||
    bundleUrl.hostname !== "github.com" ||
    !bundleUrl.pathname.startsWith(
      "/metinynci0-pixel/blind-space/releases/download/ota-v",
    )
  ) {
    throw new Error("Güncelleme paketi için sunucu adresi geçersiz.");
  }

  return manifest as UpdateManifest;
}

export async function getInstalledContentVersion(
  builtInVersion: string,
): Promise<string> {
  try {
    const current = await CapacitorUpdater.current();
    const currentVersion = current.bundle.version;
    if (!currentVersion || currentVersion === "builtin") {
      return builtInVersion;
    }

    compareVersions(currentVersion, builtInVersion);
    return currentVersion;
  } catch (error) {
    console.warn("Etkin içerik sürümü okunamadı; APK sürümü kullanılacak.", error);
    return builtInVersion;
  }
}
