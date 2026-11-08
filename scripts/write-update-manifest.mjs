import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const contentVersion = process.env.CONTENT_VERSION;
const nativeVersion = process.env.NATIVE_VERSION;
const otaTag = process.env.OTA_TAG;
const repository = process.env.GITHUB_REPOSITORY;
const checksum = process.env.BUNDLE_CHECKSUM;
const outputPath = process.argv[2] ?? "updates/latest.json";

if (
  !contentVersion ||
  !nativeVersion ||
  !otaTag ||
  !repository ||
  !checksum ||
  !/^[a-f0-9]{64}$/i.test(checksum)
) {
  throw new Error("Canlı güncelleme manifest bilgileri eksik.");
}

const manifest = {
  schemaVersion: 1,
  contentVersion,
  nativeVersion,
  bundleUrl: `https://github.com/${repository}/releases/download/${otaTag}/blind-space-update.zip`,
  checksum,
};

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
