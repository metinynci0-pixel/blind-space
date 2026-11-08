import type { FC } from "react";

export interface HomeScreenProps {
  onSectorExit: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  updateAvailable?: boolean;
  onUpdateApk?: () => void;
}

const HomeScreen: FC<HomeScreenProps> = ({
  onSectorExit,
  onOpenSettings,
  onOpenHelp,
  updateAvailable = false,
  onUpdateApk,
}) => (
  <main className="blind-screen blind-screen--home">
    <section className="blind-panel blind-panel--home" aria-labelledby="home-title">
      <h1 className="screen-title" id="home-title" tabIndex={-1}>
        Ana menü
      </h1>
      <p className="blind-brand">Blind Space</p>

      <nav className="home-actions" aria-label="Ana menü">
        <button
          id="open-sector"
          className="blind-button blind-button--primary"
          type="button"
          aria-label="Sektöre çık"
          onClick={onSectorExit}
        >
          Sektöre çık
        </button>
        <button
          id="open-settings"
          className="blind-button"
          type="button"
          onClick={onOpenSettings}
        >
          Ayarlar
        </button>
        <button
          id="open-help"
          className="blind-button"
          type="button"
          onClick={onOpenHelp}
        >
          Yardım
        </button>
      </nav>

      {updateAvailable && onUpdateApk && (
        <button
          className="blind-update"
          type="button"
          aria-label="Yeni sürüm var. APK'yı indir"
          onClick={onUpdateApk}
        >
          Yeni sürüm var — APK’yı indir
        </button>
      )}
    </section>
  </main>
);

export default HomeScreen;
