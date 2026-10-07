// =====================================================================
// I18N — TƏRCÜMƏ SİSTEMİ
// Yalnız tərcümə datası və t() funksiyası. Heç bir DOM manipulyasiyası yoxdur.
// UI yenilənməsi üçün `setOnLanguageChanged` callback-i istifadə olunur.
// =====================================================================

import { LANG_STORAGE_KEY } from './config.js';

export const TRANSLATIONS = {
    en: {
        'menu.selectLanguage': 'SELECT LANGUAGE', 'menu.startGame': 'START GAME', 'menu.lang': 'LANG', 'menu.shop': 'SHOP', 'menu.settings': 'SETTINGS',
        'menu.watchAdGold': '📺 Watch Ad for {n} 🪙', 'menu.watchAdCooldown': '⏳ Available in {n}s',
        'setup.title': 'GAME SETUP', 'setup.gameMode': 'GAME MODE', 'setup.mode2p': '2 Players', 'setup.modeAi': 'Vs CPU',
        'setup.aiDifficulty': 'AI DIFFICULTY', 'setup.diffEasy': 'Easy', 'setup.diffNormal': 'Normal', 'setup.diffHard': 'Hard',
        'setup.arenaType': 'ARENA TYPE', 'setup.arenaCircle': 'Circle', 'setup.arenaSquare': 'Square', 'setup.arenaRamp': 'Ramp',
        'setup.winningScore': 'WINNING SCORE', 'setup.pts5': '5 Pts', 'setup.pts10': '10 Pts', 'setup.pts15': '15 Pts', 'setup.pts20': '20 Pts',
        'setup.mainMenu': 'Main Menu', 'setup.next': 'NEXT ➔',
        'custom.title': 'CHARACTER CUSTOMIZATION', 'custom.player1': 'PLAYER 1 (BLUE)', 'custom.player2': 'PLAYER 2 (RED)',
        'custom.selectHat': 'Select Hat', 'custom.selectGlassesFace': 'Select Glasses / Face', 'custom.selectGlasses': 'Select Glasses',
        'custom.aiRandomMsg': '🎲 Random Cosmetics Auto-Assigned!', 'custom.back': '⬅ BACK', 'custom.fight': 'FIGHT!',
        'hud.player1': 'PLAYER 1', 'hud.player2': 'PLAYER 2', 'hud.controlsP1': 'WASD | Dash: Space', 'hud.controlsP2': 'Arrows | Dash: Enter',
        'ctrl.muteSfx': 'Mute Sound Effects', 'ctrl.muteMusic': 'Mute Music', 'ctrl.pause': 'Pause',
        'mobile.dash': 'DASH', 'mobile.rotateTitle': 'Please Rotate Your Device', 'mobile.rotateSubtitle': 'Bumper Crash 3D plays best in landscape mode',
        'victory.matchOver': 'MATCH OVER!', 'victory.wins': 'WINS!', 'victory.levelUp': '🎉 LEVEL UP! You are now Level',
        'victory.doubleGold': '📺 2x GOLD', 'victory.doubleXp': '📺 2x XP', 'victory.doubled': '✓ DOUBLED',
        'victory.rematch': 'REMATCH', 'victory.mainMenu': 'MAIN MENU',
        'pause.title': 'GAME PAUSED', 'pause.resume': 'RESUME', 'pause.settings': 'SETTINGS', 'pause.mainMenu': 'MAIN MENU',
        'settings.title': 'SETTINGS', 'settings.musicVolume': 'MUSIC VOLUME', 'settings.sfxVolume': 'SFX VOLUME',
        'settings.dangerZone': 'DANGER ZONE', 'settings.resetProgress': 'RESET PROGRESS',
        'settings.resetWarning': 'Wipes your level, XP, gold and every unlocked item. Cannot be undone.',
        'settings.resetConfirm': 'Reset ALL progress?\n\nThis wipes your level, XP, gold, and every unlocked hat, glasses, and cosmetic effect - back to a brand new save. This cannot be undone.',
        'settings.back': '⬅ BACK',
        'shop.title': '🛍️ MARKET', 'shop.yourBalance': 'YOUR BALANCE', 'shop.cosmeticEffects': 'COSMETIC EFFECTS',
        'shop.tapHint': '(tap to preview, tap again to buy)', 'shop.player1': 'PLAYER 1', 'shop.player2': 'PLAYER 2',
        'shop.hats': 'HATS', 'shop.glasses': 'GLASSES', 'shop.unlockHint': '(unlock by leveling up)', 'shop.back': '⬅ BACK',
        'shop.tapToBuy': 'TAP TO BUY', 'shop.owned': 'OWNED ✓', 'shop.lvAbbr': 'Lv',
        'ai.bot': 'AI BOT'
    },
    es: {
        'menu.selectLanguage': 'SELECCIONAR IDIOMA', 'menu.startGame': 'JUGAR', 'menu.lang': 'IDIOMA', 'menu.shop': 'TIENDA', 'menu.settings': 'AJUSTES',
        'menu.watchAdGold': '📺 Ver Anuncio por {n} 🪙', 'menu.watchAdCooldown': '⏳ Disponible en {n}s',
        'setup.title': 'CONFIGURAR PARTIDA', 'setup.gameMode': 'MODO DE JUEGO', 'setup.mode2p': '2 Jugadores', 'setup.modeAi': 'Vs CPU',
        'setup.aiDifficulty': 'DIFICULTAD DE IA', 'setup.diffEasy': 'Fácil', 'setup.diffNormal': 'Normal', 'setup.diffHard': 'Difícil',
        'setup.arenaType': 'TIPO DE ARENA', 'setup.arenaCircle': 'Círculo', 'setup.arenaSquare': 'Cuadrado', 'setup.arenaRamp': 'Rampa',
        'setup.winningScore': 'PUNTUACIÓN PARA GANAR', 'setup.pts5': '5 Pts', 'setup.pts10': '10 Pts', 'setup.pts15': '15 Pts', 'setup.pts20': '20 Pts',
        'setup.mainMenu': 'Menú Principal', 'setup.next': 'SIGUIENTE ➔',
        'custom.title': 'PERSONALIZACIÓN DE PERSONAJE', 'custom.player1': 'JUGADOR 1 (AZUL)', 'custom.player2': 'JUGADOR 2 (ROJO)',
        'custom.selectHat': 'Elegir Sombrero', 'custom.selectGlassesFace': 'Elegir Gafas / Cara', 'custom.selectGlasses': 'Elegir Gafas',
        'custom.aiRandomMsg': '🎲 ¡Cosméticos Aleatorios Asignados!', 'custom.back': '⬅ ATRÁS', 'custom.fight': '¡LUCHA!',
        'hud.player1': 'JUGADOR 1', 'hud.player2': 'JUGADOR 2', 'hud.controlsP1': 'WASD | Impulso: Espacio', 'hud.controlsP2': 'Flechas | Impulso: Enter',
        'ctrl.muteSfx': 'Silenciar Efectos', 'ctrl.muteMusic': 'Silenciar Música', 'ctrl.pause': 'Pausa',
        'mobile.dash': 'IMPULSO', 'mobile.rotateTitle': 'Por Favor Gira tu Dispositivo', 'mobile.rotateSubtitle': 'Bumper Crash 3D funciona mejor en modo horizontal',
        'victory.matchOver': '¡PARTIDA TERMINADA!', 'victory.wins': '¡GANA!', 'victory.levelUp': '🎉 ¡SUBISTE DE NIVEL! Ahora eres Nivel',
        'victory.doubleGold': '📺 2x ORO', 'victory.doubleXp': '📺 2x XP', 'victory.doubled': '✓ DUPLICADO',
        'victory.rematch': 'REVANCHA', 'victory.mainMenu': 'MENÚ PRINCIPAL',
        'pause.title': 'JUEGO PAUSADO', 'pause.resume': 'CONTINUAR', 'pause.settings': 'AJUSTES', 'pause.mainMenu': 'MENÚ PRINCIPAL',
        'settings.title': 'AJUSTES', 'settings.musicVolume': 'VOLUMEN DE MÚSICA', 'settings.sfxVolume': 'VOLUMEN DE EFECTOS',
        'settings.dangerZone': 'ZONA DE PELIGRO', 'settings.resetProgress': 'REINICIAR PROGRESO',
        'settings.resetWarning': 'Borra tu nivel, XP, oro y todos los objetos desbloqueados. No se puede deshacer.',
        'settings.resetConfirm': '¿Reiniciar TODO el progreso?\n\nEsto borra tu nivel, XP, oro y todos los sombreros, gafas y efectos cosméticos desbloqueados - vuelve a una partida nueva. No se puede deshacer.',
        'settings.back': '⬅ ATRÁS',
        'shop.title': '🛍️ TIENDA', 'shop.yourBalance': 'TU SALDO', 'shop.cosmeticEffects': 'EFECTOS COSMÉTICOS',
        'shop.tapHint': '(toca para previsualizar, toca de nuevo para comprar)', 'shop.player1': 'JUGADOR 1', 'shop.player2': 'JUGADOR 2',
        'shop.hats': 'SOMBREROS', 'shop.glasses': 'GAFAS', 'shop.unlockHint': '(desbloquea subiendo de nivel)', 'shop.back': '⬅ ATRÁS',
        'shop.tapToBuy': 'TOCA PARA COMPRAR', 'shop.owned': 'EN PROPIEDAD ✓', 'shop.lvAbbr': 'Nv',
        'ai.bot': 'IA BOT'
    },
    tr: {
        'menu.selectLanguage': 'DİL SEÇ', 'menu.startGame': 'OYNA', 'menu.lang': 'DİL', 'menu.shop': 'MAĞAZA', 'menu.settings': 'AYARLAR',
        'menu.watchAdGold': '📺 {n} 🪙 İçin Reklam İzle', 'menu.watchAdCooldown': '⏳ {n}s Sonra Hazır',
        'setup.title': 'OYUN AYARLARI', 'setup.gameMode': 'OYUN MODU', 'setup.mode2p': '2 Oyuncu', 'setup.modeAi': 'CPU\'ya Karşı',
        'setup.aiDifficulty': 'YAPAY ZEKA ZORLUĞU', 'setup.diffEasy': 'Kolay', 'setup.diffNormal': 'Normal', 'setup.diffHard': 'Zor',
        'setup.arenaType': 'ARENA TÜRÜ', 'setup.arenaCircle': 'Daire', 'setup.arenaSquare': 'Kare', 'setup.arenaRamp': 'Rampa',
        'setup.winningScore': 'KAZANMA PUANI', 'setup.pts5': '5 Puan', 'setup.pts10': '10 Puan', 'setup.pts15': '15 Puan', 'setup.pts20': '20 Puan',
        'setup.mainMenu': 'Ana Menü', 'setup.next': 'İLERİ ➔',
        'custom.title': 'KARAKTER ÖZELLEŞTİRME', 'custom.player1': 'OYUNCU 1 (MAVİ)', 'custom.player2': 'OYUNCU 2 (KIRMIZI)',
        'custom.selectHat': 'Şapka Seç', 'custom.selectGlassesFace': 'Gözlük / Yüz Seç', 'custom.selectGlasses': 'Gözlük Seç',
        'custom.aiRandomMsg': '🎲 Rastgele Kozmetikler Atandı!', 'custom.back': '⬅ GERİ', 'custom.fight': 'DÖVÜŞ!',
        'hud.player1': 'OYUNCU 1', 'hud.player2': 'OYUNCU 2', 'hud.controlsP1': 'WASD | Atılış: Boşluk', 'hud.controlsP2': 'Oklar | Atılış: Enter',
        'ctrl.muteSfx': 'Ses Efektlerini Kapat', 'ctrl.muteMusic': 'Müziği Kapat', 'ctrl.pause': 'Duraklat',
        'mobile.dash': 'ATILIŞ', 'mobile.rotateTitle': 'Lütfen Cihazınızı Döndürün', 'mobile.rotateSubtitle': 'Bumper Crash 3D yatay modda daha iyi çalışır',
        'victory.matchOver': 'MAÇ BİTTİ!', 'victory.wins': 'KAZANDI!', 'victory.levelUp': '🎉 SEVİYE ATLADIN! Artık Seviye',
        'victory.doubleGold': '📺 2x ALTIN', 'victory.doubleXp': '📺 2x XP', 'victory.doubled': '✓ İKİLENDİ',
        'victory.rematch': 'TEKRAR OYNA', 'victory.mainMenu': 'ANA MENÜ',
        'pause.title': 'OYUN DURAKLADI', 'pause.resume': 'DEVAM ET', 'pause.settings': 'AYARLAR', 'pause.mainMenu': 'ANA MENÜ',
        'settings.title': 'AYARLAR', 'settings.musicVolume': 'MÜZİK SESİ', 'settings.sfxVolume': 'EFEKT SESİ',
        'settings.dangerZone': 'TEHLİKELİ BÖLGE', 'settings.resetProgress': 'İLERLEMEYİ SIFIRLA',
        'settings.resetWarning': 'Seviyeni, XP\'ni, altınını ve açılmış tüm eşyaları siler. Geri alınamaz.',
        'settings.resetConfirm': 'TÜM ilerleme sıfırlansın mı?\n\nBu, seviyeni, XP\'ni, altınını ve açılmış tüm şapka, gözlük ve kozmetik efektleri siler - sıfırdan yeni bir kayıt gibi olur. Geri alınamaz.',
        'settings.back': '⬅ GERİ',
        'shop.title': '🛍️ MAĞAZA', 'shop.yourBalance': 'BAKİYEN', 'shop.cosmeticEffects': 'KOZMETİK EFEKTLER',
        'shop.tapHint': '(önizlemek için dokun, satın almak için tekrar dokun)', 'shop.player1': 'OYUNCU 1', 'shop.player2': 'OYUNCU 2',
        'shop.hats': 'ŞAPKALAR', 'shop.glasses': 'GÖZLÜKLER', 'shop.unlockHint': '(seviye atlayarak aç)', 'shop.back': '⬅ GERİ',
        'shop.tapToBuy': 'SATIN ALMAK İÇİN DOKUN', 'shop.owned': 'SAHİPSİN ✓', 'shop.lvAbbr': 'Sv',
        'ai.bot': 'YZ BOT'
    },
    pt: {
        'menu.selectLanguage': 'SELECIONAR IDIOMA', 'menu.startGame': 'JOGAR', 'menu.lang': 'IDIOMA', 'menu.shop': 'LOJA', 'menu.settings': 'AJUSTES',
        'menu.watchAdGold': '📺 Assistir Anúncio por {n} 🪙', 'menu.watchAdCooldown': '⏳ Disponível em {n}s',
        'setup.title': 'CONFIGURAR JOGO', 'setup.gameMode': 'MODO DE JOGO', 'setup.mode2p': '2 Jogadores', 'setup.modeAi': 'Vs CPU',
        'setup.aiDifficulty': 'DIFICULDADE DA IA', 'setup.diffEasy': 'Fácil', 'setup.diffNormal': 'Normal', 'setup.diffHard': 'Difícil',
        'setup.arenaType': 'TIPO DE ARENA', 'setup.arenaCircle': 'Círculo', 'setup.arenaSquare': 'Quadrado', 'setup.arenaRamp': 'Rampa',
        'setup.winningScore': 'PONTUAÇÃO PARA VENCER', 'setup.pts5': '5 Pts', 'setup.pts10': '10 Pts', 'setup.pts15': '15 Pts', 'setup.pts20': '20 Pts',
        'setup.mainMenu': 'Menu Principal', 'setup.next': 'PRÓXIMO ➔',
        'custom.title': 'PERSONALIZAÇÃO DE PERSONAGEM', 'custom.player1': 'JOGADOR 1 (AZUL)', 'custom.player2': 'JOGADOR 2 (VERMELHO)',
        'custom.selectHat': 'Escolher Chapéu', 'custom.selectGlassesFace': 'Escolher Óculos / Rosto', 'custom.selectGlasses': 'Escolher Óculos',
        'custom.aiRandomMsg': '🎲 Cosméticos Aleatórios Atribuídos!', 'custom.back': '⬅ VOLTAR', 'custom.fight': 'LUTAR!',
        'hud.player1': 'JOGADOR 1', 'hud.player2': 'JOGADOR 2', 'hud.controlsP1': 'WASD | Investida: Espaço', 'hud.controlsP2': 'Setas | Investida: Enter',
        'ctrl.muteSfx': 'Silenciar Efeitos Sonoros', 'ctrl.muteMusic': 'Silenciar Música', 'ctrl.pause': 'Pausar',
        'mobile.dash': 'INVESTIDA', 'mobile.rotateTitle': 'Por Favor, Gire Seu Dispositivo', 'mobile.rotateSubtitle': 'Bumper Crash 3D funciona melhor no modo paisagem',
        'victory.matchOver': 'PARTIDA ENCERRADA!', 'victory.wins': 'VENCEU!', 'victory.levelUp': '🎉 SUBIU DE NÍVEL! Agora você é Nível',
        'victory.doubleGold': '📺 2x OURO', 'victory.doubleXp': '📺 2x XP', 'victory.doubled': '✓ DOBRADO',
        'victory.rematch': 'REVANCHE', 'victory.mainMenu': 'MENU PRINCIPAL',
        'pause.title': 'JOGO PAUSADO', 'pause.resume': 'CONTINUAR', 'pause.settings': 'AJUSTES', 'pause.mainMenu': 'MENU PRINCIPAL',
        'settings.title': 'AJUSTES', 'settings.musicVolume': 'VOLUME DA MÚSICA', 'settings.sfxVolume': 'VOLUME DE EFEITOS',
        'settings.dangerZone': 'ZONA DE PERIGO', 'settings.resetProgress': 'REINICIAR PROGRESSO',
        'settings.resetWarning': 'Apaga seu nível, XP, ouro e todos os itens desbloqueados. Não pode ser desfeito.',
        'settings.resetConfirm': 'Reiniciar TODO o progresso?\n\nIsso apaga seu nível, XP, ouro e todos os chapéus, óculos e efeitos cosméticos desbloqueados - volta a um novo save. Não pode ser desfeito.',
        'settings.back': '⬅ VOLTAR',
        'shop.title': '🛍️ LOJA', 'shop.yourBalance': 'SEU SALDO', 'shop.cosmeticEffects': 'EFEITOS COSMÉTICOS',
        'shop.tapHint': '(toque para pré-visualizar, toque novamente para comprar)', 'shop.player1': 'JOGADOR 1', 'shop.player2': 'JOGADOR 2',
        'shop.hats': 'CHAPÉUS', 'shop.glasses': 'ÓCULOS', 'shop.unlockHint': '(desbloqueie subindo de nível)', 'shop.back': '⬅ VOLTAR',
        'shop.tapToBuy': 'TOQUE PARA COMPRAR', 'shop.owned': 'POSSUÍDO ✓', 'shop.lvAbbr': 'Nv',
        'ai.bot': 'IA BOT'
    }
};

let currentLang = 'en';
try {
    const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
    if (savedLang && TRANSLATIONS[savedLang]) currentLang = savedLang;
} catch (e) { /* localStorage unavailable - default to English */ }

let onLanguageChanged = () => {};
export function setOnLanguageChanged(fn) { onLanguageChanged = fn; }

export function getCurrentLang() { return currentLang; }

export function t(key, n) {
    const str = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key])
        || (TRANSLATIONS.en && TRANSLATIONS.en[key])
        || key;
    return n !== undefined ? str.replace('{n}', n) : str;
}

export function setLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;
    try { localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) { /* ignore */ }
    onLanguageChanged();
}

// DOM-a data-i18n elementlərini tətbiq edən köməkçi (UI bunu istifadə edir)
export function applyDataI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        el.title = t(el.getAttribute('data-i18n-title'));
    });
    document.documentElement.lang = currentLang;
}