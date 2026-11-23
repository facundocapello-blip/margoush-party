// Puntaje de una partida: valores del diseño (sección 8, Puntaje).
const KILL = { minion: 100, patovica: 250, bombo: 200, mozo: 200, lale: 200, delivery: 200, cepi: 200, cepiJefe: 600, pinky: 200, boss: 2000 };
// Cortes de rango (múltiplos de 50). Un recorrido sin daño da ~15.050:
// S ≈ 80 %, A ≈ 62 %, B ≈ 40 % de eso.
export const RANKS = { S: 12000, A: 9300, B: 6000 };
const PICKUP = { bottle: 50, secret: 500, coin: 10 };
const MULT_STEP = 0.1;
const MULT_MAX = 3;

export function createScore() {
  let total = 0;
  let hits = 0; // golpes seguidos sin recibir daño

  const multiplier = () => Math.min(MULT_MAX, Math.round((1 + hits * MULT_STEP) * 10) / 10);

  return {
    get total() { return total; },
    get multiplier() { return multiplier(); },
    // Lo que vale un malo ahora (los comunes se multiplican por el combo; el jefe no)
    killValue(kind) { return Math.round(KILL[kind] * (kind === 'boss' ? 1 : multiplier())); },
    addKill(kind) { total += this.killValue(kind); },
    addPickup(kind) { total += PICKUP[kind]; },
    // Boletas y otras multas: restan, pero el total nunca baja de cero
    addPenalty(n) { total = Math.max(0, total - n); },
    // Bonus sueltos (persecución de Cepi: coleccionables, cosas rotas, esquives): se multiplican por el combo
    addBonus(n) { total += Math.round(n * multiplier()); },
    // Puntos fijos (arena de BIG CHAKY: devolución, mano, esquive): sin multiplicador
    addFlat(n) { total += n; },
    addHit() { hits++; },
    // Volver a un checkpoint: el puntaje que había al llegar ahí (sin combo)
    restore(n) { total = Math.max(0, Math.round(n) || 0); hits = 0; },
    takeDamage() { hits = 0; },
    // Los bonus de vida y tiempo solo cuentan si se rescató a Margot
    finalize({ hpLeft, hpMax, seconds, won = true }) {
      const hpBonus = won ? Math.round((hpLeft / hpMax) * 3000) : 0;
      const timeBonus = won ? Math.round(Math.max(0, 480 - seconds) * 10) : 0;
      const sum = total + hpBonus + timeBonus;
      const rank = sum >= RANKS.S ? 'S' : sum >= RANKS.A ? 'A' : sum >= RANKS.B ? 'B' : 'C';
      return { total: sum, rank, breakdown: { play: total, hpBonus, timeBonus } };
    }
  };
}
