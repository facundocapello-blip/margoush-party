// Idioma del juego: español (el original) o francés (para Marine).
// Los textos se escriben en castellano en el código; este diccionario dice cómo van en francés.
// - TEXTOS: se reemplazan enteros.
// - DICHOS: lo que dicen los personajes. En francés el porteño sigue hablando en porteño
//   y abajo aparece el subtítulo en francés (el chiste está en cómo lo dicen).
// - {x} en una clave es una parte que cambia (un nombre, un número): se traduce aparte.
// Si un texto no está acá, sale tal cual (no se rompe nada).

const KEY = 'margoush3d_lang';
let lang = 'es';
try { lang = localStorage.getItem(KEY) === 'fr' ? 'fr' : 'es'; } catch (_) {}
const listeners = new Set();

export const TEXTOS = {
  // ---------- Menús ----------
  'TOCÁ PARA EMPEZAR': 'TOUCHE POUR COMMENCER',
  '▶ CONTINUAR': '▶ CONTINUER',
  '¡JUGAR!': 'JOUER !',
  '🏆 Ranking': '🏆 Classement',
  'Podio de la semana': 'Podium de la semaine',
  'Los mejores de siempre': 'Les meilleurs de tous les temps',
  'Todavía nadie en el podio. ¡El primer lugar es tuyo!': 'Personne sur le podium. La première place est à toi !',
  'Ver ranking completo': 'Voir tout le classement',
  'Idioma': 'Langue',
  'Elegí tu héroe': 'Choisis ton héros',
  'Pega fuerte': 'Frappe fort',
  '⚡ Verdades a los gritos: los vuela a todos': '⚡ Vérités en pleine face : il les fait tous voler',
  'Más rápida': 'Plus rapide',
  '⚡ ¡Hiedra!: los atrapa y te cura 🌸': '⚡ Lierre ! : il les attrape et te soigne 🌸',
  '← Volver': '← Retour',
  'Volver': 'Retour',
  'Pausa': 'Pause',
  'SEGUIR': 'CONTINUER',
  'Reintentar este tramo': 'Réessayer cette étape',
  'Salir al menú': 'Revenir au menu',
  'No pudimos iniciar el juego': 'Impossible de lancer le jeu',
  'El navegador no pudo activar los gráficos 3D.': "Le navigateur n’a pas pu activer les graphismes 3D.",
  'No se pudieron cargar los recursos del juego.': "Impossible de charger les éléments du jeu.",
  'Se interrumpieron los gráficos 3D. Recargá para volver a jugar.': "Les graphismes 3D ont été interrompus. Recharge la page pour rejouer.",
  'Reintentar': 'Réessayer',
  'Sí': 'Oui',
  'No, seguir jugando': 'Non, je continue',
  'Silenciar': 'Couper le son',
  'Poder': 'Pouvoir',
  'PODER': 'POUVOIR',
  'SALTO': 'SAUT',
  'Salto': 'Saut',
  'ESQUIVE': 'ESQUIVE',
  'Esquivar': 'Esquiver',
  'GOLPES': 'COUPS',
  'Golpe (mantené para el poder)': 'Coup (maintiens pour le pouvoir)',
  '¿Volver a arrancar desde {x}?': 'Recommencer depuis {x} ?',
  '¿Empezar todo de nuevo? Perdés lo que llevás.': 'Tout recommencer ? Tu perds ta progression.',
  '¿Salir al menú? Después podés CONTINUAR desde {x}.': 'Revenir au menu ? Tu pourras CONTINUER depuis {x}.',
  '¿Salir al menú? Perdés lo que llevás de esta partida.': 'Revenir au menu ? Tu perds cette partie.',
  '🔁 Reintentar desde {x}': '🔁 Réessayer depuis {x}',
  '🔁 Reintentar: {x}': '🔁 Réessayer : {x}',
  '🔁 Empezar de nuevo': '🔁 Recommencer',

  // ---------- Tramos y niveles ----------
  'BUENOS AIRES': 'BUENOS AIRES',
  'FRANCIA': 'FRANCE',
  'Francia': 'la France',
  'NIVEL 2 · FRANCIA': 'NIVEAU 2 · FRANCE',
  'NIVEL {n} COMPLETO': 'NIVEAU {n} TERMINÉ',
  '→ NIVEL {n}: {x}': '→ NIVEAU {n} : {x}',
  '{n} puntos': '{n} points',
  'LA FUGA DE CEPI': 'LA FUITE DE CEPI',
  'la fuga de Cepi': 'la fuite de Cepi',
  'BONUS · ¡ROMPÉ EL BYD!': 'BONUS · CASSE LA BYD !',
  'LA VEREDA': 'LE TROTTOIR',
  '¡Llegó la banda de BIG CHAKY!': 'La bande de BIG CHAKY est là !',
  'MANTECA EN LA VEREDA': 'DU BEURRE SUR LE TROTTOIR',
  'Lale y Pinky te cortan el paso.': 'Lale et Pinky te barrent la route.',
  'LA AVENIDA': "L'AVENUE",
  'Cuidado con el colectivo: no frena.': 'Attention au bus : il ne freine pas.',
  '¡PIQUETE!': 'BARRAGE !',
  'Sacá a la banda para que levanten el corte.': 'Chasse la bande pour lever le barrage.',
  '¡PASO LIBRE!': 'LA VOIE EST LIBRE !',
  'Seguí hacia el aeropuerto.': 'Continue vers l’aéroport.',
  'Deslizá el joystick a la derecha para avanzar.': 'Glisse le joystick vers la droite pour avancer.',
  'Usá la flecha derecha para avanzar.': 'Utilise la flèche droite pour avancer.',
  '¡LLEGAMOS A LE CONCEPT!': 'ON ARRIVE AU CONCEPT !',
  'La banda copó la puerta del restaurante.': "La bande bloque l'entrée du restaurant.",
  'LA RUE': 'LA RUE',
  '¡La banda te siguió hasta Francia!': "La bande t'a suivi jusqu'en France !",
  'PELOTAZOS': 'BALLES DE PADEL',
  'Cepi y Lale tiran desde lejos: acercate rápido.': 'Cepi et Lale tirent de loin : approche-toi vite.',
  'LE BOULEVARD': 'LE BOULEVARD',
  '¡Ojo! Viene el hermano de Facu…': 'Attention ! Voilà le frère de Facu…',
  'ÚLTIMO TRAMO': 'DERNIÈRE ÉTAPE',
  'Atrás de esta barrera está el galpón.': "L'entrepôt est derrière cette barrière.",

  // ---------- Malos (presentación) ----------
  'LALE «MANTECOSO»': 'LALE « LE BEURRÉ »',
  'CEPI «EL NIÑO»': 'CEPI « LE GAMIN »',
  '😡 CEPI «EL NIÑO» (JEFE)': '😡 CEPI « LE GAMIN » (BOSS)',
  'PINKY «EL TRAPITO»': 'PINKY « EL TRAPITO »',
  'Tira barras de manteca: ¡no las pises!': 'Il lance du beurre : ne marche pas dessus !',
  'Te tira pelotazos de pádel: movete de la sombra.': "Il t'envoie des balles de padel : sors de l'ombre au sol.",
  'El hermano de Facu vino re caliente: ¡aguantalo!': 'Le frère de Facu est furax : tiens bon !',
  'Te quiere cobrar el estacionamiento: si te pega, te saca plata.': "Il veut te faire payer le parking : s'il te touche, il te prend des sous.",
  'BIG CHAKY': 'BIG CHAKY',
  '🔵🟡 PINKY': '🔵🟡 PINKY',

  // ---------- Historia ----------
  '¡BIG CHAKY SE LLEVÓ A MARGOT!': 'BIG CHAKY A ENLEVÉ MARGOT !',
  '¡Rescatala antes de que llegue al galpón!': "Sauve-la avant qu'il arrive à l'entrepôt !",
  '🎉 ¡MARGOT ESTÁ A SALVO!': '🎉 MARGOT EST SAUVÉE !',
  '¡Un aplauso para {x}!': 'Bravo, {x} !',
  '📸 ¡FOTO FAMILIAR!': '📸 PHOTO DE FAMILLE !',

  // ---------- Poderes y golpes ----------
  '¡VERDADES A LOS GRITOS!': 'VÉRITÉS EN PLEINE FACE !',
  'La verdad duele: todo vuela por el aire.': 'La vérité fait mal : tout s’envole.',
  '¡HIEDRA!': 'LIERRE !',
  '¡HIEDRA! OH LÀ LÀ !': 'LIERRE ! OH LÀ LÀ !',
  'La hiedra atrapa todo lo que viene.': 'Le lierre attrape tout ce qui arrive.',
  '⚡ ¡PODER LISTO!': '⚡ POUVOIR PRÊT !',
  '⚡ ¡LISTO!': '⚡ PRÊT !',
  '⚡ ¡LISTO! (L)': '⚡ PRÊT ! (L)',
  '⚡ ¡PODER LISTO!': '⚡ POUVOIR PRÊT !',
  '⚡ ¡PODER LISTO! (L)': '⚡ POUVOIR PRÊT ! (L)',
  '⚡ ¡PODER!': '⚡ POUVOIR !',
  '⚡ ¡PODER LISTO! Mantené 👊': '⚡ POUVOIR PRÊT ! Garde 👊 appuyé',
  '🔋 BYD de Cepi': '🔋 BYD de Cepi',
  'Cargá el poder pegando 👊': 'Frappe pour charger le pouvoir 👊',
  '🌺 ¡QUÉ LINDA!': '🌺 QU’ELLE EST JOLIE !',
  '¡VERDAD!': 'VÉRITÉ !',
  '¡JUSTO!': 'PILE !',
  '¡RESBALÓN!': 'ÇA GLISSE !',
  '¡TOMÁ!': 'TIENS !',
  '¡PLAF!': 'PLAF !',
  '¡BOM!': 'BOUM !',
  '¡PAF!': 'PAF !',
  '¡PUM! +{n}': 'BOUM ! +{n}',
  '¡AHÍ VOY!': "J'ARRIVE !",
  '-${n} ¡ESTACIONAMIENTO!': '-${n} PARKING !',
  '¡UFF! 🌀': 'OUF ! 🌀',
  '¡SECRETO! +500': 'SECRET ! +500',
  '🌟 SECRETO': '🌟 SECRET',
  'Encontraste el Pasaje del Cortado: +500 puntos.': 'Tu as trouvé le Passage du Cortado : +500 points.',
  '🚌 ¡BOCINAZO!': '🚌 COUP DE KLAXON !',
  '🐦 ¡PALOMAS!': '🐦 PIGEONS !',
  '¡SPLASH!': 'SPLASH !',
  '¡BACHE!': 'NID-DE-POULE !',
  '¡QUEMA!': 'ÇA BRÛLE !',

  // ---------- Persecución y bonus ----------
  'BYD de Cepi': 'BYD de Cepi',
  'EL BYD DE CEPI': 'LA BYD DE CEPI',
  '¡CURRUCUCÚ!': 'ROUCOULE !',
  '¡PALOMAS!': 'PIGEONS !',
  '¡LA GRÈVE!': 'LA GRÈVE !',
  '¡PELOTAZO!': 'BALLE DE PADEL !',
  '¡SIN BATERÍA!': 'PLUS DE BATTERIE !',
  '¡SE QUEDÓ SIN BATERÍA!': 'PLUS DE BATTERIE !',
  'El BYD de Cepi se apaga en el cargador…': 'La BYD de Cepi s’éteint sur la borne…',
  '«¡Es eléctrico, papá!» Cepi se baja con la paleta: sacale la llave.': '« ¡Es eléctrico, papá! » Cepi descend avec sa raquette : prends-lui la clé.',
  '¡ESQUIVE JUSTO!': 'ESQUIVE PARFAITE !',
  '¡ALCANZASTE A CEPI! +{n}': 'TU AS RATTRAPÉ CEPI ! +{n}',

  // ---------- Fin de partida y ranking ----------
  '¡MARGOT ESTÁ A SALVO!': 'MARGOT EST SAUVÉE !',
  '¡Margot te sigue esperando!': "Margot t'attend toujours !",
  'Pelea y objetos': 'Combat et objets',
  'Bonus por vida': 'Bonus de vie',
  'Bonus por tiempo': 'Bonus de temps',
  'PUNTAJE': 'SCORE',
  'Tu apodo': 'Ton pseudo',
  'Guardar puntaje': 'Enregistrer le score',
  'Guardando…': 'Enregistrement…',
  '¡Guardado!': 'Enregistré !',
  'Guardado en el celular': 'Gardé sur le téléphone',
  'No se pudo guardar.': "Impossible d'enregistrer.",
  'Sin puntos todavía': 'Pas encore de points',
  'Poné un apodo para entrar al ranking.': 'Mets un pseudo pour entrer dans le classement.',
  'Poné un apodo.': 'Mets un pseudo.',
  'Héroe inválido.': 'Héros invalide.',
  'Puntaje inválido.': 'Score invalide.',
  '¡Listo! Ya estás en el ranking de la familia.': "C'est fait ! Tu es dans le classement de la famille.",
  'Sin conexión: tu puntaje quedó guardado en este celular': 'Hors ligne : ton score est gardé sur ce téléphone',
  'Sin conexión: mostrando los puntajes de este celular': 'Hors ligne : scores de ce téléphone',
  'Empezar de cero': 'Recommencer à zéro',
  'Jugar de nuevo': 'Rejouer',
  '🏆 Ver ranking': '🏆 Voir le classement',
  'Menú': 'Menu',
  '📸 Guardar la foto': '📸 Garder la photo',
  'MARGOUSH: ¡Margot está a salvo!': 'MARGOUSH : Margot est sauvée !',
  'Foto familiar del rescate': 'Photo de famille du sauvetage',
  'Cepi, enojado': 'Cepi, fâché',
  '🏆 Ranking de la familia': '🏆 Classement de la famille',
  'Esta semana': 'Cette semaine',
  'Histórico': 'Depuis toujours',
  'Cargando…': 'Chargement…',
  'Apodo': 'Pseudo',
  'Héroe': 'Héros',
  'Puntaje': 'Score',
  'Fecha': 'Date',
  'Todavía no hay puntajes. ¡Sé el primero!': 'Pas encore de scores. Sois le premier !',
  'Ranking en línea': 'Classement en ligne',
  // ---------- Nivel 1: Cepi se lleva a Margot, persecución y mini nivel del BYD ----------
  '¡CEPI SE LLEVÓ A MARGOT!': 'CEPI A ENLEVÉ MARGOT !',
  '¡Se escapa en su BYD! ¡Perseguilo!': "Il s'enfuit dans sa BYD ! Poursuis-le !",
  '¡ROMPÉ EL BYD!': 'CASSE LA BYD !',
  'el BYD de Cepi': 'la BYD de Cepi',
  'la calle porteña': 'la rue de Buenos Aires',
  'NIVEL 1 · BUENOS AIRES': 'NIVEAU 1 · BUENOS AIRES',
  'NIVEL 1 · BUENOS AIRES': 'NIVEAU 1 · BUENOS AIRES',
  '¡OTRA VEZ!': 'ENCORE UNE FOIS !',
  'CARGA DEL BYD': 'CHARGE DE LA BYD',
  '¡CEPI SE LLEVA A MARGOT!': 'CEPI EMMÈNE MARGOT !',
  'Corre al galpón de BIG CHAKY. ¡Seguilo por Buenos Aires!': "Il court à l'entrepôt de BIG CHAKY. Suis-le dans Buenos Aires !",
  '¡PIQUETE!': 'BARRAGE !',
  // ---------- Escenas animadas y aeropuerto ----------
  'LE CONCEPT': 'LE CONCEPT',
  'Domingo en Buenos Aires': 'Dimanche à Buenos Aires',
  '¡Salí a buscarla!': 'Pars à sa recherche !',
  '¡SEGUÍ AL BYD!': 'SUIS LA BYD !',
  'Deslizá para cambiar de carril': 'Glisse pour changer de voie',
  'Tocá para saltar': 'Touche pour sauter',
  'Cambiá de carril': 'Change de voie',
  'Saltá': 'Saute',
  'Se está quedando sin batería: no lo pierdas hasta el cargador 🔌': 'Sa batterie se vide : ne la lâche pas jusqu’au chargeur 🔌',
  'SALTAR ⏭': 'PASSER ⏭',
  'BIG CHAKY SE LLEVA A MARGOT A FRANCIA': 'BIG CHAKY EMMÈNE MARGOT EN FRANCE',
  '¡Corré al aeropuerto antes de que despegue! ✈': "Cours à l'aéroport avant qu'il décolle ! ✈",
  '¡ÚLTIMA PARADA: EL AEROPUERTO!': "DERNIER ARRÊT : L'AÉROPORT !",
  'La banda no te deja subir al avión.': "La bande t'empêche de monter dans l'avion.",
  'NIVEL 2: FRANCIA': 'NIVEAU 2 : FRANCE',
  // ---------- Campaña de 4 actos y arenas (Cepi, Lale, Pinky) ----------
  'ACTO 1 · BUENOS AIRES': 'ACTE 1 · BUENOS AIRES',
  'Acto 1 · Buenos Aires': 'Acte 1 · Buenos Aires',
  'JEFE 1 · BIG CHAKY': 'BOSS 1 · BIG CHAKY',
  'ACTO 2 · ¡SEGUÍ AL BYD!': 'ACTE 2 · SUIS LA BYD !',
  'Acto 2 · Persecución BYD': 'Acte 2 · Poursuite BYD',
  'ACTO 2 · ¡ROMPÉ EL BYD!': 'ACTE 2 · CASSE LA BYD !',
  'JEFE 2 · CEPI «EL NIÑO»': 'BOSS 2 · CEPI « LE GAMIN »',
  'Cepi (Pádel)': 'Cepi (Padel)',
  'ACTO 3 · FRANCIA (LE BLÉ)': 'ACTE 3 · FRANCE (LE BLÉ)',
  'Acto 3 · Francia': 'Acte 3 · France',
  'JEFE 3 · LALE «MANTECOSO»': 'BOSS 3 · LALE « LE BEURRÉ »',
  'Lale (Le Blé)': 'Lale (Le Blé)',
  'ACTO 4 · CAMINO AL GALPÓN': "ACTE 4 · VERS L'ENTREPÔT",
  'Acto 4 · Galpón': 'Acte 4 · Entrepôt',
  'JEFE FINAL · PINKY': 'BOSS FINAL · PINKY',
  'Pinky (Final)': 'Pinky (Final)',
  // Arena de Cepi
  'FASE 1 · 🎾': 'PHASE 1 · 🎾',
  '¡SAQUE Y REMATE!': 'SERVICE ET SMASH !',
  'Devolvé la dorada o pegale cuando se cansa': "Renvoie la balle dorée ou frappe-le quand il s'essouffle",
  'FASE 2 · ↔️': 'PHASE 2 · ↔️',
  'DUELO DE LA FLECHITA': 'DUEL DE LA FLÈCHE',
  '¡Esquivá al lado CONTRARIO al que apunta!': "Esquive du côté OPPOSÉ à celui qu'il vise !",
  'FASE 3 · 📦': 'PHASE 3 · 📦',
  '¡SEÑUELOS DE CARTÓN!': 'LEURRES EN CARTON !',
  'Volteá los cartones y pegale al Cepi real': 'Fais tomber les cartons et frappe le vrai Cepi',
  '¿PARA DÓNDE SACA?…': 'DE QUEL CÔTÉ VA-T-IL SERVIR ?…',
  '¡SACA A LA IZQ! → ANDÁ A LA DER': 'IL SERT À GAUCHE ! → VA À DROITE',
  '¡SACA A LA DER! ← ANDÁ A LA IZQ': 'IL SERT À DROITE ! ← VA À GAUCHE',
  '¡CORRÉ A LA DERECHA! →': 'COURS À DROITE ! →',
  '← ¡CORRÉ A LA IZQUIERDA!': '← COURS À GAUCHE !',
  '¡BIEN ESQUIVADO!': 'BIEN ESQUIVÉ !',
  '¡PELOTAZO!': 'EN PLEIN DEDANS !',
  '¡VIDRIO!': 'VITRE !',
  '¡PUNTO DE ORO!': 'POINT EN OR !',
  '¡DEVUELTA!': 'RENVOYÉE !',
  '¡BLOQUEO!': 'BLOQUÉ !',
  '¡CARTÓN!': 'CARTON !',
  '¡ATURDIDO! ¡PEGALE!': 'ÉTOURDI ! FRAPPE-LE !',
  '¡CANSADO! ¡PEGALE!': 'FATIGUÉ ! FRAPPE-LE !',
  '¡ESQUIVE PERFECTO!': 'ESQUIVE PARFAITE !',
  '¡TE AGARRÓ!': 'TOUCHÉ !',
  '¿CUÁL ES EL REAL?': 'LEQUEL EST LE VRAI ?',
  // Arena de Lale
  'FASE 1 · 🧈': 'PHASE 1 · 🧈',
  '¡MANTECA PARA TODOS!': 'DU BEURRE POUR TOUT LE MONDE !',
  'Pegale a la bolsa de harina para enharinarlo': 'Frappe le sac de farine pour le couvrir de farine',
  'FASE 2 · ⛸️': 'PHASE 2 · ⛸️',
  '¡PATINANDO EN MANTECA!': 'PATINAGE SUR BEURRE !',
  'Esquivá sus pasadas y tirale harina': 'Esquive ses passages et couvre-le de farine',
  'FASE 3 · 🔥': 'PHASE 3 · 🔥',
  '¡SUBÍ EL HORNO!': 'MONTE LE FOUR !',
  '¡Manteca, patín y harina a toda máquina!': 'Beurre, glisse et farine à fond !',
  '¡A PATINAR!': 'EN GLISSE !',
  '¡HARINA!': 'FARINE !',
  '¡ENHARINADO! ¡PEGALE!': 'ENFARINÉ ! FRAPPE-LE !',
  '¡MUY MANTECOSO! ¡USÁ HARINA!': 'TROP GLISSANT ! UTILISE LA FARINE !',
  // Arena final de Pinky + Margot
  'FASE 1 · 🚗': 'PHASE 1 · 🚗',
  '¡DALE, DALE, QUE ENTRA!': 'ALLEZ, RECULE, ÇA PASSE !',
  'Esquivá los autos y pegale cuando cobra': "Esquive les voitures et frappe-le quand il encaisse",
  'FASE 2 · 🌙': 'PHASE 2 · 🌙',
  '¡TARIFA NOCTURNA!': 'TARIF DE NUIT !',
  'Entran de a dos: buscá el cajón libre': 'Deux voitures à la fois : trouve la place libre',
  'FASE 3 · 👶': 'PHASE 3 · 👶',
  '¡REMATE CON MARGOT!': 'COUP FINAL AVEC MARGOT !',
  '¡Tocá a Margot para su grito supersónico!': 'Touche Margot pour son cri supersonique !',
  '👶 ¡GRITO DE MARGOT!': '👶 CRI DE MARGOT !',
  '¡ESTÁ COBRANDO! ¡PEGALE!': 'IL ENCAISSE ! FRAPPE-LE !',
  '¡ESPERÁ QUE COBRE!': "ATTENDS QU'IL ENCAISSE !",
  '👶 ¡MARGOT ESTÁ LISTA!': '👶 MARGOT EST PRÊTE !',
  '👶 ¡BUAAAAAÁ! 💥': '👶 OUINNNNN ! 💥',
};

export const DICHOS = {
  // Cepi
  '¡Me tenés podrido!': 'Tu me saoules !',
  '¡Tomá, pelotazo!': 'Tiens, prends ça !',
  '¡Dale que es fácil, che!': "Allez, c'est facile !",
  '¡Dale, que es fácil, che!': "Allez, c'est facile !",
  '¡Andá a jugar a la bolita!': 'Va jouer aux billes !',
  '¡Te voy a acusar con mamá!': 'Je vais le dire à maman !',
  '¡¿Perdiste?! ¡No te lo puedo creer!': "T'as perdu ?! J'y crois pas !",
  '¡Hasta Margot lo hacía mejor!': 'Même Margot ferait mieux !',
  '¡Mi BYD no!': 'Pas ma BYD !',
  '¡Lo tengo en cuotas!': 'Je la paie encore à crédit !',
  '¡Es eléctrico, papá!': 'Elle est électrique, mec !',
  '¡Le bajás la batería!': 'Tu vides la batterie !',
  '¡Ni lo terminé de pagar!': "Je l'ai même pas finie de payer !",
  '¡MI BYD! ¡Lo llevo al taller en Francia!': "MA BYD ! Je l'emmène au garage en France !",
  '¡Jaja! ¡Ni un rayón le hiciste!': 'Haha ! Pas une égratignure !',
  '¡Jaja! ¡Casi, casi!': 'Haha ! Presque, presque !',
  '¡Bueno, ganaste… esta vez!': "Bon, t'as gagné… pour cette fois !",
  '¡Uf, uf…!': 'Pff, pff… !',
  '¡Cepi prepara el saque!': 'Cepi prépare son service !',
  // Pinky
  '¿Te lo cuido, jefe?': 'Je vous la surveille, chef ?',
  '¡Son 2 lucas, maestro!': "C'est 2 000 pesos, mon pote !",
  '¡Dale que te lo lavo!': 'Allez, je vous la lave !',
  '¡Acá se paga por adelantado!': "Ici, on paie d'avance !",
  '¡Aguante Boca!': 'Allez Boca !',
  '¡Aguantá que te ayudo!': "Tiens bon, je t'aide !",
  '📻 ¡GOOOL DE BOCA!': '📻 BUUUT DE BOCA !',
  '¡Me voy a la cancha!': 'Je file au stade !',
  '¡Aguante Margot! (el estacionamiento va de onda)': "Allez Margot ! (le parking, c'est cadeau)",
  // Lale
  '¡Bravo! ¡Tomen manteca de regalo!': 'Bravo ! Du beurre en cadeau !',
  // BIG CHAKY
  '¡Tomá, barrilito!': 'Tiens, un petit tonneau !',
  '¡Me devolviste el barril, atrevido!': "Tu m'as renvoyé le tonneau, insolent !",
  '¡Ahora sí me enojé!': 'Là, je suis vraiment fâché !',
  '¡Soltá, soltá!': 'Lâche, lâche !',
  '¡Eso no vale!': 'Ça compte pas !',
  // BIG CHAKY: voces nuevas (voice.js) y «Chaky dice»
  '¡Soy BIG CHAKY… y traje barriles!': "Je suis BIG CHAKY… et j'ai des tonneaux !",
  '¡Ahí va otro!': 'Et un autre !',
  '¡Atajá esta!': 'Attrape celui-là !',
  '¡Ey, ese era mío!': "Hé, c'était le mien !",
  '¡Auch, mi panza!': 'Aïe, mon ventre !',
  '¡Ese me dolió en el alma!': "Celui-là m'a fait mal au cœur !",
  '¡Muy lento, campeón!': 'Trop lent, champion !',
  '¡Barril 1, vos 0!': 'Tonneau 1, toi 0 !',
  '¡Chaky dice… hacé lo que dice el cartel!': 'Chaky dit… fais ce que dit le panneau !',
  '¡Uh, le pegaste!': 'Oh, bien vu !',
  '¡Bien, eh!': 'Pas mal, hein !',
  '¡Jua! ¡Caíste!': 'Ha ! Tu es tombé dans le piège !',
  '¡Leé el cartel, campeón!': 'Lis le panneau, champion !',
  '¡Barril gigante!': 'Tonneau géant !',
  '¡Soltá, soltá, soltá!': 'Lâche, lâche, lâche !',
  '¡Esto no termina acá! ¡Nos vemos en Francia!': 'Ça ne finit pas ici ! On se voit en France !',
  '¡SALTÁ!': 'SAUTE !',
  '¡PIÑA!': 'COGNE !',
  '¡ESQUIVÁ!': 'ESQUIVE !',
  '¡QUIETO!': 'BOUGE PAS !',
  'FASE 1': 'PHASE 1', 'FASE 2': 'PHASE 2', 'FASE 3': 'PHASE 3',
  '¡BARRILES!': 'TONNEAUX !', 'Devolvele los dorados 👊': 'Renvoie-lui les dorés 👊',
  '¡CHAKY DICE!': 'CHAKY DIT !', 'Hacé lo que dice el cartel': 'Fais ce que dit le panneau',
  '¡ENOJADO!': 'FURIEUX !', 'Pegale a la mano trabada 👊': 'Frappe la main coincée 👊',
  '¡BIEN!': 'BRAVO !', '¡NO!': 'NON !',
  '¡PERFECTO!': 'PARFAIT !', '¡FALLÓ!': 'RATÉ !', 'Tocá cada flecha cuando llega arriba': 'Touche chaque flèche quand elle arrive en haut',
  'Tocá cada botón cuando baja la flecha': 'Touche chaque bouton quand la flèche arrive en bas',
  'RONDA 1': 'MANCHE 1', 'RONDA 2': 'MANCHE 2', 'RONDA 3': 'MANCHE 3',
  '¡DUELO DE BAILE!': 'DUEL DE DANSE !', '¡SUBE EL RITMO!': 'LE RYTHME MONTE !', '¡FINAL A TODO DISCO!': 'FINALE DISCO À FOND !',
  '⭐ ¡VIDA EXTRA! ¡SEGUÍ BAILANDO!': '⭐ VIE BONUS ! CONTINUE DE DANSER !',
  '⭐ ¡VIDA EXTRA!': '⭐ VIE BONUS !',
  '¡Perdiste el compás!': 'Tu as perdu le rythme !',
  '¡Alcanzá a BIG CHAKY rumbo al aeropuerto!': "Rattrape BIG CHAKY en route vers l'aéroport !",
  'Te daré a Margoth, sólo si puedes vencerme en...': 'Je te rendrai Margoth, seulement si tu me bats à...',
  '¡La prueba de Baile!': "L'épreuve de danse !",
  'Tocá para empezar': 'Touche pour commencer',
  '¡SALTO!': 'SAUT !', '¡GIRO!': 'TOURNE !', '¡TU TURNO!': 'À TOI !',
  '¡CLASE DE BAILE!': 'COURS DE DANSE !', '«Si querés a Margot, vas a tener que seguirme el ritmo»': '« Si tu veux Margot, tu vas devoir suivre mon rythme »',
  'Mirá los pasos y repetilos': 'Regarde les pas et répète-les',
  '¡Si querés a Margot, vas a tener que seguirme el ritmo!': 'Si tu veux Margot, tu vas devoir suivre mon rythme !',
  '¡Y uno, y dos…!': 'Et un, et deux… !', '¡Mirá y aprendé!': 'Regarde et apprends !', '¡Atenti a la cadera!': 'Attention aux hanches !',
  '¡Esa cadera!': 'Ces hanches !', '¡Con onda, eh!': 'Avec style, hein !', '¡Mirá vos, sabe bailar!': 'Tiens, il sait danser !',
  '¡Te falta calle, campeón!': 'Il te manque de la pratique, champion !', '¡Eso no es bailar!': "Ça, ce n'est pas danser !", '¡Dos pies izquierdos!': 'Deux pieds gauches !',
  // Margot y BIG CHAKY cuando cruzan al fondo
  '¡Papááá!': 'Papaaa !',
  '¡Jua, jua, jua!': 'Mouahaha !',
  // Douge: verdades a los gritos
  '¡ESTÁS PELADO!': "T'ES CHAUVE !",
  '¡ESO NO ES UN ASADO!': "ÇA, C'EST PAS UN ASADO !",
  '¡TU EQUIPO SE VA A LA B!': 'TON ÉQUIPE VA DESCENDRE !',
  '¡TENÉS OLOR A PATA!': 'TU PUES DES PIEDS !',
  '¡NO SABÉS PEGAR!': 'TU SAIS PAS FRAPPER !',
  '¡TU VIEJA TE VISTE!': "C'EST TA MÈRE QUI T'HABILLE !",
  '¡CORRÉS COMO PATO!': 'TU COURS COMME UN CANARD !',
  '¡Jua! ¡Me la llevo!': 'Ha ! Je l’emmène !',
  '¡MI BYD! ¡Me llevo a Margot igual!': 'MA BYD ! J’emmène Margot quand même !',
  '¡Cargado! ¡Casi, casi!': 'Chargée ! Presque, presque !',
  '¡Jaja! ¡100 %, me voy!': 'Haha ! 100 %, je file !',
  '¡AY! ¡Me desenchufaste!': 'AÏE ! Tu m’as débranché !',
  '¡El cable no!': 'Pas le câble !',
  '¡Mamááá!': 'Mamaaan !',
  '¡Enchufado de nuevo!': 'Rebranché !',
  '¡Ya casi carga!': 'Elle est presque chargée !',
  '¡Cargá, cargá, cargá!': 'Charge, charge, charge !',
  '¡Qué lindo domingo, Margot!': 'Quel beau dimanche, Margot !',
  '¡Ajó, ajó!': 'Areuh, areuh !',
  '¡Esa bebé va a ser mía! ¡Jua, jua, jua!': 'Ce bébé sera à moi ! Mouahaha !',
  '¡Les pago lo que quieran! ¡Tráiganmela!': 'Je vous paie ce que vous voulez ! Ramenez-la-moi !',
  '💵 ¡Estacionamiento pago!': '💵 Parking payé !',
  '🧈 ¡Manteca de por vida!': '🧈 Du beurre à vie !',
  '🔌 ¡Un cargador para mi BYD!': '🔌 Un chargeur pour ma BYD !',
  '¡Gracias, Niño! ¡A Margot me la llevo a Francia!': "Merci, gamin ! J'emmène Margot en France !",
  '¡Me rompiste el BYD! ¡Ahora es personal!': "Tu as cassé ma BYD ! Maintenant c'est personnel !",
};

// Plantillas ({x}, {n}) armadas una sola vez
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const PLANTILLAS = Object.keys(TEXTOS).filter(k => /\{[a-z]\}/.test(k)).map(k => {
  const names = [...k.matchAll(/\{([a-z])\}/g)].map(m => m[1]);
  const re = new RegExp('^' + k.split(/\{[a-z]\}/).map(esc).join('(.+?)') + '$');
  return { re, names, fr: TEXTOS[k] };
});

export function getLang() { return lang; }
export function setLang(l) {
  const next = l === 'fr' ? 'fr' : 'es';
  if (next === lang) return;
  lang = next;
  try { localStorage.setItem(KEY, lang); } catch (_) {}
  document.documentElement.lang = lang;
  listeners.forEach(fn => { try { fn(lang); } catch (_) {} });
}
export function onLangChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// Traduce un texto escrito en castellano (si estamos en francés)
export function tr(s) {
  if (lang === 'es' || typeof s !== 'string' || !s) return s;
  if (Object.prototype.hasOwnProperty.call(TEXTOS, s)) return TEXTOS[s];
  if (Object.prototype.hasOwnProperty.call(DICHOS, s)) return DICHOS[s];
  for (const p of PLANTILLAS) {
    const m = s.match(p.re);
    if (m) {
      let out = p.fr;
      p.names.forEach((n, i) => { out = out.replace('{' + n + '}', tr(m[i + 1])); });
      return out;
    }
  }
  return s;
}

// Pone un texto en un elemento. Si es algo que dice un personaje y estamos en francés,
// queda en castellano y abajo va el subtítulo en francés.
export function fillText(el, s) {
  if (lang === 'fr' && typeof s === 'string' && Object.prototype.hasOwnProperty.call(DICHOS, s)) {
    el.textContent = s;
    const sub = document.createElement('small');
    sub.className = 'sub';
    sub.textContent = DICHOS[s];
    el.append(sub);
    return;
  }
  el.textContent = tr(s);
}

// Textos fijos del HTML (menús, botones): guarda el original y lo traduce cada vez que cambia el idioma
const ORIG = new WeakMap();
const ATTRS = ['aria-label', 'alt', 'placeholder'];
export function translateDom(root = document.body) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    if (n.parentElement?.closest('script,style,#labels,#banner,#hud-score,#hud-mult,#hud-hearts,#combo-num,#continue-where,#pause-confirm-text,#level-card,#curtain')) continue;
    const raw = n.nodeValue;
    if (!raw.trim()) continue;
    if (!ORIG.has(n)) ORIG.set(n, raw);
    const o = ORIG.get(n);
    const lead = o.match(/^\s*/)[0], trail = o.match(/\s*$/)[0];
    n.nodeValue = lead + tr(o.trim()) + trail;
  }
  root.querySelectorAll('[aria-label],[alt],[placeholder]').forEach(el => {
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const key = 'data-i18n-' + a;
      if (!el.hasAttribute(key)) el.setAttribute(key, el.getAttribute(a));
      el.setAttribute(a, tr(el.getAttribute(key)));
    }
  });
}
