// Elementos DOM Globais da Retrospectiva
let retrospectiveModal;
let retrospectiveOverlay;
let selectionScreen, introScreen, mainStatsScreen, productiveDayScreen,
    timePatternsScreen, comparisonScreen, finalScreenContainer, finalScreenImageableContent;
let allScreens = [];

// Botões e Elementos Internos da Retrospectiva
let metricButtons, startRetrospectiveButton, monthSelectionText,
    introNextButton, mainStatsNextButton, productiveDayNextButton,
    timePatternsNextButton, comparisonNextButton,
    shareButton, downloadButton, finalCloseXButton,
    musicToggleButton;

// Elemento de Áudio
let retrospectiveMusicAudio;

// Elementos de Dados nas Telas
let introUserNameEl, introMonth, questionsResolvedEl, tasksCompletedEl, focusTimeEl,
    phraseQuestionsEl, phraseTasksEl, phraseFocusEl,
    mostProductiveDateEl, mostProductiveValueEl,
    peakFocusHourEl, longestStreakEl, weekdayChartContainer,
    comparisonQuestionsResolvedEl, comparisonTasksCompletedEl, comparisonFocusTimeEl,
    questionsPercentageEl, tasksPercentageEl, focusPercentageEl,
    comparisonHighlightEl;

// Elementos da Tela Final
let finalMonthYearEl, finalMainTitleEl,
    finalQuestionsValueEl, finalTasksValueEl, finalFocusValueEl,
    finalPeakFocusHourEl, finalLongestStreakEl, finalMostProductiveDayShortEl,
    achievementsListEl, finalFooterEl,
    finalQuestionsHighlightItem, finalTasksHighlightItem, finalFocusHighlightItem,
    finalPeakFocusStatItem, finalLongestStreakStatItem, finalProductiveDayStatItem,
    finalAchievementsContainer;

// Estado da Retrospectiva
let currentScreenIndex = 0;
let selectedMetrics = [];
let retrospectiveDataStore = { currentMonth: {}, previousMonth: {} };
let retrospectiveDataProcessed = false;
let isMusicPlaying = false;
let userInteractedWithMusic = false;

// Constantes e Frases
const motivationalPhrases = {
    questions: [
        "Sua mente é uma máquina de problemas! 🧠",
        "Cada questão é um degrau para a maestria! ⚡",
        "Você transforma curiosidade em conhecimento! 🌟",
        "Desvendando mistérios, uma questão por vez! 💡",
        "O cérebro agradece por tantos desafios! 💪",
    ],
    tasks: [
        "Você é um(a) mestre(a) da organização! 🎯",
        "Cada tarefa concluída é uma vitória! 🏆",
        "Sua produtividade está nas alturas! ✨",
        "Checklist zerado, mente tranquila! ✅",
        "Imparável na execução de tarefas! 🚀",
    ],
    focus: [
        "Seu foco é sua superpotência! 🔥",
        "Minutos de foco, horas de progresso! ⏰",
        "Dominando a arte da concentração! 🧘",
        "No flow, o tempo voa e a mágica acontece! 🌌",
        "Focado(a) como um laser, produtivo(a) como nunca! 💥",
    ],
    generalPositive: [
        "Que mês incrível, continue assim! 🎉",
        "Seu progresso é inspirador! 🌠",
        "Você está no caminho certo para o sucesso! 🗺️",
        "Pequenos passos, grandes conquistas! 👣",
        "A dedicação está gerando resultados fantásticos! 🤩",
    ]
};

// --- Funções de Detecção de Mobile (simples) ---
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// FUNÇÕES UTILITÁRIAS E DE LÓGICA INTERNA DA RETROSPECTIVA
function getMonthYearString(date = new Date()) {
    if (!(date instanceof Date) || isNaN(date.valueOf())) {
        console.warn("TASKIFY_RETRO: Data inválida fornecida para getMonthYearString. Usando data atual.");
        date = new Date();
    }
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${date.getFullYear()}`;
}

function getRandomPhrase(type) {
    const phrases = motivationalPhrases[type] || motivationalPhrases.generalPositive;
    return phrases[Math.floor(Math.random() * phrases.length)];
}

function hexToRgbArray(hex) {
    if (!hex || typeof hex !== 'string') return null;
    let c = hex.startsWith('#') ? hex.substring(1) : hex;
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    if (c.length !== 6) return null;
    try {
        const bigint = parseInt(c, 16);
        if (isNaN(bigint)) return null;
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    } catch (e) { console.error("Erro ao converter hex para RGB:", hex, e); return null; }
}

function formatFocusMinutes(minutes) {
    const m = parseFloat(minutes) || 0;
    return Math.round(m);
}

function animateValue(element, start, end, duration, formatter = val => Math.round(val)) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const currentValue = progress * (end - start) + start;
        element.textContent = formatter(currentValue);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

function toggleMetric(event) {
    const button = event.currentTarget;
    const metric = button.dataset.metric;

    if (selectedMetrics.includes(metric)) {
        selectedMetrics = selectedMetrics.filter(m => m !== metric);
    } else {
        selectedMetrics.push(metric);
    }
    updateMetricButtonsState();
    if (startRetrospectiveButton) startRetrospectiveButton.disabled = selectedMetrics.length === 0;
}

// --- Funções de Controle de Música ---
function playRetrospectiveMusic() {
    if (retrospectiveMusicAudio && retrospectiveMusicAudio.paused && userInteractedWithMusic) {
        retrospectiveMusicAudio.play().then(() => {
            isMusicPlaying = true;
            updateMusicButtonIcon();
        }).catch(error => {
            console.warn("TASKIFY_RETRO_MUSIC: Erro ao tentar tocar a música:", error);
            isMusicPlaying = false;
            updateMusicButtonIcon();
        });
    }
}

function pauseRetrospectiveMusic() {
    if (retrospectiveMusicAudio && !retrospectiveMusicAudio.paused) {
        retrospectiveMusicAudio.pause();
        isMusicPlaying = false;
        userInteractedWithMusic = true;
        updateMusicButtonIcon();
    }
}

function toggleRetrospectiveMusic() {
    userInteractedWithMusic = true;
    if (isMusicPlaying) {
        pauseRetrospectiveMusic();
    } else {
        playRetrospectiveMusic();
    }
}

function updateMusicButtonIcon() {
    if (!musicToggleButton) return;
    const icon = musicToggleButton.querySelector('i');
    if (icon) {
        icon.className = isMusicPlaying ? 'bi bi-volume-up-fill' : 'bi bi-volume-mute-fill';
        musicToggleButton.setAttribute('aria-label', isMusicPlaying ? 'Música tocando (clique para pausar)' : 'Música pausada (clique para tocar)');
    }
}


function initializeRetrospectiveInternals() {
    retrospectiveModal = document.getElementById('retrospective-modal');
    retrospectiveOverlay = document.getElementById('retrospective-modal-overlay');
    retrospectiveMusicAudio = document.getElementById('retrospective-background-music');
    musicToggleButton = document.getElementById('retrospective-music-toggle');

    if (!retrospectiveModal) return;
    if (musicToggleButton) musicToggleButton.addEventListener('click', toggleRetrospectiveMusic);

    selectionScreen = document.getElementById('retrospective-selection-screen');
    introScreen = document.getElementById('retrospective-intro-screen');
    mainStatsScreen = document.getElementById('retrospective-main-stats-screen');
    productiveDayScreen = document.getElementById('retrospective-productive-day-screen');
    timePatternsScreen = document.getElementById('retrospective-time-patterns-screen');
    comparisonScreen = document.getElementById('retrospective-comparison-screen');
    finalScreenContainer = document.getElementById('retrospective-final-screen');
    finalScreenImageableContent = finalScreenContainer ? finalScreenContainer.querySelector('.retrospective-final-content-wrapper') : null;

    allScreens = [selectionScreen, introScreen, mainStatsScreen, productiveDayScreen, timePatternsScreen, comparisonScreen, finalScreenContainer].filter(Boolean);

    metricButtons = document.querySelectorAll('.retrospective-metric-button');
    startRetrospectiveButton = document.getElementById('retrospective-start-button');
    monthSelectionText = document.getElementById('retrospective-month-selection');
    introNextButton = document.getElementById('retrospective-intro-next-button');
    mainStatsNextButton = document.getElementById('retrospective-main-stats-next-button');
    productiveDayNextButton = document.getElementById('retrospective-productive-day-next-button');
    timePatternsNextButton = document.getElementById('retrospective-time-patterns-next-button');
    comparisonNextButton = document.getElementById('retrospective-comparison-next-button');
    shareButton = document.getElementById('retrospective-share-button');
    downloadButton = document.getElementById('retrospective-download-button');
    finalCloseXButton = finalScreenContainer ? finalScreenContainer.querySelector('.retrospective-final-close-x-btn') : null;

    introUserNameEl = document.getElementById('retrospective-intro-user-name');
    introMonth = document.getElementById('retrospective-intro-month');
    questionsResolvedEl = document.getElementById('retrospective-questions-resolved');
    tasksCompletedEl = document.getElementById('retrospective-tasks-completed');
    focusTimeEl = document.getElementById('retrospective-focus-time');
    phraseQuestionsEl = document.getElementById('retrospective-phrase-questions');
    phraseTasksEl = document.getElementById('retrospective-phrase-tasks');
    phraseFocusEl = document.getElementById('retrospective-phrase-focus');
    mostProductiveDateEl = document.getElementById('retrospective-most-productive-date');
    mostProductiveValueEl = document.getElementById('retrospective-most-productive-value');
    peakFocusHourEl = document.getElementById('retrospective-peak-focus-hour');
    longestStreakEl = document.getElementById('retrospective-longest-streak');
    weekdayChartContainer = document.getElementById('retrospective-weekday-distribution-chart');
    comparisonQuestionsResolvedEl = document.getElementById('retrospective-comparison-questions-resolved');
    comparisonTasksCompletedEl = document.getElementById('retrospective-comparison-tasks-completed');
    comparisonFocusTimeEl = document.getElementById('retrospective-comparison-focus-time');
    questionsPercentageEl = document.getElementById('retrospective-questions-percentage');
    tasksPercentageEl = document.getElementById('retrospective-tasks-percentage');
    focusPercentageEl = document.getElementById('retrospective-focus-percentage');
    comparisonHighlightEl = document.getElementById('retrospective-comparison-highlight');

    finalMonthYearEl = document.getElementById('retrospective-final-month-year');
    finalMainTitleEl = finalScreenContainer ? finalScreenContainer.querySelector('.retrospective-final-main-title') : null;
    finalFooterEl = finalScreenContainer ? finalScreenContainer.querySelector('.retrospective-final-footer') : null;
    finalQuestionsValueEl = document.getElementById('final-questions-value');
    finalTasksValueEl = document.getElementById('final-tasks-value');
    finalFocusValueEl = document.getElementById('final-focus-value');
    finalPeakFocusHourEl = document.getElementById('final-peak-focus-hour');
    finalLongestStreakEl = document.getElementById('final-longest-streak');
    finalMostProductiveDayShortEl = document.getElementById('final-most-productive-day-short');
    achievementsListEl = document.getElementById('retrospective-achievements-list');
    finalQuestionsHighlightItem = finalScreenContainer ? finalScreenContainer.querySelector('[data-final-metric="questions"]') : null;
    finalTasksHighlightItem = finalScreenContainer ? finalScreenContainer.querySelector('[data-final-metric="tasks"]') : null;
    finalFocusHighlightItem = finalScreenContainer ? finalScreenContainer.querySelector('[data-final-metric="focus"]') : null;
    finalPeakFocusStatItem = finalScreenContainer ? finalScreenContainer.querySelector('[data-final-metric="peakFocus"]') : null;
    finalLongestStreakStatItem = finalScreenContainer ? finalScreenContainer.querySelector('[data-final-metric="longestStreak"]') : null;
    finalProductiveDayStatItem = finalScreenContainer ? finalScreenContainer.querySelector('[data-final-metric="productiveDay"]') : null;
    finalAchievementsContainer = finalScreenContainer ? finalScreenContainer.querySelector('.retrospective-final-achievements-container') : null;

    metricButtons.forEach(button => button.addEventListener('click', toggleMetric));
    if (startRetrospectiveButton) startRetrospectiveButton.addEventListener('click', startRetrospectiveFlow);
    if (introNextButton) introNextButton.addEventListener('click', () => { populateMainStatsScreen(); showScreen(getScreenIndexById('retrospective-main-stats-screen')); });
    if (mainStatsNextButton) mainStatsNextButton.addEventListener('click', () => { populateProductiveDayScreen(); showScreen(getScreenIndexById('retrospective-productive-day-screen')); });
    if (productiveDayNextButton) productiveDayNextButton.addEventListener('click', () => { populateTimePatternsScreen(); showScreen(getScreenIndexById('retrospective-time-patterns-screen')); });
    if (timePatternsNextButton) timePatternsNextButton.addEventListener('click', () => {
        if (shouldShowComparisonScreen()) {
            populateComparisonScreen(); showScreen(getScreenIndexById('retrospective-comparison-screen'));
        } else {
            populateFinalScreen(); showScreen(getScreenIndexById('retrospective-final-screen'));
        }
    });
    if (comparisonNextButton) comparisonNextButton.addEventListener('click', () => { populateFinalScreen(); showScreen(getScreenIndexById('retrospective-final-screen')); });
    if (finalCloseXButton) finalCloseXButton.addEventListener('click', closeRetrospectiveView);
    if (shareButton) shareButton.addEventListener('click', shareRetrospectiveOnTwitterWithImage);
    if (downloadButton) downloadButton.addEventListener('click', downloadRetrospectiveImageAction);

    if (monthSelectionText && retrospectiveDataStore.currentMonth && Object.keys(retrospectiveDataStore.currentMonth).length > 0) {
        monthSelectionText.textContent = getMonthYearString(new Date(retrospectiveDataStore.currentMonth.year, retrospectiveDataStore.currentMonth.monthIndex));
    } else if (monthSelectionText) {
        monthSelectionText.textContent = getMonthYearString(new Date());
    }
}

function getScreenIndexById(screenId) {
    if (!screenId || allScreens.length === 0) return -1;
    return allScreens.findIndex(screen => screen && screen.id === screenId);
}

function applyDynamicScreenBackground(screenElement, screenIndex) {
    if (!screenElement) return;

    if (screenElement.id === 'retrospective-time-patterns-screen') {
        return;
    }

    const primaryRgb = hexToRgbArray(getComputedStyle(document.documentElement).getPropertyValue('--primary-color-dark').trim());
    if (!primaryRgb) {
        console.warn("TASKIFY_RETRO: Cor primária RGB não encontrada para background dinâmico.");
        return;
    }
    const [r, g, b] = primaryRgb;
    let gradientStyle;

    const alpha1 = 0.3 - (screenIndex * 0.03);
    const alpha2 = 0.1 - (screenIndex * 0.02);
    const angle = 140 + (screenIndex * 15);

    const color1 = `rgba(${r},${g},${b}, ${Math.max(0.05, alpha1)})`;
    const color2 = `rgba(${r},${g},${b}, ${Math.max(0.02, alpha2)})`;

    const baseBgColor = document.body.classList.contains('light') ? '#FFFFFF' : '#000000';

    gradientStyle = `linear-gradient(${angle}deg, ${color1} 0%, ${baseBgColor} 60%, ${color2} 100%)`;

    screenElement.style.background = gradientStyle;
}

function openRetrospectiveView() {
    if (!retrospectiveModal || !retrospectiveOverlay) return;
    if (!window.taskifyStateReady || !window.state) {
        const msg = "Os dados do aplicativo principal ainda não estão prontos. Tente novamente em alguns instantes.";
        if (typeof window.showCustomAlert === 'function') window.showCustomAlert(msg, "Dados Indisponíveis"); else alert(msg);
        return;
    }

    retrospectiveDataStore = processDataForRetrospectiveDirectly(window.state);
    retrospectiveDataProcessed = true;

    currentScreenIndex = 0;
    selectedMetrics = [];
    if (metricButtons && metricButtons.length > 0) updateMetricButtonsState();
    if (startRetrospectiveButton) startRetrospectiveButton.disabled = true;

    if (monthSelectionText && retrospectiveDataStore.currentMonth && Object.keys(retrospectiveDataStore.currentMonth).length > 0) {
        monthSelectionText.textContent = getMonthYearString(new Date(retrospectiveDataStore.currentMonth.year, retrospectiveDataStore.currentMonth.monthIndex));
    } else if (monthSelectionText) {
        monthSelectionText.textContent = getMonthYearString(new Date());
    }

    retrospectiveOverlay.classList.add('show');
    retrospectiveModal.classList.add('show');
    document.body.classList.add('modal-open', 'retrospective-open');

    isMusicPlaying = false;
    userInteractedWithMusic = false;
    if (musicToggleButton) musicToggleButton.style.display = 'none';

    showScreen(0);
    updateMusicButtonIcon();
}

function closeRetrospectiveView() {
    if (!retrospectiveModal || !retrospectiveOverlay) return;
    retrospectiveModal.classList.remove('show');
    retrospectiveOverlay.classList.remove('show');
    document.body.classList.remove('modal-open', 'retrospective-open');

    if (retrospectiveMusicAudio) {
        retrospectiveMusicAudio.pause();
        retrospectiveMusicAudio.currentTime = 0;
        isMusicPlaying = false;
        if (musicToggleButton) musicToggleButton.style.display = 'none';
        updateMusicButtonIcon();
    }

    setTimeout(() => {
        currentScreenIndex = 0;
        if (allScreens.length > 0 && allScreens[0]) {
            allScreens.forEach((screen, index) => {
                if (screen) {
                    screen.classList.remove('active', 'previous', 'next-out', 'previous-in');
                    screen.style.animation = '';
                    if (index === 0) {
                        screen.style.display = 'flex';
                        screen.classList.add('active');
                        screen.style.opacity = '1';
                        screen.style.visibility = 'visible';
                        screen.style.transform = 'translateX(0px) scale(1)';
                    } else {
                        screen.style.display = 'none';
                    }
                }
            });
        }
    }, 700);
}


function showScreen(screenIndex) {
    if (screenIndex < 0 || screenIndex >= allScreens.length || !allScreens[screenIndex]) {
        screenIndex = 0;
        if (!allScreens[screenIndex]) {
            closeRetrospectiveView(); return;
        }
    }

    const previousActiveScreen = allScreens[currentScreenIndex];

    allScreens.forEach((screen, index) => {
        if (screen) {
            screen.classList.remove('active', 'previous', 'next-out', 'previous-in');
            screen.style.animation = '';
            if (index !== screenIndex && !screen.classList.contains('active')) {
                setTimeout(() => {
                    if (screen && !screen.classList.contains('active')) {
                        screen.style.display = 'none';
                    }
                }, 700);
            }
        }
    });

    const targetScreen = allScreens[screenIndex];
    if (targetScreen) {
        applyDynamicScreenBackground(targetScreen, screenIndex);
        targetScreen.style.display = 'flex';
        void targetScreen.offsetWidth;

        if (screenIndex > currentScreenIndex) {
            if (previousActiveScreen) previousActiveScreen.classList.add('previous');
            targetScreen.classList.add('active');
        } else if (screenIndex < currentScreenIndex) {
            if (previousActiveScreen) previousActiveScreen.classList.add('next-out');
            targetScreen.classList.add('previous-in', 'active');
        } else {
            targetScreen.classList.add('active');
        }

        if (musicToggleButton) {
            musicToggleButton.style.display = (targetScreen.id === 'retrospective-selection-screen') ? 'none' : 'flex';
            if (targetScreen.id !== 'retrospective-selection-screen') updateMusicButtonIcon();
        }
    }
    currentScreenIndex = screenIndex;
}

function updateMetricButtonsState() {
    metricButtons.forEach(button => {
        const metric = button.dataset.metric;
        button.classList.toggle('selected', selectedMetrics.includes(metric));
    });
}

function startRetrospectiveFlow() {
    if (!retrospectiveDataProcessed || !retrospectiveDataStore.currentMonth || Object.keys(retrospectiveDataStore.currentMonth).length === 0) {
        const msg = "Os dados da retrospectiva ainda não foram carregados ou estão vazios. Tente reabrir a retrospectiva.";
        if (typeof window.showCustomAlert === 'function') window.showCustomAlert(msg, "Dados Indisponíveis"); else alert(msg);
        return;
    }
    if (selectedMetrics.length === 0) {
        const msg = "Por favor, selecione pelo menos uma métrica para continuar.";
        if (typeof window.showCustomAlert === 'function') window.showCustomAlert(msg, "Seleção Necessária"); else alert(msg);
        return;
    }

    userInteractedWithMusic = true;
    if (retrospectiveMusicAudio && !isMusicPlaying) playRetrospectiveMusic();
    if (musicToggleButton) musicToggleButton.style.display = 'flex';
    updateMusicButtonIcon();

    populateIntroScreen();
    const introScreenIndex = getScreenIndexById('retrospective-intro-screen');
    if (introScreenIndex !== -1) showScreen(introScreenIndex);
}

function shouldShowComparisonScreen() {
    if (!retrospectiveDataStore.previousMonth || Object.keys(retrospectiveDataStore.previousMonth).length === 0) return false;
    const { previousMonth } = retrospectiveDataStore;
    return selectedMetrics.some(metric => {
        if (metric === "questions") return (previousMonth.questionsResolved || 0) > 0;
        if (metric === "tasks") return (previousMonth.tasksCompleted || 0) > 0;
        if (metric === "focus") return (previousMonth.focusTimeMinutes || 0) > 0;
        return false;
    });
}

document.addEventListener('taskifyStateReady', (event) => {
    // Lógica para lidar com o estado pronto...
});


function processDataForRetrospectiveDirectly(appStateProvided) {
    if (!appStateProvided || typeof appStateProvided !== 'object' || Object.keys(appStateProvided).length === 0) {
        const today = new Date();
        const defaultMonthData = { year: today.getFullYear(), monthIndex: today.getMonth(), questionsResolved: 0, tasksCompleted: 0, focusTimeMinutes: 0, mostProductiveDayOverall: { date: null, totalScore: 0, questions: 0, tasks: 0, focusMinutes: 0 }, peakFocusHour: null, longestStreakInMonth: 0, weeklyDistribution: Array(7).fill(0) };
        return { currentMonth: defaultMonthData, previousMonth: { ...defaultMonthData } };
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth();
    const prevMonthDate = new Date(today);
    prevMonthDate.setDate(1);
    prevMonthDate.setMonth(currentMonthIndex - 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonthIndex = prevMonthDate.getMonth();

    return {
        currentMonth: getMonthlyAggregatedData(currentYear, currentMonthIndex, appStateProvided),
        previousMonth: getMonthlyAggregatedData(prevYear, prevMonthIndex, appStateProvided)
    };
}

function getMonthlyAggregatedData(year, monthIndex, appState) {
    if (!appState || typeof appState !== 'object') {
        return { year, monthIndex, questionsResolved: 0, tasksCompleted: 0, focusTimeMinutes: 0, mostProductiveDayOverall: { date: null, totalScore: 0, questions: 0, tasks: 0, focusMinutes: 0 }, peakFocusHour: null, longestStreakInMonth: 0, weeklyDistribution: Array(7).fill(0) };
    }

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
    const daysInMonth = endDate.getDate();

    let questionsResolvedThisMonth = 0;
    const streakDataString = localStorage.getItem('taskify-streak');
    let streakHistory = {};
    if (streakDataString) {
        try {
            const parsedStreak = JSON.parse(streakDataString);
            if (parsedStreak && typeof parsedStreak.history === 'object') streakHistory = parsedStreak.history;
        } catch (e) { console.error("TASKIFY_RETRO: Erro ao parsear streakData:", e); }
    }
    for (const dateISO in streakHistory) {
        const entryDate = new Date(dateISO + "T00:00:00");
        if (entryDate.getFullYear() === year && entryDate.getMonth() === monthIndex) {
            questionsResolvedThisMonth += (Number(streakHistory[dateISO]) || 0);
        }
    }

    let tasksCompleted = 0;
    if (appState.tasks && Array.isArray(appState.tasks)) {
        tasksCompleted = appState.tasks.filter(task => {
            if (!task || !task.completed || !task.completionDate) return false;
            try {
                const completionDate = new Date(task.completionDate);
                return completionDate >= startDate && completionDate <= endDate;
            } catch (e) { return false; }
        }).length;
    }

    let focusTimeSeconds = 0;
    if (appState.pomodoro && appState.pomodoro.sessions && Array.isArray(appState.pomodoro.sessions)) {
        appState.pomodoro.sessions.forEach(session => {
            if (!session || session.type !== 'focus' || !session.startTime || !session.duration) return;
            try {
                const sessionStartDate = new Date(session.startTime);
                if (sessionStartDate >= startDate && sessionStartDate <= endDate) {
                    focusTimeSeconds += (session.duration || 0);
                }
            } catch (e) { /* Ignora */ }
        });
    }
    const focusTimeMinutes = Math.round(focusTimeSeconds / 60);

    const dailyData = Array(daysInMonth).fill(null).map((_, i) => ({
        dateObj: new Date(year, monthIndex, i + 1),
        questions: 0, tasks: 0, focusMinutes: 0, totalScore: 0
    }));
    const hourlyFocusCounts = Array(24).fill(0);

    for (let d = 0; d < daysInMonth; d++) {
        const dateISO = dailyData[d].dateObj.toISOString().split('T')[0];
        if (streakHistory[dateISO] !== undefined) {
            const dailyQuestions = Number(streakHistory[dateISO]) || 0;
            dailyData[d].questions += dailyQuestions;
            dailyData[d].totalScore += dailyQuestions * 0.5; // Peso para questões
        }
    }
    if (appState.tasks && Array.isArray(appState.tasks)) {
        appState.tasks.forEach(task => {
            if (!task || !task.completed || !task.completionDate) return;
            try {
                const completionDate = new Date(task.completionDate);
                if (completionDate.getFullYear() === year && completionDate.getMonth() === monthIndex) {
                    const dayOfMonthIndex = completionDate.getDate() - 1;
                    if (dailyData[dayOfMonthIndex]) {
                        dailyData[dayOfMonthIndex].tasks++;
                        dailyData[dayOfMonthIndex].totalScore += 1; // Peso para tarefas
                    }
                }
            } catch (e) { /* Ignora */ }
        });
    }
    if (appState.pomodoro && appState.pomodoro.sessions && Array.isArray(appState.pomodoro.sessions)) {
        appState.pomodoro.sessions.forEach(session => {
            if (!session || session.type !== 'focus' || !session.startTime || !session.duration) return;
            try {
                const sessionStartDate = new Date(session.startTime);
                if (sessionStartDate.getFullYear() === year && sessionStartDate.getMonth() === monthIndex) {
                    const dayOfMonthIndex = sessionStartDate.getDate() - 1;
                    const sessionMinutes = Math.round((session.duration || 0) / 60);
                    if (dailyData[dayOfMonthIndex]) {
                        dailyData[dayOfMonthIndex].focusMinutes += sessionMinutes;
                        dailyData[dayOfMonthIndex].totalScore += sessionMinutes * 0.05; // Peso para foco
                    }
                    const hour = sessionStartDate.getHours();
                    hourlyFocusCounts[hour] += sessionMinutes;
                }
            } catch (e) { /* Ignora */ }
        });
    }

    let mostProductiveDayOverall = { date: null, totalScore: 0, questions: 0, tasks: 0, focusMinutes: 0 };
    dailyData.forEach((dayItem) => {
        if (dayItem.totalScore > mostProductiveDayOverall.totalScore) {
            mostProductiveDayOverall = {
                date: dayItem.dateObj.toISOString(),
                totalScore: dayItem.totalScore,
                questions: dayItem.questions,
                tasks: dayItem.tasks,
                focusMinutes: dayItem.focusMinutes
            };
        }
    });

    const maxFocusForHour = Math.max(...hourlyFocusCounts);
    const peakFocusHour = maxFocusForHour > 0 ? hourlyFocusCounts.indexOf(maxFocusForHour) : null;

    let longestStreakInMonth = 0;
    if (streakHistory && typeof streakHistory === 'object' && appState.goals && typeof appState.goals.daily === 'number') {
        let currentMonthlyStreak = 0;
        let maxMonthlyStreak = 0;
        const dailyGoal = (appState.goals.daily > 0) ? appState.goals.daily : 1;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateToCheck = new Date(year, monthIndex, d);
            const dateISO = dateToCheck.toISOString().split('T')[0];
            if (streakHistory[dateISO] !== undefined && (Number(streakHistory[dateISO]) || 0) >= dailyGoal) {
                currentMonthlyStreak++;
            } else {
                if (currentMonthlyStreak > maxMonthlyStreak) maxMonthlyStreak = currentMonthlyStreak;
                currentMonthlyStreak = 0;
            }
        }
        if (currentMonthlyStreak > maxMonthlyStreak) maxMonthlyStreak = currentMonthlyStreak;
        longestStreakInMonth = maxMonthlyStreak;
    }

    const weeklyDistribution = Array(7).fill(0); // Domingo a Sábado
    dailyData.forEach(dayItem => {
        if (dayItem.dateObj) {
            const dayOfWeek = dayItem.dateObj.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
            weeklyDistribution[dayOfWeek] += dayItem.totalScore; // Soma o 'totalScore' para o dia da semana
        }
    });

    return {
        year, monthIndex,
        questionsResolved: questionsResolvedThisMonth,
        tasksCompleted,
        focusTimeMinutes,
        mostProductiveDayOverall: mostProductiveDayOverall.date ? mostProductiveDayOverall : { date: null, totalScore: 0, questions: 0, tasks: 0, focusMinutes: 0 },
        peakFocusHour,
        longestStreakInMonth,
        weeklyDistribution
    };
}


function populateIntroScreen() {
    if (!retrospectiveDataStore.currentMonth || !introMonth) {
        if (introMonth) introMonth.textContent = "Sua Retrospectiva";
        return;
    }
    const { currentMonth } = retrospectiveDataStore;
    if (introMonth) introMonth.textContent = `Sua Retrospectiva de ${getMonthYearString(new Date(currentMonth.year, currentMonth.monthIndex))}`;
}

function populateMainStatsScreen() {
    if (!retrospectiveDataStore.currentMonth) {
        ['questions', 'tasks', 'focus'].forEach(metric => {
            const card = mainStatsScreen ? mainStatsScreen.querySelector(`[data-metric-card="${metric}"]`) : null;
            if (card) card.style.display = 'none';
        });
        return;
    }
    const { currentMonth } = retrospectiveDataStore;
    const cardsData = [
        { metric: "questions", el: questionsResolvedEl, value: currentMonth.questionsResolved || 0, phraseEl: phraseQuestionsEl, cardSel: '[data-metric-card="questions"]', formatter: val => Math.round(val) },
        { metric: "tasks", el: tasksCompletedEl, value: currentMonth.tasksCompleted || 0, phraseEl: phraseTasksEl, cardSel: '[data-metric-card="tasks"]', formatter: val => Math.round(val) },
        { metric: "focus", el: focusTimeEl, value: currentMonth.focusTimeMinutes || 0, phraseEl: phraseFocusEl, cardSel: '[data-metric-card="focus"]', formatter: val => `${Math.round(val)} min` }
    ];
    let visibleCards = 0;
    const animationDuration = 1000;
    cardsData.forEach(item => {
        const card = mainStatsScreen ? mainStatsScreen.querySelector(item.cardSel) : null;
        if (card) {
            if (selectedMetrics.includes(item.metric)) {
                card.style.display = ''; card.classList.add('animated-metric-card');
                if (item.el) animateValue(item.el, 0, item.value, animationDuration, item.formatter); else if (item.el) item.el.textContent = item.formatter(item.value);
                if (item.phraseEl) item.phraseEl.textContent = getRandomPhrase(item.metric);
                visibleCards++;
            } else {
                card.style.display = 'none'; card.classList.remove('animated-metric-card');
            }
        }
    });
    const gridEl = mainStatsScreen ? mainStatsScreen.querySelector('.retrospective-stats-grid') : null;
    if (gridEl) {
        if (visibleCards === 1) gridEl.style.gridTemplateColumns = 'minmax(180px, 280px)';
        else if (visibleCards === 2) gridEl.style.gridTemplateColumns = 'repeat(2, minmax(150px, 1fr))';
        else gridEl.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
    }
}

function populateProductiveDayScreen() {
    if (!retrospectiveDataStore.currentMonth || !mostProductiveDateEl || !mostProductiveValueEl) {
        if (mostProductiveDateEl) mostProductiveDateEl.textContent = "-";
        if (mostProductiveValueEl) mostProductiveValueEl.textContent = "Dados indisponíveis.";
        return;
    }
    const { mostProductiveDayOverall } = retrospectiveDataStore.currentMonth;
    const motivationalTextEl = productiveDayScreen ? productiveDayScreen.querySelector('.retrospective-motivational-text') : null;
    if (mostProductiveDayOverall && mostProductiveDayOverall.date && mostProductiveDayOverall.totalScore > 0) {
        const dateObj = new Date(mostProductiveDayOverall.date);
        mostProductiveDateEl.textContent = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
        let achievementsText = [];
        if (mostProductiveDayOverall.questions > 0) achievementsText.push(`${mostProductiveDayOverall.questions} questões`);
        if (mostProductiveDayOverall.tasks > 0) achievementsText.push(`${mostProductiveDayOverall.tasks} tarefas`);
        if (mostProductiveDayOverall.focusMinutes > 0) achievementsText.push(`${formatFocusMinutes(mostProductiveDayOverall.focusMinutes)} min de foco`);
        mostProductiveValueEl.textContent = achievementsText.length > 0 ? achievementsText.join(' + ') + "!" : "Um dia de grande esforço!";
        if (motivationalTextEl) motivationalTextEl.innerHTML = `Você estava em <span class="retrospective-highlight-primary">modo máquina</span> neste dia! 🔥`;
    } else {
        mostProductiveDateEl.textContent = "Ops!";
        mostProductiveValueEl.textContent = "Parece que não tivemos um dia épico este mês.";
        if (motivationalTextEl) motivationalTextEl.innerHTML = `Continue firme, o próximo mês pode ser <span class="retrospective-highlight-primary">o seu momento</span>! 💪`;
    }
}

function populateTimePatternsScreen() {
    if (!retrospectiveDataStore.currentMonth) {
        if (peakFocusHourEl) peakFocusHourEl.textContent = "-";
        if (longestStreakEl) longestStreakEl.textContent = "0";
        if (weekdayChartContainer) weekdayChartContainer.innerHTML = '<p style="text-align:center; padding:20px 0; color: var(--text-muted-dark, #BCA8DD);">Dados de distribuição semanal indisponíveis.</p>';
        return;
    }
    const { peakFocusHour, longestStreakInMonth, weeklyDistribution } = retrospectiveDataStore.currentMonth;
    const animationDuration = 800;

    if (peakFocusHourEl) {
        peakFocusHourEl.textContent = peakFocusHour !== null ? `${String(peakFocusHour).padStart(2, '0')}:00` : "-";
    }
    if (longestStreakEl) {
        animateValue(longestStreakEl, 0, longestStreakInMonth || 0, animationDuration);
    }

    if (weekdayChartContainer && weeklyDistribution && Array.isArray(weeklyDistribution) && weeklyDistribution.length === 7) {
        weekdayChartContainer.innerHTML = '';
        const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const maxValue = Math.max(...weeklyDistribution, 1);

        weeklyDistribution.forEach((value, index) => {
            const barContainer = document.createElement('div');
            barContainer.className = 'retrospective-weekday-bar-container';

            const bar = document.createElement('div');
            bar.className = 'retrospective-weekday-bar';

            const finalHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;
            bar.style.height = `0%`;

            void bar.offsetWidth;

            setTimeout(() => {
                bar.style.height = `${finalHeight}%`;
            }, 100 + index * 50);

            const label = document.createElement('span');
            label.className = 'retrospective-weekday-label';
            label.textContent = dayLabels[index];

            barContainer.appendChild(bar);
            barContainer.appendChild(label);
            weekdayChartContainer.appendChild(barContainer);
        });
    } else if (weekdayChartContainer) {
        weekdayChartContainer.innerHTML = '<p style="text-align:center; padding:20px 0; color: var(--text-muted-dark, #BCA8DD);">Dados de distribuição semanal indisponíveis.</p>';
    }
}

function populateComparisonScreen() {
    if (!retrospectiveDataStore.currentMonth || !retrospectiveDataStore.previousMonth || Object.keys(retrospectiveDataStore.previousMonth).length === 0) {
        ['questions', 'tasks', 'focus'].forEach(metric => {
            const card = comparisonScreen ? comparisonScreen.querySelector(`[data-metric-comparison-card="${metric}"]`) : null;
            if (card) card.style.display = 'none';
        });
        if (comparisonHighlightEl) comparisonHighlightEl.textContent = "dados de comparação indisponíveis";
        return;
    }
    const { currentMonth, previousMonth } = retrospectiveDataStore;
    let comparisonMetricsShown = 0;
    const animationDuration = 1000;

    const setTextAndPercentage = (valueEl, percentageEl, iconContainer, currentValue, previousValue, formatterFunc = (val) => `${Math.round(val)}`) => {
        let metricDisplayed = false;
        if (valueEl) animateValue(valueEl, 0, parseFloat(currentValue) || 0, animationDuration, formatterFunc);
        if (percentageEl && iconContainer) {
            const icon = iconContainer.querySelector('.retrospective-icon-small');
            if (!icon) { percentageEl.textContent = "-"; return metricDisplayed; }
            const currentNum = parseFloat(currentValue) || 0;
            const prevNum = parseFloat(previousValue) || 0;
            if (previousValue !== null && previousValue !== undefined) {
                if (prevNum > 0) {
                    const percentageChange = ((currentNum - prevNum) / prevNum) * 100;
                    percentageEl.textContent = `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(0)}%`;
                    icon.className = `bi ${percentageChange >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right'} retrospective-icon-small ${percentageChange >= 0 ? 'retrospective-icon-green' : 'retrospective-icon-red'}`;
                    metricDisplayed = true;
                } else if (currentNum > 0) {
                    percentageEl.textContent = "NOVO!"; icon.className = 'bi bi-stars retrospective-icon-small retrospective-icon-green'; metricDisplayed = true;
                } else { percentageEl.textContent = "0%"; icon.className = 'bi bi-dash retrospective-icon-small'; }
            } else { percentageEl.textContent = "-"; icon.className = 'bi bi-dash retrospective-icon-small'; }
        } else if (percentageEl) { percentageEl.textContent = "-"; }
        return metricDisplayed;
    };
    const comparisonCardsData = [
        { metric: "questions", valueElId: "retrospective-comparison-questions-resolved", percentageElId: "retrospective-questions-percentage", current: currentMonth.questionsResolved || 0, prev: previousMonth.questionsResolved, cardSel: '[data-metric-comparison-card="questions"]', formatter: (val) => `${Math.round(val)}` },
        { metric: "tasks", valueElId: "retrospective-comparison-tasks-completed", percentageElId: "retrospective-tasks-percentage", current: currentMonth.tasksCompleted || 0, prev: previousMonth.tasksCompleted, cardSel: '[data-metric-comparison-card="tasks"]', formatter: (val) => `${Math.round(val)}` },
        { metric: "focus", valueElId: "retrospective-comparison-focus-time", percentageElId: "retrospective-focus-percentage", current: currentMonth.focusTimeMinutes || 0, prev: previousMonth.focusTimeMinutes, cardSel: '[data-metric-comparison-card="focus"]', formatter: val => `${Math.round(val)} min` }
    ];
    comparisonCardsData.forEach(item => {
        const card = comparisonScreen ? comparisonScreen.querySelector(item.cardSel) : null;
        if (card) {
            if (selectedMetrics.includes(item.metric)) {
                card.style.display = '';
                if (setTextAndPercentage(document.getElementById(item.valueElId), document.getElementById(item.percentageElId), document.getElementById(item.percentageElId)?.parentElement, item.current, item.prev, item.formatter)) {
                    comparisonMetricsShown++;
                }
            } else { card.style.display = 'none'; }
        }
    });
    if (comparisonHighlightEl) {
        if (comparisonMetricsShown > 0) {
            const messages = ["sua evolução está demais", "você está voando alto", "o progresso não para", "que salto de performance"];
            comparisonHighlightEl.textContent = messages[Math.floor(Math.random() * messages.length)];
        } else { comparisonHighlightEl.textContent = "seu desempenho este mês"; }
    }
}

function populateFinalScreen() {
    if (!retrospectiveDataStore.currentMonth || !finalMonthYearEl || !achievementsListEl || !finalScreenImageableContent || !finalFooterEl) {
        if (finalMonthYearEl) finalMonthYearEl.textContent = getMonthYearString(new Date());
        if (achievementsListEl) achievementsListEl.innerHTML = '<li>Nenhuma conquista para exibir.</li>';
        if (finalFooterEl) finalFooterEl.textContent = "#TaskifyWrapped";
        [finalQuestionsHighlightItem, finalTasksHighlightItem, finalFocusHighlightItem, finalPeakFocusStatItem, finalLongestStreakStatItem, finalProductiveDayStatItem, finalAchievementsContainer].forEach(el => { if (el) el.style.display = 'none'; });
        return;
    }
    const { currentMonth } = retrospectiveDataStore;
    finalMonthYearEl.textContent = getMonthYearString(new Date(currentMonth.year, currentMonth.monthIndex));
    finalFooterEl.textContent = "#TaskifyWrapped";
    const highlightsGrid = finalScreenImageableContent.querySelector('.retrospective-final-highlights');
    let visibleHighlightCount = 0;
    [finalQuestionsHighlightItem, finalTasksHighlightItem, finalFocusHighlightItem].forEach(item => { if (item) item.style.display = 'none'; });
    [finalPeakFocusStatItem, finalLongestStreakStatItem, finalProductiveDayStatItem, finalAchievementsContainer].forEach(el => { if (el) el.style.display = 'none'; });
    if (finalQuestionsHighlightItem && selectedMetrics.includes("questions")) { finalQuestionsHighlightItem.style.display = 'flex'; if (finalQuestionsValueEl) finalQuestionsValueEl.textContent = currentMonth.questionsResolved || 0; visibleHighlightCount++; }
    if (finalTasksHighlightItem && selectedMetrics.includes("tasks")) { finalTasksHighlightItem.style.display = 'flex'; if (finalTasksValueEl) finalTasksValueEl.textContent = currentMonth.tasksCompleted || 0; visibleHighlightCount++; }
    if (finalFocusHighlightItem && selectedMetrics.includes("focus")) { finalFocusHighlightItem.style.display = 'flex'; if (finalFocusValueEl) finalFocusValueEl.textContent = `${formatFocusMinutes(currentMonth.focusTimeMinutes)} min`; visibleHighlightCount++; }
    if (highlightsGrid) highlightsGrid.dataset.itemCount = visibleHighlightCount;
    if (finalPeakFocusStatItem && currentMonth.peakFocusHour !== null) { finalPeakFocusStatItem.style.display = 'flex'; if (finalPeakFocusHourEl) finalPeakFocusHourEl.textContent = `${String(currentMonth.peakFocusHour).padStart(2, '0')}:00`; } else if (finalPeakFocusStatItem && currentMonth.peakFocusHour === null) { finalPeakFocusStatItem.style.display = 'flex'; if (finalPeakFocusHourEl) finalPeakFocusHourEl.textContent = "-"; }
    if (finalLongestStreakStatItem && (currentMonth.longestStreakInMonth || 0) >= 0) { finalLongestStreakStatItem.style.display = 'flex'; if (finalLongestStreakEl) finalLongestStreakEl.textContent = currentMonth.longestStreakInMonth || 0; }
    if (finalProductiveDayStatItem && currentMonth.mostProductiveDayOverall && currentMonth.mostProductiveDayOverall.date) { finalProductiveDayStatItem.style.display = 'flex'; const prodDate = new Date(currentMonth.mostProductiveDayOverall.date); if (finalMostProductiveDayShortEl) finalMostProductiveDayShortEl.textContent = prodDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).replace('.', ''); } else if (finalProductiveDayStatItem) { finalProductiveDayStatItem.style.display = 'flex'; if (finalMostProductiveDayShortEl) finalMostProductiveDayShortEl.textContent = "-"; }
    achievementsListEl.innerHTML = '';
    const achievements = determineAchievements(currentMonth, selectedMetrics);
    if (achievements.length > 0) { if (finalAchievementsContainer) finalAchievementsContainer.style.display = ''; const badge = document.createElement('span'); badge.className = 'retrospective-badge-achievement'; badge.innerHTML = achievements[0]; achievementsListEl.appendChild(badge); }
}

function determineAchievements(monthData, metrics) {
    const achievements = [];
    const appGoals = (window.state && window.state.goals) ? window.state.goals : { monthly: 300, daily: 10, weekly: 50 };
    if (!monthData) return ["<i class='bi bi-emoji-smile-fill'></i> Mês concluído!"];
    const monthlyQuestionsGoal = appGoals.monthly || 300;
    const monthlyTasksGoal = Math.max(15, Math.round((appGoals.weekly || 50) * 0.75 * 4));
    const monthlyFocusGoalMinutes = Math.max(600, Math.round((appGoals.monthly || 300) * 1.5));
    let bestAchievement = { score: -1, text: "" };
    const updateBest = (score, text) => { if (score > bestAchievement.score) bestAchievement = { score, text }; };
    if (metrics.includes("questions") && (monthData.questionsResolved || 0) >= monthlyQuestionsGoal && monthlyQuestionsGoal > 0) updateBest(5, "<i class='bi bi-award-fill'></i> Meta de Questões Batida!");
    else if (metrics.includes("questions") && (monthData.questionsResolved || 0) > (monthlyQuestionsGoal * 0.75) && monthlyQuestionsGoal > 0) updateBest(3, "<i class='bi bi-trophy-fill'></i> Mestre das Questões");
    if (metrics.includes("tasks") && (monthData.tasksCompleted || 0) >= monthlyTasksGoal && monthlyTasksGoal > 0) updateBest(5, "<i class='bi bi-check-all'></i> Produtividade em Alta!");
    else if (metrics.includes("tasks") && (monthData.tasksCompleted || 0) > (monthlyTasksGoal * 0.75) && monthlyTasksGoal > 0) updateBest(3, "<i class='bi bi-check-circle-fill'></i> Executor(a) Nato(a)");
    if (metrics.includes("focus") && (monthData.focusTimeMinutes || 0) >= monthlyFocusGoalMinutes && monthlyFocusGoalMinutes > 0) updateBest(5, "<i class='bi bi-stopwatch-fill'></i> Lorde do Tempo");
    else if (metrics.includes("focus") && (monthData.focusTimeMinutes || 0) > (monthlyFocusGoalMinutes * 0.75) && monthlyFocusGoalMinutes > 0) updateBest(3, "<i class='bi bi-hourglass-split'></i> Foco Inabalável");
    if ((monthData.longestStreakInMonth || 0) >= 20) updateBest(6, `<i class='bi bi-gem'></i> Streak de ${monthData.longestStreakInMonth} Dias!`);
    else if ((monthData.longestStreakInMonth || 0) >= 7) updateBest(4, `<i class='bi bi-fire'></i> Streak de ${monthData.longestStreakInMonth} Dias`);
    if (monthData.mostProductiveDayOverall && (monthData.mostProductiveDayOverall.totalScore || 0) > 15) updateBest(4.5, "<i class='bi bi-stars'></i> Dia Lendário!");
    if (bestAchievement.score > -1) achievements.push(bestAchievement.text);
    else achievements.push("<i class='bi bi-emoji-sunglasses-fill'></i> Mês de Esforço!");
    return achievements.slice(0, 1);
}

function generateRetrospectiveShareText() {
    if (!retrospectiveDataStore.currentMonth || Object.keys(retrospectiveDataStore.currentMonth).length === 0) {
        return "Confira meu progresso no Taskify! #TaskifyApp https://taskify-fabinxz.vercel.app #TaskifyWrapped";
    }
    const { questionsResolved, tasksCompleted, focusTimeMinutes, mostProductiveDayOverall, longestStreakInMonth } = retrospectiveDataStore.currentMonth;
    const monthName = getMonthYearString(new Date(retrospectiveDataStore.currentMonth.year, retrospectiveDataStore.currentMonth.monthIndex));
    let text = `Minha retrospectiva de ${monthName} no Taskify! 🚀\n\n`;
    let detailsAdded = 0;
    if (selectedMetrics.includes("questions") && (questionsResolved || 0) > 0) { text += `✅ ${questionsResolved} questões\n`; detailsAdded++; }
    if (selectedMetrics.includes("tasks") && (tasksCompleted || 0) > 0) { text += `🎯 ${tasksCompleted} tarefas\n`; detailsAdded++; }
    if (selectedMetrics.includes("focus") && (focusTimeMinutes || 0) > 0) { text += `⏰ ${formatFocusMinutes(focusTimeMinutes)} min de foco\n`; detailsAdded++; }
    if (detailsAdded > 0 && ((mostProductiveDayOverall && mostProductiveDayOverall.date) || (longestStreakInMonth || 0) >= 3)) text += "\n";
    if (mostProductiveDayOverall && mostProductiveDayOverall.date && (mostProductiveDayOverall.totalScore || 0) > 0) { const prodDate = new Date(mostProductiveDayOverall.date); text += `🌟 Dia Mais Produtivo: ${prodDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }).replace('.', '')}\n`; }
    if ((longestStreakInMonth || 0) >= 3) { text += `🔥 Maior Streak: ${longestStreakInMonth} dias\n`; }
    text += "Confira o Taskify e organize seu sucesso! 👉 taskify-fabinxz.vercel.app\n#TaskifyWrapped";
    return text;
}

async function generateRetrospectiveImageInternal(forSharingNotification = false, tryClipboard = true) {
    if (!finalScreenImageableContent) {
        if (typeof window.showCustomAlert === 'function') window.showCustomAlert("Erro: A área da retrospectiva não pôde ser encontrada para gerar a imagem.", "Falha ao Gerar Imagem");
        return { success: false, canvas: null, error: "Conteúdo da tela final não encontrado." };
    }
    if (typeof html2canvas !== 'function') {
        if (typeof window.showCustomAlert === 'function') window.showCustomAlert("Erro: A funcionalidade de imagem (html2canvas) não está disponível.", "Funcionalidade Indisponível");
        return { success: false, canvas: null, error: "html2canvas não disponível." };
    }

    const isLightTheme = document.body.classList.contains('light');
    const currentPrimaryColorHex = getComputedStyle(document.documentElement).getPropertyValue(isLightTheme ? '--primary-color-light' : '--primary-color-dark').trim();
    const currentFontFamily = getComputedStyle(document.body).fontFamily;
    const primaryRgbArray = hexToRgbArray(currentPrimaryColorHex);
    let primaryRgbStringForCssVar = primaryRgbArray ? primaryRgbArray.join(', ') : "10, 124, 255";
    let solidFallbackBackgroundColor = isLightTheme ? '#FFFFFF' : '#000000';
    let cardBackgroundColorForClone = isLightTheme ? `linear-gradient(160deg, rgba(${primaryRgbStringForCssVar}, 0.2) 0%, rgba(${primaryRgbStringForCssVar}, 0.08) 40%, #f8f8f8 100%)` : `linear-gradient(160deg, rgba(${primaryRgbStringForCssVar}, 0.2) 0%, rgba(${primaryRgbStringForCssVar}, 0.08) 40%, #050505 100%)`;

    const options = {
        backgroundColor: solidFallbackBackgroundColor, scale: 2, useCORS: true, logging: false,
        onclone: (documentCloned) => {
            const clonedBody = documentCloned.body; const clonedHtml = documentCloned.documentElement;
            clonedHtml.style.setProperty('--primary-color-dark', currentPrimaryColorHex); clonedHtml.style.setProperty('--primary-color-light', currentPrimaryColorHex);
            clonedHtml.style.setProperty('--primary-color-dark-rgb', primaryRgbStringForCssVar); clonedHtml.style.setProperty('--primary-color-light-rgb', primaryRgbStringForCssVar);
            clonedBody.style.fontFamily = currentFontFamily;
            if (isLightTheme) { clonedBody.classList.add('light'); clonedHtml.classList.add('light-theme-active'); clonedBody.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color-light').trim() || '#222222'; }
            else { clonedBody.classList.remove('light'); clonedHtml.classList.remove('light-theme-active'); clonedBody.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color-dark').trim() || '#FFFFFF'; }
            const clonedContentWrapper = documentCloned.querySelector('.retrospective-final-content-wrapper');
            if (clonedContentWrapper) {
                clonedContentWrapper.style.background = cardBackgroundColorForClone;
                clonedContentWrapper.style.color = isLightTheme ? (getComputedStyle(document.documentElement).getPropertyValue('--text-color-light').trim() || '#222222') : '#FFFFFF';
                const textColorForClone = isLightTheme ? (getComputedStyle(document.documentElement).getPropertyValue('--text-color-light').trim() || '#222222') : '#FFFFFF';
                const mutedTextColorForClone = isLightTheme ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
                const iconMutedColorForClone = isLightTheme ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)';
                clonedContentWrapper.querySelector('.retrospective-final-logo .logo-text').style.color = textColorForClone;
                clonedContentWrapper.querySelector('.retrospective-final-date').style.color = mutedTextColorForClone;
                clonedContentWrapper.querySelector('.retrospective-final-main-title').style.color = textColorForClone;
                clonedContentWrapper.querySelectorAll('.retrospective-final-highlight-value').forEach(el => el.style.color = currentPrimaryColorHex);
                clonedContentWrapper.querySelectorAll('.retrospective-final-highlight-label').forEach(el => el.style.color = mutedTextColorForClone);
                clonedContentWrapper.querySelectorAll('.final-highlight-icon').forEach(el => el.style.color = iconMutedColorForClone);
                clonedContentWrapper.querySelectorAll('.retrospective-final-other-stat-item i').forEach(el => el.style.color = currentPrimaryColorHex);
                clonedContentWrapper.querySelectorAll('.retrospective-final-other-stat-item span, .retrospective-final-other-stat-item strong').forEach(el => el.style.color = textColorForClone);
                clonedContentWrapper.querySelector('.retrospective-final-achievements-title').style.color = isLightTheme ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)';
                const clonedFooter = clonedContentWrapper.querySelector('.retrospective-final-footer'); if (clonedFooter) { clonedFooter.textContent = "#TaskifyWrapped"; clonedFooter.style.color = isLightTheme ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';}
                const clonedBadges = documentCloned.querySelectorAll('.retrospective-badge-achievement');
                clonedBadges.forEach(badge => { let badgeSolidBgColor = isLightTheme ? `rgba(${primaryRgbArray[0]}, ${primaryRgbArray[1]}, ${primaryRgbArray[2]}, 0.8)` : `rgba(${primaryRgbArray[0]}, ${primaryRgbArray[1]}, ${primaryRgbArray[2]}, 0.9)`; let badgeTextColor = isLightTheme ? (getComputedStyle(document.documentElement).getPropertyValue('--card-bg-light').trim() || '#FFFFFF') : '#FFFFFF'; badge.style.background = badgeSolidBgColor; badge.style.color = badgeTextColor; badge.style.textShadow = 'none'; badge.style.boxShadow = 'none'; badge.style.animation = 'none'; });
            }
            Array.from(document.styleSheets).forEach(styleSheet => { try { if (styleSheet.href && (styleSheet.href.includes('bootstrap-icons') || styleSheet.href.includes('retrospective.css') || styleSheet.href.includes('style.css'))) { const link = documentCloned.createElement('link'); link.rel = 'stylesheet'; link.href = styleSheet.href; documentCloned.head.appendChild(link); } else if (styleSheet.cssRules) { const style = documentCloned.createElement('style'); Array.from(styleSheet.cssRules).forEach(rule => style.appendChild(documentCloned.createTextNode(rule.cssText))); documentCloned.head.appendChild(style); } } catch (e) { if (!(e instanceof DOMException && e.name === 'SecurityError')) { console.warn("TASKIFY_RETRO: html2canvas onclone - Não foi possível clonar stylesheet:", styleSheet.href || "inline", e); } } });
            return new Promise(resolve => setTimeout(resolve, 600));
        }
    };

    try {
        const canvas = await html2canvas(finalScreenImageableContent, options);

        if (tryClipboard) {
            if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem !== 'undefined') {
                await new Promise((resolvePromise, rejectPromise) => {
                    canvas.toBlob(async function (blob) {
                        if (blob) {
                            try {
                                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                                const alertTitle = forSharingNotification ? 'Compartilhar' : 'Copiado!';
                                const alertMsg = forSharingNotification ? 'Imagem copiada! Cole no seu tweet.' : 'Imagem da retrospectiva copiada para a área de transferência!';
                                if (typeof window.showCustomAlert === 'function') window.showCustomAlert(alertMsg, alertTitle);
                                resolvePromise();
                            } catch (clipboardError) {
                                console.error("TASKIFY_RETRO: Falha ao escrever no clipboard:", clipboardError);
                                const errorMsg = `Não foi possível copiar a imagem automaticamente (${clipboardError.name || 'Erro Desconhecido'}). ${isMobileDevice() ? 'Você pode baixar a imagem usando o outro botão e anexá-la manualmente.' : 'Tente um print screen.'}`;
                                if (typeof window.showCustomAlert === 'function') window.showCustomAlert(errorMsg, "Cópia Falhou");
                                rejectPromise(clipboardError);
                            }
                        } else {
                            const errorMsg = "Erro ao processar a imagem (blob nulo).";
                            if (typeof window.showCustomAlert === 'function') window.showCustomAlert(errorMsg, "Falha na Imagem");
                            rejectPromise(new Error("Falha ao criar blob"));
                        }
                    }, 'image/png');
                });
                return { success: true, canvas: canvas, error: null }; // Cópia bem-sucedida
            } else {
                console.warn("TASKIFY_RETRO: API de Clipboard não disponível para cópia.");
                 if (forSharingNotification && isMobileDevice()) {
                    // Se for para compartilhar e é mobile, não mostre erro aqui, o fluxo de fallback (download) será ativado
                } else if (forSharingNotification) { // Desktop e API não disponível
                    if (typeof window.showCustomAlert === 'function') window.showCustomAlert("Seu navegador não suporta copiar imagens para a área de transferência. Tente baixar a imagem.", "Aviso");
                }
                return { success: false, canvas: canvas, error: "API de Clipboard indisponível." }; // Retorna o canvas para fallback
            }
        } else { // Se tryClipboard é false, apenas retorna o canvas (para download)
            return { success: true, canvas: canvas, error: null };
        }
    } catch (err) {
        const userMessage = `Erro ao gerar imagem da retrospectiva. Detalhes: ${err.message}.`;
        if (typeof window.showCustomAlert === 'function') window.showCustomAlert(userMessage, "Falha na Imagem");
        return { success: false, canvas: null, error: err.message };
    }
}


function downloadCanvasAsImageFile(canvas, filename = 'retrospectiva_taskify.png') {
    if (!canvas) {
        console.error("TASKIFY_RETRO: Tentativa de download com canvas nulo.");
        return;
    }
    try {
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (typeof window.showCustomAlert === 'function') {
            window.showCustomAlert("Download da imagem iniciado!", "Download Concluído");
        } else {
            alert("Download da imagem iniciado!");
        }
    } catch (e) {
        console.error("TASKIFY_RETRO: Erro ao tentar baixar a imagem:", e);
        if (typeof window.showCustomAlert === 'function') {
            window.showCustomAlert("Ocorreu um erro ao tentar baixar a imagem.", "Falha no Download");
        } else {
            alert("Ocorreu um erro ao tentar baixar a imagem.");
        }
    }
}

async function shareRetrospectiveOnTwitterWithImage() {
    const textToShare = generateRetrospectiveShareText();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`;
    let imageGeneratedAndHandled = false;

    if (isMobileDevice()) {
        console.log("TASKIFY_RETRO: Modo mobile para compartilhar. Tentando download da imagem.");
        const result = await generateRetrospectiveImageInternal(true, false);
        if (result.success && result.canvas) {
            downloadCanvasAsImageFile(result.canvas, 'retrospectiva_taskify_twitter.png');
            if (typeof window.showCustomAlert === 'function') {
                window.showCustomAlert("Imagem baixada! Agora, anexe-a ao seu tweet.", "Compartilhar no Twitter");
            }
            imageGeneratedAndHandled = true;
        } else {
            if (typeof window.showCustomAlert === 'function') {
                 window.showCustomAlert("Não foi possível preparar a imagem para o Twitter. Você pode tentar baixá-la com o outro botão ou compartilhar apenas o texto.", "Falha na Imagem");
            }
        }
    } else {
        console.log("TASKIFY_RETRO: Modo desktop para compartilhar. Tentando copiar imagem para o clipboard.");
        const result = await generateRetrospectiveImageInternal(true, true);
        if (result.success && result.canvas) {
            imageGeneratedAndHandled = true;
        } else if (!result.success && result.canvas) {
            if (typeof window.showCustomAlert === 'function') {
                 window.showCustomAlert("Não foi possível copiar a imagem. Tente baixá-la com o outro botão e anexar ao tweet, ou compartilhe apenas o texto.", "Falha na Cópia");
            }
        } else {
             if (typeof window.showCustomAlert === 'function') {
                window.showCustomAlert("Não foi possível gerar a imagem para o Twitter. Compartilhando apenas o texto.", "Falha na Imagem");
            }
        }
    }

    setTimeout(() => {
        window.open(twitterUrl, '_blank');
    }, imageGeneratedAndHandled ? 1500 : 500);
}

async function downloadRetrospectiveImageAction() {
    console.log("TASKIFY_RETRO: Gerando imagem para download direto.");
    const result = await generateRetrospectiveImageInternal(false, false);
    if (result.success && result.canvas) {
        downloadCanvasAsImageFile(result.canvas, 'retrospectiva_taskify.png');
    } else {
        console.error("TASKIFY_RETRO: Canvas não foi gerado para download ou houve erro.");
        if (typeof window.showCustomAlert === 'function' && !result.canvas) {
             window.showCustomAlert("Não foi possível gerar a imagem para download. Tente um print screen.", "Falha no Download");
        } else if (typeof window.showCustomAlert === 'function' && result.canvas && !result.success) {
            window.showCustomAlert("Houve um problema ao preparar a imagem para download (Canvas gerado, mas erro na operação).", "Falha");
        }
    }
}


window.initializeRetrospectiveInternals = initializeRetrospectiveInternals;
window.openRetrospectiveView = openRetrospectiveView;
window.closeRetrospectiveView = closeRetrospectiveView;
