/** Elite station targets (seconds) — used for score normalization across pages */
export const ELITE_TARGETS: Record<string, number> = {
  'Ski Erg': 210,
  'Sled Push': 70,
  'Sled Pull': 80,
  'Burpee Broad Jump': 150,
  'Row Erg': 200,
  'Farmers Carry': 55,
  'Sandbag Lunges': 110,
  'Wall Balls': 150,
};

/** Station accent colors — used for charts and badges */
export const STATION_COLORS: Record<string, string> = {
  'Ski Erg': '#00F0FF',
  'Sled Push': '#FF6B00',
  'Sled Pull': '#FF6B35',
  'Burpee Broad Jump': '#FF4444',
  'Row Erg': '#00F0FF',
  'Farmers Carry': '#ec4899',
  'Sandbag Lunges': '#B45FFF',
  'Wall Balls': '#B45FFF',
};

/** Session type / modality colors — merged superset used across dashboard & performance */
export const MODALITY_COLORS: Record<string, string> = {
  run: '#00F0FF',
  running: '#00F0FF',
  strength: '#39FF14',
  hiit: '#FF6B00',
  hyrox: '#39FF14',
  hyrox_sim: '#39FF14',
  simulation: '#39FF14',
  station_practice: '#FF8C42',
  crossfit: '#FF8C42',
  recovery: '#00F0FF',
  rest: 'rgba(255,255,255,0.1)',
};
