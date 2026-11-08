import type { FC } from "react";
import type {
  AccessibilitySettings,
  DirectionAnnouncementFormat,
} from "../a11y/settings";

export interface SettingsScreenProps {
  settings: AccessibilitySettings;
  onSettingsChange: (changes: Partial<AccessibilitySettings>) => void;
  onLeftEarTest: () => void;
  onRightEarTest: () => void;
  onBack: () => void;
}

interface RangeControlProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  valueText: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}

const RangeControl: FC<RangeControlProps> = ({
  id, label, value, min, max, step, valueText, disabled = false, onChange,
}) => (
  <div className={`setting-control${disabled ? " setting-control--disabled" : ""}`}>
    <div className="setting-control__heading">
      <label htmlFor={id}>{label}</label>
       <output id={`${id}-value`} htmlFor={id}>{valueText}</output>
    </div>
    <input
      id={id}
      aria-label={label}
      aria-valuetext={valueText}
      aria-describedby={`${id}-value`}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.currentTarget.value))}
    />
  </div>
);

const SettingsScreen: FC<SettingsScreenProps> = ({
  settings,
  onSettingsChange,
  onLeftEarTest,
  onRightEarTest,
  onBack,
}) => {
  const directionOptions: { value: DirectionAnnouncementFormat; label: string }[] = [
    { value: "clock", label: "Saat yönü" },
    { value: "left-right", label: "Sol / sağ" },
    { value: "degrees", label: "Derece" },
  ];

  return (
    <main className="blind-screen">
      <section className="blind-panel blind-panel--wide" aria-labelledby="settings-title">
        <header className="screen-header">
          <button className="blind-button blind-button--back" type="button" onClick={onBack}>
            Ana menü
          </button>
          <div>
            <p className="blind-kicker">Kendi ses alanın</p>
            <h1 className="screen-title" id="settings-title" tabIndex={-1}>
              Ayarlar
            </h1>
          </div>
        </header>

        <div className="settings-grid">
          <section className="settings-section" aria-labelledby="sound-title">
            <h2 id="sound-title">Ses dengesi</h2>
            <RangeControl
              id="speech-rate"
              label="Konuşma hızı"
              value={settings.speechRate}
              min={0.5}
              max={2}
              step={0.1}
              valueText={`${settings.speechRate.toFixed(1)}×`}
              onChange={(speechRate) => onSettingsChange({ speechRate })}
            />
            <RangeControl
              id="music-volume"
              label="Müzik"
              value={settings.musicVolume}
              min={0}
              max={100}
              step={1}
              valueText={`%${settings.musicVolume}`}
              onChange={(musicVolume) => onSettingsChange({ musicVolume })}
            />
            <RangeControl
              id="effects-volume"
              label="Efektler"
              value={settings.effectsVolume}
              min={0}
              max={100}
              step={1}
              valueText={`%${settings.effectsVolume}`}
              onChange={(effectsVolume) => onSettingsChange({ effectsVolume })}
            />
            <RangeControl
              id="direction-volume"
              label="Yön sesleri"
              value={settings.directionVolume}
              min={0}
              max={100}
              step={1}
              valueText={`%${settings.directionVolume}`}
              onChange={(directionVolume) => onSettingsChange({ directionVolume })}
            />
            <RangeControl
              id="speech-volume"
              label="Konuşma sesi"
              value={settings.speechVolume}
              min={0}
              max={100}
              step={1}
              valueText={`%${settings.speechVolume}`}
              onChange={(speechVolume) => onSettingsChange({ speechVolume })}
            />
          </section>

          <section className="settings-section" aria-labelledby="orientation-title">
            <h2 id="orientation-title">Yön ve dokunsal bildirim</h2>
            <fieldset className="direction-picker">
              <legend>Yön anlatım biçimi</legend>
              <div className="direction-options">
                {directionOptions.map((option) => (
                  <label className="choice-option" key={option.value}>
                    <input
                      type="radio"
                      name="direction-format"
                      value={option.value}
                      checked={settings.directionFormat === option.value}
                      onChange={() => onSettingsChange({ directionFormat: option.value })}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="toggle-control">
              <input
                type="checkbox"
                checked={settings.vibrationEnabled}
                onChange={(event) => onSettingsChange({ vibrationEnabled: event.currentTarget.checked })}
              />
              <span className="toggle-control__text">
                <strong>Titreşim</strong>
                <small>{settings.vibrationEnabled ? "Açık" : "Kapalı"}</small>
              </span>
            </label>
            <RangeControl
              id="vibration-intensity"
              label="Titreşim şiddeti"
              value={settings.vibrationIntensity}
              min={0}
              max={100}
              step={1}
              valueText={`%${settings.vibrationIntensity}`}
              disabled={!settings.vibrationEnabled}
              onChange={(vibrationIntensity) => onSettingsChange({ vibrationIntensity })}
            />

            <div className="test-controls" aria-label="Ses testleri">
              <h3>Ses testleri</h3>
              <button className="blind-button blind-button--compact" type="button" onClick={onLeftEarTest}>
                Sol kulak testi
              </button>
              <button className="blind-button blind-button--compact" type="button" onClick={onRightEarTest}>
                Sağ kulak testi
              </button>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default SettingsScreen;
