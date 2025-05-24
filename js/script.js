// Variáveis globais e estado inicial
let weeklyChartInstance = null;

const initialDefaultState = {
    todayCount: 73,
    lastAccessDate: new Date().toDateString(),
    goals: {
        daily: 100,
        weekly: 600,
        monthly: 2000,
        yearly: 20000,
        streak: 21
    },
    weeklyProgress: 536,
    monthlyProgress: 1804,
    yearlyProgress: 4833,
    weeklyActivityData: [132, 90, 99, 110, 105, 120, 73], // Último é o dia atual
    dailyRecord: {
        value: 143,
        date: "20 de maio"
    },
    currentStreak: {
        days: 0,
        lastCompletionDate: null
    },
    peakActivity: {
        dayName: "Sáb",
        questions: 132
    },
    isDarkMode: true,
    lastWeekStartDate: getStartOfWeek(new Date()).toDateString(),
    lastMonthStartDate: getStartOfMonth(new Date()).toDateString(),
    lastYearStartDate: getStartOfYear(new Date()).toDateString(),
};

let state = JSON.parse(JSON.stringify(initialDefaultState)); // Deep copy

// Funções Utilitárias de Data
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajusta para segunda-feira como início da semana
    return new Date(d.setDate(diff));
}

function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getStartOfYear(date) {
    return new Date(date.getFullYear(), 0, 1);
}

function getLast7DayLabels() {
    const dayAbbreviations = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]; // Abreviações curtas
    const labels = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(dayAbbreviations[date.getDay()]);
    }
    return labels;
}

// Gerenciamento de Estado (LocalStorage)
function populateInitialDataIfEmpty() {
    state.goals = { ...initialDefaultState.goals, ...(state.goals || {}) };
    state.dailyRecord = { ...initialDefaultState.dailyRecord, ...(state.dailyRecord || {}) };
    state.currentStreak = { ...initialDefaultState.currentStreak, ...(state.currentStreak || {}) };
    state.peakActivity = { ...initialDefaultState.peakActivity, ...(state.peakActivity || {}) };

    if (!Array.isArray(state.weeklyActivityData) || state.weeklyActivityData.length !== 7) {
        state.weeklyActivityData = [...initialDefaultState.weeklyActivityData];
    } else {
        state.weeklyActivityData = state.weeklyActivityData.map(val => Number(val) || 0);
    }
}

function loadState() {
    try {
        const savedStateString = localStorage.getItem('taskify-state');
        if (savedStateString) {
            const parsedState = JSON.parse(savedStateString);
            state = {
                ...initialDefaultState,
                ...parsedState,
                goals: { ...initialDefaultState.goals, ...(parsedState.goals || {}) },
                dailyRecord: { ...initialDefaultState.dailyRecord, ...(parsedState.dailyRecord || {}) },
                currentStreak: { ...initialDefaultState.currentStreak, ...(parsedState.currentStreak || {}) },
                peakActivity: { ...initialDefaultState.peakActivity, ...(parsedState.peakActivity || {}) },
                weeklyActivityData: (parsedState.weeklyActivityData && Array.isArray(parsedState.weeklyActivityData) && parsedState.weeklyActivityData.length === 7)
                    ? parsedState.weeklyActivityData.map(v => Number(v) || 0)
                    : [...initialDefaultState.weeklyActivityData],
            };
        } else {
            state = JSON.parse(JSON.stringify(initialDefaultState));
        }
    } catch (e) {
        console.error("Error parsing state from localStorage:", e);
        state = JSON.parse(JSON.stringify(initialDefaultState));
        localStorage.removeItem('taskify-state');
    }

    const savedTheme = localStorage.getItem('taskify-theme');
    state.isDarkMode = savedTheme !== null ? savedTheme === 'dark' : initialDefaultState.isDarkMode;
    const savedPrimaryColor = localStorage.getItem('taskify-primary-color');
    if (savedPrimaryColor) {
        document.documentElement.style.setProperty('--primary-color-light', savedPrimaryColor);
        document.documentElement.style.setProperty('--primary-color-dark', savedPrimaryColor);
    }


    populateInitialDataIfEmpty();
}

function saveState() {
    try {
        localStorage.setItem('taskify-state', JSON.stringify(state));
        localStorage.setItem('taskify-theme', state.isDarkMode ? 'dark' : 'light');
        // A cor primária já é salva em applyPrimaryColor
    } catch (e) {
        console.error("Error saving state to localStorage:", e);
    }
}

// Lógica de Reset de Contadores
function checkAllResets() {
    const prevLastAccessDate = state.lastAccessDate;
    const prevWeeklyData = [...state.weeklyActivityData];

    checkAndResetDailyCounters();
    checkAndResetWeeklyCounters();
    checkAndResetMonthlyCounters();
    checkAndResetYearlyCounters();

    const weeklyDataChanged = JSON.stringify(prevWeeklyData) !== JSON.stringify(state.weeklyActivityData);

    if (state.lastAccessDate !== prevLastAccessDate || weeklyDataChanged) {
        updateUI();
    }
    saveState();
}

function checkAndResetDailyCounters() {
    const todayStr = new Date().toDateString();
    if (state.lastAccessDate !== todayStr) {
        state.todayCount = 0;
        state.lastAccessDate = todayStr;
        if (state.weeklyActivityData && state.weeklyActivityData.length === 7) {
            state.weeklyActivityData.shift();
            state.weeklyActivityData.push(0);
        } else {
            state.weeklyActivityData = [0, 0, 0, 0, 0, 0, 0];
        }
        updatePeakActivity();
    }
}

function checkAndResetWeeklyCounters() {
    const currentWeekStartStr = getStartOfWeek(new Date()).toDateString();
    if (state.lastWeekStartDate !== currentWeekStartStr) {
        state.weeklyProgress = 0;
        state.lastWeekStartDate = currentWeekStartStr;
    }
}

function checkAndResetMonthlyCounters() {
    const currentMonthStartStr = getStartOfMonth(new Date()).toDateString();
    if (state.lastMonthStartDate !== currentMonthStartStr) {
        state.monthlyProgress = 0;
        state.lastMonthStartDate = currentMonthStartStr;
    }
}

function checkAndResetYearlyCounters() {
    const currentYearStartStr = getStartOfYear(new Date()).toDateString();
    if (state.lastYearStartDate !== currentYearStartStr) {
        state.yearlyProgress = 0;
        state.lastYearStartDate = currentYearStartStr;
    }
}

// Atualização da UI
function updateCircularProgress(elementId, current, target) {
    const circle = document.getElementById(elementId);
    if (!circle) return;

    // O raio (r) é fixo no SVG (r=52). A escala visual é feita pelo CSS no container .circular-progress
    // e no SVG (.progress-ring width/height 100%).
    // O valor do raio para cálculo da circunferência deve ser o original do elemento circle.
    const radius = 52; // Usar o raio original do <circle>
    const circumference = 2 * Math.PI * radius;

    // Assegura que strokeDasharray está correto caso não tenha sido setado via HTML/CSS inicialmente
    // ou se precisar ser recalculado (embora aqui seja fixo pelo r=52)
    if (circle.style.strokeDasharray !== `${circumference} ${circumference}`) {
         circle.style.strokeDasharray = `${circumference} ${circumference}`;
    }

    const progress = target > 0 ? Math.min(current / target, 1) : 0;
    const dashoffsetValue = circumference * (1 - progress);
    circle.style.strokeDashoffset = dashoffsetValue;
}

function updateUI() {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };

    setText('today-count', state.todayCount);
    setText('today-target', state.goals.daily);
    updateCircularProgress('today-progress', state.todayCount, state.goals.daily);

    setText('week-count', state.weeklyProgress);
    setText('week-target', state.goals.weekly);
    updateCircularProgress('week-progress', state.weeklyProgress, state.goals.weekly);

    setText('month-count', state.monthlyProgress);
    setText('month-target', state.goals.monthly);
    updateCircularProgress('month-progress', state.monthlyProgress, state.goals.monthly);

    setText('year-count', state.yearlyProgress);
    setText('year-target', state.goals.yearly);
    updateCircularProgress('year-progress', state.yearlyProgress, state.goals.yearly);

    setText('daily-record-value', state.dailyRecord.value);
    setText('daily-record-date', state.dailyRecord.date || "-");
    updateStreakUI();
    setText('peak-activity-day', state.peakActivity.dayName || "-");
    setText('peak-activity-questions', `${state.peakActivity.questions} questões`);

    document.getElementById('daily-goal-input').value = state.goals.daily;
    document.getElementById('weekly-goal-input').value = state.goals.weekly;
    document.getElementById('monthly-goal-input').value = state.goals.monthly;
    document.getElementById('yearly-goal-input').value = state.goals.yearly;
    document.getElementById('streak-goal-input').value = state.goals.streak;

    document.title = `(${state.goals.daily > 0 ? Math.round((state.todayCount / state.goals.daily) * 100) : 0}%) Taskify`;
    updateWeeklyChartDataOnly();
}

function updateDailyRecord() {
    const todayLocaleDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    if (state.todayCount > state.dailyRecord.value) {
        state.dailyRecord.value = state.todayCount;
        state.dailyRecord.date = todayLocaleDate;
    } else if (state.dailyRecord.date === todayLocaleDate && state.todayCount < state.dailyRecord.value) {
        // Se a data do recorde é hoje, e o todayCount diminuiu mas ainda é o recorde atual para hoje.
        // Esta lógica pode ser simplificada: se todayCount é o valor atual, e a data do recorde é hoje,
        // então o valor do recorde deve ser o todayCount.
        // A intenção aqui parece ser que se o recorde foi estabelecido hoje e o usuário decrementa,
        // o recorde deve refletir o valor atual de 'hoje', não o pico anterior do dia.
        // No entanto, um "recorde diário" geralmente significa o máximo atingido em *qualquer* dia.
        // A lógica atual já cobre isso: state.dailyRecord.value é o recorde histórico.
        // Se o recorde de hoje (state.todayCount) supera o state.dailyRecord.value, ele é atualizado.
        // Se o recorde foi estabelecido hoje, e o state.todayCount diminui, o state.dailyRecord.value (histórico)
        // não deve diminuir, a menos que o recorde histórico seja especificamente resetado ou que
        // a definição de "dailyRecord" seja "o máximo de hoje até agora, se hoje for o dia do recorde".
        // A lógica atual parece correta para um recorde histórico.
        // Se for para refletir o valor atual do dia caso o recorde seja de hoje:
         if (state.dailyRecord.date === todayLocaleDate) {
            state.dailyRecord.value = state.todayCount;
         }
    }
    if (state.todayCount === 0 && state.dailyRecord.date === todayLocaleDate) {
        // Se zerou hoje e o recorde era de hoje, resetar o recorde?
        // Isso faria o recorde desaparecer se o usuário zerar.
        // Mais seguro é manter o recorde do dia, mesmo que depois zere.
        // A lógica original de `state.todayCount > state.dailyRecord.value` cuida disso.
        // Esta condição específica `state.todayCount === 0 && state.dailyRecord.date === todayLocaleDate`
        // implicaria que se o recorde foi tipo "50" hoje, e depois zera, o recorde passa a ser "0" com data "-".
        // Vou manter a lógica mais simples: dailyRecord é o máximo histórico.
    }
}

// Lógica do Contador de Questões
function getStepValue() {
    const stepInput = document.getElementById('questions-step-input');
    let step = parseInt(stepInput.value, 10);
    if (isNaN(step) || step < 1) {
        step = 1;
        stepInput.value = "1";
    }
    return step;
}

function incrementToday() {
    checkAllResets();
    const step = getStepValue();
    state.todayCount += step;
    state.weeklyProgress += step;
    state.monthlyProgress += step;
    state.yearlyProgress += step;
    if (state.weeklyActivityData && state.weeklyActivityData.length === 7) {
        state.weeklyActivityData[6] += step;
    }
    updateDailyRecord();
    updatePeakActivity();
    updateStreak();
    saveState();
    updateUI();
}

function decrementToday() {
    checkAllResets();
    const step = getStepValue();
    if (state.todayCount > 0 || (state.todayCount === 0 && step <= 0)) { // Permitir decremento se step for negativo e já estiver em zero
        const newTodayCount = Math.max(0, state.todayCount - step);
        const actualDecrementAmount = state.todayCount - newTodayCount;

        state.todayCount = newTodayCount;

        if (actualDecrementAmount > 0) { // Apenas se houve de fato um decremento
            state.weeklyProgress = Math.max(0, state.weeklyProgress - actualDecrementAmount);
            state.monthlyProgress = Math.max(0, state.monthlyProgress - actualDecrementAmount);
            state.yearlyProgress = Math.max(0, state.yearlyProgress - actualDecrementAmount);
            if (state.weeklyActivityData && state.weeklyActivityData.length === 7) {
                state.weeklyActivityData[6] = Math.max(0, state.weeklyActivityData[6] - actualDecrementAmount);
            }
        }
        updateDailyRecord(); // Atualiza o recorde diário caso tenha sido o dia do recorde
        updatePeakActivity();
        updateStreak(); // Streak pode ser afetado se cair abaixo da meta
        saveState();
        updateUI();
    }
}

// Lógica de Pico de Atividade e Streak
function updatePeakActivity() {
    let maxQuestions = 0;
    let peakDayOriginalIndex = -1;
    if (!Array.isArray(state.weeklyActivityData) || state.weeklyActivityData.length !== 7) {
        state.peakActivity = { dayName: "-", questions: 0 };
        return;
    }
    state.weeklyActivityData.forEach((count, index) => {
        if (count >= maxQuestions) { // Usa >= para pegar o dia mais recente em caso de empate
            maxQuestions = count;
            peakDayOriginalIndex = index;
        }
    });
    if (peakDayOriginalIndex !== -1 && maxQuestions > 0) {
        const today = new Date();
        const peakDate = new Date(today);
        peakDate.setDate(today.getDate() - (6 - peakDayOriginalIndex));
        const dayAbbreviations = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]; // Mesmas do gráfico
        state.peakActivity.dayName = dayAbbreviations[peakDate.getDay()];
        state.peakActivity.questions = maxQuestions;
    } else {
        state.peakActivity.dayName = "-";
        state.peakActivity.questions = 0;
    }
}

function updateStreak() {
    const todayISO = new Date().toISOString().split('T')[0];
    const dailyGoal = state.goals.daily;
    const todayQuestions = state.todayCount;

    // Carregar dados do streak do localStorage
    const streakDataString = localStorage.getItem('taskify-streak');
    let streakData;
    try {
        streakData = streakDataString ? JSON.parse(streakDataString) : { current: 0, lastValidDate: null, history: {} };
        if (typeof streakData.current !== 'number' || streakData.current < 0) streakData.current = 0;
        if (!streakData.history) streakData.history = {};
    } catch (e) {
        console.error("Error parsing streak data from localStorage:", e);
        streakData = { current: 0, lastValidDate: null, history: {} };
    }


    const goalMetToday = todayQuestions >= dailyGoal && dailyGoal > 0;
    const wasGoalMetForTodayInHistory = streakData.history[todayISO] !== undefined && streakData.history[todayISO] >= dailyGoal;

    if (goalMetToday) {
        if (!wasGoalMetForTodayInHistory) { // Primeira vez que a meta é atingida hoje
            addDayToStreak(streakData, todayISO, todayQuestions);
        }
        streakData.history[todayISO] = todayQuestions; // Atualiza com a contagem atual se já existia
    } else { // Meta não atingida hoje
        if (wasGoalMetForTodayInHistory) { // Meta foi atingida anteriormente hoje, mas agora não mais
            removeDayFromStreak(streakData, todayISO);
        }
        // Se a meta nunca foi atingida hoje, não faz nada no history (a menos que queira registrar dias não cumpridos)
        delete streakData.history[todayISO]; // Garante que não há registro de meta cumprida para hoje
    }

    // Verificar se o streak foi quebrado (se lastValidDate não é ontem nem hoje)
    if (streakData.lastValidDate && streakData.lastValidDate !== todayISO) {
        const lastValid = new Date(streakData.lastValidDate);
        const todayDateObj = new Date(todayISO);

        // Normalizar para meia-noite para evitar problemas de fuso horário no cálculo de diffDays
        lastValid.setHours(0, 0, 0, 0);
        todayDateObj.setHours(0, 0, 0, 0);

        const diffTime = todayDateObj - lastValid; // Diferença em milissegundos
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Diferença em dias

        if (diffDays > 1) { // Mais de 1 dia de diferença significa que o streak foi quebrado
            streakData.current = goalMetToday ? 1 : 0;
            if (goalMetToday) {
                streakData.lastValidDate = todayISO;
            } else if (streakData.current === 0) { // Se o streak zerou e a meta não foi atingida hoje
                streakData.lastValidDate = null;
            }
        }
    } else if (!streakData.lastValidDate && goalMetToday) { // Começando um novo streak do zero
        streakData.current = 1;
        streakData.lastValidDate = todayISO;
    }


    state.currentStreak.days = streakData.current;
    state.currentStreak.lastCompletionDate = streakData.lastValidDate;
    saveStreakData(streakData); // Salva no localStorage
}

function addDayToStreak(streakData, dateISO, questions) {
    const yesterday = new Date(dateISO);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    if (streakData.lastValidDate === dateISO) { // Já contabilizado hoje (ex: por decremento e novo incremento)
        streakData.history[dateISO] = questions;
        return;
    }

    if (streakData.lastValidDate === yesterdayISO || streakData.current === 0 || streakData.lastValidDate === null) {
        streakData.current += 1;
    } else { // Streak quebrado e recomeçando
        streakData.current = 1;
    }
    streakData.lastValidDate = dateISO;
    streakData.history[dateISO] = questions;
}

function removeDayFromStreak(streakData, dateISO) {
    // Se a meta foi desfeita no dia que era o 'lastValidDate'
    if (streakData.lastValidDate === dateISO) {
        streakData.current = Math.max(0, streakData.current - 1);

        if (streakData.current === 0) {
            streakData.lastValidDate = null;
        } else {
            // Tenta encontrar o dia anterior válido no histórico
            const dates = Object.keys(streakData.history)
                .filter(d => d < dateISO && streakData.history[d] >= state.goals.daily)
                .sort((a, b) => new Date(b) - new Date(a));
            streakData.lastValidDate = dates.length > 0 ? dates[0] : null;
            // Se não encontrou dia anterior válido, o streak deveria ser 0.
            // A lógica de recalcular o streak completo baseado no histórico é mais complexa
            // e geralmente não é necessária para uma remoção simples.
            // Para simplicidade, se o dia atual é removido e era o pico do streak,
            // o lastValidDate retrocede.
            // Se a remoção quebra a contiguidade, o streak.current pode ficar inconsistente
            // sem uma reavaliação completa do histórico.
            // A abordagem mais simples é que `removeDayFromStreak` só é chamado se
            // `dateISO` era `lastValidDate`. Se o streak.current se torna 0, lastValidDate é null.
            // Se não, o `lastValidDate` precisa ser o dia anterior que validou o streak.
            const yesterday = new Date(dateISO);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayISO = yesterday.toISOString().split('T')[0];
            if (streakData.history[yesterdayISO] && streakData.history[yesterdayISO] >= state.goals.daily) {
                 streakData.lastValidDate = yesterdayISO;
            } else { // Não havia dia anterior válido, então o streak zera
                streakData.current = 0;
                streakData.lastValidDate = null;
            }
        }
    }
    // Remove o dia do histórico, independentemente de ser o lastValidDate
    delete streakData.history[dateISO];
}


function saveStreakData(data) {
    localStorage.setItem('taskify-streak', JSON.stringify(data));
}


function updateStreakUI() {
    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    };
    setText('current-streak-value', `${state.currentStreak.days} dias`);
    const streakFillEl = document.getElementById('streak-progress-fill');
    if (streakFillEl) {
        const streakProgressPercent = state.goals.streak > 0 ? Math.min((state.currentStreak.days / state.goals.streak) * 100, 100) : 0;
        streakFillEl.style.width = `${streakProgressPercent}%`;
    }
}

// Modal de Metas
function openGoalsModal() {
    const modal = document.getElementById('goals-modal');
    const overlay = document.getElementById('goals-modal-overlay');
    if (modal && overlay) {
        document.getElementById('daily-goal-input').value = state.goals.daily;
        document.getElementById('weekly-goal-input').value = state.goals.weekly;
        document.getElementById('monthly-goal-input').value = state.goals.monthly;
        document.getElementById('yearly-goal-input').value = state.goals.yearly;
        document.getElementById('streak-goal-input').value = state.goals.streak;
        overlay.classList.add('show');
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

function closeGoalsModal() {
    const modal = document.getElementById('goals-modal');
    const overlay = document.getElementById('goals-modal-overlay');
    if (modal && overlay) {
        modal.classList.remove('show');
        overlay.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

function saveGoals() {
    const daily = parseInt(document.getElementById('daily-goal-input').value);
    const weekly = parseInt(document.getElementById('weekly-goal-input').value);
    const monthly = parseInt(document.getElementById('monthly-goal-input').value);
    const yearly = parseInt(document.getElementById('yearly-goal-input').value);
    const streak = parseInt(document.getElementById('streak-goal-input').value);
    if (isNaN(daily) || daily < 1 || isNaN(weekly) || weekly < 1 || isNaN(monthly) || monthly < 1 || isNaN(yearly) || yearly < 1 || isNaN(streak) || streak < 1) {
        alert("Todas as metas devem ser números positivos."); return;
    }
    state.goals = { daily, weekly, monthly, yearly, streak };
    saveState();
    updateUI(); // Atualiza a UI com as novas metas
    updateStreak(); // Recalcula e atualiza o streak com a nova meta diária
    closeGoalsModal();
}

// Gerenciamento de Tema e Cor Primária
function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    applyTheme();
    saveState();
}

function applyTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const faviconEl = document.getElementById('favicon');
    const docElement = document.documentElement;

    docElement.classList.remove('light-theme-active'); // Remove antes para garantir que a transição de bg funcione
    docElement.style.setProperty('--body-bg', state.isDarkMode ? '#020306' : '#f4f4f4');

    if (state.isDarkMode) {
        body.classList.remove('light');
        if (themeIcon) { themeIcon.classList.remove('bi-sun-fill'); themeIcon.classList.add('bi-moon-fill'); }
    } else {
        body.classList.add('light');
        docElement.classList.add('light-theme-active'); // Adiciona classe específica para light theme no HTML element
        if (themeIcon) { themeIcon.classList.remove('bi-moon-fill'); themeIcon.classList.add('bi-sun-fill'); }
    }

    const primaryColorForFavicon = getComputedStyle(docElement).getPropertyValue('--primary-color-dark').trim(); // Usa a var dark, pois ela é setada igual à light
    if (faviconEl) {
        faviconEl.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='${encodeURIComponent(primaryColorForFavicon)}' class='bi bi-check2-square' viewBox='0 0 16 16'><path d='M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8A1.5 1.5 0 0 1 12.5 3v1.5a.5.5 0 0 1-1 0V3a.5.5 0 0 0-.5-.5H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 1 0 1H3z'/><path d='m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z'/></svg>`;
    }
    // Recria o gráfico para aplicar cores do novo tema
    // O argumento false evita a animação inicial, que só deve ocorrer na primeira carga.
    setupChart(false);
}

function applyPrimaryColor(color) {
    document.documentElement.style.setProperty('--primary-color-light', color);
    document.documentElement.style.setProperty('--primary-color-dark', color);
    localStorage.setItem('taskify-primary-color', color);
    applyTheme(); // Re-aplica o tema para que o gráfico e favicon peguem a nova cor
}

function initColorPicker() {
    const logoElement = document.querySelector('.logo');
    const directColorInput = document.getElementById('direct-color-input');
    if (!logoElement || !directColorInput) {
        console.warn("Elementos do seletor de cores não encontrados."); return;
    }
    logoElement.addEventListener('click', (event) => {
        event.stopPropagation(); // Evita que cliques no logo fechem algo, se aplicável
        // Animação de clique
        logoElement.style.transform = 'scale(0.92)';
        setTimeout(() => { logoElement.style.transform = 'scale(1)'; }, 150);

        // Pega a cor primária atual para definir no color input
        let currentPrimaryColor = localStorage.getItem('taskify-primary-color') ||
                                  getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim() ||
                                  '#007AFF'; // Fallback
        directColorInput.value = currentPrimaryColor;
        directColorInput.click(); // Abre o seletor de cores nativo
    });
    directColorInput.addEventListener('input', (event) => applyPrimaryColor(event.target.value));
    directColorInput.addEventListener('change', (event) => applyPrimaryColor(event.target.value)); // Para navegadores que só disparam change
}

// Configuração do Gráfico
function setupChart(animateInitialRender = false) {
    const chartCanvas = document.getElementById('weeklyActivityChart');
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');

    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }

    const data = state.weeklyActivityData;
    if (!Array.isArray(data) || data.length !== 7) {
        // Limpa o canvas e mostra mensagem de erro se os dados forem inválidos
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = state.isDarkMode ? '#AAA' : '#495057';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif';
        ctx.fillText("Dados de atividade inválidos.", chartCanvas.width / 2, chartCanvas.height / 2);
        return;
    }

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim();
    const gridColor = state.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = state.isDarkMode ? '#AAA' : '#555';
    const tooltipBackgroundColor = state.isDarkMode ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipTextColor = state.isDarkMode ? '#FFFFFF' : '#222';
    const bodyBgColor = getComputedStyle(document.body).backgroundColor; // Para borda dos pontos

    // Criação do gradiente para a área do gráfico
    const gradient = ctx.createLinearGradient(0, 0, 0, chartCanvas.height * 0.8); // Ajusta a altura do gradiente
    gradient.addColorStop(0, Chart.helpers.color(primaryColor).alpha(0.3).rgbString());
    gradient.addColorStop(1, Chart.helpers.color(primaryColor).alpha(0).rgbString());

    const dayLabels = getLast7DayLabels();

    weeklyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dayLabels,
            datasets: [{
                label: 'Questões',
                data: [...data], // Copia os dados para evitar mutação
                borderColor: primaryColor,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4, // Suaviza a linha
                pointBackgroundColor: primaryColor,
                pointBorderColor: bodyBgColor, // Cor de fundo do body para "recortar" o ponto
                pointBorderWidth: 1.5,
                pointHoverBackgroundColor: primaryColor,
                pointHoverBorderColor: bodyBgColor,
                pointHoverBorderWidth: 2,
                pointRadius: 4, // Tamanho dos pontos
                pointHoverRadius: 7, // Tamanho dos pontos no hover
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: animateInitialRender ? 800 : 0, // Animação apenas na carga inicial
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: gridColor,
                        drawBorder: false, // Remove a borda do eixo
                    },
                    ticks: {
                        color: textColor,
                        precision: 0, // Sem casas decimais
                        maxTicksLimit: 5, // Limita o número de ticks para não poluir
                    }
                },
                x: {
                    grid: {
                        display: false, // Remove a grade vertical
                    },
                    ticks: {
                        color: textColor,
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // Esconde a legenda
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: tooltipBackgroundColor,
                    titleColor: tooltipTextColor,
                    bodyColor: tooltipTextColor,
                    titleFont: { weight: 'bold', size: 13 },
                    bodyFont: { size: 12 },
                    padding: 10,
                    cornerRadius: 6,
                    borderColor: primaryColor,
                    borderWidth: 1,
                    displayColors: false, // Não mostra a caixinha de cor no tooltip
                    callbacks: {
                        title: (items) => items[0].label, // Título do tooltip
                        label: (item) => `Questões: ${item.raw}` // Conteúdo do tooltip
                    }
                }
            },
            interaction: {
                mode: 'index', // Mostra tooltips para todos os datasets no mesmo índice X
                intersect: false, // Tooltip aparece ao passar perto, não precisa acertar o ponto
            },
            hover: { // Configurações de hover global
                mode: 'nearest',
                intersect: true
            }
        }
    });
}

function updateWeeklyChartDataOnly() {
    if (weeklyChartInstance && Array.isArray(state.weeklyActivityData) && state.weeklyActivityData.length === 7) {
        weeklyChartInstance.data.datasets[0].data = [...state.weeklyActivityData];
        weeklyChartInstance.update('none'); // 'none' para evitar re-animação desnecessária
    } else if (!weeklyChartInstance) {
        // Se o gráfico não existe (pode acontecer em raras condições de erro), tenta recriá-lo
        setupChart(false);
    }
}

// Inicialização do Streak
function initStreak() {
    const savedData = localStorage.getItem('taskify-streak'); // Mudou a chave para 'taskify-streak'
    if (savedData) {
        try {
            const streakData = JSON.parse(savedData);
            // Validações básicas da estrutura dos dados carregados
            if (streakData && typeof streakData.current === 'number' && streakData.current >= 0) {
                state.currentStreak.days = streakData.current;
                state.currentStreak.lastCompletionDate = streakData.lastValidDate || null;
                // Não precisa popular state.streakData.history aqui, pois updateStreak() o manipula.
            } else { // Dados inválidos, reseta para o padrão
                state.currentStreak = { ...initialDefaultState.currentStreak };
                localStorage.setItem('taskify-streak', JSON.stringify({current: 0, lastValidDate: null, history: {}}));
            }
        } catch (e) {
            console.error("Error parsing streak data:", e);
            state.currentStreak = { ...initialDefaultState.currentStreak };
            localStorage.setItem('taskify-streak', JSON.stringify({current: 0, lastValidDate: null, history: {}}));
        }
    } else { // Nenhum dado salvo, inicializa com o padrão
        state.currentStreak = { ...initialDefaultState.currentStreak };
        const initialStreakDataToSave = {
            current: state.currentStreak.days,
            lastValidDate: state.currentStreak.lastCompletionDate,
            history: {} // Inicia com histórico vazio
        };
        // Se o default state tem um streak, popular o histórico (opcional, mas pode ser útil para debug/consistência)
        if (state.currentStreak.days > 0 && state.currentStreak.lastCompletionDate) {
            for (let i = 0; i < state.currentStreak.days; i++) {
                const date = new Date(state.currentStreak.lastCompletionDate);
                date.setDate(date.getDate() - i);
                initialStreakDataToSave.history[date.toISOString().split('T')[0]] = state.goals.daily; // Assume que a meta foi atingida
            }
        }
        localStorage.setItem('taskify-streak', JSON.stringify(initialStreakDataToSave));
    }
    updateStreak(); // Garante que a lógica do streak seja aplicada com os dados carregados/iniciais
    updateStreakUI(); // Atualiza a UI do streak
}

// Inicialização Principal
function init() {
    const loaderElement = document.getElementById('loader');
    if (loaderElement) loaderElement.style.display = 'flex';

    loadState();
    initColorPicker();
    applyTheme(); // Aplica tema e cor primária (incluindo gráfico e favicon)
    checkAllResets(); // Reseta contadores diários/semanais etc., se necessário
    initStreak(); // Carrega e processa dados de streak
    // setupChart é chamado dentro de applyTheme, mas uma chamada inicial com animação é boa.
    // No entanto, applyTheme já chama setupChart(false). Para animação inicial,
    // precisamos de uma chamada explícita *depois* de applyTheme ou condicionar dentro de applyTheme.
    // A chamada em applyTheme garante que as cores corretas sejam usadas.
    // Para a animação inicial:
    if (weeklyChartInstance) weeklyChartInstance.destroy(); // Garante que não haja duplicatas
    setupChart(true); // Chama com animação inicial

    updateUI(); // Atualiza todos os elementos da UI com os dados carregados/processados

    const goalsForm = document.getElementById('goals-form');
    if (goalsForm) goalsForm.addEventListener('submit', (e) => { e.preventDefault(); saveGoals(); });
    const goalsOverlay = document.getElementById('goals-modal-overlay');
    if (goalsOverlay) goalsOverlay.addEventListener('click', closeGoalsModal);

    // Intervalo para verificar resets (ex: mudança de dia)
    setInterval(checkAllResets, 60000); // 1 minuto

    // Esconde o loader após um pequeno atraso
    setTimeout(() => {
        if (loaderElement) {
            loaderElement.style.opacity = '0';
            setTimeout(() => { loaderElement.style.display = 'none'; }, 500); // Espera a transição de opacidade
        }
    }, 250); // Tempo mínimo de exibição do loader
}

document.addEventListener('DOMContentLoaded', init);

// Animação de Partículas
const particleCanvas = document.getElementById('particle-canvas');
if (particleCanvas) {
    const ctx = particleCanvas.getContext('2d');
    let particlesArray = [];
    let lastParticleTime = 0;
    const particleCooldown = 30; // milliseconds
    let currentMouseX = -1000, currentMouseY = -1000; // Inicia fora da tela

    function resizeCanvas() {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
    }

    function setupParticleListeners() {
        window.addEventListener('resize', resizeCanvas);
        document.addEventListener('mousemove', (e) => { currentMouseX = e.clientX; currentMouseY = e.clientY; });
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                currentMouseX = e.touches[0].clientX;
                currentMouseY = e.touches[0].clientY;
            }
        });
        document.addEventListener('mouseleave', () => { currentMouseX = -1000; currentMouseY = -1000; }); // Move para fora da tela
        document.addEventListener('touchend', () => { currentMouseX = -1000; currentMouseY = -1000; }); // Move para fora da tela
        resizeCanvas(); // Define o tamanho inicial
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 4 + 1.5; // Tamanho entre 1.5 e 5.5
            this.baseSize = this.size;
            this.color = color;
            this.speedX = Math.random() * 2 - 1; // Velocidade horizontal entre -1 e 1
            this.speedY = Math.random() * 2 - 1; // Velocidade vertical entre -1 e 1
            this.life = Math.random() * 60 + 30; // Vida da partícula em frames (0.5 a 1.5 segundos a 60fps)
            this.initialLife = this.life;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life--;
            if (this.life > 0) {
                this.size = this.baseSize * (this.life / this.initialLife); // Diminui o tamanho com a vida
            }
            if (this.size < 0.1) {
                this.size = 0; // Evita tamanhos negativos ou muito pequenos
            }
        }
        draw() {
            if (this.size > 0) {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function handleParticles(timestamp) {
        // Cria novas partículas se o mouse estiver na tela e o cooldown tiver passado
        if (currentMouseX > -1000 && timestamp - lastParticleTime > particleCooldown) {
            let primaryColor = '#007AFF'; // Cor padrão
            // Tenta obter a cor primária do CSS (que é atualizada pelo JS do tema)
            if (typeof state !== 'undefined' && state.isDarkMode !== undefined) { // Garante que 'state' e 'isDarkMode' estão definidos
                primaryColor = getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim();
            } else { // Fallback se 'state' não estiver pronto (raro, mas seguro)
                const tempPC = localStorage.getItem('taskify-primary-color') || (localStorage.getItem('taskify-theme') === 'light' ? '#007AFF' : '#007AFF');
                primaryColor = tempPC;
            }

            for (let i = 0; i < 1; i++) { // Número de partículas por evento de mouse (pode aumentar para mais densidade)
                particlesArray.push(new Particle(currentMouseX + (Math.random() - 0.5) * 10, currentMouseY + (Math.random() - 0.5) * 10, primaryColor));
            }
            lastParticleTime = timestamp;
        }

        // Atualiza e remove partículas mortas ou fora da tela
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            if (particlesArray[i].life <= 0 ||
                particlesArray[i].x < -20 || particlesArray[i].x > particleCanvas.width + 20 ||
                particlesArray[i].y < -20 || particlesArray[i].y > particleCanvas.height + 20) {
                particlesArray.splice(i, 1);
                i--; // Ajusta o índice após a remoção
            }
        }
    }

    function animateParticles(timestamp) {
        ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height); // Limpa o canvas
        handleParticles(timestamp); // Lida com a lógica das partículas
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].draw(); // Desenha cada partícula
        }
        requestAnimationFrame(animateParticles); // Loop de animação
    }

    // Garante que a animação comece após o DOM estar pronto
    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
        setupParticleListeners();
        requestAnimationFrame(animateParticles);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setupParticleListeners();
            requestAnimationFrame(animateParticles);
        });
    }
} else {
    console.warn("Elemento #particle-canvas não encontrado. Animação de partículas desabilitada.");
}
