import { useEffect, useRef } from "react";
import type { FC } from "react";
import type { SectorObject } from "../core/sector";
import "./SectorScreen.css";

export interface SectorScreenProps {
  sectorName: string;
  worldSize: number;
  ship: { x: number; y: number; headingDegrees: number };
  objects: SectorObject[];
  onStatus: () => void;
  onRadar: () => void;
  onTurnLeft: () => void;
  onMoveForward: () => void;
  onTurnRight: () => void;
  onBack: () => void;
}

interface SectorMapProps {
  worldSize: number;
  ship: SectorScreenProps["ship"];
  objects: SectorObject[];
}

const disabledReasonId = "sector-stage-two-disabled";

const SectorMap: FC<SectorMapProps> = ({ worldSize, ship, objects }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef({ worldSize, ship, objects });
  sceneRef.current = { worldSize, ship, objects };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);

      const { worldSize: size, ship: currentShip, objects: mapObjects } =
        sceneRef.current;
      const width = rect.width;
      const height = rect.height;
      const inset = 22;
      const mapWidth = width - inset * 2;
      const mapHeight = height - inset * 2;
      const toPoint = (x: number, y: number) => ({
        x: inset + (x / size) * mapWidth,
        y: inset + (y / size) * mapHeight,
      });

      context.clearRect(0, 0, width, height);
      const backdrop = context.createLinearGradient(0, 0, width, height);
      backdrop.addColorStop(0, "#102b3a");
      backdrop.addColorStop(1, "#081a28");
      context.fillStyle = backdrop;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(114, 215, 226, 0.12)";
      context.lineWidth = 1;
      for (let step = 0; step <= 4; step += 1) {
        const x = inset + (mapWidth * step) / 4;
        const y = inset + (mapHeight * step) / 4;
        context.beginPath();
        context.moveTo(x, inset);
        context.lineTo(x, height - inset);
        context.stroke();
        context.beginPath();
        context.moveTo(inset, y);
        context.lineTo(width - inset, y);
        context.stroke();
      }
      context.strokeStyle = "rgba(114, 215, 226, 0.32)";
      context.strokeRect(inset, inset, mapWidth, mapHeight);

      mapObjects.forEach((object) => {
        const point = toPoint(object.x, object.y);
        if (object.kind === "star") {
          context.beginPath();
          context.arc(point.x, point.y, 2.8, 0, Math.PI * 2);
          context.fillStyle = "#b4e8ee";
          context.fill();
          return;
        }

        if (object.kind === "ferrit") {
          context.beginPath();
          context.arc(point.x, point.y, 7, 0, Math.PI * 2);
          context.fillStyle = "#e7bd79";
          context.fill();
          context.strokeStyle = "rgba(231, 189, 121, 0.34)";
          context.lineWidth = 5;
          context.stroke();
          return;
        }

        context.beginPath();
        context.arc(point.x, point.y, 9, 0, Math.PI * 2);
        context.strokeStyle = "#72d7e2";
        context.lineWidth = 2;
        context.stroke();
        context.beginPath();
        context.arc(point.x, point.y, 3, 0, Math.PI * 2);
        context.fillStyle = "#d7fbff";
        context.fill();
      });

      const shipPoint = toPoint(currentShip.x, currentShip.y);
      context.save();
      context.translate(shipPoint.x, shipPoint.y);
       context.rotate((currentShip.headingDegrees * Math.PI) / 180);
      context.beginPath();
      context.moveTo(0, -11);
      context.lineTo(7, 8);
      context.lineTo(0, 5);
      context.lineTo(-7, 8);
      context.closePath();
      context.fillStyle = "#f1fbfc";
      context.fill();
      context.strokeStyle = "#72d7e2";
      context.lineWidth = 1.5;
      context.stroke();
      context.restore();
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [worldSize, ship.x, ship.y, ship.headingDegrees, objects]);

  return (
    <canvas
      ref={canvasRef}
      className="sector-map__canvas"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
};

const SectorScreen: FC<SectorScreenProps> = ({
  sectorName,
  worldSize,
  ship,
  objects,
  onStatus,
  onRadar,
  onTurnLeft,
  onMoveForward,
  onTurnRight,
  onBack,
}) => {
  const formattedWorldSize = new Intl.NumberFormat("tr-TR").format(worldSize);
  const formattedShipX = new Intl.NumberFormat("tr-TR").format(ship.x);
  const formattedShipY = new Intl.NumberFormat("tr-TR").format(ship.y);

  return (
    <main className="sector-screen" aria-labelledby="sector-title">
      <header className="sector-header">
        <div>
          <p className="sector-kicker">Uçuş · Aşama 2</p>
          <h1 className="sector-title" id="sector-title" tabIndex={-1}>
            Sektör {sectorName}
          </h1>
        </div>
        <p className="sector-dimensions">
          <span className="sector-dimensions__mark" aria-hidden="true" />
          {formattedWorldSize} × {formattedWorldSize} birim
        </p>
      </header>

      <section className="sector-scene" aria-label="Sektör haritası ve konum">
        <div className="sector-map-frame">
          <SectorMap worldSize={worldSize} ship={ship} objects={objects} />
          <span className="sector-map-frame__label" aria-hidden="true">
            ALAN A-2
          </span>
          <span className="sector-map-frame__north" aria-hidden="true">
            N
          </span>
        </div>
        <div className="sector-map-info">
          <p className="sector-ship-position">
            <span className="sector-ship-position__dot" aria-hidden="true" />
            Gemi konumu
            <strong>
              X {formattedShipX} · Y {formattedShipY}
            </strong>
          </p>
          <ul className="sector-map-legend" aria-label="Sektördeki önemli nesneler">
            {objects.filter((object) => object.kind !== "star").map((object) => (
              <li className={`sector-map-legend__item sector-map-legend__item--${object.kind}`} key={object.id}>
                <span className="sector-map-legend__symbol" aria-hidden="true" />
                {object.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sector-controls" aria-labelledby="sector-controls-title">
        <div className="sector-controls__heading">
          <h2 id="sector-controls-title">Uçuş kontrolleri</h2>
          <span>Dokunarak veya klavyeyle kullan</span>
        </div>
        <p className="sector-disabled-note" id={disabledReasonId}>
          Aşama 2’de henüz kullanılamaz.
        </p>
        <div
          className="sector-control-grid"
          role="group"
          aria-label="Sabit dokuz kare kontrol düzeni"
        >
          <button className="sector-control sector-control--utility" type="button" onClick={onStatus}>
            <span className="sector-control__eyebrow">Durum</span>
            <span className="sector-control__label">Durum oku</span>
          </button>
          <button className="sector-control sector-control--utility" type="button" onClick={onRadar}>
            <span className="sector-control__eyebrow">Tarama</span>
            <span className="sector-control__label">Radar özeti</span>
          </button>
          <button
            className="sector-control sector-control--disabled"
            type="button"
            aria-disabled="true"
            aria-describedby={disabledReasonId}
          >
            <span className="sector-control__eyebrow">Hedef</span>
            <span className="sector-control__label">Hedef değiştir</span>
            <span className="sector-control__reason">Aşama 2’de kapalı</span>
          </button>
          <button className="sector-control sector-control--movement" type="button" onClick={onTurnLeft}>
            <span className="sector-control__arrow" aria-hidden="true">↶</span>
            <span className="sector-control__label">Sola dön</span>
          </button>
          <button
            className="sector-control sector-control--disabled sector-control--attack"
            type="button"
            aria-disabled="true"
            aria-describedby={disabledReasonId}
          >
            <span className="sector-control__eyebrow">Saldırı</span>
            <span className="sector-control__label">Saldırı başlat</span>
            <span className="sector-control__reason">Aşama 2’de kapalı</span>
          </button>
          <button className="sector-control sector-control--movement" type="button" onClick={onTurnRight}>
            <span className="sector-control__arrow" aria-hidden="true">↷</span>
            <span className="sector-control__label">Sağa dön</span>
          </button>
          <button
            className="sector-control sector-control--disabled"
            type="button"
            aria-disabled="true"
            aria-describedby={disabledReasonId}
          >
            <span className="sector-control__eyebrow">Yetenek</span>
            <span className="sector-control__label">Özel yetenek</span>
            <span className="sector-control__reason">Aşama 2’de kapalı</span>
          </button>
          <button
            className="sector-control sector-control--movement"
            type="button"
            onClick={onMoveForward}
            aria-label="İleri git"
          >
            <span className="sector-control__arrow" aria-hidden="true">↑</span>
            <span className="sector-control__label">İleri git</span>
          </button>
          <button
            className="sector-control sector-control--disabled"
            type="button"
            aria-disabled="true"
            aria-describedby={disabledReasonId}
          >
            <span className="sector-control__eyebrow">Donanım</span>
            <span className="sector-control__label">Darbe kapsülü</span>
            <span className="sector-control__reason">Aşama 2’de kapalı</span>
          </button>
        </div>
      </section>

      <button className="sector-back" type="button" onClick={onBack}>
        Ana menüye dön
      </button>
    </main>
  );
};

export default SectorScreen;
