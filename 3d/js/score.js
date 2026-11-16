// Puntaje de una partida: valores del diseño (sección 8, Puntaje).
const KILL = { minion: 100, patovica: 250, bombo: 200, mozo: 200, delivery: 200, boss: 2000 };
// Cortes de rango (múltiplos de 50). Un recorrido de los dos niveles sin recibir daño da ~22.600:
// S ≈ 80 %, A ≈ 62 %, B ≈ 40 % de eso.
export const RANKS = { S: 18000, A: 14000, B: 9000 };
const PICKUP = { bottle: 50, secret: 500 };
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
    addHit() { hits++; },
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
