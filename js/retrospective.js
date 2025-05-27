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
    shareButton, downloadButton, finalCloseXButton;

// Elementos de Dados nas Telas
let introMonth, questionsResolvedEl, tasksCompletedEl, focusTimeEl,
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
    achievementsListEl,
    finalQuestionsHighlightItem, finalTasksHighlightItem, finalFocusHighlightItem,
    finalPeakFocusStatItem, finalLongestStreakStatItem, finalProductiveDayStatItem,
    finalAchievementsContainer;

// Estado da Retrospectiva
let currentScreenIndex = 0;
let selectedMetrics = [];
let retrospectiveDataStore = { currentMonth: {}, previousMonth: {} }; // Inicializa com objetos vazios
let retrospectiveDataProcessed = false;

// Constantes e Frases
const motivationalPhrases = {
    questions: [
        "Sua mente é uma máquina de resolver problemas! 🧠",
        "Cada questão resolvida é um passo rumo à maestria! ⚡",
        "Você transformou curiosidade em conhecimento! 🌟",
    ],
    tasks: [
        "Você é um verdadeiro executor de sonhos! 🎯",
        "Cada tarefa concluída é uma vitória conquistada! 🏆",
        "Sua produtividade brilha como neon na escuridão! ✨",
    ],
    focus: [
        "Seu foco é sua superpotência! 🔥",
        "Minutos de foco = momentos de crescimento! ⏰", // Atualizado
        "Você dominou a arte da concentração! 🎭",
    ],
};

function getRandomPhrase(type) {
    const phrases = motivationalPhrases[type] || motivationalPhrases.questions;
    return phrases[Math.floor(Math.random() * phrases.length)];
}

function hexToRgbArray(hex) {
    if (!hex || typeof hex !== 'string') return null;
    let c = hex.substring(1);
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    if (c.length !== 6) return null;
    try {
        const bigint = parseInt(c, 16);
        if (isNaN(bigint)) return null;
        return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
    } catch (e) { console.error("Erro ao converter hex para RGB:", hex, e); return null; }
}

// Função auxiliar para formatar minutos de foco
function formatFocusMinutes(minutes) {
    const m = Math.round(parseFloat(minutes) || 0); // Arredonda para o inteiro mais próximo
    return `${m} min`;
}

function initializeRetrospectiveInternals() {
    console.log("TASKIFY_RETRO: initializeRetrospectiveInternals chamada.");
    retrospectiveModal = document.getElementById('retrospective-modal');
    retrospectiveOverlay = document.getElementById('retrospective-modal-overlay');

    if (!retrospectiveModal) {
        console.error("TASKIFY_RETRO: Falha crítica - #retrospective-modal não encontrado.");
        return;
    }

    selectionScreen = document.getElementById('retrospective-selection-screen');
    introScreen = document.getElementById('retrospective-intro-screen');
    mainStatsScreen = document.getElementById('retrospective-main-stats-screen');
    productiveDayScreen = document.getElementById('retrospective-productive-day-screen');
    timePatternsScreen = document.getElementById('retrospective-time-patterns-screen');
    comparisonScreen = document.getElementById('retrospective-comparison-screen');
    finalScreenContainer = document.getElementById('retrospective-final-screen');
    finalScreenImageableContent = finalScreenContainer ? finalScreenContainer.querySelector('.retrospective-final-content-wrapper') : null;

    allScreens = [
        selectionScreen, introScreen, mainStatsScreen, productiveDayScreen,
        timePatternsScreen, comparisonScreen, finalScreenContainer
    ].filter(Boolean); // Filtra nulos se alguma tela não for encontrada

    if (allScreens.length < 7 && allScreens.length > 0) {
        console.warn("TASKIFY_RETRO: Algumas telas da retrospectiva não foram encontradas.");
    }
    if (!finalScreenImageableContent && finalScreenContainer) {
        console.warn("TASKIFY_RETRO: O wrapper .retrospective-final-content-wrapper não foi encontrado.");
    }

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
    if (downloadButton) downloadButton.addEventListener('click', copyRetrospectiveImageToClipboard);

    console.log("TASKIFY_RETRO: Listeners internos da retrospectiva configurados.");
}

function getScreenIndexById(screenId) {
    if (!screenId || allScreens.length === 0) return -1;
    return allScreens.findIndex(screen => screen && screen.id === screenId);
}

function openRetrospectiveView() {
    console.log("TASKIFY_RETRO: openRetrospectiveView chamada.");
    if (!retrospectiveModal || !retrospectiveOverlay) {
        console.error("TASKIFY_RETRO: Modal ou Overlay da retrospectiva não encontrados.");
        return;
    }
    if (!window.taskifyStateReady || !window.state) {
         const msg = "Os dados do aplicativo principal ainda não estão prontos. Tente novamente em alguns instantes.";
         if (typeof window.showCustomAlert === 'function') window.showCustomAlert(msg, "Dados Indisponíveis"); else alert(msg);
         return;
    }

    // Processa os dados do window.state AQUI ao abrir a retrospectiva
    retrospectiveDataStore = processDataForRetrospectiveDirectly(window.state);
    retrospectiveDataProcessed = true;
    console.log("TASKIFY_RETRO: Dados processados para retrospectiva:", JSON.parse(JSON.stringify(retrospectiveDataStore)));


    currentScreenIndex = 0;
    selectedMetrics = [];
    if (metricButtons && metricButtons.length > 0) updateMetricButtonsState();
    if (startRetrospectiveButton) startRetrospectiveButton.disabled = true;

    if (monthSelectionText && retrospectiveDataStore.currentMonth) {
        monthSelectionText.textContent = getMonthYearString(new Date(retrospectiveDataStore.currentMonth.year, retrospectiveDataStore.currentMonth.monthIndex));
    } else if (monthSelectionText) {
        monthSelectionText.textContent = getMonthYearString(new Date()); // Fallback
    }

    retrospectiveOverlay.classList.add('show');
    retrospectiveModal.classList.add('show');
    document.body.classList.add('modal-open', 'retrospective-open');
    showScreen(0); // Mostra a primeira tela (seleção)
}

function closeRetrospectiveView() {
    if (!retrospectiveModal || !retrospectiveOverlay) return;
    retrospectiveModal.classList.remove('show');
    retrospectiveOverlay.classList.remove('show');
    document.body.classList.remove('modal-open', 'retrospective-open');

    setTimeout(() => { // Delay para permitir animação de saída
        currentScreenIndex = 0;
        if (allScreens.length > 0 && allScreens[0]) {
            allScreens.forEach((screen, index) => {
                if (screen) {
                    screen.classList.remove('active', 'previous', 'next-out', 'previous-in');
                    screen.style.animation = ''; // Limpa animações inline
                    if (index === 0) { // Reseta a primeira tela para o estado inicial
                        screen.style.display = 'flex';
                        screen.classList.add('active');
                        screen.style.opacity = '1';
                        screen.style.visibility = 'visible';
                        screen.style.transform = 'translateX(0px) scale(1)';
                    } else {
                        screen.style.display = 'none'; // Esconde outras telas
                    }
                }
            });
        }
    }, 600); // Tempo da animação de fadeOut
}


function showScreen(screenIndex) {
    if (screenIndex < 0 || screenIndex >= allScreens.length || !allScreens[screenIndex]) {
        console.error(`TASKIFY_RETRO: Índice de tela inválido (${screenIndex}). Telas disponíveis: ${allScreens.length}`);
        screenIndex = 0; // Volta para a primeira tela como fallback seguro
        if (!allScreens[screenIndex]) {
            console.error("TASKIFY_RETRO: Nenhuma tela disponível para exibir. Fechando retrospectiva.");
            closeRetrospectiveView();
            return;
        }
    }

    const previousActiveScreen = allScreens[currentScreenIndex];

    allScreens.forEach((screen, index) => {
        if (screen) {
            screen.classList.remove('active', 'previous', 'next-out', 'previous-in');
            screen.style.animation = ''; // Limpa animação anterior
            if (index !== screenIndex && !screen.classList.contains('active')) {
                // Esconde telas não ativas após a animação
                setTimeout(() => {
                    if (screen && !screen.classList.contains('active')) {
                       screen.style.display = 'none';
                    }
                }, 600); // Duração da animação
            }
        }
    });

    const targetScreen = allScreens[screenIndex];
    if (targetScreen) {
        targetScreen.style.display = 'flex'; // Garante que a tela alvo é flexível
        void targetScreen.offsetWidth; // Força reflow para a animação funcionar

        if (screenIndex > currentScreenIndex) { // Avançando
            if(previousActiveScreen) previousActiveScreen.classList.add('previous'); // Animação de saída para a esquerda
            targetScreen.classList.add('active'); // Animação de entrada da direita
        } else if (screenIndex < currentScreenIndex) { // Voltando
            if(previousActiveScreen) previousActiveScreen.classList.add('next-out'); // Animação de saída para a direita
            targetScreen.classList.add('previous-in', 'active'); // Animação de entrada da esquerda
        } else { // Mesma tela (geralmente ao abrir)
            targetScreen.classList.add('active');
        }
    }
    currentScreenIndex = screenIndex;
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
    populateIntroScreen();
    const introScreenIndex = getScreenIndexById('retrospective-intro-screen');
    if (introScreenIndex !== -1) showScreen(introScreenIndex);
    else console.error("TASKIFY_RETRO: Tela de introdução não encontrada para iniciar o fluxo.");
}

function shouldShowComparisonScreen() {
    if (!retrospectiveDataStore.previousMonth || Object.keys(retrospectiveDataStore.previousMonth).length === 0) return false;
    const { previousMonth } = retrospectiveDataStore;
    // Verifica se há dados significativos no mês anterior para as métricas selecionadas
    return selectedMetrics.some(metric => {
        if (metric === "questions") return (previousMonth.questionsResolved || 0) > 0;
        if (metric === "tasks") return (previousMonth.tasksCompleted || 0) > 0;
        if (metric === "focus") return (previousMonth.focusTimeMinutes || 0) > 0; 
        return false;
    });
}

function getMonthYearString(date = new Date()) {
    if (!(date instanceof Date) || isNaN(date.valueOf())) { // Checagem mais robusta
        console.warn("TASKIFY_RETRO: Data inválida fornecida para getMonthYearString. Usando data atual.");
        date = new Date();
    }
    const month = date.toLocaleString('pt-BR', { month: 'long' });
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${date.getFullYear()}`;
}

// Listener para o evento 'taskifyStateReady' do script.js
document.addEventListener('taskifyStateReady', (event) => {
    console.log("TASKIFY_RETRO: Evento 'taskifyStateReady' recebido.");
    const receivedState = event.detail ? event.detail.taskifyAppState : null;

    if (receivedState && typeof receivedState === 'object' && Object.keys(receivedState).length > 0) {
        // Não processa imediatamente, espera o usuário abrir a retrospectiva
        // Apenas confirma que window.state está acessível
        if (window.state && Object.keys(window.state).length > 0) {
            console.log("TASKIFY_RETRO: window.state está disponível. Dados serão processados ao abrir a retrospectiva.");
        } else {
             console.warn("TASKIFY_RETRO: window.state não está disponível mesmo após taskifyStateReady.");
        }
    } else {
        console.error("TASKIFY_RETRO: Estado não recebido ou vazio via event.detail em taskifyStateReady.");
    }
});


function processDataForRetrospectiveDirectly(appStateProvided) {
    console.log("TASKIFY_RETRO: processDataForRetrospectiveDirectly chamado com:", appStateProvided ? "estado fornecido" : "estado nulo/vazio");
    if (!appStateProvided || typeof appStateProvided !== 'object' || Object.keys(appStateProvided).length === 0) {
        console.warn("TASKIFY_RETRO: appStateProvided é nulo ou vazio em processDataForRetrospectiveDirectly. Retornando dados de fallback.");
        const today = new Date();
        const defaultMonthData = { year: today.getFullYear(), monthIndex: today.getMonth(), questionsResolved: 0, tasksCompleted: 0, focusTimeMinutes: 0, mostProductiveDayOverall: { date: null, totalScore: 0, questions: 0, tasks: 0, focusMinutes: 0 }, peakFocusHour: null, longestStreakInMonth: 0, weeklyDistribution: Array(7).fill(0) };
        return { currentMonth: defaultMonthData, previousMonth: { ...defaultMonthData } };
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonthIndex = today.getMonth();

    const prevMonthDate = new Date(today);
    prevMonthDate.setDate(1); // Vai para o primeiro dia do mês atual
    prevMonthDate.setMonth(currentMonthIndex - 1); // Subtrai um mês
    const prevYear = prevMonthDate.getFullYear();
    const prevMonthIndex = prevMonthDate.getMonth();

    return {
        currentMonth: getMonthlyAggregatedData(currentYear, currentMonthIndex, appStateProvided),
        previousMonth: getMonthlyAggregatedData(prevYear, prevMonthIndex, appStateProvided)
    };
}

function getMonthlyAggregatedData(year, monthIndex, appState) {
    if (!appState || typeof appState !== 'object') { // Proteção adicional
        console.warn(`TASKIFY_RETRO: appState inválido em getMonthlyAggregatedData para ${year}-${monthIndex + 1}.`);
        return { year, monthIndex, questionsResolved: 0, tasksCompleted: 0, focusTimeMinutes: 0, mostProductiveDayOverall: { date: null, totalScore: 0, questions: 0, tasks: 0, focusMinutes: 0 }, peakFocusHour: null, longestStreakInMonth: 0, weeklyDistribution: Array(7).fill(0) };
    }

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999); // Último milissegundo do mês
    const daysInMonth = endDate.getDate();

    // 1. Questões Resolvidas
    let questionsResolvedThisMonth = 0;
    const streakDataString = localStorage.getItem('taskify-streak'); // Streak é a fonte para questões
    let streakHistory = {};
    if (streakDataString) {
        try {
            const parsedStreak = JSON.parse(streakDataString);
            if (parsedStreak && typeof parsedStreak.history === 'object') {
                streakHistory = parsedStreak.history;
            }
        } catch (e) { console.error("TASKIFY_RETRO: Erro ao parsear streakData para retrospectiva:", e); }
    }
    for (const dateISO in streakHistory) {
        const entryDate = new Date(dateISO + "T00:00:00"); // Adiciona T00 para evitar problemas de fuso
        if (entryDate.getFullYear() === year && entryDate.getMonth() === monthIndex) {
            questionsResolvedThisMonth += (Number(streakHistory[dateISO]) || 0);
        }
    }

    // 2. Tarefas Concluídas
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

    // 3. Tempo de Foco
    let focusTimeSeconds = 0;
    if (appState.pomodoro && appState.pomodoro.sessions && Array.isArray(appState.pomodoro.sessions)) {
        appState.pomodoro.sessions.forEach(session => {
            if (!session || session.type !== 'focus' || !session.startTime || !session.duration) return;
            try {
                const sessionStartDate = new Date(session.startTime);
                if (sessionStartDate >= startDate && sessionStartDate <= endDate) {
                    focusTimeSeconds += (session.duration || 0); // duration é em segundos
                }
            } catch (e) { /* Ignora sessões com datas inválidas */ }
        });
    }
    const focusTimeMinutes = Math.round(focusTimeSeconds / 60);


    // Dados Diários para Dia Mais Produtivo e Pico de Foco
    const dailyData = Array(daysInMonth).fill(null).map((_, i) => ({
        dateObj: new Date(year, monthIndex, i + 1),
        questions: 0, tasks: 0, focusMinutes: 0, totalScore: 0
    }));
    const hourlyFocusCounts = Array(24).fill(0); // Para pico de foco

    // Preenche dailyData com questões
    for (let d = 0; d < daysInMonth; d++) {
        const dateISO = dailyData[d].dateObj.toISOString().split('T')[0];
        if (streakHistory[dateISO] !== undefined) {
            const dailyQuestions = Number(streakHistory[dateISO]) || 0;
            dailyData[d].questions += dailyQuestions;
            dailyData[d].totalScore += dailyQuestions * 0.5; // Ponderação
        }
    }
    // Preenche dailyData com tarefas
    if (appState.tasks && Array.isArray(appState.tasks)) {
        appState.tasks.forEach(task => {
            if (!task || !task.completed || !task.completionDate) return;
            try {
                const completionDate = new Date(task.completionDate);
                if (completionDate.getFullYear() === year && completionDate.getMonth() === monthIndex) {
                    const dayOfMonthIndex = completionDate.getDate() - 1;
                    if (dailyData[dayOfMonthIndex]) {
                        dailyData[dayOfMonthIndex].tasks++;
                        dailyData[dayOfMonthIndex].totalScore += 1; // Ponderação
                    }
                }
            } catch (e) { /* Ignora tarefas com datas inválidas */ }
        });
    }
    // Preenche dailyData com foco e hourlyFocusCounts
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
                        dailyData[dayOfMonthIndex].totalScore += sessionMinutes * 0.05; // Ponderação
                    }
                    const hour = sessionStartDate.getHours();
                    hourlyFocusCounts[hour] += sessionMinutes;
                }
            } catch (e) { /* Ignora sessões com datas inválidas */ }
        });
    }

    // 4. Dia Mais Produtivo
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

    // 5. Pico de Foco (Horário)
    const maxFocusForHour = Math.max(...hourlyFocusCounts);
    const peakFocusHour = maxFocusForHour > 0 ? hourlyFocusCounts.indexOf(maxFocusForHour) : null;

    // 6. Maior Streak no Mês
    let longestStreakInMonth = 0;
    if (streakHistory && typeof streakHistory === 'object' && appState.goals && typeof appState.goals.daily === 'number') {
        let currentMonthlyStreak = 0;
        let maxMonthlyStreak = 0;
        const dailyGoal = (appState.goals.daily > 0) ? appState.goals.daily : 1; // Evita divisão por zero

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
        if (currentMonthlyStreak > maxMonthlyStreak) maxMonthlyStreak = currentMonthlyStreak; // Checa a última sequência
        longestStreakInMonth = maxMonthlyStreak;
    }

    // 7. Distribuição Semanal (baseado no totalScore diário)
    const weeklyDistribution = Array(7).fill(0); // Dom (0) a Sáb (6)
    dailyData.forEach(dayItem => {
        if (dayItem.dateObj) {
            const dayOfWeek = dayItem.dateObj.getDay(); // 0 = Domingo, ..., 6 = Sábado
            weeklyDistribution[dayOfWeek] += dayItem.totalScore;
        }
    });

    return {
        year, monthIndex,
        questionsResolved: questionsResolvedThisMonth,
        tasksCompleted,
        focusTimeMinutes, // Alterado de focusTimeHours
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
    introMonth.textContent = `Sua Retrospectiva de ${getMonthYearString(new Date(retrospectiveDataStore.currentMonth.year, retrospectiveDataStore.currentMonth.monthIndex))}`;
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
        { metric: "questions", el: questionsResolvedEl, value: currentMonth.questionsResolved || 0, phraseEl: phraseQuestionsEl, cardSel: '[data-metric-card="questions"]' },
        { metric: "tasks", el: tasksCompletedEl, value: currentMonth.tasksCompleted || 0, phraseEl: phraseTasksEl, cardSel: '[data-metric-card="tasks"]' },
        { metric: "focus", el: focusTimeEl, value: formatFocusMinutes(currentMonth.focusTimeMinutes), phraseEl: phraseFocusEl, cardSel: '[data-metric-card="focus"]' }
    ];

    let visibleCards = 0;
    cardsData.forEach(item => {
        const card = mainStatsScreen ? mainStatsScreen.querySelector(item.cardSel) : null;
        if (card) {
            if (selectedMetrics.includes(item.metric)) {
                card.style.display = '';
                if (item.el) item.el.textContent = item.value;
                if (item.phraseEl) item.phraseEl.textContent = getRandomPhrase(item.metric);
                visibleCards++;
            } else {
                card.style.display = 'none';
            }
        }
    });
    const gridEl = mainStatsScreen ? mainStatsScreen.querySelector('.retrospective-stats-grid') : null;
    if (gridEl) {
        if (visibleCards === 1) gridEl.style.gridTemplateColumns = 'minmax(180px, 300px)';
        else if (visibleCards === 2) gridEl.style.gridTemplateColumns = 'repeat(2, minmax(180px, 1fr))';
        else gridEl.style.gridTemplateColumns = 'repeat(auto-fit, minmax(180px, 1fr))';
    }
}

function populateProductiveDayScreen() {
    if (!retrospectiveDataStore.currentMonth || !mostProductiveDateEl || !mostProductiveValueEl) {
         if(mostProductiveDateEl) mostProductiveDateEl.textContent = "-";
         if(mostProductiveValueEl) mostProductiveValueEl.textContent = "Dados indisponíveis.";
        return;
    }
    const { mostProductiveDayOverall } = retrospectiveDataStore.currentMonth;
    if (mostProductiveDayOverall && mostProductiveDayOverall.date && mostProductiveDayOverall.totalScore > 0) {
        const dateObj = new Date(mostProductiveDayOverall.date);
        mostProductiveDateEl.textContent = dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
        let achievementsText = [];
        if (mostProductiveDayOverall.questions > 0) achievementsText.push(`${mostProductiveDayOverall.questions} questões`);
        if (mostProductiveDayOverall.tasks > 0) achievementsText.push(`${mostProductiveDayOverall.tasks} tarefas`);
        if (mostProductiveDayOverall.focusMinutes > 0) achievementsText.push(`${mostProductiveDayOverall.focusMinutes.toFixed(0)} min de foco`);
        mostProductiveValueEl.textContent = achievementsText.length > 0 ? achievementsText.join(' + ') + "!" : "Um dia de grande esforço!";
    } else {
        mostProductiveDateEl.textContent = "-";
        mostProductiveValueEl.textContent = "Nenhum dia com dados significativos este mês.";
    }
}

function populateTimePatternsScreen() {
    if (!retrospectiveDataStore.currentMonth) {
        if(peakFocusHourEl) peakFocusHourEl.textContent = "-"; // Alterado de N/A para -
        if(longestStreakEl) longestStreakEl.textContent = "0";
        if(weekdayChartContainer) weekdayChartContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted-dark);">Dados não disponíveis.</p>';
        return;
    }
    const { peakFocusHour, longestStreakInMonth, weeklyDistribution } = retrospectiveDataStore.currentMonth;

    if (peakFocusHourEl) {
        peakFocusHourEl.textContent = peakFocusHour !== null ? `${String(peakFocusHour).padStart(2, '0')}:00` : "-"; // Alterado de N/A para -
    }
    if (longestStreakEl) longestStreakEl.textContent = longestStreakInMonth || 0;

    if (weekdayChartContainer && weeklyDistribution && weeklyDistribution.length === 7) {
        weekdayChartContainer.innerHTML = '';
        const dayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const maxValue = Math.max(...weeklyDistribution, 1); // Evita divisão por zero se todos forem 0

        weeklyDistribution.forEach((value, index) => {
            const barContainer = document.createElement('div');
            barContainer.className = 'retrospective-weekday-bar-container';
            const bar = document.createElement('div');
            bar.className = 'retrospective-weekday-bar';
            bar.style.height = `${(value / maxValue) * 100}%`;
            const label = document.createElement('span');
            label.className = 'retrospective-weekday-label';
            label.textContent = dayLabels[index];
            barContainer.appendChild(bar);
            barContainer.appendChild(label);
            weekdayChartContainer.appendChild(barContainer);
        });
    } else if (weekdayChartContainer) {
         weekdayChartContainer.innerHTML = '<p style="text-align:center; color: var(--text-muted-dark);">Dados de distribuição semanal indisponíveis.</p>';
    }
}

function populateComparisonScreen() {
    if (!retrospectiveDataStore.currentMonth || !retrospectiveDataStore.previousMonth || Object.keys(retrospectiveDataStore.previousMonth).length === 0) {
        console.warn("TASKIFY_RETRO: Dados do mês atual ou anterior ausentes para comparação.");
        ['questions', 'tasks', 'focus'].forEach(metric => {
            const card = comparisonScreen ? comparisonScreen.querySelector(`[data-metric-comparison-card="${metric}"]`) : null;
            if (card) card.style.display = 'none';
        });
        if (comparisonHighlightEl) comparisonHighlightEl.textContent = "dados de comparação indisponíveis";
        return;
    }

    const { currentMonth, previousMonth } = retrospectiveDataStore;
    let comparisonMetricsShown = 0;

    const setTextAndPercentage = (valueEl, percentageEl, iconContainer, currentValue, previousValue, formatterFunc = (val) => `${val}`) => {
        let metricDisplayed = false;
        if (valueEl) {
            valueEl.textContent = formatterFunc(currentValue);
        }
    
        if (percentageEl && iconContainer) {
            const icon = iconContainer.querySelector('.retrospective-icon-small');
            if (!icon) { percentageEl.textContent = "-"; return metricDisplayed; } // Alterado de N/A para -
    
            const currentNum = parseFloat(currentValue) || 0;
            const prevNum = parseFloat(previousValue) || 0;
    
            if (previousValue !== null && previousValue !== undefined ) { 
                if (prevNum > 0) {
                    const percentageChange = ((currentNum - prevNum) / prevNum) * 100;
                    percentageEl.textContent = `${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(0)}%`;
                    icon.className = `bi ${percentageChange >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right'} retrospective-icon-small ${percentageChange >= 0 ? 'retrospective-icon-green' : 'retrospective-icon-red'}`;
                    metricDisplayed = true;
                } else if (currentNum > 0) { 
                    percentageEl.textContent = "NOVO!";
                    icon.className = 'bi bi-stars retrospective-icon-small retrospective-icon-green';
                    metricDisplayed = true;
                } else { 
                    percentageEl.textContent = "0%";
                    icon.className = 'bi bi-dash retrospective-icon-small';
                }
            } else { percentageEl.textContent = "-"; icon.className = 'bi bi-dash retrospective-icon-small'; } // Alterado de N/A para -
        } else if (percentageEl) { percentageEl.textContent = "-"; } // Alterado de N/A para -
        return metricDisplayed;
    };

    const comparisonCardsData = [
        { metric: "questions", valueElId: "retrospective-comparison-questions-resolved", percentageElId: "retrospective-questions-percentage", current: currentMonth.questionsResolved || 0, prev: previousMonth.questionsResolved, cardSel: '[data-metric-comparison-card="questions"]', formatter: (val) => `${val}` },
        { metric: "tasks", valueElId: "retrospective-comparison-tasks-completed", percentageElId: "retrospective-tasks-percentage", current: currentMonth.tasksCompleted || 0, prev: previousMonth.tasksCompleted, cardSel: '[data-metric-comparison-card="tasks"]', formatter: (val) => `${val}` },
        { metric: "focus", valueElId: "retrospective-comparison-focus-time", percentageElId: "retrospective-focus-percentage", current: currentMonth.focusTimeMinutes || 0, prev: previousMonth.focusTimeMinutes, cardSel: '[data-metric-comparison-card="focus"]', formatter: formatFocusMinutes }
    ];

    comparisonCardsData.forEach(item => {
        const card = comparisonScreen ? comparisonScreen.querySelector(item.cardSel) : null;
        if (card) {
            if (selectedMetrics.includes(item.metric)) {
                card.style.display = '';
                if (setTextAndPercentage(
                    document.getElementById(item.valueElId), 
                    document.getElementById(item.percentageElId), 
                    document.getElementById(item.percentageElId)?.parentElement, 
                    item.current, 
                    item.prev, 
                    item.formatter
                )) {
                    comparisonMetricsShown++;
                }
            } else {
                card.style.display = 'none';
            }
        }
    });
    if (comparisonHighlightEl) comparisonHighlightEl.textContent = comparisonMetricsShown > 0 ? "sua evolução" : "seu desempenho este mês";
}

function populateFinalScreen() {
    if (!retrospectiveDataStore.currentMonth || !finalMonthYearEl || !achievementsListEl || !finalScreenImageableContent) {
        if (finalMonthYearEl) finalMonthYearEl.textContent = getMonthYearString(new Date());
        if (achievementsListEl) achievementsListEl.innerHTML = '<li>Nenhuma conquista para exibir.</li>';
        [finalQuestionsHighlightItem, finalTasksHighlightItem, finalFocusHighlightItem,
         finalPeakFocusStatItem, finalLongestStreakStatItem, finalProductiveDayStatItem,
         finalAchievementsContainer].forEach(el => { if (el) el.style.display = 'none'; });
        return;
    }
    const { currentMonth } = retrospectiveDataStore;
    finalMonthYearEl.textContent = getMonthYearString(new Date(currentMonth.year, currentMonth.monthIndex));

    const highlightsGrid = finalScreenImageableContent.querySelector('.retrospective-final-highlights');
    let visibleHighlightCount = 0;

    [finalQuestionsHighlightItem, finalTasksHighlightItem, finalFocusHighlightItem].forEach(item => {
        if (item) item.style.display = 'none';
    });
    [finalPeakFocusStatItem, finalLongestStreakStatItem, finalProductiveDayStatItem,
     finalAchievementsContainer].forEach(el => { if (el) el.style.display = 'none'; });


    if (finalQuestionsHighlightItem && selectedMetrics.includes("questions")) {
        finalQuestionsHighlightItem.style.display = 'flex';
        if(finalQuestionsValueEl) finalQuestionsValueEl.textContent = currentMonth.questionsResolved || 0;
        visibleHighlightCount++;
    }
    if (finalTasksHighlightItem && selectedMetrics.includes("tasks")) {
        finalTasksHighlightItem.style.display = 'flex';
        if(finalTasksValueEl) finalTasksValueEl.textContent = currentMonth.tasksCompleted || 0;
        visibleHighlightCount++;
    }
    if (finalFocusHighlightItem && selectedMetrics.includes("focus")) {
        finalFocusHighlightItem.style.display = 'flex';
        if(finalFocusValueEl) finalFocusValueEl.textContent = formatFocusMinutes(currentMonth.focusTimeMinutes);
        visibleHighlightCount++;
    }

    if (highlightsGrid) {
        highlightsGrid.dataset.itemCount = visibleHighlightCount;
    }


    if (finalPeakFocusStatItem && currentMonth.peakFocusHour !== null) {
        finalPeakFocusStatItem.style.display = 'flex';
        if(finalPeakFocusHourEl) finalPeakFocusHourEl.textContent = `${String(currentMonth.peakFocusHour).padStart(2, '0')}:00`;
    } else if (finalPeakFocusStatItem && currentMonth.peakFocusHour === null) {
        finalPeakFocusStatItem.style.display = 'flex';
        if(finalPeakFocusHourEl) finalPeakFocusHourEl.textContent = "-"; // Alterado de N/A
    }

    if (finalLongestStreakStatItem && (currentMonth.longestStreakInMonth || 0) >= 0) { // Alterado para >=0 para mostrar mesmo se for 0
        finalLongestStreakStatItem.style.display = 'flex';
        if(finalLongestStreakEl) finalLongestStreakEl.textContent = currentMonth.longestStreakInMonth || 0;
    }

    if (finalProductiveDayStatItem && currentMonth.mostProductiveDayOverall && currentMonth.mostProductiveDayOverall.date) {
        finalProductiveDayStatItem.style.display = 'flex';
        const prodDate = new Date(currentMonth.mostProductiveDayOverall.date);
        if(finalMostProductiveDayShortEl) finalMostProductiveDayShortEl.textContent = prodDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
    } else if (finalProductiveDayStatItem) {
        finalProductiveDayStatItem.style.display = 'flex';
        if(finalMostProductiveDayShortEl) finalMostProductiveDayShortEl.textContent = "-"; // Alterado de N/A
    }


    achievementsListEl.innerHTML = '';
    const achievements = determineAchievements(currentMonth, selectedMetrics);
    if (achievements.length > 0) {
        if (finalAchievementsContainer) finalAchievementsContainer.style.display = '';
        const badge = document.createElement('span');
        badge.className = 'retrospective-badge retrospective-badge-achievement';
        badge.innerHTML = achievements[0];
        achievementsListEl.appendChild(badge);
    }
}


function determineAchievements(monthData, metrics) {
    const achievements = [];
    const appGoals = (window.state && window.state.goals) ? window.state.goals : { monthly: 300, daily: 10, weekly: 50 };

    if (!monthData) return ["<i class='bi bi-emoji-smile-fill'></i> Bom Trabalho!"];

    const monthlyQuestionsGoal = appGoals.monthly || 300;
    const monthlyTasksGoal = Math.max(15, Math.round((appGoals.weekly || 50) * 0.75 * 4));
    // Exemplo: 1.5 min de foco por questão da meta mensal, ou um mínimo de 10h (600 min)
    const monthlyFocusGoalMinutes = Math.max(600, Math.round((appGoals.monthly || 300) * 1.5));


    if (metrics.includes("questions") && (monthData.questionsResolved || 0) >= monthlyQuestionsGoal && monthlyQuestionsGoal > 0) {
        achievements.push("<i class='bi bi-award-fill'></i> Meta de Questões Superada!");
    } else if (metrics.includes("questions") && (monthData.questionsResolved || 0) > (monthlyQuestionsGoal / 2) && monthlyQuestionsGoal > 0) {
        achievements.push("<i class='bi bi-trophy-fill'></i> Mestre das Questões");
    }

    if (metrics.includes("tasks") && (monthData.tasksCompleted || 0) >= monthlyTasksGoal && monthlyTasksGoal > 0) {
        achievements.push("<i class='bi bi-check-all'></i> Produtividade em Alta!");
    } else if (metrics.includes("tasks") && (monthData.tasksCompleted || 0) > (monthlyTasksGoal / 2) && monthlyTasksGoal > 0) {
        achievements.push("<i class='bi bi-check-circle-fill'></i> Executor Nato");
    }

    if (metrics.includes("focus") && (monthData.focusTimeMinutes || 0) >= monthlyFocusGoalMinutes && monthlyFocusGoalMinutes > 0) {
        achievements.push("<i class='bi bi-stopwatch-fill'></i> Lorde do Tempo");
    } else if (metrics.includes("focus") && (monthData.focusTimeMinutes || 0) > (monthlyFocusGoalMinutes / 2) && monthlyFocusGoalMinutes > 0) {
        achievements.push("<i class='bi bi-hourglass-split'></i> Foco Inabalável");
    }

    if ((monthData.longestStreakInMonth || 0) >= 15) {
        achievements.push("<i class='bi bi-gem'></i> Streak Diamante!");
    } else if ((monthData.longestStreakInMonth || 0) >= 7) {
        achievements.push("<i class='bi bi-fire'></i> Streak Imbatível");
    }

    if (monthData.mostProductiveDayOverall && (monthData.mostProductiveDayOverall.totalScore || 0) > 15) {
        achievements.push("<i class='bi bi-stars'></i> Dia Lendário");
    }
    
    if (achievements.length === 0) {
        achievements.push("<i class='bi bi-emoji-smile-fill'></i> Mês de Esforço!");
    }
    if (achievements.length > 1) {
        if (achievements.some(a => a.includes("Superada") || a.includes("Diamante") || a.includes("Lorde"))) {
            return achievements.filter(a => a.includes("Superada") || a.includes("Diamante") || a.includes("Lorde")).slice(0,1);
        }
    }
    return achievements.slice(0, 1);
}

function generateRetrospectiveShareText() {
    if (!retrospectiveDataStore.currentMonth || Object.keys(retrospectiveDataStore.currentMonth).length === 0) {
        return "Confira meu progresso no Taskify! #TaskifyApp https://taskify-fabinxz.vercel.app";
    }
    const { questionsResolved, tasksCompleted, focusTimeMinutes, mostProductiveDayOverall, longestStreakInMonth } = retrospectiveDataStore.currentMonth;
    const monthName = getMonthYearString(new Date(retrospectiveDataStore.currentMonth.year, retrospectiveDataStore.currentMonth.monthIndex));
    let text = `Minha retrospectiva de ${monthName} no Taskify! 🚀\n\n`;
    let detailsAdded = 0;

    if (selectedMetrics.includes("questions") && (questionsResolved || 0) > 0) { text += `✅ ${questionsResolved} questões resolvidas\n`; detailsAdded++; }
    if (selectedMetrics.includes("tasks") && (tasksCompleted || 0) > 0) { text += `🎯 ${tasksCompleted} tarefas concluídas\n`; detailsAdded++; }
    if (selectedMetrics.includes("focus") && (focusTimeMinutes || 0) > 0) { text += `⏰ ${formatFocusMinutes(focusTimeMinutes)} de foco total\n`; detailsAdded++; }
    if (detailsAdded > 0) text += "\n";

    if (mostProductiveDayOverall && mostProductiveDayOverall.date && (mostProductiveDayOverall.totalScore || 0) > 0) {
         const prodDate = new Date(mostProductiveDayOverall.date);
         text += `🌟 Dia Mais Produtivo: ${prodDate.toLocaleDateString('pt-BR', {day: '2-digit', month: 'long'})}\n`;
    }
    if ((longestStreakInMonth || 0) >= 3) { text += `🔥 Maior Streak: ${longestStreakInMonth} dias\n`; }

    text += "\nConfira o Taskify e organize seu sucesso! 👉 taskify-fabinxz.vercel.app\n#TaskifyWrapped #Produtividade #Foco";
    return text;
}


async function generateAndCopyRetrospectiveImageInternal(forSharingNotification = false) {
    if (!finalScreenImageableContent) {
        const message = "Erro: A área da retrospectiva não pôde ser encontrada para gerar a imagem.";
        console.error("TASKIFY_RETRO:", message);
        if (typeof window.showCustomAlert === 'function') window.showCustomAlert(message, "Falha ao Gerar Imagem");
        else alert(message);
        return null;
    }
    if (typeof html2canvas !== 'function') {
        const message = "Erro: A funcionalidade de imagem (html2canvas) não está disponível.";
        console.error("TASKIFY_RETRO: html2canvas não está definido.");
        if (typeof window.showCustomAlert === 'function') window.showCustomAlert(message, "Funcionalidade Indisponível");
        else alert(message);
        return null;
    }

    const isLightTheme = document.body.classList.contains('light');
    const currentPrimaryColorHex = getComputedStyle(document.documentElement).getPropertyValue('--primary-color-dark').trim();
    const currentFontFamily = getComputedStyle(document.body).fontFamily;
    const primaryRgbArray = hexToRgbArray(currentPrimaryColorHex);
    let primaryRgbStringForCssVar = primaryRgbArray ? primaryRgbArray.join(', ') : "10, 124, 255";
    
    let solidFallbackBackgroundColor = isLightTheme ? '#FFFFFF' : '#0a0a0a'; 
    let cardBackgroundColorForClone; 

    if (isLightTheme) {
        cardBackgroundColorForClone = `linear-gradient(160deg, rgba(${primaryRgbStringForCssVar}, 0.15) 0%, rgba(${primaryRgbStringForCssVar}, 0.05) 40%, #f8f8f8 100%)`;
    } else {
        cardBackgroundColorForClone = `linear-gradient(160deg, rgba(${primaryRgbStringForCssVar}, 0.25) 0%, rgba(${primaryRgbStringForCssVar}, 0.1) 40%, #101012 100%)`;
    }


    console.log("TASKIFY_RETRO: Gerando imagem. Tema claro:", isLightTheme, "Cor primária HEX:", currentPrimaryColorHex, "RGB string:", primaryRgbStringForCssVar, "Fallback Sólido:", solidFallbackBackgroundColor);

    const options = {
        backgroundColor: solidFallbackBackgroundColor,
        scale: 2, useCORS: true, logging: false,
        onclone: (documentCloned) => {
            console.log("TASKIFY_RETRO: html2canvas onclone - Documento clonado.");
            const clonedBody = documentCloned.body;
            const clonedHtml = documentCloned.documentElement;

            clonedHtml.style.setProperty('--primary-color-dark', currentPrimaryColorHex);
            clonedHtml.style.setProperty('--primary-color-light', currentPrimaryColorHex);
            clonedHtml.style.setProperty('--primary-color-dark-rgb', primaryRgbStringForCssVar);
            clonedHtml.style.setProperty('--primary-color-light-rgb', primaryRgbStringForCssVar);
            clonedBody.style.fontFamily = currentFontFamily;
            
            if (isLightTheme) {
                clonedBody.classList.add('light');
                clonedHtml.classList.add('light-theme-active');
                clonedBody.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color-light').trim();
            } else {
                clonedBody.classList.remove('light');
                clonedHtml.classList.remove('light-theme-active');
                clonedBody.style.color = getComputedStyle(document.documentElement).getPropertyValue('--text-color-dark').trim();
            }

            const clonedContentWrapper = documentCloned.querySelector('.retrospective-final-content-wrapper');
            if (clonedContentWrapper) {
                clonedContentWrapper.style.background = cardBackgroundColorForClone; 
                clonedContentWrapper.style.color = isLightTheme ? getComputedStyle(document.documentElement).getPropertyValue('--text-color-light').trim() : '#FFFFFF';
                console.log("TASKIFY_RETRO: Gradiente do card aplicado ao clone:", cardBackgroundColorForClone);

                clonedContentWrapper.querySelector('.retrospective-final-logo .logo-text').style.color = isLightTheme ? getComputedStyle(document.documentElement).getPropertyValue('--text-color-light').trim() : '#FFFFFF';
                clonedContentWrapper.querySelector('.retrospective-final-date').style.color = isLightTheme ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';
                clonedContentWrapper.querySelector('.retrospective-final-main-title').style.color = isLightTheme ? getComputedStyle(document.documentElement).getPropertyValue('--text-color-light').trim() : '#FFFFFF';
                clonedContentWrapper.querySelectorAll('.retrospective-final-highlight-value').forEach(el => el.style.color = currentPrimaryColorHex);
                clonedContentWrapper.querySelectorAll('.retrospective-final-highlight-label').forEach(el => el.style.color = isLightTheme ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)');
                clonedContentWrapper.querySelectorAll('.final-highlight-icon').forEach(el => el.style.color = isLightTheme ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)');
                clonedContentWrapper.querySelectorAll('.retrospective-final-other-stat-item i').forEach(el => el.style.color = currentPrimaryColorHex);
                clonedContentWrapper.querySelectorAll('.retrospective-final-other-stat-item span, .retrospective-final-other-stat-item strong').forEach(el => el.style.color = isLightTheme ? getComputedStyle(document.documentElement).getPropertyValue('--text-color-light').trim() : '#FFFFFF');
                clonedContentWrapper.querySelector('.retrospective-final-achievements-title').style.color = isLightTheme ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.8)';
                clonedContentWrapper.querySelector('.retrospective-final-footer').style.color = isLightTheme ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)';

                // Aplica uma cor de fundo sólida para o badge na imagem gerada
                const clonedBadges = documentCloned.querySelectorAll('.retrospective-badge-achievement');
                clonedBadges.forEach(badge => {
                    let badgeSolidBgColor;
                    let badgeTextColor;
                    const primaryColorForBadge = clonedHtml.style.getPropertyValue('--primary-color-dark');

                    if (isLightTheme) {
                        const rgb = hexToRgbArray(primaryColorForBadge);
                        if (rgb) {
                            badgeSolidBgColor = `rgba(${Math.max(0, rgb[0]-20)}, ${Math.max(0, rgb[1]-20)}, ${Math.max(0, rgb[2]-20)}, 0.8)`;
                        } else {
                            badgeSolidBgColor = 'rgba(0,0,0,0.1)'; // Fallback
                        }
                        badgeTextColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color-light').trim();
                    } else {
                         const rgb = hexToRgbArray(primaryColorForBadge);
                        if (rgb) {
                             badgeSolidBgColor = `rgba(${Math.min(255, rgb[0]+30)}, ${Math.min(255, rgb[1]+30)}, ${Math.min(255, rgb[2]+30)}, 0.7)`;
                        } else {
                            badgeSolidBgColor = 'rgba(255,255,255,0.2)'; // Fallback
                        }
                        badgeTextColor = 'white';
                    }
                    badge.style.background = badgeSolidBgColor;
                    badge.style.color = badgeTextColor;
                    badge.style.textShadow = 'none'; 
                    badge.style.boxShadow = 'none'; 
                    badge.style.animation = 'none'; 
                });

                console.log("TASKIFY_RETRO: html2canvas onclone - Estilos (card e badge sólidos) aplicados.");
            } else {
                 console.warn("TASKIFY_RETRO: html2canvas onclone - .retrospective-final-content-wrapper não encontrado no clone.");
            }
            Array.from(document.styleSheets).forEach(styleSheet => {
                try {
                    if (styleSheet.href && styleSheet.href.includes('bootstrap-icons')) {
                        const link = documentCloned.createElement('link');
                        link.rel = 'stylesheet'; link.href = styleSheet.href;
                        documentCloned.head.appendChild(link);
                    } else if (styleSheet.cssRules) {
                        const style = documentCloned.createElement('style');
                        Array.from(styleSheet.cssRules).forEach(rule => style.appendChild(documentCloned.createTextNode(rule.cssText)));
                        documentCloned.head.appendChild(style);
                    }
                } catch (e) {
                    if (!(e instanceof DOMException && e.name === 'SecurityError')) {
                         console.warn("TASKIFY_RETRO: html2canvas onclone - Não foi possível clonar stylesheet:", styleSheet.href || "inline", e);
                    }
                }
            });
            return new Promise(resolve => setTimeout(resolve, 500));
        }
    };

    try {
        const canvas = await html2canvas(finalScreenImageableContent, options);
        console.log("TASKIFY_RETRO: html2canvas concluiu. Canvas gerado.");
        if (navigator.clipboard && navigator.clipboard.write) {
            return new Promise((resolvePromise, rejectPromise) => {
                canvas.toBlob(async function(blob) {
                    if (blob) {
                        try {
                            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                            console.log("TASKIFY_RETRO: Imagem da retrospectiva copiada.");
                            const alertTitle = forSharingNotification ? 'Compartilhar' : 'Copiado!';
                            const alertMsg = forSharingNotification ? 'Imagem copiada! Cole no seu tweet.' : 'Imagem da retrospectiva copiada para a área de transferência!';
                            if (typeof window.showCustomAlert === 'function') window.showCustomAlert(alertMsg, alertTitle); else alert(alertMsg);
                            resolvePromise(canvas);
                        } catch (err) {
                            console.error("TASKIFY_RETRO: Falha ao copiar imagem:", err);
                            if (typeof window.showCustomAlert === 'function') window.showCustomAlert("Não foi possível copiar a imagem automaticamente. Tente novamente ou use um print screen.", "Cópia Falhou");
                            else alert("Não foi possível copiar a imagem automaticamente. Tente novamente ou use um print screen.");
                            rejectPromise(err);
                        }
                    } else {
                         console.error("TASKIFY_RETRO: Falha ao criar blob da imagem.");
                         if (typeof window.showCustomAlert === 'function') window.showCustomAlert("Erro ao processar a imagem para cópia.", "Falha na Imagem"); else alert("Erro ao processar a imagem para cópia.");
                         rejectPromise(new Error("Falha ao criar blob"));
                    }
                }, 'image/png');
            });
        } else {
            console.warn("TASKIFY_RETRO: API de Clipboard (write) não suportada ou não segura (ex: HTTP).");
             if (typeof window.showCustomAlert === 'function') window.showCustomAlert("Seu navegador não suporta a cópia automática de imagens ou a página não é segura (HTTPS).", "Aviso");
             else alert("Seu navegador não suporta a cópia automática de imagens ou a página não é segura (HTTPS).");
            return canvas;
        }
    } catch (err) {
        console.error("TASKIFY_RETRO: Erro ao gerar imagem com html2canvas:", err);
        const userMessage = `Erro ao gerar imagem da retrospectiva. Detalhes: ${err.message}.`;
        if (typeof window.showCustomAlert === 'function') window.showCustomAlert(userMessage, "Falha na Imagem"); else alert(userMessage);
        return null;
    }
}


async function shareRetrospectiveOnTwitterWithImage() {
    const textToShare = generateRetrospectiveShareText();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textToShare)}`;
    const canvas = await generateAndCopyRetrospectiveImageInternal(true);
    if (!canvas) {
        if (typeof window.showCustomAlert === 'function') window.showCustomAlert('Não foi possível gerar/copiar a imagem. Compartilhando apenas texto. Abrindo Twitter...', 'Compartilhar Texto');
        else alert('Não foi possível gerar/copiar a imagem. Compartilhando apenas texto. Abrindo Twitter...');
    }
    setTimeout(() => { window.open(twitterUrl, '_blank'); }, 1500);
}

async function copyRetrospectiveImageToClipboard() {
    await generateAndCopyRetrospectiveImageInternal(false);
}

window.initializeRetrospectiveInternals = initializeRetrospectiveInternals;
window.openRetrospectiveView = openRetrospectiveView;
window.closeRetrospectiveView = closeRetrospectiveView;
