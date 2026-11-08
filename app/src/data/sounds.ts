export const SOUND_ID = {
  engineCruise: 22,
  shipTurn: 26,
  sectorBoundary: 35,
  gateSignal: 36,
  radarScan: 45,
  ferritSignal: 126,
  leftEarTest: 227,
  rightEarTest: 228,
} as const;

export const sounds = [
  {
    id: SOUND_ID.engineCruise,
    name: "Motor seyir",
    file: "ses_022.ogg",
    temporary: true,
  },
  {
    id: SOUND_ID.shipTurn,
    name: "Yön değiştirme",
    file: "ses_026.ogg",
    temporary: true,
  },
  {
    id: SOUND_ID.sectorBoundary,
    name: "Sektör sınırı",
    file: "ses_035.ogg",
    temporary: true,
  },
  {
    id: SOUND_ID.gateSignal,
    name: "Kapı işareti",
    file: "ses_036.ogg",
    temporary: true,
  },
  {
    id: SOUND_ID.radarScan,
    name: "Radar taraması",
    file: "ses_045.ogg",
    temporary: true,
  },
  {
    id: SOUND_ID.ferritSignal,
    name: "Maden işareti",
    file: "ses_126.ogg",
    temporary: true,
  },
  {
    id: SOUND_ID.leftEarTest,
    name: "Ses testi sol",
    file: "ses_227.ogg",
    temporary: true,
  },
  {
    id: SOUND_ID.rightEarTest,
    name: "Ses testi sağ",
    file: "ses_228.ogg",
    temporary: true,
  },
] as const;
