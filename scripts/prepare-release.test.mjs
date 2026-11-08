import test from "node:test";
import assert from "node:assert/strict";
import { shouldBuildApk } from "./prepare-release.mjs";

const latestApkTag = "v0.1.8";
const latestApkPackage = {
  dependencies: { "@capacitor/core": "^7.6.10" },
  devDependencies: { "@capacitor/cli": "^7.6.10" },
};
const latestApkLock = {
  packages: {
    "node_modules/@capacitor/core": {
      version: "7.6.10",
      resolved: "https://registry.npmjs.org/@capacitor/core/-/core-7.6.10.tgz",
    },
  },
};

function input(overrides = {}) {
  return {
    latestApkTag,
    latestApkPackage,
    currentPackage: latestApkPackage,
    latestApkLock,
    currentLock: latestApkLock,
    nativeFilesSinceApk: ["app/src/App.tsx"],
    ...overrides,
  };
}

test("web-only changes since the last APK publish OTA without rebuilding APK", () => {
  assert.equal(shouldBuildApk(input()), false);
});

test("native plugins added since the last APK rebuild the APK", () => {
  assert.equal(
    shouldBuildApk(
      input({
        latestApkPackage,
        currentPackage: {
          dependencies: {
            ...latestApkPackage.dependencies,
            "@capacitor/preferences": "^7.0.0",
          },
          devDependencies: latestApkPackage.devDependencies,
        },
      }),
    ),
    true,
  );
});

test("a native lock version change since the last APK rebuilds the APK", () => {
  assert.equal(
    shouldBuildApk(
      input({
        currentLock: {
          packages: {
            ...latestApkLock.packages,
            "node_modules/@capacitor/core": {
              version: "7.7.0",
              resolved:
                "https://registry.npmjs.org/@capacitor/core/-/core-7.7.0.tgz",
            },
          },
        },
      }),
    ),
    true,
  );
});

test("Android or Capacitor configuration changes since the last APK rebuild", () => {
  assert.equal(
    shouldBuildApk(
      input({ nativeFilesSinceApk: ["android/app/build.gradle"] }),
    ),
    true,
  );
  assert.equal(
    shouldBuildApk(input({ nativeFilesSinceApk: ["capacitor.config.ts"] })),
    true,
  );
});

test("a first release without an APK tag builds the APK", () => {
  assert.equal(shouldBuildApk(input({ latestApkTag: null })), true);
});
