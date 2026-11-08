import type { FC } from "react";

export interface HelpScreenProps {
  onBack: () => void;
}

const HelpScreen: FC<HelpScreenProps> = ({ onBack }) => (
  <main className="blind-screen">
    <section className="blind-panel blind-panel--help" aria-labelledby="help-title">
      <header className="screen-header">
        <button className="blind-button blind-button--back" type="button" onClick={onBack}>
          Ana menü
        </button>
        <div>
          <p className="blind-kicker">Blind Space</p>
          <h1 className="screen-title" id="help-title" tabIndex={-1}>
            Yardım
          </h1>
        </div>
      </header>
      <div className="help-copy">
        <p>Oyunu sesleri dinleyerek ve yön bildirimlerini takip ederek oynarsın.</p>
        <p>Ana menüde “Sektöre çık” şu an yakında bilgisi verir. Ayarlar bölümünden ses düzeylerini, konuşma hızını ve yön anlatım biçimini düzenleyebilirsin.</p>
        <p>Yönler saat yönü, sol / sağ ya da derece olarak anlatılabilir. Kulak testleri sesin iki tarafta da duyulup duyulmadığını kontrol etmene yardımcı olur.</p>
      </div>
    </section>
  </main>
);

export default HelpScreen;
