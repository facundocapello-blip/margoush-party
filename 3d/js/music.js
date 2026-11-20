// Banda de sonido de MARGOUSH 3D, compuesta por código (sintetizador de Web Audio, no pesa nada).
// Un tema por momento del juego, cada uno con su estilo:
//   menu     → tango electrónico épico (portada)
//   intro    → «¡uh, no!» cómico (Cepi se lleva a Margot)
//   chase    → cumbia rock acelerada (persecución en la 9 de Julio)
//   byd      → arcade con tic-tac que se acelera con la carga del BYD
//   ba       → murga / candombe porteño (calle de Buenos Aires)
//   francia  → vals musette con acordeón (Francia)
//   boss     → rock orquestal con coro (BIG CHAKY)
//   rescate  → canción de cuna en tango (Margot rescatada)
// Cada tema es { step: s por paso, play(n, d, ctx) } y se repite solo. n = paso, d = demora en s.
// tone(tipo, f0, f1, dur, vol, demora) y hiss(dur, vol, frec, q, demora) llegan de audio.js.

export const m2f = (m) => 440 * Math.pow(2, (m - 69) / 12);

// Melodías: por compás, lista de [paso, nota midi, largo en pasos]
export function makeThemes(tone, hiss) {
  const kick = (d, v = 0.45) => tone('sine', 140, 45, 0.16, v, d);
  const snare = (d, v = 0.22) => { hiss(0.11, v, 1800, 0.7, d); tone('triangle', 220, 170, 0.07, v * 0.3, d); };
  const hat = (d, v = 0.05) => hiss(0.03, v, 8000, 2, d);
  // Bandoneón / acordeón: dos sierras apenas desafinadas (el «batido» del fuelle)
  const bando = (m, len, vol, d) => { const f = m2f(m); tone('sawtooth', f, f, len, vol, d); tone('sawtooth', f * 1.006, f * 1.006, len, vol * 0.8, d); };
  const lead = (m, len, vol, d) => { const f = m2f(m); tone('square', f, f, len, vol * 0.6, d); tone('triangle', f, f, len, vol, d); };
  const melodyAt = (bars, bar, i, fn) => { for (const [at, m, len] of bars[bar] || []) if (at === i) fn(m, len); };

  // ---------- Portada: tango electrónico en Re menor ----------
  const TANGO_CH = [[38, [62, 65, 69]], [33, [61, 64, 67]], [38, [62, 65, 69]], [43, [62, 67, 70]], [38, [62, 65, 69]], [43, [62, 67, 70]], [33, [61, 64, 67]], [38, [62, 65, 69]]];
  const TANGO_MEL = { 4: [[0, 74, 6], [6, 72, 2], [8, 70, 4], [12, 69, 4]], 5: [[0, 70, 6], [6, 69, 2], [8, 67, 8]], 6: [[0, 69, 4], [4, 70, 4], [8, 72, 4], [12, 73, 4]], 7: [[0, 74, 12], [12, 62, 4]] };
  const menu = { step: 0.125, play(n, d) {
    const step = 0.125, i = n % 16, bar = Math.floor(n / 16) % 8;
    const [root, triad] = TANGO_CH[bar];
    if (i === 0 || i === 8) kick(d);
    if (i === 4 || i === 12) snare(d, 0.16);
    if (i % 2 === 1) hat(d, 0.035);
    // bajo en 3-3-2 (habanera / «arrastre» del tango)
    if (i === 0 || i === 6 || i === 12) { const f = m2f(i === 6 ? root + 7 : root); tone('sawtooth', f, f, step * 2.2, 0.08, d); }
    // bandoneón marcato en cuatro
    if (i % 4 === 0) for (const m of triad) bando(m - 12, step * 1.1, i === 0 ? 0.028 : 0.02, d);
    melodyAt(TANGO_MEL, bar, i, (m, len) => bando(m, len * step * 0.95, 0.04, d));
  } };

  // ---------- Intro: «¡uh, no!» cómico (tuba oom-pah, cromático bajando y silbato) ----------
  const UHNO = { 0: [[0, 72, 2], [2, 71, 2], [4, 70, 2], [6, 69, 6]], 1: [[0, 67, 2], [2, 66, 2], [4, 65, 2], [6, 64, 6]] };
  const intro = { step: 0.15, play(n, d) {
    const step = 0.15, i = n % 16, bar = Math.floor(n / 16) % 2;
    const root = bar ? 41 : 43;
    if (i === 0 || i === 8) tone('triangle', m2f(root - 12), m2f(root - 12), step * 2, 0.22, d);
    if (i === 4 || i === 12) for (const m of [root + 12, root + 15, root + 19]) tone('square', m2f(m), m2f(m), step * 0.8, 0.018, d);
    melodyAt(UHNO, bar, i, (m, len) => lead(m, len * step * 0.9, 0.05, d));
    if (bar === 1 && i === 12) tone('sine', 1400, 300, step * 4, 0.05, d); // silbato que cae
  } };

  // ---------- Persecución: cumbia rock en La menor (Am–G–F–E) ----------
  const CUMBIA_CH = [[45, [69, 72, 76]], [43, [67, 71, 74]], [41, [65, 69, 72]], [40, [64, 68, 71]]];
  const CUMBIA_MEL = { 0: [[0, 76, 2], [2, 74, 2], [4, 72, 2], [6, 71, 2], [8, 69, 4], [12, 72, 4]], 1: [[0, 74, 2], [2, 72, 2], [4, 71, 2], [6, 69, 2], [8, 67, 4], [12, 71, 4]], 2: [[0, 72, 2], [2, 71, 2], [4, 69, 2], [6, 67, 2], [8, 65, 4], [12, 69, 4]], 3: [[0, 68, 4], [4, 71, 4], [8, 74, 4], [12, 76, 4]] };
  const chase = { step: 0.1, play(n, d) {
    const step = 0.1, i = n % 16, bar = Math.floor(n / 16) % 4, round = Math.floor(n / 64) % 2;
    const [root, triad] = CUMBIA_CH[bar];
    if (i === 0 || i === 8) kick(d, 0.5);
    if (i === 4 || i === 12) snare(d);
    // güiro: «chi-chiqui» con acento
    if (i % 2 === 0) hiss(0.05, i % 4 === 2 ? 0.1 : 0.05, 5200, 1.4, d);
    // bajo de cumbia: tónica y quinta
    for (const [at, iv] of [[0, 0], [6, 7], [8, 12], [14, 7]]) if (i === at) { const f = m2f(root - 12 + iv); tone('sawtooth', f, f, step * 1.8, 0.08, d); }
    // acordes de teclado en el contratiempo
    if (i % 4 === 2) for (const m of triad) tone('square', m2f(m - 12), m2f(m - 12), step * 0.7, 0.014, d);
    // acordeón: la melodía entra la segunda vuelta
    if (round === 1) melodyAt(CUMBIA_MEL, bar, i, (m, len) => bando(m, len * step * 0.9, 0.035, d));
  } };

  // ---------- Mini nivel del BYD: arcade con tic-tac (se acelera con la carga) ----------
  const ARC_CH = [[40, [64, 67, 71]], [36, [60, 64, 67]], [38, [62, 66, 69]], [35, [59, 63, 66]]];
  const byd = { step: 0.11, stepFor: (ctx) => 0.11 - 0.045 * (ctx.intensity || 0), play(n, d, ctx) {
    const i = n % 16, bar = Math.floor(n / 16) % 4, k = ctx.intensity || 0;
    const [root, triad] = ARC_CH[bar];
    if (i === 0 || i === 8) kick(d, 0.45);
    if (i === 4 || i === 12) snare(d, 0.18);
    // tic-tac del reloj (más fuerte cuanto más carga)
    if (i % 4 === 0) tone('sine', i % 8 === 0 ? 2100 : 1500, i % 8 === 0 ? 2100 : 1500, 0.03, 0.05 + k * 0.08, d);
    if (i % 2 === 0) { const f = m2f(root - 12); tone('sawtooth', f, f, 0.1, 0.07, d); }
    { const m = triad[[0, 1, 2, 1][i % 4]] + (i >= 8 ? 12 : 0); tone('square', m2f(m), m2f(m), 0.07, 0.025, d); }
    if (k > 0.7 && i % 2 === 1) tone('square', 1760, 1760, 0.03, 0.015, d); // alarma
  } };

  // ---------- Buenos Aires: murga / candombe en Sol mayor ----------
  const MURGA_CH = [[43, [67, 71, 74]], [48, [64, 67, 72]], [38, [66, 69, 74]], [43, [67, 71, 74]]];
  const MURGA_MEL = { 4: [[0, 74, 4], [4, 74, 2], [6, 76, 2], [8, 74, 4], [12, 71, 4]], 5: [[0, 72, 4], [4, 72, 2], [6, 74, 2], [8, 72, 4], [12, 67, 4]], 6: [[0, 69, 2], [2, 71, 2], [4, 72, 2], [6, 74, 2], [8, 76, 4], [12, 78, 4]], 7: [[0, 79, 8], [8, 74, 4], [12, 71, 4]] };
  const CLAVE = [0, 3, 6, 10, 12];
  const ba = { step: 0.12, play(n, d) {
    const step = 0.12, i = n % 16, bar = Math.floor(n / 16) % 8;
    const [root, triad] = MURGA_CH[bar % 4];
    // bombo de murga y platillo
    if (i === 0 || i === 8 || i === 10) tone('sine', 110, 50, 0.2, 0.42, d);
    if (i === 4 || i === 12) hiss(0.18, 0.12, 6500, 0.6, d);
    // tambor chico del candombe: «tu-cu-tú» en las tres últimas semicorcheas de cada tiempo
    if (i % 4 !== 0) tone('triangle', 520, 380, 0.05, i % 4 === 3 ? 0.07 : 0.04, d);
    // madera (clave 3-2)
    if (CLAVE.includes(i)) tone('triangle', 1700, 1700, 0.025, 0.05, d);
    // repique: redoble al final de cada 2 compases
    if (bar % 2 === 1 && i >= 12) tone('triangle', 330, 260, 0.05, 0.06, d);
    if (i === 0 || i === 8) { const f = m2f(root - 12); tone('sawtooth', f, f, step * 3, 0.06, d); }
    if (i === 0 || i === 6 || i === 12) for (const m of triad) tone('square', m2f(m - 12), m2f(m - 12), step * 0.9, 0.012, d);
    melodyAt(MURGA_MEL, bar, i, (m, len) => lead(m, len * step * 0.9, 0.05, d)); // «bronces» de murga
  } };

  // ---------- Francia: vals musette (3/4) con acordeón, La menor ----------
  const MUS_CH = [[45, [69, 72, 76]], [40, [68, 71, 74]], [45, [69, 72, 76]], [38, [65, 69, 74]], [45, [69, 72, 76]], [40, [68, 71, 74]], [45, [69, 72, 76]], [45, [69, 72, 76]]];
  const MUS_MEL = { 0: [[0, 76, 4], [4, 77, 2], [6, 76, 2], [8, 75, 2], [10, 76, 2]], 1: [[0, 83, 4], [4, 80, 4], [8, 76, 4]], 2: [[0, 81, 4], [4, 79, 2], [6, 77, 2], [8, 76, 4]], 3: [[0, 77, 4], [4, 74, 4], [8, 69, 4]], 4: [[0, 72, 2], [2, 74, 2], [4, 76, 4], [8, 81, 4]], 5: [[0, 80, 4], [4, 83, 4], [8, 80, 4]], 6: [[0, 81, 8], [8, 76, 4]], 7: [[0, 69, 12]] };
  const francia = { step: 0.11, play(n, d) {
    const step = 0.11, i = n % 12, bar = Math.floor(n / 12) % 8;
    const [root, triad] = MUS_CH[bar];
    // «um-pa-pa»: bajo en el 1, acordes en el 2 y el 3
    if (i === 0) { const f = m2f(root - 12); tone('triangle', f, f, step * 3, 0.16, d); tone('sawtooth', f, f, step * 2, 0.04, d); }
    if (i === 4 || i === 8) for (const m of triad) bando(m - 12, step * 1.4, 0.012, d);
    if (i === 4 || i === 8) hiss(0.04, 0.04, 7000, 2, d); // escobilla
    melodyAt(MUS_MEL, bar, i, (m, len) => bando(m, len * step * 0.95, 0.036, d));
  } };

  // ---------- BIG CHAKY: rock orquestal en Do menor ----------
  const ROCK_CH = [[36, [60, 63, 67]], [32, [60, 63, 68]], [34, [62, 65, 70]], [31, [62, 67, 71]]];
  const CHOIR = { 4: [[0, 72, 8], [8, 75, 8]], 5: [[0, 75, 4], [4, 74, 4], [8, 72, 8]], 6: [[0, 74, 8], [8, 70, 8]], 7: [[0, 71, 16]] };
  const boss = { step: 0.12, play(n, d) {
    const step = 0.12, i = n % 16, bar = Math.floor(n / 16) % 8;
    const [root, triad] = ROCK_CH[bar % 4];
    if (i === 0 || i === 8) { tone('sine', 95, 40, 0.5, 0.5, d); tone('triangle', m2f(root), m2f(root) * 0.7, 0.4, 0.12, d); } // timbales
    if (i === 4 || i === 12) snare(d, 0.24);
    if (i % 2 === 1) hat(d, 0.04);
    // guitarra: quinta en corcheas, apagada
    if (i % 2 === 0) for (const iv of [0, 7, 12]) { const f = m2f(root + iv); tone('sawtooth', f, f, step * 1.3, 0.035, d); }
    // coro: acorde largo al empezar cada compás
    if (i === 0) for (const m of triad) { tone('triangle', m2f(m), m2f(m), step * 15, 0.03, d); tone('sine', m2f(m) * 1.003, m2f(m) * 1.003, step * 15, 0.02, d); }
    if (i === 0 && bar % 2 === 0) for (const m of triad) tone('square', m2f(m + 12), m2f(m + 12), step * 2, 0.02, d); // bronces
    melodyAt(CHOIR, bar, i, (m, len) => { tone('triangle', m2f(m), m2f(m), len * step, 0.05, d); tone('sawtooth', m2f(m - 12), m2f(m - 12), len * step, 0.018, d); });
  } };

  // ---------- Rescate: canción de cuna en tango, Re mayor ----------
  const CUNA_CH = [[38, [62, 66, 69]], [35, [59, 62, 66]], [31, [59, 62, 67]], [33, [61, 64, 69]]];
  const CUNA_MEL = { 0: [[0, 78, 4], [4, 76, 4], [8, 74, 8]], 1: [[0, 74, 4], [4, 73, 4], [8, 71, 8]], 2: [[0, 71, 4], [4, 74, 4], [8, 79, 4], [12, 78, 4]], 3: [[0, 76, 12], [12, 73, 4]] };
  const rescate = { step: 0.17, play(n, d) {
    const step = 0.17, i = n % 16, bar = Math.floor(n / 16) % 4, round = Math.floor(n / 64) % 2;
    const [root, triad] = CUNA_CH[bar];
    if (i === 0) { const f = m2f(root - 12); tone('triangle', f, f, step * 6, 0.12, d); }
    if (i === 6 || i === 12) { const f = m2f(root - 5); tone('triangle', f, f, step * 3, 0.07, d); } // arrastre suave
    if (i === 0 || i === 8) for (const m of triad) bando(m, step * 7, 0.009, d);
    // cajita de música: arpegio arriba
    if (i % 2 === 0) { const m = triad[(i / 2) % 3] + 24; tone('sine', m2f(m), m2f(m), step * 2.5, 0.03, d); }
    if (round === 1) melodyAt(CUNA_MEL, bar, i, (m, len) => tone('sine', m2f(m), m2f(m), len * step, 0.06, d));
    else melodyAt(CUNA_MEL, bar, i, (m, len) => bando(m - 12, len * step * 0.95, 0.025, d));
  } };

  return { menu, intro, chase, byd, ba, francia, boss, rescate };
}
