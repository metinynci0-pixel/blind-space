import { useCallback, useEffect, useRef, useState } from "react";
import { Browser } from "@capacitor/browser";
import { Haptics } from "@capacitor/haptics";
import { ScreenReader } from "@capacitor/screen-reader";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import HelpScreen from "./screens/HelpScreen";
import HomeScreen from "./screens/HomeScreen";
import SettingsScreen from "./screens/SettingsScreen";
import {
  loadAccessibilitySettings,
  saveAccessibilitySettings,
} from "./a11y/accessibilitySettingsStore";
import {
  NotificationQueue,
  type NotificationPriority,
} from "./a11y/notificationQueue";
import {
  DEFAULT_ACCESSIBILITY_SETTINGS,
  type AccessibilitySettings,
} from "./a11y/settings";
import { playSound } from "./audio/soundEngine";
import { CONTENT_VERSION, NATIVE_VERSION } from "./appVersion";
import {
  compareVersions,
  getInstalledContentVersion,
  getUpdateManifest,
  isNativeApp,
  STABLE_APK_URL,
} from "./updates/updateService";

type Screen = "home" | "settings" | "help";

interface LiveAnnouncement {
  message: string;
  priority: NotificationPriority;
  sequence: number;
}

const SCREEN_TITLES: Record<Screen, string> = {
  home: "Ana menü",
  settings: "Ayarlar",
  help: "Yardım",
};

const SCREEN_HEADING_IDS: Record<Screen, string> = {
  home: "home-title",
  settings: "settings-title",
  help: "help-title",
};

function App() {
  const [screen, setScreen] = useState<Screen>("home");
  const [settings, setSettings] = useState<AccessibilitySettings>({
    ...DEFAULT_ACCESSIBILITY_SETTINGS,
  });
  const [settingsReady, setSettingsReady] = useState(false);
  const [talkBackEnabled, setTalkBackEnabled] = useState(false);
  const [screenReaderReady, setScreenReaderReady] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState<LiveAnnouncement>({
    message: "",
    priority: 4,
    sequence: 0,
  });

  const settingsRef = useRef(settings);
  const talkBackRef = useRef(false);
  const lastSavedSettingsRef = useRef(
    JSON.stringify(DEFAULT_ACCESSIBILITY_SETTINGS),
  );
  const previousScreenRef = useRef<Screen>("home");
  const openerRef = useRef<"settings" | "help" | null>(null);
  const liveSequenceRef = useRef(0);
  const notificationQueueRef = useRef(new NotificationQueue());
  const readerReadyPromiseRef = useRef<Promise<void> | null>(null);
  const resolveReaderReadyRef = useRef<(() => void) | null>(null);

  if (readerReadyPromiseRef.current === null) {
    readerReadyPromiseRef.current = new Promise<void>((resolve) => {
      resolveReaderReadyRef.current = resolve;
    });
  }

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const getAnnouncementState = useCallback(
    () => ({
      talkBackEnabled: talkBackRef.current,
      speechRate: settingsRef.current.speechRate,
      speechVolume: settingsRef.current.speechVolume,
    }),
    [],
  );

  const publishLiveAnnouncement = useCallback(
    (message: string, priority: NotificationPriority) => {
      const sequence = ++liveSequenceRef.current;
      setLiveAnnouncement({ message: "", priority, sequence });
      window.setTimeout(() => {
        setLiveAnnouncement({ message, priority, sequence });
      }, 60);
    },
    [],
  );

  const announce = useCallback(
    async (message: string, priority: NotificationPriority): Promise<void> => {
      await readerReadyPromiseRef.current;
      await notificationQueueRef.current.enqueue(
        message,
        priority,
        getAnnouncementState,
        publishLiveAnnouncement,
      );
    },
    [getAnnouncementState, publishLiveAnnouncement],
  );

  useEffect(() => {
    let active = true;
    let listenerHandle: { remove: () => Promise<void> } | undefined;
    const updateReaderState = (enabled: boolean) => {
      talkBackRef.current = enabled;
      setTalkBackEnabled(enabled);
    };

    void ScreenReader.addListener("stateChange", ({ value }) => {
      if (active) {
        updateReaderState(value);
      }
    })
      .then((handle) => {
        if (active) {
          listenerHandle = handle;
        } else {
          void handle.remove();
        }
      })
      .catch((error: unknown) => {
        console.warn("Ekran okuyucu değişiklikleri izlenemedi.", error);
      });

    void ScreenReader.isEnabled()
      .then(({ value }) => {
        if (active) {
          updateReaderState(value);
        }
      })
      .catch((error: unknown) => {
        console.info("Bu ortamda ekran okuyucu algılanamadı.", error);
        if (active) {
          updateReaderState(false);
        }
      })
      .finally(() => {
        if (active) {
          setScreenReaderReady(true);
          resolveReaderReadyRef.current?.();
        }
      });

    return () => {
      active = false;
      void listenerHandle?.remove();
    };
  }, []);

  useEffect(() => {
    let active = true;
    void loadAccessibilitySettings()
      .then((loadedSettings) => {
        if (!active) {
          return;
        }
        settingsRef.current = loadedSettings;
        setSettings(loadedSettings);
        lastSavedSettingsRef.current = JSON.stringify(loadedSettings);
      })
      .catch((error: unknown) => {
        console.error("Erişilebilirlik ayarları yüklenemedi.", error);
        if (!active) {
          return;
        }
        const defaults = { ...DEFAULT_ACCESSIBILITY_SETTINGS };
        settingsRef.current = defaults;
        setSettings(defaults);
        lastSavedSettingsRef.current = JSON.stringify(defaults);
        void announce(
          "Kayıtlı ayarlar yüklenemedi. Varsayılan ayarlar kullanılıyor.",
          3,
        );
      })
      .finally(() => {
        if (active) {
          setSettingsReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [announce]);

  useEffect(() => {
    if (!settingsReady) {
      return;
    }

    const serializedSettings = JSON.stringify(settings);
    if (serializedSettings === lastSavedSettingsRef.current) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveAccessibilitySettings(settings)
        .then(() => {
          lastSavedSettingsRef.current = serializedSettings;
        })
        .catch((error: unknown) => {
          console.error("Erişilebilirlik ayarları kaydedilemedi.", error);
          void announce("Ayarlar telefona kaydedilemedi.", 3);
        });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [announce, settings, settingsReady]);

  useEffect(() => {
    if (!isNativeApp()) {
      return;
    }

    void CapacitorUpdater.notifyAppReady().catch((error: unknown) => {
      console.error("Canlı güncelleme motoru hazır durumu bildiremedi.", error);
    });
  }, []);

  useEffect(() => {
    if (!screenReaderReady) {
      return;
    }

    const previousScreen = previousScreenRef.current;
    previousScreenRef.current = screen;
    const animationFrame = window.requestAnimationFrame(() => {
      if (screen === "home" && previousScreen !== "home") {
        const openerId =
          openerRef.current === "settings" ? "open-settings" : "open-help";
        document.getElementById(openerId)?.focus({ preventScroll: true });
        return;
      }

      document
        .getElementById(SCREEN_HEADING_IDS[screen])
        ?.focus({ preventScroll: true });

      if (!talkBackRef.current) {
        void announce(SCREEN_TITLES[screen], 4);
      }
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [announce, screen, screenReaderReady]);

  useEffect(() => {
    if (!settingsReady || !screenReaderReady || !isNativeApp()) {
      return;
    }

    let active = true;
    const checkForUpdates = async () => {
      try {
        const manifest = await getUpdateManifest();
        if (!active) {
          return;
        }

        if (compareVersions(manifest.nativeVersion, NATIVE_VERSION) > 0) {
          setUpdateAvailable(true);
          void announce("Yeni sürüm var.", 2);
          return;
        }

        setUpdateAvailable(false);
        const installedVersion =
          await getInstalledContentVersion(CONTENT_VERSION);
        if (
          compareVersions(manifest.contentVersion, installedVersion) <= 0 ||
          !active
        ) {
          return;
        }

        const bundle = await CapacitorUpdater.download({
          version: manifest.contentVersion,
          url: manifest.bundleUrl,
          checksum: manifest.checksum,
        });
        if (!active) {
          return;
        }

        await announce("Oyun güncellendi. Uygulama yeniden başlatılıyor.", 3);
        await CapacitorUpdater.set({ id: bundle.id });
      } catch (error) {
        console.error("Oyun içeriği güncellenemedi.", error);
        if (active) {
          void announce(
            "Oyun güncellemesi indirilemedi. Mevcut oyun korunuyor.",
            3,
          );
        }
      }
    };

    void checkForUpdates();
    return () => {
      active = false;
    };
  }, [announce, screenReaderReady, settingsReady]);

  const openSettings = useCallback(() => {
    openerRef.current = "settings";
    setScreen("settings");
  }, []);

  const openHelp = useCallback(() => {
    openerRef.current = "help";
    setScreen("help");
  }, []);

  const returnToHome = useCallback(() => {
    setScreen("home");
  }, []);

  const updateSettings = useCallback(
    (changes: Partial<AccessibilitySettings>) => {
      const nextSettings = { ...settingsRef.current, ...changes };
      settingsRef.current = nextSettings;
      setSettings(nextSettings);

      const vibrationWasRequested =
        changes.vibrationEnabled === true ||
        typeof changes.vibrationIntensity === "number";
      if (
        vibrationWasRequested &&
        nextSettings.vibrationEnabled &&
        nextSettings.vibrationIntensity > 0
      ) {
        void Haptics.vibrate({
          duration: Math.max(
            1,
            Math.round(nextSettings.vibrationIntensity * 3),
          ),
        }).catch((error: unknown) => {
          console.warn("Titreşim bu cihazda kullanılamıyor.", error);
        });
      }
    },
    [],
  );

  const runEarTest = useCallback(
    (soundId: 227 | 228, earName: "sol" | "sağ") => {
      const volume = settingsRef.current.directionVolume / 100;
      if (volume === 0) {
        void announce("Yön seslerinin düzeyi sıfır.", 2);
        return;
      }

      void playSound(soundId, volume).catch((error: unknown) => {
        console.error(`${earName} kulak testi çalıştırılamadı.`, error);
        void announce(`${earName} kulak testi çalıştırılamadı.`, 1);
      });
    },
    [announce],
  );

  const openApkDownload = useCallback(() => {
    void Browser.open({ url: STABLE_APK_URL }).catch((error: unknown) => {
      console.error("APK indirme bağlantısı açılamadı.", error);
      void announce("APK indirme bağlantısı açılamadı.", 2);
    });
  }, [announce]);

  const visibleScreen =
    screen === "home" ? (
      <HomeScreen
        onSectorExit={() => {
          void announce("Sektöre çık yakında kullanılabilir.", 2);
        }}
        onOpenSettings={openSettings}
        onOpenHelp={openHelp}
        updateAvailable={updateAvailable}
        onUpdateApk={openApkDownload}
      />
    ) : screen === "settings" ? (
      <SettingsScreen
        settings={settings}
        onSettingsChange={updateSettings}
        onLeftEarTest={() => runEarTest(227, "sol")}
        onRightEarTest={() => runEarTest(228, "sağ")}
        onBack={returnToHome}
      />
    ) : (
      <HelpScreen onBack={returnToHome} />
    );

  return (
    <>
      {visibleScreen}
      <div
        className="screen-reader-live-region"
        role="status"
        aria-live={
          talkBackEnabled && liveAnnouncement.priority > 1 ? "polite" : "off"
        }
        aria-atomic="true"
      >
        {talkBackEnabled && liveAnnouncement.priority > 1
          ? liveAnnouncement.message
          : ""}
      </div>
      <div
        className="screen-reader-live-region"
        role="alert"
        aria-live={
          talkBackEnabled && liveAnnouncement.priority <= 1
            ? "assertive"
            : "off"
        }
        aria-atomic="true"
      >
        {talkBackEnabled && liveAnnouncement.priority <= 1
          ? liveAnnouncement.message
          : ""}
      </div>
    </>
  );
}

export default App;
