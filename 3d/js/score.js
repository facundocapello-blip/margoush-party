// Puntaje de una partida: valores del diseño (sección 8, Puntaje).
const KILL = { minion: 100, boss: 2000 };
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
    addKill(kind) {
      total += Math.round(KILL[kind] * (kind === 'minion' ? multiplier() : 1));
    },
    addPickup(kind) { total += PICKUP[kind]; },
    addHit() { hits++; },
    takeDamage() { hits = 0; },
    finalize({ hpLeft, hpMax, seconds }) {
      const hpBonus = Math.round((hpLeft / hpMax) * 3000);
      const timeBonus = Math.round(Math.max(0, 300 - seconds) * 10);
      const sum = total + hpBonus + timeBonus;
      const rank = sum >= 15000 ? 'S' : sum >= 10000 ? 'A' : sum >= 6000 ? 'B' : 'C';
      return { total: sum, rank, breakdown: { play: total, hpBonus, timeBonus } };
    }
  };
}
