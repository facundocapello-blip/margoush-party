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
export const WAVES = [
  { id: 'vereda', level: 1, trigger: 22, gate: null, title: 'LA VEREDA', text: '¡Llegó la banda de BIG CHAKY!',
    spawns: [{ dx: 9, dz: -1.5, kind: 'secuaz' }, { dx: 11, dz: 1.8, kind: 'secuaz' }, { dx: -8, dz: 0.5, kind: 'secuaz' }] },
  { id: 'vereda-2', level: 1, trigger: 50, gate: 0, title: 'OJO CON EL PATOVICA', text: 'Grandote y lento: no te dejes agarrar.',
    spawns: [{ dx: 8, dz: 0, kind: 'patovica' }, { dx: 10, dz: -2, kind: 'secuaz' }] },
  { id: 'avenida', level: 1, trigger: 72, gate: null, title: 'LA AVENIDA', text: 'Cuidado con el colectivo: no frena.',
    spawns: [{ dx: 9, dz: -2, kind: 'secuaz' }, { dx: 10, dz: 2, kind: 'secuaz' }, { dx: -8, dz: -1.5, kind: 'patovica' }] },
  { id: 'piquete', level: 1, trigger: 106, gate: 1, title: '¡PIQUETE!', text: 'Vencé a los del bombo para que levanten el corte.',
    spawns: [{ dx: 7, dz: -2, kind: 'bombo' }, { dx: 8, dz: 2, kind: 'bombo' }, { dx: 5, dz: 0, kind: 'secuaz' }, { dx: -7, dz: 1, kind: 'secuaz' }] },
  { id: 'le-concept', level: 1, trigger: 126, gate: null, endsLevel: true, title: '¡LLEGAMOS A LE CONCEPT!', text: 'La banda copó la puerta del restaurante.',
    facu: '¡Llegamos a Le Concept! La banda copó la puerta: ¡sacalos!',
    spawns: [{ dx: 8, dz: 0, kind: 'patovica' }, { dx: 9, dz: -2.2, kind: 'bombo' }, { dx: 6, dz: 2.2, kind: 'secuaz' }, { dx: -7, dz: -1, kind: 'secuaz' }, { dx: 10, dz: 1.5, kind: 'secuaz' }] },

  { id: 'francia', level: 2, trigger: 162, gate: null, title: 'LA RUE', text: 'Los mozos tiran croissants: acercate rápido.',
    spawns: [{ dx: 11, dz: -2, kind: 'mozo' }, { dx: 12, dz: 2, kind: 'mozo' }, { dx: 7, dz: 0, kind: 'secuaz' }, { dx: -7, dz: 1.5, kind: 'secuaz' }] },
  { id: 'francia-2', level: 2, trigger: 186, gate: 2, title: '¡DELIVERY!', text: 'Viene en bici a toda velocidad: esquivalo.',
    spawns: [{ dx: 10, dz: 1.5, kind: 'delivery' }, { dx: 9, dz: -2, kind: 'secuaz' }, { dx: 12, dz: 0, kind: 'mozo' }] },
  { id: 'boulevard', level: 2, trigger: 212, gate: null, title: 'LE BOULEVARD', text: 'Grève: pasá por el hueco de la fila.',
    spawns: [{ dx: 10, dz: 0, kind: 'patovica' }, { dx: 11, dz: -2, kind: 'delivery' }, { dx: 12, dz: 2, kind: 'mozo' }, { dx: -7, dz: 1, kind: 'secuaz' }] },
  { id: 'boulevard-2', level: 2, trigger: 238, gate: 3, title: 'ÚLTIMO TRAMO', text: 'Atrás de esta barrera está el galpón.',
    spawns: [{ dx: 8, dz: -1.5, kind: 'patovica' }, { dx: 10, dz: 1.8, kind: 'delivery' }, { dx: 11, dz: 0, kind: 'mozo' }, { dx: -7, dz: -2, kind: 'secuaz' }, { dx: 7, dz: 2.5, kind: 'secuaz' }] }
];

// Trampas. zone: tramo donde actúan las que aparecen solas.
export const TRAPS = [
  // Nivel 1 — Buenos Aires
  { kind: 'baldosa', x: 14, z: -1.2 }, { kind: 'baldosa', x: 27, z: 1.6 }, { kind: 'baldosa', x: 33, z: -2.4 },
  { kind: 'baldosa', x: 44, z: 2.4 }, { kind: 'baldosa', x: 79, z: -0.8 }, { kind: 'baldosa', x: 98, z: 2.2 },
  { kind: 'bache', x: 40, z0: -3.6, z1: -0.6, w: 2.2 },
  { kind: 'bache', x: 58, z0: 0.6, z1: 3.6, w: 2.2 },
  // (fuera del tramo del colectivo: que un bocinazo no te tire adentro de un pozo)
  { kind: 'bache', x: 49, z0: -1.4, z1: 1.6, w: 2.4 },
  { kind: 'colectivo', from: 68, to: 116, every: 7 },
  { kind: 'boletas', from: 80, to: 116, every: 1.6 },
  // Nivel 2 — Francia
  { kind: 'trottinette', from: 158, to: 252, every: 3.2 },
  { kind: 'palomas', from: 165, to: 255, every: 11 },
  { kind: 'greve', from: 214, to: 252, every: 9 }
];
