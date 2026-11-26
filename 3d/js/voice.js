// Voces de los jefes: quién habla, qué frase, cuándo y por encima de quién.
// Lógica pura (se prueba con node --test): el que reproduce es `speak(text, perfil)` que le pasa el juego.
//
// - Catálogo por jefe → evento → variantes (español rioplatense; el globo se traduce con i18n).
// - Prioridades: derrota / cambio de fase / presentación (3) > daño y ataque especial (2) > ataque y burla (1).
//   Una voz más importante corta a la que suena; una igual o menor mientras otra suena se descarta.
// - Sin repetición: cada evento saca de una bolsa mezclada y nunca repite la última frase.
// - Esperas mínimas por evento (las burlas como mucho una cada 6 s).
// - PROVISORIO: hoy las frases salen con la voz del sistema (speechSynthesis) y un tono distinto por jefe.
//   Cuando haya grabaciones, cada perfil suma `files` y el juego reproduce el archivo en vez de la voz.

export const PROVISORIO = true;

// Tono, velocidad y timbre de balbuceo Web Audio de cada jefe (H-5: sin archivos ni TTS)
export const PROFILES = {
  chaky: { id: 'chaky', lang: 'es-AR', pitch: 0.35, rate: 0.82, baseHz: 96,  wave: 'sawtooth', formant: 520,  q: 3.5, step: 0.135, vol: 0.18 }, // grave y lento
  cepi:  { id: 'cepi',  lang: 'es-AR', pitch: 1.1,  rate: 1.18, baseHz: 255, wave: 'sawtooth', formant: 1650, q: 7.5, step: 0.072, vol: 0.14 }, // rápido y nasal
  lale:  { id: 'lale',  lang: 'es-AR', pitch: 1.3,  rate: 0.72, baseHz: 155, wave: 'triangle', formant: 680,  q: 2.2, step: 0.118, vol: 0.20 }, // gordito y redondo
  pinky: { id: 'pinky', lang: 'es-AR', pitch: 1.0,  rate: 1.38, baseHz: 335, wave: 'square',   formant: 2150, q: 5.5, step: 0.064, vol: 0.12 }, // chillón de cancha
  facu:  { id: 'facu',  lang: 'es-AR', pitch: 0.85, rate: 1.0,  baseHz: 188, wave: 'sawtooth', formant: 1120, q: 4.2, step: 0.095, vol: 0.16 }  // canchero de galería
};

const VOWEL_FORMANT = { a: 1.0, e: 1.25, i: 1.48, o: 0.82, u: 0.68 };

// Convierte una frase en 3..9 sílabas cortas sintetizadas con el timbre del jefe (lógica pura, testeable)
export function bossBabblePlan(text, prof = PROFILES.chaky, maxDur = 1.4) {
  if (!text || typeof text !== 'string') return [];
  const p = prof?.baseHz ? prof : (PROFILES[prof?.id] || PROFILES.chaky);
  const clean = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const vowels = [...clean.matchAll(/[aeiou]/g)].map(m => m[0]);
  const count = Math.max(3, Math.min(9, vowels.length || Math.ceil(clean.length / 4)));
  const isQ = text.includes('?'), isExc = text.includes('!');
  const step = p.step || 0.095;
  const notes = [];
  let delay = 0;
  for (let i = 0; i < count; i++) {
    if (delay > maxDur) break;
    const v = vowels[i % Math.max(1, vowels.length)] || 'a';
    const hash = ((clean.charCodeAt((i * 5 + 1) % clean.length) || 65) % 7) - 3; // -3..+3
    const endLift = i === count - 1 ? (isQ ? 1.24 : isExc ? 1.12 : 0.9) : 1;
    const f0 = p.baseHz * (1 + hash * 0.045) * (isExc && i === 0 ? 1.08 : 1);
    const f1 = f0 * (i === count - 1 && isQ ? 1.22 : (hash >= 0 ? 1.06 : 0.93)) * endLift;
    const dur = Math.max(0.04, step * 0.72);
    notes.push({
      delay,
      dur,
      freq0: Math.round(f0 * 10) / 10,
      freq1: Math.round(f1 * 10) / 10,
      formant: Math.round(p.formant * (VOWEL_FORMANT[v] || 1)),
      wave: p.wave,
      q: p.q,
      vol: p.vol
    });
    delay += step;
  }
  return notes;
}

export const PRIO = { ko: 3, phase: 3, intro: 3, dice: 3, hurt: 2, special: 2, stuck: 2, returned: 2, attack: 1, taunt: 1, good: 1, bad: 1, count: 2, pick: 2, margot: 3 };
export const COOLDOWN = { taunt: 6, attack: 2.5, hurt: 1.2, returned: 1.5, good: 0.5, bad: 0.5, count: 0.5 }; // s

export const CATALOG = {
  chaky: {
    intro: ['¡Soy BIG CHAKY… y vine a bailar!'],
    attack: ['¡Seguime el ritmo!', '¡Ahí va otro paso!', '¡Atajá este giro!'],
    hurt: ['¡Auch, mi panza!', '¡Ese me dolió en el alma!'],
    taunt: ['¡Muy lento!', '¡Perdiste el compás!'],
    dice: ['¡Si querés a Margot, vas a tener que seguirme el ritmo!'],
    count: ['¡Y uno, y dos…!', '¡Mirá y aprendé!', '¡Atenti a la cadera!'],
    good: ['¡Esa cadera!', '¡Con onda, eh!', '¡Mirá vos, sabe bailar!'],
    bad: ['¡Te falta calle!', '¡Eso no es bailar!', '¡Dos pies izquierdos!'],
    phase: ['¡Ahora sí me enojé!'],
    ko: ['¡Esto no termina acá! ¡Nos vemos en Francia!']
  },
  cepi: {
    intro: ['¿Vos acá? Dale, te doy ventaja: saco yo.'],
    attack: ['¡Bandeja!', '¡Por el vidrio!', '¡Punto de oro!'],
    hurt: ['¡Eso fue suerte!', '¡Ey, no vale!'],
    taunt: ['¡Comprate una paleta!', '¡Es eléctrico, che!'],
    phase: ['Se terminó el calentamiento.', 'Ahora juego en serio, che.'],
    ko: ['¡Pido revancha!… ¿y me cargás el BYD?']
  },
  lale: {
    intro: ['Tranqui… todo suavecito, ¿viste?'],
    attack: ['¡Manteca para todos!', 'Untadito, untadito…'],
    hurt: ['¡No, harina no! ¡Me arruinás el peinado!'],
    taunt: ['Te derretiste como mi revés.', '¿Te resbalaste? Pasa.'],
    phase: ['Subí el horno… que se derrita todo.'],
    ko: ['Se me derritió todo… hasta el orgullo.']
  },
  pinky: {
    intro: ['¿Pensaste que el jefe era Chaky? ¡Chaky me debe el estacionamiento!'],
    attack: ['¡Dale, dale, dale, que entra!', '¡Todo, todo, todo!', '¡Cortá, cortá!'],
    hurt: ['¡Eh, eh! ¡Sin tocar la mercadería!'],
    taunt: ['¿Te lo cuido?', 'Son dos mil… por adelantado.'],
    phase: ['Ahora te cobro hora y media.', 'Tarifa nocturna, che.'],
    margot: ['¡Puaj! ¡Papilla en los anteojos! ¡No veo nada!', '¡Mis Ray-Ban! ¡Son de zapallo!'],
    ko: ['¡Bueno, bueno! Hoy no se cobra… ¡pero mirá, el cheque lo firmó Facu!']
  },
  facu: {
    intro: ['¿Creían que era Pinky el cerebro? ¡Bienvenidos a mi galería!'],
    attack: ['¡Esto es arte, che!', '¡Un pincelazo de autor!', '¡Pieza única!'],
    hurt: ['¡Ey, ese cuadro era carísimo!', '¡Auch! ¡Con cuidado!'],
    taunt: ['Esto no lo entienden: es arte moderno.', '¡No toquen la obra!'],
    pick: ['¿Cuál es el verdadero? ¡Ojo con el ojo!'],
    phase: ['¡Ahora sí me enojé, che!', '¡Se acabó la paciencia!'],
    margot: ['¡¿Qué hiciste?! …¡Es una obra maestra!', '¡Esos garabatos valen millones!'],
    ko: ['Bueno… está bien. ¡Les devuelvo a Margot!']
  }
};

// Cuánto tarda en decirse (para la prioridad y para bajar la música mientras habla)
export const lineDur = (text, rate = 1) => (0.45 + text.length * 0.065) / Math.max(0.5, rate);

// speak(text, profile) reproduce; now() da los segundos actuales; rand para mezclar
export function createVoice({ speak = () => {}, now = () => performance.now() / 1000, rand = Math.random, catalog = CATALOG } = {}) {
  const bags = new Map(), last = new Map(), lastAt = new Map();
  let cur = null; // { boss, event, prio, until }

  function pick(boss, event) {
    const list = catalog[boss]?.[event];
    if (!list || !list.length) return null;
    const key = boss + ':' + event;
    let bag = bags.get(key);
    if (!bag || !bag.length) {
      bag = list.slice();
      for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      // que la primera de la bolsa nueva no repita la última que sonó
      if (bag.length > 1 && bag[bag.length - 1] === last.get(key)) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
      bags.set(key, bag);
    }
    const text = bag.pop();
    last.set(key, text);
    return text;
  }

  // Devuelve la frase dicha (para el globo) o null si no correspondía hablar
  function say(boss, event, { force = false } = {}) {
    const t = now(), prio = PRIO[event] ?? 1, key = boss + ':' + event;
    const cd = COOLDOWN[event] || 0;
    if (!force && cd && lastAt.has(key) && t - lastAt.get(key) < cd) return null;
    if (!force && cur && t < cur.until && prio <= cur.prio) return null;
    const text = pick(boss, event);
    if (!text) return null;
    const prof = PROFILES[boss] || PROFILES.chaky;
    lastAt.set(key, t);
    cur = { boss, event, prio, until: t + lineDur(text, prof.rate) };
    speak(text, prof, { event, prio, dur: cur.until - t });
    return text;
  }

  return {
    say,
    get speaking() { return cur && now() < cur.until ? { ...cur } : null; },
    reset() { cur = null; bags.clear(); last.clear(); lastAt.clear(); }
  };
}
