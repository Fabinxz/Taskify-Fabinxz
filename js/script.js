// Variáveis globais e estado inicial
let weeklyChartInstance = null;

const initialDefaultState = {
    todayCount: 0, // ZERADO
    lastAccessDate: new Date().toDateString(), // Mantém lógica atual
    goals: { // Valores dos inputs do modal no HTML, "pré-estabelecidos"
        daily: 20,
        weekly: 50,
        monthly: 1200,
        yearly: 20000,
        streak: 30
    },
    weeklyProgress: 0, // ZERADO
    monthlyProgress: 0, // ZERADO
    yearlyProgress: 0, // ZERADO
    weeklyActivityData: [0, 0, 0, 0, 0, 0, 0], // ZERADO (7 dias)
    dailyRecord: {
        value: 0, // ZERADO
        date: "-" // Placeholder para data zerada
    },
    currentStreak: {
        days: 0, // ZERADO
        lastCompletionDate: null // ZERADO
    },
    peakActivity: {
        dayName: "-", // Placeholder para dia zerado
        questions: 0 // ZERADO
    },
    isDarkMode: true, // Default, mas localStorage pode sobrescrever
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
    const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]; 
    const labels = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(dayNames[date.getDay()]);
    }
    return labels;
}

// Gerenciamento de Estado (LocalStorage)
function loadState() {
    let themeToApply = initialDefaultState.isDarkMode;
    let primaryColorToApply = null; 

    // 1. Carregar preferências de tema e cor PRIMEIRO
    const savedThemeSetting = localStorage.getItem('taskify-theme');
    if (savedThemeSetting !== null) {
        themeToApply = savedThemeSetting === 'dark';
    }
    const savedPrimaryColor = localStorage.getItem('taskify-primary-color');
    if (savedPrimaryColor) {
        primaryColorToApply = savedPrimaryColor;
        document.documentElement.style.setProperty('--primary-color-light', primaryColorToApply);
        document.documentElement.style.setProperty('--primary-color-dark', primaryColorToApply);
    }

    // 2. Tenta carregar o estado completo do localStorage
    let loadedState = null;
    try {
        const savedStateString = localStorage.getItem('taskify-state');
        if (savedStateString) {
            loadedState = JSON.parse(savedStateString);
        }
    } catch (e) {
        console.error("Error parsing 'taskify-state' from localStorage:", e);
        localStorage.removeItem('taskify-state'); 
    }

    // 3. Constrói o estado final, priorizando dados salvos sobre os defaults
    if (loadedState) {
        // Se existe um estado salvo, usa-o como base
        state = {
            ...initialDefaultState, // Garante que todos os campos de initialDefaultState existam
            ...loadedState,         // Sobrescreve com os dados salvos
            goals: { ...initialDefaultState.goals, ...(loadedState.goals || {}) }, // Mescla metas
            dailyRecord: { ...initialDefaultState.dailyRecord, ...(loadedState.dailyRecord || {}) },
            currentStreak: { ...initialDefaultState.currentStreak }, // Streak é gerenciado separadamente
            peakActivity: { ...initialDefaultState.peakActivity, ...(loadedState.peakActivity || {}) },
            weeklyActivityData: (loadedState.weeklyActivityData && Array.isArray(loadedState.weeklyActivityData) && loadedState.weeklyActivityData.length === 7)
                ? loadedState.weeklyActivityData.map(v => Number(v) || 0)
                : [...initialDefaultState.weeklyActivityData],
        };
        // Garante que as datas de reset de período sejam do estado carregado se válidas
        state.lastAccessDate = loadedState.lastAccessDate || initialDefaultState.lastAccessDate;
        state.lastWeekStartDate = loadedState.lastWeekStartDate || initialDefaultState.lastWeekStartDate;
        state.lastMonthStartDate = loadedState.lastMonthStartDate || initialDefaultState.lastMonthStartDate;
        state.lastYearStartDate = loadedState.lastYearStartDate || initialDefaultState.lastYearStartDate;
    } else {
        // Se não há estado salvo, usa o initialDefaultState completamente (primeira carga/após reset)
        state = JSON.parse(JSON.stringify(initialDefaultState));
    }
    state.isDarkMode = themeToApply; // Aplica tema carregado/default (já foi feito antes, mas garante)
}


function saveState() {
    try {
        const stateToSave = { ...state };
        localStorage.setItem('taskify-state', JSON.stringify(stateToSave));
        localStorage.setItem('taskify-theme', state.isDarkMode ? 'dark' : 'light');
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
    const radius = 52; 
    const circumference = 2 * Math.PI * radius;
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

    // Atualizar meta de streak no card
    const streakTargetValueEl = document.getElementById('streak-target-value');
    if (streakTargetValueEl) {
        streakTargetValueEl.textContent = state.goals.streak;
    }

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
         state.dailyRecord.value = state.todayCount;
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
    const newTodayCount = Math.max(0, state.todayCount - step);
    const actualDecrementAmount = state.todayCount - newTodayCount; 

    state.todayCount = newTodayCount;

    if (actualDecrementAmount > 0) { 
        state.weeklyProgress = Math.max(0, state.weeklyProgress - actualDecrementAmount);
        state.monthlyProgress = Math.max(0, state.monthlyProgress - actualDecrementAmount);
        state.yearlyProgress = Math.max(0, state.yearlyProgress - actualDecrementAmount);
        if (state.weeklyActivityData && state.weeklyActivityData.length === 7) {
            state.weeklyActivityData[6] = Math.max(0, state.weeklyActivityData[6] - actualDecrementAmount);
        }
    }
    updateDailyRecord(); 
    updatePeakActivity();
    updateStreak(); 
    saveState();
    updateUI();
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
        if (count >= maxQuestions) { 
            maxQuestions = count;
            peakDayOriginalIndex = index;
        }
    });

    if (peakDayOriginalIndex !== -1 && maxQuestions > 0) {
        const today = new Date();
        const peakDate = new Date(today);
        peakDate.setDate(today.getDate() - (6 - peakDayOriginalIndex)); 
        const dayNames = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
        state.peakActivity.dayName = dayNames[peakDate.getDay()];
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
        if (!wasGoalMetForTodayInHistory) { 
            addDayToStreak(streakData, todayISO, todayQuestions);
        }
        streakData.history[todayISO] = todayQuestions; 
    } else { 
        if (wasGoalMetForTodayInHistory) { 
            removeDayFromStreak(streakData, todayISO);
        }
        delete streakData.history[todayISO]; 
    }

    if (streakData.lastValidDate && streakData.lastValidDate !== todayISO) {
        const lastValid = new Date(streakData.lastValidDate);
        const todayDateObj = new Date(todayISO);
        lastValid.setHours(0, 0, 0, 0);
        todayDateObj.setHours(0, 0, 0, 0);
        const diffTime = todayDateObj - lastValid; 
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays > 1) { 
            streakData.current = goalMetToday ? 1 : 0;
            streakData.lastValidDate = goalMetToday ? todayISO : null;
        }
    } else if (!streakData.lastValidDate && goalMetToday) { 
        streakData.current = 1;
        streakData.lastValidDate = todayISO;
    } else if (streakData.lastValidDate && !goalMetToday && streakData.lastValidDate === todayISO) {
    }

    state.currentStreak.days = streakData.current;
    state.currentStreak.lastCompletionDate = streakData.lastValidDate;
    saveStreakData(streakData); 
}

function addDayToStreak(streakData, dateISO, questions) {
    const yesterday = new Date(dateISO);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split('T')[0];

    if (streakData.lastValidDate === dateISO) { 
        streakData.history[dateISO] = questions; 
        return;
    }

    if (streakData.lastValidDate === yesterdayISO || streakData.current === 0 || streakData.lastValidDate === null) {
        streakData.current += 1;
    } else { 
        streakData.current = 1; 
    }
    streakData.lastValidDate = dateISO;
    streakData.history[dateISO] = questions;
}

function removeDayFromStreak(streakData, dateISO) {
    if (streakData.lastValidDate === dateISO) {
        streakData.current = Math.max(0, streakData.current - 1);

        if (streakData.current === 0) {
            streakData.lastValidDate = null;
        } else {
            const yesterday = new Date(dateISO);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayISO = yesterday.toISOString().split('T')[0];

            if (streakData.history[yesterdayISO] && streakData.history[yesterdayISO] >= state.goals.daily) {
                 streakData.lastValidDate = yesterdayISO;
            } else { 
                streakData.current = 0; 
                streakData.lastValidDate = null;
            }
        }
    }
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
    updateUI(); 
    updateStreak(); 
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

    docElement.classList.remove('light-theme-active'); 
    docElement.style.setProperty('--body-bg', state.isDarkMode ? '#020306' : '#f4f4f4');

    if (state.isDarkMode) {
        body.classList.remove('light');
        if (themeIcon) { themeIcon.classList.remove('bi-sun-fill'); themeIcon.classList.add('bi-moon-fill'); }
    } else {
        body.classList.add('light');
        docElement.classList.add('light-theme-active'); 
        if (themeIcon) { themeIcon.classList.remove('bi-moon-fill'); themeIcon.classList.add('bi-sun-fill'); }
    }

    const primaryColorForFavicon = getComputedStyle(docElement).getPropertyValue('--primary-color-dark').trim(); 
    if (faviconEl) {
        faviconEl.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='${encodeURIComponent(primaryColorForFavicon)}' class='bi bi-check2-square' viewBox='0 0 16 16'><path d='M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8A1.5 1.5 0 0 1 12.5 3v1.5a.5.5 0 0 1-1 0V3a.5.5 0 0 0-.5-.5H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 1 0 1H3z'/><path d='m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z'/></svg>`;
    }
    setupChart(false); 
}

function applyPrimaryColor(color) {
    document.documentElement.style.setProperty('--primary-color-light', color);
    document.documentElement.style.setProperty('--primary-color-dark', color);
    localStorage.setItem('taskify-primary-color', color); 
    applyTheme(); 
}

function initColorPicker() {
    const logoElement = document.querySelector('.logo');
    const directColorInput = document.getElementById('direct-color-input');
    if (!logoElement || !directColorInput) {
        console.warn("Elementos do seletor de cores não encontrados."); return;
    }
    logoElement.addEventListener('click', (event) => {
        event.stopPropagation(); 
        logoElement.style.transform = 'scale(0.92)';
        setTimeout(() => { logoElement.style.transform = 'scale(1)'; }, 150);

        let currentPrimaryColor = localStorage.getItem('taskify-primary-color') ||
                                  getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim() ||
                                  '#007AFF'; 
        directColorInput.value = currentPrimaryColor;
        directColorInput.click(); 
    });
    directColorInput.addEventListener('input', (event) => applyPrimaryColor(event.target.value));
    directColorInput.addEventListener('change', (event) => applyPrimaryColor(event.target.value)); 
}

// Configuração do Gráfico
function setupChart(animateInitialRender = false) {
    const chartCanvas = document.getElementById('weeklyActivityChart');
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');

    if (weeklyChartInstance) {
        weeklyChartInstance.destroy();
    }

    const data = state.weeklyActivityData || initialDefaultState.weeklyActivityData; 
    if (!Array.isArray(data) || data.length !== 7) {
        ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = state.isDarkMode ? '#AAA' : '#495057';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif';
        ctx.fillText("Dados de atividade inválidos.", chartCanvas.width / 2, chartCanvas.height / 2);
        console.error(" weeklyActivityData é inválido:", data);
        return;
    }

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim();
    const gridColor = state.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = state.isDarkMode ? '#AAA' : '#555';
    const tooltipBackgroundColor = state.isDarkMode ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipTextColor = state.isDarkMode ? '#FFFFFF' : '#222';
    const bodyBgColor = getComputedStyle(document.body).backgroundColor; 

    const gradient = ctx.createLinearGradient(0, 0, 0, chartCanvas.height * 0.8); 
    gradient.addColorStop(0, Chart.helpers.color(primaryColor).alpha(0.3).rgbString());
    gradient.addColorStop(1, Chart.helpers.color(primaryColor).alpha(0).rgbString());

    const dayLabels = getLast7DayLabels();

    weeklyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dayLabels,
            datasets: [{
                label: 'Questões',
                data: [...data], 
                borderColor: primaryColor,
                backgroundColor: gradient,
                fill: true,
                tension: 0.4, 
                pointBackgroundColor: primaryColor,
                pointBorderColor: bodyBgColor, 
                pointBorderWidth: 1.5,
                pointHoverBackgroundColor: primaryColor,
                pointHoverBorderColor: bodyBgColor,
                pointHoverBorderWidth: 2,
                pointRadius: 4, 
                pointHoverRadius: 7, 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: animateInitialRender ? 800 : 0, 
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor, drawBorder: false, },
                    ticks: { color: textColor, precision: 0, maxTicksLimit: 5, }
                },
                x: {
                    grid: { display: false, },
                    ticks: { color: textColor, }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true, backgroundColor: tooltipBackgroundColor, titleColor: tooltipTextColor,
                    bodyColor: tooltipTextColor, titleFont: { weight: 'bold', size: 13 },
                    bodyFont: { size: 12 }, padding: 10, cornerRadius: 6,
                    borderColor: primaryColor, borderWidth: 1, displayColors: false,
                    callbacks: {
                        title: (items) => items[0].label, 
                        label: (item) => `Questões: ${item.raw}` 
                    }
                }
            },
            interaction: { mode: 'index', intersect: false, },
            hover: { mode: 'nearest', intersect: true }
        }
    });
}

function updateWeeklyChartDataOnly() {
    if (weeklyChartInstance && Array.isArray(state.weeklyActivityData) && state.weeklyActivityData.length === 7) {
        weeklyChartInstance.data.datasets[0].data = [...state.weeklyActivityData];
        weeklyChartInstance.update('none'); 
    } else if (!weeklyChartInstance) {
        setupChart(false);
    }
}

// Inicialização do Streak
function initStreak() {
    const savedData = localStorage.getItem('taskify-streak'); 
    let initialStreakDays = 0;
    let initialLastCompletionDate = null;
    let initialHistory = {};

    if (savedData) {
        try {
            const streakData = JSON.parse(savedData);
            if (streakData && typeof streakData.current === 'number' && streakData.current >= 0) {
                initialStreakDays = streakData.current;
                initialLastCompletionDate = streakData.lastValidDate || null;
                initialHistory = streakData.history || {};
            } else { 
                 localStorage.removeItem('taskify-streak'); 
            }
        } catch (e) {
            console.error("Error parsing streak data in initStreak:", e);
            localStorage.removeItem('taskify-streak'); 
        }
    }
    
    state.currentStreak.days = initialStreakDays;
    state.currentStreak.lastCompletionDate = initialLastCompletionDate;

    const currentStreakDataToStore = {
        current: state.currentStreak.days,
        lastValidDate: state.currentStreak.lastCompletionDate,
        history: initialHistory 
    };
    localStorage.setItem('taskify-streak', JSON.stringify(currentStreakDataToStore));
    
    updateStreak(); 
    updateStreakUI(); 
}

// --- Modal do Guia de Boas-Vindas ---
function openWelcomeGuideModal() {
    const modal = document.getElementById('welcome-guide-modal');
    const overlay = document.getElementById('welcome-guide-modal-overlay');
    if (modal && overlay) {
        // Resetar o checkbox cada vez que o modal é aberto,
        // para que o usuário possa decidir novamente se não quiser ver na próxima carga da página.
        const checkbox = document.getElementById('dont-show-guide-again-checkbox');
        if(checkbox) checkbox.checked = false;

        overlay.classList.add('show');
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

function closeWelcomeGuideModal() {
    const modal = document.getElementById('welcome-guide-modal');
    const overlay = document.getElementById('welcome-guide-modal-overlay');
    const checkbox = document.getElementById('dont-show-guide-again-checkbox');

    if (checkbox && checkbox.checked) {
        localStorage.setItem('taskify-welcomeGuideDismissed', 'true');
    }

    if (modal && overlay) {
        modal.classList.remove('show');
        overlay.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

// --- Modal de Confirmação de Reset ---
// Abre o modal de confirmação de reset
function openConfirmResetModal() {
    closeGoalsModal(); // Fecha o modal de metas primeiro, se estiver aberto
    const modal = document.getElementById('confirm-reset-modal');
    const overlay = document.getElementById('confirm-reset-modal-overlay');
    if (modal && overlay) {
        overlay.classList.add('show');
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

// Fecha o modal de confirmação de reset
function closeConfirmResetModal() {
    const modal = document.getElementById('confirm-reset-modal');
    const overlay = document.getElementById('confirm-reset-modal-overlay');
    if (modal && overlay) {
        modal.classList.remove('show');
        overlay.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

// Executa o reset completo dos dados do aplicativo
function performFullReset() {
    localStorage.removeItem('taskify-state');
    localStorage.removeItem('taskify-theme');
    localStorage.removeItem('taskify-primary-color');
    localStorage.removeItem('taskify-streak');
    location.reload();
}

// Lida com o clique no botão "Resetar App" (no modal de metas)
function handleResetAppData() {
    openConfirmResetModal();
}

// Atualiza o ano no rodapé
function updateFooterYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}

// Inicialização Principal
function init() {
    const loaderElement = document.getElementById('loader');
    if (loaderElement) loaderElement.style.display = 'flex';
    loadState();      
    initColorPicker(); 
    applyTheme();     
    checkAllResets(); 
    initStreak();     
    
    updateFooterYear(); // Atualiza o ano no rodapé

    if (weeklyChartInstance) weeklyChartInstance.destroy(); 
    setupChart(true); 

    updateUI(); 

    const goalsForm = document.getElementById('goals-form');
    if (goalsForm) goalsForm.addEventListener('submit', (e) => { e.preventDefault(); saveGoals(); });
    const goalsOverlay = document.getElementById('goals-modal-overlay');
    if (goalsOverlay) goalsOverlay.addEventListener('click', closeGoalsModal);
    
    const btnResetAppData = document.getElementById('btn-reset-app-data');
    if (btnResetAppData) btnResetAppData.addEventListener('click', handleResetAppData); // Botão no modal de metas

    // Event listeners para o novo modal de confirmação de reset
    const confirmResetModalOverlay = document.getElementById('confirm-reset-modal-overlay');
    if (confirmResetModalOverlay) confirmResetModalOverlay.addEventListener('click', closeConfirmResetModal);
    
    const confirmResetModalCloseBtn = document.getElementById('confirm-reset-modal-close-btn');
    if (confirmResetModalCloseBtn) confirmResetModalCloseBtn.addEventListener('click', closeConfirmResetModal);

    const btnCancelResetConfirmation = document.getElementById('btn-cancel-reset-confirmation');
    if (btnCancelResetConfirmation) btnCancelResetConfirmation.addEventListener('click', closeConfirmResetModal);
    const btnConfirmResetAction = document.getElementById('btn-confirm-reset-action');
    if (btnConfirmResetAction) btnConfirmResetAction.addEventListener('click', performFullReset);

    // Event listeners para o modal do guia
    const btnOpenGuide = document.getElementById('btn-open-guide');
    if(btnOpenGuide) btnOpenGuide.addEventListener('click', openWelcomeGuideModal);
    const welcomeGuideModalOverlay = document.getElementById('welcome-guide-modal-overlay');
    if(welcomeGuideModalOverlay) welcomeGuideModalOverlay.addEventListener('click', closeWelcomeGuideModal);
    const welcomeGuideModalCloseBtn = document.getElementById('welcome-guide-modal-close-btn');
    if(welcomeGuideModalCloseBtn) welcomeGuideModalCloseBtn.addEventListener('click', closeWelcomeGuideModal);
    const btnCloseWelcomeGuide = document.getElementById('btn-close-welcome-guide');
    if(btnCloseWelcomeGuide) btnCloseWelcomeGuide.addEventListener('click', closeWelcomeGuideModal);

    // Mostrar guia na primeira visita se não foi dispensado
    if (localStorage.getItem('taskify-welcomeGuideDismissed') !== 'true') {
        openWelcomeGuideModal();
    }

    setInterval(checkAllResets, 60000); 

    setTimeout(() => {
        if (loaderElement) {
            loaderElement.style.opacity = '0';
            setTimeout(() => { loaderElement.style.display = 'none'; }, 500); 
        }
    }, 250); 
}

document.addEventListener('DOMContentLoaded', init);

// Animação de Partículas
const particleCanvas = document.getElementById('particle-canvas');
if (particleCanvas) {
    const ctx = particleCanvas.getContext('2d');
    let particlesArray = [];
    let lastParticleTime = 0;
    const particleCooldown = 30; 
    let currentMouseX = -1000, currentMouseY = -1000; 

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
        document.addEventListener('mouseleave', () => { currentMouseX = -1000; currentMouseY = -1000; }); 
        document.addEventListener('touchend', () => { currentMouseX = -1000; currentMouseY = -1000; }); 
        resizeCanvas(); 
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 4 + 1.5; 
            this.baseSize = this.size;
            this.color = color;
            this.speedX = Math.random() * 2 - 1; 
            this.speedY = Math.random() * 2 - 1; 
            this.life = Math.random() * 60 + 30; 
            this.initialLife = this.life;
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            this.life--;
            if (this.life > 0) {
                this.size = this.baseSize * (this.life / this.initialLife); 
            }
            if (this.size < 0.1) {
                this.size = 0; 
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
        if (currentMouseX > -1000 && timestamp - lastParticleTime > particleCooldown) {
            let primaryColor = '#007AFF'; 
            if (typeof state !== 'undefined' && state.isDarkMode !== undefined) { 
                primaryColor = getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim();
            } else { 
                const tempPC = localStorage.getItem('taskify-primary-color') || '#007AFF';
                primaryColor = tempPC;
            }

            for (let i = 0; i < 1; i++) { 
                particlesArray.push(new Particle(currentMouseX + (Math.random() - 0.5) * 10, currentMouseY + (Math.random() - 0.5) * 10, primaryColor));
            }
            lastParticleTime = timestamp;
        }

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            if (particlesArray[i].life <= 0 ||
                particlesArray[i].x < -20 || particlesArray[i].x > particleCanvas.width + 20 ||
                particlesArray[i].y < -20 || particlesArray[i].y > particleCanvas.height + 20) {
                particlesArray.splice(i, 1);
                i--; 
            }
        }
    }

    function animateParticles(timestamp) {
        ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height); 
        handleParticles(timestamp); 
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].draw(); 
        }
        requestAnimationFrame(animateParticles); 
    }

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
