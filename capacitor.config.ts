import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.blindspace.game",
  appName: "Blind Space",
  webDir: "app/dist",
  plugins: {
    CapacitorUpdater: {
      autoUpdate: "off",
      statsUrl: "",
      version: process.env.VITE_CONTENT_VERSION ?? "0.1.0",
    },
  },
};

export default config;
