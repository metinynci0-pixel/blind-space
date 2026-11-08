import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import path from "node:path";

function readGitFile(ref, filePath) {
  try {
    return execFileSync("git", ["show", `${ref}:${filePath}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null;
  }
}

function parseJson(value) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function nativeDependencies(packageJson) {
  const allDependencies = {
    ...packageJson?.dependencies,
    ...packageJson?.devDependencies,
  };
  return Object.fromEntries(
    Object.entries(allDependencies)
      .filter(([name]) => name.toLowerCase().includes("capacitor"))
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

function nativeLockEntries(packageLock) {
  const packages = packageLock?.packages ?? {};
  return Object.fromEntries(
    Object.entries(packages)
      .filter(([name]) =>
        /node_modules\/(?:@capacitor\/|@capacitor-community\/|@capgo\/)/.test(
          name,
        ),
      )
      .map(([name, entry]) => [
        name,
        { version: entry.version, resolved: entry.resolved },
      ])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
}

export function shouldBuildApk({
  latestApkTag,
  latestApkPackage,
  currentPackage,
  latestApkLock,
  currentLock,
  nativeFilesSinceApk,
}) {
  if (!latestApkTag || !latestApkPackage) {
    return true;
  }

  if (
    JSON.stringify(nativeDependencies(latestApkPackage)) !==
    JSON.stringify(nativeDependencies(currentPackage))
  ) {
    return true;
  }

  if (
    JSON.stringify(nativeLockEntries(latestApkLock)) !==
    JSON.stringify(nativeLockEntries(currentLock))
  ) {
    return true;
  }

  return nativeFilesSinceApk.some(
    (filePath) =>
      /^(android|ios)\//.test(filePath) ||
      filePath === "capacitor.config.ts" ||
      filePath === "updates/update-protocol-version.txt" ||
      filePath.startsWith("patches/"),
  );
}

function main() {
  const runNumber = Number(process.env.GITHUB_RUN_NUMBER);
  if (!Number.isSafeInteger(runNumber) || runNumber < 1) {
    throw new Error("GITHUB_RUN_NUMBER eksik veya geçersiz.");
  }

  const currentVersion = `0.1.${runNumber}`;
  const currentPackage = parseJson(readGitFile("HEAD", "package.json"));
  const currentLock = parseJson(readGitFile("HEAD", "package-lock.json"));
  const previousManifest = parseJson(
    readGitFile("origin/main", "updates/latest.json"),
  );
  const tags = execFileSync(
    "git",
    ["tag", "--list", "v*", "--sort=-version:refname"],
    { encoding: "utf8" },
  )
    .split("\n")
    .filter((tag) => /^v\d+\.\d+\.\d+$/.test(tag));
  const latestApkTag = tags[0] ?? null;
  const latestApkPackage = latestApkTag
    ? parseJson(readGitFile(latestApkTag, "package.json"))
    : null;
  const latestApkLock = latestApkTag
    ? parseJson(readGitFile(latestApkTag, "package-lock.json"))
    : null;
  const nativeFilesSinceApk = latestApkTag
    ? execFileSync("git", ["diff", "--name-only", latestApkTag, "HEAD"], {
        encoding: "utf8",
      })
        .split("\n")
        .filter(Boolean)
    : [];

  const needsApk = shouldBuildApk({
    latestApkTag,
    latestApkPackage,
    currentPackage,
    latestApkLock,
    currentLock,
    nativeFilesSinceApk,
  });
  const nativeVersion = needsApk
    ? currentVersion
    : latestApkTag?.slice(1) ?? previousManifest?.nativeVersion ?? currentVersion;
  const output = [
    `needs_apk=${needsApk}`,
    `content_version=${currentVersion}`,
    `native_version=${nativeVersion}`,
    `ota_tag=ota-v${currentVersion}`,
    `apk_tag=v${currentVersion}`,
  ].join("\n");

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${output}\n`);
  } else {
    console.log(output);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  main();
}
