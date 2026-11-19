// Datos de la partida: dos niveles sobre una misma calle que avanza en +X.
// Nivel 1 — Buenos Aires (termina peleando en la puerta de Le Concept)
// Nivel 2 — Francia (termina en el galpón de BIG CHAKY)

export const LE_CONCEPT_X = 134;
export const BORDER_X = 149;      // frontera entre los dos mundos
export const GALPON_X = 262;
export const SECRET_X = 230;      // pasaje secreto, en el boulevard
export const STREET_MAX_X = 315;

export const LEVELS = [
  { id: 1, name: 'BUENOS AIRES', minX: 1, maxX: 146, start: 4 },
  { id: 2, name: 'FRANCIA', minX: 152, maxX: STREET_MAX_X, start: 156 }
];

// Portones: cajones (se derrumban) y el piquete (cubiertas con fuego)
export const GATES = [
  { x: 64, kind: 'crates' },
  { x: 118, kind: 'piquete' },
  { x: 204, kind: 'crates' },
  { x: 256, kind: 'crates' }
];

// Oleadas en orden. gate = índice del portón que abren al despejarse.
// La banda son tres amigos de Facu: Pinky el trapito (te cobra el estacionamiento), Lale (manteca) y Cepi (pelotazos de pádel).
// Pocos por tanda (18 en total) y nunca dos iguales a la vez.
export const WAVES = [
  { id: 'vereda', level: 1, trigger: 22, gate: null, title: 'LA VEREDA', text: '¡Llegó la banda de BIG CHAKY!',
    spawns: [{ dx: 9, dz: -0.8, kind: 'pinky' }] },
  { id: 'vereda-2', level: 1, trigger: 50, gate: 0, title: 'MANTECA EN LA VEREDA', text: 'Lale y Pinky te cortan el paso.',
    spawns: [{ dx: 9, dz: 1.2, kind: 'lale' }, { dx: 8, dz: -1, kind: 'pinky' }] },
  { id: 'avenida', level: 1, trigger: 72, gate: null, title: 'LA AVENIDA', text: 'Cuidado con el colectivo: no frena.',
    spawns: [{ dx: 9, dz: -1.5, kind: 'cepi' }, { dx: -8, dz: 1.5, kind: 'pinky' }] },
  { id: 'piquete', level: 1, trigger: 106, gate: 1, title: '¡PIQUETE!', text: 'Sacá a la banda para que levanten el corte.',
    spawns: [{ dx: 7, dz: -2, kind: 'lale' }, { dx: 8, dz: 2, kind: 'cepi' }, { dx: 5, dz: 0, kind: 'pinky' }] },
  { id: 'le-concept', level: 1, trigger: 126, gate: null, endsLevel: true, title: '¡LLEGAMOS A LE CONCEPT!', text: 'La banda copó la puerta del restaurante.',
    spawns: [{ dx: 8, dz: 0, kind: 'pinky' }, { dx: 9, dz: 2.2, kind: 'cepi' }] },

  { id: 'francia', level: 2, trigger: 162, gate: null, title: 'LA RUE', text: '¡La banda te siguió hasta Francia!',
    spawns: [{ dx: 8, dz: 0, kind: 'pinky' }, { dx: 9, dz: -1.2, kind: 'lale' }] },
  { id: 'francia-2', level: 2, trigger: 186, gate: 2, title: 'PELOTAZOS', text: 'Cepi y Lale tiran desde lejos: acercate rápido.',
    spawns: [{ dx: 10, dz: 1.5, kind: 'cepi' }, { dx: 9, dz: -2, kind: 'lale' }] },
  // Mini-jefe a mitad del nivel 2: Cepi «el Niño», el hermano de Facu, viene re caliente (y con el BYD roto)
  { id: 'boulevard', level: 2, trigger: 212, gate: null, title: 'LE BOULEVARD', text: '¡Ojo! Viene el hermano de Facu…',
    spawns: [{ dx: 10, dz: 0, kind: 'cepiJefe' }] },
  { id: 'boulevard-2', level: 2, trigger: 238, gate: 3, title: 'ÚLTIMO TRAMO', text: 'Atrás de esta barrera está el galpón.',
    spawns: [{ dx: 8, dz: -1.5, kind: 'pinky' }, { dx: 10, dz: 1.8, kind: 'lale' }, { dx: 11, dz: 0, kind: 'cepi' }] }
];

// Trampas. zone: tramo donde actúan las que aparecen solas.
export const TRAPS = [
  // Nivel 1 — Buenos Aires
  { kind: 'baldosa', x: 14, z: -1.2 }, { kind: 'baldosa', x: 27, z: 1.6 }, { kind: 'baldosa', x: 33, z: -2.4 },
  { kind: 'baldosa', x: 44, z: 2.4 }, { kind: 'baldosa', x: 79, z: -0.8 }, { kind: 'baldosa', x: 98, z: 2.2 },
  // (sin baches: mataban en bucle al que dejaba el pulgar empujando hacia adelante)
  { kind: 'colectivo', from: 68, to: 116, every: 7 },
  { kind: 'boletas', from: 80, to: 116, every: 1.6 },
  // Nivel 2 — Francia
  { kind: 'trottinette', from: 158, to: 252, every: 3.2 },
  { kind: 'palomas', from: 165, to: 255, every: 11 }
  // (sin grève: la fila que cruzaba la calle no se entendía y no te dejaba pasar)
];
