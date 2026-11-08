import { playSound } from "./audio/soundEngine";

function App() {
  return (
    <main className="stage-zero">
      <div className="stage-zero__panel">
        <h1 className="stage-zero__title" data-testid="text-title">
          Blind Space
        </h1>
        <button
          className="stage-zero__button stage-zero__button--primary"
          type="button"
          aria-label="Başla — oyunu başlat"
          data-testid="button-start"
          onClick={() => undefined}
        >
          Başla
        </button>
        <button
          className="stage-zero__button"
          type="button"
          aria-label="Sol kulak testi — sol kulak ses testini başlat"
          data-testid="button-left-ear-test"
          onClick={() => {
            void playSound(227).catch((error: unknown) => {
              console.error("Sol kulak ses testi çalınamadı.", error);
            });
          }}
        >
          Sol kulak testi
        </button>
        <button
          className="stage-zero__button"
          type="button"
          aria-label="Sağ kulak testi — sağ kulak ses testini başlat"
          data-testid="button-right-ear-test"
          onClick={() => {
            void playSound(228).catch((error: unknown) => {
              console.error("Sağ kulak ses testi çalınamadı.", error);
            });
          }}
        >
          Sağ kulak testi
        </button>
      </div>
    </main>
  );
}

export default App;
