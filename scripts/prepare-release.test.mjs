import test from "node:test";
import assert from "node:assert/strict";
import { shouldBuildApk } from "./prepare-release.mjs";

const previousManifest = { nativeVersion: "0.1.8" };
const previousPackage = {
  dependencies: { "@capacitor/core": "^7.6.10" },
  devDependencies: { "@capacitor/cli": "^7.6.10" },
};
const previousLock = {
  packages: {
    "node_modules/@capacitor/core": {
      version: "7.6.10",
      resolved: "https://registry.npmjs.org/@capacitor/core/-/core-7.6.10.tgz",
    },
  },
};

function input(overrides = {}) {
  return {
    previousPackage,
    currentPackage: previousPackage,
    previousLock,
    currentLock: previousLock,
    previousManifest,
    changedFiles: ["app/src/App.tsx"],
    ...overrides,
  };
}

test("web-only changes publish OTA without rebuilding the APK", () => {
  assert.equal(shouldBuildApk(input()), false);
});

test("adding a native Capacitor plugin rebuilds the APK", () => {
  assert.equal(
    shouldBuildApk(
      input({
        currentPackage: {
          dependencies: {
            ...previousPackage.dependencies,
            "@capacitor/preferences": "^7.0.0",
          },
          devDependencies: previousPackage.devDependencies,
        },
      }),
    ),
    true,
  );
});

test("a resolved native plugin version change rebuilds the APK", () => {
  assert.equal(
    shouldBuildApk(
      input({
        currentLock: {
          packages: {
            ...previousLock.packages,
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

test("Android or Capacitor configuration changes rebuild the APK", () => {
  assert.equal(
    shouldBuildApk(input({ changedFiles: ["android/app/build.gradle"] })),
    true,
  );
  assert.equal(
    shouldBuildApk(input({ changedFiles: ["capacitor.config.ts"] })),
    true,
  );
});

test("a first release without existing metadata builds the APK", () => {
  assert.equal(
    shouldBuildApk(input({ previousManifest: null })),
    true,
  );
});
