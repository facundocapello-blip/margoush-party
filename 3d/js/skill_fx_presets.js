// Paletas, escalas y arquetipos JSON para el generador multicapa de efectos (inspirado en Effekseer CC-0).
// Cada efecto combina explícitamente las 4 capas:
//   1. core      — Núcleo brillante (Sprite + Cross-Flare aditivo)
//   2. trail     — Estela de trayectoria (Ribbon / Track teselado con caída UV)
//   3. shockwave — Onda de choque anular (Ring con radio interno/externo independientes)
//   4. sparks    — Chispas y fragmentos (Streaks estirados por velocidad + escombros giratorios)

export const SKILL_PALETTES = {
  astral_cyan: {
    id: 'astral_cyan',
    label: { es: 'Cian Astral (CC-0)', fr: 'Cyan Astral (CC-0)' },
    core: '#ffffff',
    primary: '#38d9f5',
    secondary: '#1864ab',
    accent: '#a5f3fc',
    debris: '#74c0fc'
  },
  solar_gold: {
    id: 'solar_gold',
    label: { es: 'Oro Sísmico (Douge)', fr: 'Or Sismique (Douge)' },
    core: '#ffffff',
    primary: '#ffd43b',
    secondary: '#f76707',
    accent: '#fff3bf',
    debris: '#ffa94d'
  },
  emerald_ivy: {
    id: 'emerald_ivy',
    label: { es: 'Hiedra Viva (Marine)', fr: 'Lierre Vif (Marine)' },
    core: '#f4fff8',
    primary: '#2fe084',
    secondary: '#087f5b',
    accent: '#c0eb75',
    debris: '#ff85b3'
  },
  electric_padel: {
    id: 'electric_padel',
    label: { es: 'Punto de Oro (Cepi)', fr: 'Point d’Or (Cepi)' },
    core: '#ffffff',
    primary: '#ffe066',
    secondary: '#00a8e8',
    accent: '#90e0ef',
    debris: '#ffd166'
  },
  amber_oven: {
    id: 'amber_oven',
    label: { es: 'Horno Ígneo (Lale)', fr: 'Four Ardent (Lale)' },
    core: '#fff9db',
    primary: '#ff922b',
    secondary: '#d9480f',
    accent: '#ffe066',
    debris: '#ffc078'
  },
  heroic_coral: {
    id: 'heroic_coral',
    label: { es: 'Grito Estelar (Margot)', fr: 'Cri Étoilé (Margot)' },
    core: '#ffffff',
    primary: '#ff6b8b',
    secondary: '#f59f00',
    accent: '#63e6be',
    debris: '#ffd43b'
  },
  crimson_flare: {
    id: 'crimson_flare',
    label: { es: 'Filo Carmesí (CC-0)', fr: 'Lame Cramoisie (CC-0)' },
    core: '#fff5f5',
    primary: '#ff4d6d',
    secondary: '#a4133c',
    accent: '#ffb3c1',
    debris: '#ff8fa3'
  }
};

export const SKILL_SIZES = {
  xs: { id: 'xs', scale: 0.5, cellSize: 128, label: { es: 'XS · 0.5×', fr: 'XS · 0.5×' } },
  sm: { id: 'sm', scale: 0.75, cellSize: 160, label: { es: 'S · 0.75×', fr: 'S · 0.75×' } },
  md: { id: 'md', scale: 1.0, cellSize: 192, label: { es: 'M · 1.0×', fr: 'M · 1.0×' } },
  lg: { id: 'lg', scale: 1.35, cellSize: 256, label: { es: 'L · 1.35×', fr: 'L · 1.35×' } },
  xl: { id: 'xl', scale: 1.75, cellSize: 320, label: { es: 'XL · 1.75×', fr: 'XL · 1.75×' } }
};

export const SKILL_PRESETS = {
  effekseer_astral_slash: {
    id: 'effekseer_astral_slash',
    name: { es: 'Corte Astral (Effekseer CC-0)', fr: 'Entaille Astrale (Effekseer CC-0)' },
    palette: 'astral_cyan',
    size: 'md',
    duration: 0.68,
    seed: 108,
    sheet: { frames: 16, fps: 24, maxAtlasWidth: 2048 },
    layers: {
      core: {
        enabled: true,
        shape: 'starburst',
        radius: 36,
        rays: 8,
        flareLength: 2.1,
        spinSpeed: 2.4,
        intensity: 1.0,
        followTrajectory: false,
        startAt: 0.0,
        endAt: 0.78
      },
      trail: {
        enabled: true,
        mode: 'slash_arc',
        radius: 68,
        arcDeg: 235,
        startDeg: -145,
        width: 24,
        length: 0.62,
        ribbons: 2,
        tiltY: 0.78,
        turbulence: 0.12,
        startAt: 0.0,
        endAt: 0.72
      },
      shockwave: {
        enabled: true,
        rings: 2,
        startRadius: 14,
        endRadius: 82,
        thickness: 18,
        tiltY: 0.72,
        rotationDeg: -24,
        stagger: 0.09,
        dashCount: 0,
        startAt: 0.04,
        endAt: 0.88
      },
      sparks: {
        enabled: true,
        sparkCount: 24,
        shardCount: 10,
        shardShape: 'diamond',
        speedMin: 120,
        speedMax: 310,
        spreadDeg: 220,
        directionDeg: -20,
        gravity: 180,
        drag: 3.1,
        sparkSize: 1.0,
        shardSize: 1.0,
        bounce: 0.0,
        startAt: 0.02,
        endAt: 1.0
      }
    }
  },

  douge_truth_slam: {
    id: 'douge_truth_slam',
    name: { es: 'Douge · ¡Verdades a los Gritos!', fr: 'Douge · Vérités Hurlées !' },
    palette: 'solar_gold',
    size: 'md',
    duration: 0.76,
    seed: 77,
    sheet: { frames: 16, fps: 22, maxAtlasWidth: 2048 },
    layers: {
      core: {
        enabled: true,
        shape: 'starburst',
        radius: 42,
        rays: 10,
        flareLength: 1.85,
        spinSpeed: 1.2,
        intensity: 1.1,
        followTrajectory: false,
        startAt: 0.06,
        endAt: 0.82
      },
      trail: {
        enabled: true,
        mode: 'ground_slam',
        radius: 74,
        arcDeg: 180,
        startDeg: -90,
        width: 26,
        length: 0.58,
        ribbons: 2,
        tiltY: 0.5,
        turbulence: 0.15,
        startAt: 0.0,
        endAt: 0.56
      },
      shockwave: {
        enabled: true,
        rings: 3,
        startRadius: 12,
        endRadius: 88,
        thickness: 22,
        tiltY: 0.44,
        rotationDeg: 0,
        stagger: 0.08,
        dashCount: 12,
        startAt: 0.08,
        endAt: 0.94
      },
      sparks: {
        enabled: true,
        sparkCount: 26,
        shardCount: 14,
        shardShape: 'shard',
        speedMin: 140,
        speedMax: 340,
        spreadDeg: 170,
        directionDeg: -90,
        gravity: 520,
        drag: 2.2,
        sparkSize: 1.1,
        shardSize: 1.15,
        bounce: 0.42,
        startAt: 0.08,
        endAt: 1.0
      }
    }
  },

  marine_ivy_whirl: {
    id: 'marine_ivy_whirl',
    name: { es: 'Marine · ¡Torbellino Hiedra!', fr: 'Marine · Tourbillon Lierre !' },
    palette: 'emerald_ivy',
    size: 'md',
    duration: 0.82,
    seed: 314,
    sheet: { frames: 16, fps: 20, maxAtlasWidth: 2048 },
    layers: {
      core: {
        enabled: true,
        shape: 'orb',
        radius: 34,
        rays: 6,
        flareLength: 1.55,
        spinSpeed: 3.0,
        intensity: 0.95,
        followTrajectory: false,
        startAt: 0.0,
        endAt: 0.86
      },
      trail: {
        enabled: true,
        mode: 'spiral_vortex',
        radius: 70,
        arcDeg: 420,
        startDeg: 0,
        width: 19,
        length: 0.7,
        ribbons: 3,
        tiltY: 0.62,
        turbulence: 0.22,
        startAt: 0.0,
        endAt: 0.88
      },
      shockwave: {
        enabled: true,
        rings: 2,
        startRadius: 16,
        endRadius: 78,
        thickness: 15,
        tiltY: 0.56,
        rotationDeg: 8,
        stagger: 0.14,
        dashCount: 8,
        startAt: 0.05,
        endAt: 0.9
      },
      sparks: {
        enabled: true,
        sparkCount: 18,
        shardCount: 16,
        shardShape: 'leaf',
        speedMin: 95,
        speedMax: 240,
        spreadDeg: 360,
        directionDeg: 0,
        gravity: -45,
        drag: 2.6,
        sparkSize: 0.9,
        shardSize: 1.2,
        bounce: 0.0,
        startAt: 0.04,
        endAt: 1.0
      }
    }
  },

  cepi_golden_smash: {
    id: 'cepi_golden_smash',
    name: { es: 'Cepi · ¡Remate Punto de Oro!', fr: 'Cepi · Smash Point d’Or !' },
    palette: 'electric_padel',
    size: 'md',
    duration: 0.64,
    seed: 512,
    sheet: { frames: 16, fps: 25, maxAtlasWidth: 2048 },
    layers: {
      core: {
        enabled: true,
        shape: 'diamond',
        radius: 38,
        rays: 4,
        flareLength: 2.35,
        spinSpeed: 1.8,
        intensity: 1.15,
        followTrajectory: true,
        startAt: 0.0,
        endAt: 0.85
      },
      trail: {
        enabled: true,
        mode: 'projectile_lance',
        radius: 76,
        arcDeg: 140,
        startDeg: -25,
        width: 22,
        length: 0.65,
        ribbons: 2,
        tiltY: 0.7,
        turbulence: 0.18,
        startAt: 0.0,
        endAt: 0.78
      },
      shockwave: {
        enabled: true,
        rings: 2,
        startRadius: 10,
        endRadius: 74,
        thickness: 17,
        tiltY: 0.38,
        rotationDeg: 68,
        stagger: 0.07,
        dashCount: 0,
        startAt: 0.12,
        endAt: 0.92
      },
      sparks: {
        enabled: true,
        sparkCount: 28,
        shardCount: 8,
        shardShape: 'diamond',
        speedMin: 160,
        speedMax: 380,
        spreadDeg: 95,
        directionDeg: 18,
        gravity: 210,
        drag: 3.4,
        sparkSize: 1.05,
        shardSize: 0.95,
        bounce: 0.25,
        startAt: 0.1,
        endAt: 1.0
      }
    }
  },

  lale_oven_flare: {
    id: 'lale_oven_flare',
    name: { es: 'Lale · ¡Subí el Horno!', fr: 'Lale · Monte le Four !' },
    palette: 'amber_oven',
    size: 'md',
    duration: 0.78,
    seed: 909,
    sheet: { frames: 16, fps: 20, maxAtlasWidth: 2048 },
    layers: {
      core: {
        enabled: true,
        shape: 'orb',
        radius: 44,
        rays: 6,
        flareLength: 1.65,
        spinSpeed: 0.9,
        intensity: 1.1,
        followTrajectory: false,
        startAt: 0.0,
        endAt: 0.84
      },
      trail: {
        enabled: true,
        mode: 'radial_burst',
        radius: 72,
        arcDeg: 360,
        startDeg: -90,
        width: 21,
        length: 0.56,
        ribbons: 5,
        tiltY: 0.85,
        turbulence: 0.28,
        startAt: 0.02,
        endAt: 0.76
      },
      shockwave: {
        enabled: true,
        rings: 2,
        startRadius: 16,
        endRadius: 84,
        thickness: 20,
        tiltY: 0.65,
        rotationDeg: 0,
        stagger: 0.12,
        dashCount: 10,
        startAt: 0.04,
        endAt: 0.9
      },
      sparks: {
        enabled: true,
        sparkCount: 22,
        shardCount: 12,
        shardShape: 'shard',
        speedMin: 100,
        speedMax: 270,
        spreadDeg: 260,
        directionDeg: -90,
        gravity: -160,
        drag: 2.3,
        sparkSize: 1.0,
        shardSize: 1.05,
        bounce: 0.0,
        startAt: 0.03,
        endAt: 1.0
      }
    }
  },

  margot_hero_cry: {
    id: 'margot_hero_cry',
    name: { es: 'Margot · ¡Grito Heroico!', fr: 'Margot · Cri Héroïque !' },
    palette: 'heroic_coral',
    size: 'md',
    duration: 0.8,
    seed: 2026,
    sheet: { frames: 16, fps: 20, maxAtlasWidth: 2048 },
    layers: {
      core: {
        enabled: true,
        shape: 'starburst',
        radius: 40,
        rays: 6,
        flareLength: 2.0,
        spinSpeed: 2.8,
        intensity: 1.08,
        followTrajectory: false,
        startAt: 0.0,
        endAt: 0.86
      },
      trail: {
        enabled: true,
        mode: 'slash_arc',
        radius: 64,
        arcDeg: 320,
        startDeg: -160,
        width: 18,
        length: 0.72,
        ribbons: 2,
        tiltY: 0.92,
        turbulence: 0.16,
        startAt: 0.0,
        endAt: 0.8
      },
      shockwave: {
        enabled: true,
        rings: 3,
        startRadius: 12,
        endRadius: 86,
        thickness: 16,
        tiltY: 0.92,
        rotationDeg: 0,
        stagger: 0.11,
        dashCount: 16,
        startAt: 0.02,
        endAt: 0.95
      },
      sparks: {
        enabled: true,
        sparkCount: 20,
        shardCount: 14,
        shardShape: 'star',
        speedMin: 115,
        speedMax: 290,
        spreadDeg: 360,
        directionDeg: 0,
        gravity: 90,
        drag: 2.5,
        sparkSize: 1.0,
        shardSize: 1.2,
        bounce: 0.0,
        startAt: 0.03,
        endAt: 1.0
      }
    }
  }
};
