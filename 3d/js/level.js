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

// Portones: cajones rompibles al despejar cada zona (sin piquete)
export const GATES = [
  { x: 64, kind: 'crates' },
  { x: 204, kind: 'crates' },
  { x: 256, kind: 'crates' }
];

// Oleadas en orden. gate = índice del portón que abren al despejarse.
// Chaky, Cepi, Lale y Pinky son únicamente JEFES de sus arenas; en la calle pelean sus secuaces.
export const WAVES = [
  { id: 'vereda', level: 1, trigger: 22, gate: null, title: 'LA VEREDA', text: '¡Llegaron los secuaces de BIG CHAKY!',
    spawns: [{ dx: 9, dz: -0.9, kind: 'secuaz' }, { dx: 11, dz: 1.1, kind: 'secuaz' }] },
  { id: 'vereda-2', level: 1, trigger: 50, gate: 0, title: 'SEGURIDAD VIP', text: 'Un patovica y su secuaz cortan la vereda.',
    spawns: [{ dx: 9, dz: 1.1, kind: 'patovica' }, { dx: 8, dz: -1.1, kind: 'secuaz' }] },
  { id: 'avenida', level: 1, trigger: 76, gate: null, title: 'LA AVENIDA', text: 'Cuidado con el colectivo: no frena.',
    spawns: [{ dx: 9, dz: -1.4, kind: 'bombo' }, { dx: -8, dz: 1.4, kind: 'secuaz' }] },
  { id: 'le-concept', level: 1, trigger: 122, gate: null, endsLevel: true, title: '¡ÚLTIMA PARADA: EL AEROPUERTO!', text: 'Los secuaces no te dejan subir al avión.',
    spawns: [{ dx: 8, dz: -0.6, kind: 'patovica' }, { dx: 10, dz: 1.6, kind: 'bombo' }] },

  { id: 'francia', level: 2, trigger: 162, gate: null, title: 'LA RUE', text: '¡Secuaces en las calles de París!',
    spawns: [{ dx: 8, dz: 0.4, kind: 'mozo' }, { dx: 10, dz: -1.3, kind: 'secuaz' }] },
  { id: 'francia-2', level: 2, trigger: 186, gate: 1, title: 'CAMINO A LE BLÉ', text: 'Mozos y deliverys cuidan la panadería.',
    spawns: [{ dx: 10, dz: 1.4, kind: 'mozo' }, { dx: 9, dz: -1.6, kind: 'delivery' }] },
  { id: 'boulevard-2', level: 2, trigger: 238, gate: 2, title: 'ÚLTIMO TRAMO', text: 'Atrás de esta barrera está el galpón.',
    spawns: [{ dx: 8, dz: -1.4, kind: 'patovica' }, { dx: 10, dz: 1.6, kind: 'delivery' }, { dx: 11, dz: 0, kind: 'bombo' }] }
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
