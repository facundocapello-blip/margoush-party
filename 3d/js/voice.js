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

// Tono y velocidad de cada jefe (voz del sistema)
export const PROFILES = {
  chaky: { lang: 'es-AR', pitch: 0.35, rate: 0.82 }, // grave, torpe, explosivo
  cepi: { lang: 'es-AR', pitch: 1.1, rate: 1.18 },   // canchero, rápido, burlón
  lale: { lang: 'es-AR', pitch: 1.3, rate: 0.72 },   // meloso, se estira como manteca
  pinky: { lang: 'es-AR', pitch: 1.0, rate: 1.38 }   // trapito, a mil por hora
};

export const PRIO = { ko: 3, phase: 3, intro: 3, dice: 3, hurt: 2, special: 2, stuck: 2, returned: 2, attack: 1, taunt: 1, good: 1, bad: 1, count: 2 };
export const COOLDOWN = { taunt: 6, attack: 2.5, hurt: 1.2, returned: 1.5, good: 0.5, bad: 0.5, count: 0.5 }; // s

export const CATALOG = {
  chaky: {
    intro: ['¡Soy BIG CHAKY… y traje barriles!'],
    attack: ['¡Tomá, barrilito!', '¡Ahí va otro!', '¡Atajá esta!'],
    returned: ['¡Me devolviste el barril, atrevido!', '¡Ey, ese era mío!'],
    hurt: ['¡Auch, mi panza!', '¡Ese me dolió en el alma!'],
    taunt: ['¡Muy lento, campeón!', '¡Perdiste el compás!'],
    dice: ['¡Si querés a Margot, vas a tener que seguirme el ritmo!'],
    count: ['¡Y uno, y dos…!', '¡Mirá y aprendé!', '¡Atenti a la cadera!'],
    good: ['¡Esa cadera!', '¡Con onda, eh!', '¡Mirá vos, sabe bailar!'],
    bad: ['¡Te falta calle, campeón!', '¡Eso no es bailar!', '¡Dos pies izquierdos!'],
    phase: ['¡Ahora sí me enojé!'],
    special: ['¡Barril gigante!'],
    stuck: ['¡Soltá, soltá, soltá!'],
    ko: ['¡Esto no termina acá! ¡Nos vemos en Francia!']
  },
  cepi: {
    intro: ['¿Vos acá? Dale, te doy ventaja: saco yo.'],
    attack: ['¡Bandeja!', '¡Por el vidrio!', '¡Punto de oro!'],
    hurt: ['¡Eso fue suerte!', '¡Ey, no vale!'],
    taunt: ['¡Comprate una paleta!', '¡Es eléctrico, papá!'],
    phase: ['Se terminó el calentamiento.', 'Ahora juego en serio, papá.'],
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
    taunt: ['¿Te lo cuido, jefe?', 'Son dos mil… por adelantado.'],
    phase: ['Ahora te cobro hora y media.', 'Tarifa nocturna, papi.'],
    ko: ['¡Bueno, bueno! Hoy no se cobra… ¡pero mirá, el cheque lo firmó Facu!']
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
