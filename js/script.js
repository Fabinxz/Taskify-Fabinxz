let weeklyChartInstance = null;
let pomodoroChartInstance = null;
let tasksChartInstance = null;
let pomodoroInterval = null;
let retrospectiveModalEl;
let retrospectiveModalOverlayEl;

// Elementos de áudio
let focusEndSound = null;
let breakEndSound = null;

// Variáveis para Drag and Drop
let draggedItem = null;

// Flatpickr instances
let taskDatePicker = null;
let recurringTaskStartDatePicker = null;
let recurringTaskEndDatePicker = null;


window.showCustomAlert = showCustomAlert;

window.taskifyStateReady = false;

// Constantes de Temas e Paletas
const PREDEFINED_PALETTES = {
    electricBlue: { name: 'Azul Elétrico', primary: '#0A7CFF' },
    emeraldGreen: { name: 'Verde Esmeralda', primary: '#00DB4D' },
    fieryRed: { name: 'Vermelho Ígneo', primary: '#D51818' },
    royalPurple: { name: 'Roxo Real', primary: '#852DD8' },
    sunnyOrange: { name: 'Laranja Solar', primary: '#FF8C00' }
};

const VISUAL_MODES = {
    default: { name: 'Padrão', icon: 'bi-display', subtitle: 'Experiência padrão Taskify' },
    focus: { name: 'Foco Total', icon: 'bi-bullseye', subtitle: 'Interface minimalista, menos distrações' },
    night: { name: 'Profundo da Noite', icon: 'bi-moon-stars', subtitle: 'Cores escuras e suaves para seus olhos' },
    motivational: { name: 'Energia Vibrante', icon: 'bi-lightning-charge', subtitle: 'Cores dinâmicas para te inspirar' }
};

const initialDefaultState = {
    todayCount: 0,
    lastAccessDate: new Date().toDateString(),
    goals: {
        daily: 20,
        weekly: 50,
        monthly: 1200,
        yearly: 20000,
        streak: 30
    },
    weeklyProgress: 0,
    monthlyProgress: 0,
    yearlyProgress: 0,
    weeklyActivityData: [0, 0, 0, 0, 0, 0, 0],
    dailyRecord: {
        value: 0,
        date: "-"
    },
    currentStreak: {
        days: 0,
        lastCompletionDate: null,
        history: {}
    },
    peakActivity: {
        dayName: "-",
        questions: 0
    },
    isDarkMode: true,
    lastWeekStartDate: getStartOfWeek(new Date()).toDateString(),
    lastMonthStartDate: getStartOfMonth(new Date()).toDateString(),
    lastYearStartDate: getStartOfYear(new Date()).toDateString(),
    pomodoro: {
        timerRunning: false,
        currentTime: 25 * 60,
        mode: 'focus',
        focusDuration: 25 * 60,
        shortBreakDuration: 5 * 60,
        longBreakDuration: 15 * 60,
        cyclesBeforeLongBreak: 4,
        currentCycleInSet: 0,
        totalPomodorosToday: 0,
        sessions: [],
        autoStartBreaks: false,
        autoStartFocus: false,
        enableSound: true,
        lastModeEnded: null,
        dailyFocusData: [0, 0, 0, 0, 0, 0, 0]
    },
    tasks: [],
    dailyTaskCompletionData: [0, 0, 0, 0, 0, 0, 0],
    recurringTaskPatterns: [],
    visuals: {
        currentPalette: 'electricBlue',
        currentVisualMode: 'default'
    }
};

let state = JSON.parse(JSON.stringify(initialDefaultState));
window.state = state;

// Funções Utilitárias de Data, Cor e Formatação
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function getStartOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getStartOfYear(date) {
    return new Date(date.getFullYear(), 0, 1);
}

function getLast7DayLabels() {
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const labels = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        labels.push(dayNames[date.getDay()]);
    }
    return labels;
}

function hexToRgba(hex, alpha = 1) {
    if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
    const hexVal = hex.startsWith('#') ? hex.slice(1) : hex;
    if (hexVal.length !== 3 && hexVal.length !== 6) return `rgba(0,0,0,${alpha})`;

    let r, g, b;
    if (hexVal.length === 3) {
        r = parseInt(hexVal[0] + hexVal[0], 16);
        g = parseInt(hexVal[1] + hexVal[1], 16);
        b = parseInt(hexVal[2] + hexVal[2], 16);
    } else {
        r = parseInt(hexVal.substring(0, 2), 16);
        g = parseInt(hexVal.substring(2, 4), 16);
        b = parseInt(hexVal.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgbArray(hex) {
    if (!hex || typeof hex !== 'string') return null;
    let c = hex.substring(1);
    if (c.length === 3) {
        c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    if (c.length !== 6) {
        return null;
    }
    try {
        const bigint = parseInt(c, 16);
        if (isNaN(bigint)) return null;
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    } catch (e) {
        console.error("Erro ao converter hex para RGB:", hex, e);
        return null;
    }
}


function formatUnit(value, singularUnit, pluralUnit) {
    const val = parseInt(value, 10);
    if (isNaN(val)) return `0 ${pluralUnit}`;
    return `${val} ${val === 1 ? singularUnit : pluralUnit}`;
}

function getTodayISO() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateToDDMMYYYY(isoDateString) {
    if (!isoDateString) return '';
    const dateParts = isoDateString.split('-');
    if (dateParts.length === 3) {
        return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    return isoDateString;
}

function formatDateToISO(ddmmyyyyString) {
    if (!ddmmyyyyString) return null;
    const parts = ddmmyyyyString.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return null;
}


// Gerenciamento de Estado (LocalStorage)
function loadState() {
    let themeToApply = initialDefaultState.isDarkMode;
    let primaryColorToApply = PREDEFINED_PALETTES[initialDefaultState.visuals.currentPalette].primary;
    let currentPaletteName = initialDefaultState.visuals.currentPalette;
    let currentVisualModeName = initialDefaultState.visuals.currentVisualMode;

    const savedThemeSetting = localStorage.getItem('taskify-theme');
    if (savedThemeSetting !== null) {
        themeToApply = savedThemeSetting === 'dark';
    }

    const savedPrimaryColor = localStorage.getItem('taskify-primary-color');
    if (savedPrimaryColor) {
        primaryColorToApply = savedPrimaryColor;
    }

    const savedPaletteName = localStorage.getItem('taskify-palette');
    if (savedPaletteName && PREDEFINED_PALETTES[savedPaletteName]) {
        currentPaletteName = savedPaletteName;
        primaryColorToApply = PREDEFINED_PALETTES[currentPaletteName].primary;
    } else if (savedPaletteName === 'custom' && savedPrimaryColor) {
        currentPaletteName = 'custom';
        primaryColorToApply = savedPrimaryColor;
    } else {
        currentPaletteName = initialDefaultState.visuals.currentPalette;
        primaryColorToApply = PREDEFINED_PALETTES[currentPaletteName].primary;
    }

    const savedVisualMode = localStorage.getItem('taskify-visual-mode');
    if (savedVisualMode && VISUAL_MODES[savedVisualMode]) {
        currentVisualModeName = savedVisualMode;
    }

    document.documentElement.style.setProperty('--primary-color-light', primaryColorToApply);
    document.documentElement.style.setProperty('--primary-color-dark', primaryColorToApply);
    const rgbArray = hexToRgbArray(primaryColorToApply);
    if (rgbArray) {
        document.documentElement.style.setProperty('--primary-color-light-rgb', rgbArray.join(', '));
        document.documentElement.style.setProperty('--primary-color-dark-rgb', rgbArray.join(', '));
    }


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

    if (loadedState) {
        state = {
            ...JSON.parse(JSON.stringify(initialDefaultState)),
            ...loadedState,
            goals: { ...initialDefaultState.goals, ...(loadedState.goals || {}) },
            dailyRecord: { ...initialDefaultState.dailyRecord, ...(loadedState.dailyRecord || {}) },
            peakActivity: { ...initialDefaultState.peakActivity, ...(loadedState.peakActivity || {}) },
            weeklyActivityData: (loadedState.weeklyActivityData && Array.isArray(loadedState.weeklyActivityData) && loadedState.weeklyActivityData.length === 7)
                ? loadedState.weeklyActivityData.map(v => (typeof v === 'number' && !isNaN(v) ? v : 0))
                : [...initialDefaultState.weeklyActivityData],
            tasks: (loadedState.tasks && Array.isArray(loadedState.tasks))
                ? loadedState.tasks.map(task => ({
                    ...task,
                    assignedDate: task.assignedDate || null,
                    sourcePatternId: task.sourcePatternId || null,
                    isRecurringInstance: task.isRecurringInstance || false
                }))
                : [...initialDefaultState.tasks],
            recurringTaskPatterns: (loadedState.recurringTaskPatterns && Array.isArray(loadedState.recurringTaskPatterns))
                ? loadedState.recurringTaskPatterns
                : [...initialDefaultState.recurringTaskPatterns],
            dailyTaskCompletionData: (loadedState.dailyTaskCompletionData && Array.isArray(loadedState.dailyTaskCompletionData) && loadedState.dailyTaskCompletionData.length === 7)
                ? loadedState.dailyTaskCompletionData.map(v => (typeof v === 'number' && !isNaN(v) ? v : 0))
                : [...initialDefaultState.dailyTaskCompletionData],
            visuals: { ...initialDefaultState.visuals, ...(loadedState.visuals || {}) },
        };

        const numericKeys = ['todayCount', 'weeklyProgress', 'monthlyProgress', 'yearlyProgress'];
        numericKeys.forEach(key => {
            if (typeof state[key] !== 'number' || isNaN(state[key])) {
                console.warn(`Sanitizing state.${key}: was ${state[key]}, setting to ${initialDefaultState[key]}`);
                state[key] = initialDefaultState[key];
            }
        });

        state.lastAccessDate = loadedState.lastAccessDate || initialDefaultState.lastAccessDate;
        state.lastWeekStartDate = loadedState.lastWeekStartDate || initialDefaultState.lastWeekStartDate;
        state.lastMonthStartDate = loadedState.lastMonthStartDate || initialDefaultState.lastMonthStartDate;
        state.lastYearStartDate = loadedState.lastYearStartDate || initialDefaultState.lastYearStartDate;

        const pomodoroLoadedState = loadedState.pomodoro || {};
        state.pomodoro = {
            ...initialDefaultState.pomodoro,
            ...pomodoroLoadedState,
            timerRunning: false,
            enableSound: typeof pomodoroLoadedState.enableSound === 'boolean' ? pomodoroLoadedState.enableSound : initialDefaultState.pomodoro.enableSound,
            dailyFocusData: (pomodoroLoadedState.dailyFocusData && Array.isArray(pomodoroLoadedState.dailyFocusData) && pomodoroLoadedState.dailyFocusData.length === 7)
                ? pomodoroLoadedState.dailyFocusData.map(v => (typeof v === 'number' && !isNaN(v) ? v : 0))
                : [...initialDefaultState.pomodoro.dailyFocusData]
        };
        if (!(pomodoroLoadedState.timerRunning && pomodoroLoadedState.currentTime > 0)) {
            if (state.pomodoro.mode === 'focus') state.pomodoro.currentTime = state.pomodoro.focusDuration;
            else if (state.pomodoro.mode === 'shortBreak') state.pomodoro.currentTime = state.pomodoro.shortBreakDuration;
            else if (state.pomodoro.mode === 'longBreak') state.pomodoro.currentTime = state.pomodoro.longBreakDuration;
            state.pomodoro.lastModeEnded = pomodoroLoadedState.lastModeEnded || null;
        }

    } else {
        state = JSON.parse(JSON.stringify(initialDefaultState));
    }
    state.isDarkMode = themeToApply;
    state.visuals.currentPalette = currentPaletteName;
    state.visuals.currentVisualMode = currentVisualModeName;

    window.state = state;
}

function saveState() {
    try {
        const stateToSave = { ...state };

        localStorage.setItem('taskify-state', JSON.stringify(stateToSave));
        localStorage.setItem('taskify-theme', state.isDarkMode ? 'dark' : 'light');

        if (state.visuals.currentPalette === 'custom') {
            localStorage.setItem('taskify-primary-color', getComputedStyle(document.documentElement).getPropertyValue('--primary-color-dark').trim());
        } else if (PREDEFINED_PALETTES[state.visuals.currentPalette]) {
            localStorage.setItem('taskify-primary-color', PREDEFINED_PALETTES[state.visuals.currentPalette].primary);
        } else {
            localStorage.setItem('taskify-primary-color', PREDEFINED_PALETTES.electricBlue.primary);
        }
        localStorage.setItem('taskify-palette', state.visuals.currentPalette);
        localStorage.setItem('taskify-visual-mode', state.visuals.currentVisualMode);

    } catch (e) {
        console.error("Error saving state to localStorage:", e);
    }
}

// Lógica de Reset de Contadores
function checkAllResets() {
    const prevLastAccessDate = state.lastAccessDate;
    const todayStr = new Date().toDateString();

    checkAndResetDailyCounters(todayStr);
    checkAndResetWeeklyCounters();
    checkAndResetMonthlyCounters();
    checkAndResetYearlyCounters();

    if (state.pomodoro && state.lastAccessDate !== todayStr) {
        if (state.pomodoro.totalPomodorosToday > 0) {
            state.pomodoro.totalPomodorosToday = 0;
        }
        state.pomodoro.sessions = state.pomodoro.sessions.filter(session => {
            try {
                const sessionDate = new Date(session.startTime);
                return sessionDate.toDateString() === todayStr;
            } catch (e) { return false; }
        });
    }

    if (state.lastAccessDate !== prevLastAccessDate) {
        updateUI();
        updatePomodoroChartDataOnly();
        updateTasksChartDataOnly();
        updateWeeklyChartDataOnly();
    }

    if (state.lastAccessDate !== todayStr) {
        state.lastAccessDate = todayStr;
    }
    saveState();
}

function checkAndResetDailyCounters(todayStr) {
    if (state.lastAccessDate !== todayStr) {
        state.todayCount = 0;

        // Limpa as marcações de 'deletedThisInstanceOfDay' do dia anterior
        state.tasks.forEach(task => {
            if (task.deletedThisInstanceOfDay) {
                delete task.deletedThisInstanceOfDay;
            }
        });


        const shiftArray = (arr) => {
            if (arr && Array.isArray(arr) && arr.length === 7) {
                arr.shift();
                arr.push(0);
            } else {
                return [0, 0, 0, 0, 0, 0, 0];
            }
            return arr;
        };

        state.weeklyActivityData = shiftArray(state.weeklyActivityData);
        updatePeakActivity();

        const newDailyFocusData = Array(7).fill(0);
        const todayDate = new Date();
        for (let d = 0; d < 7; d++) {
            const dateToCheck = new Date(todayDate);
            dateToCheck.setDate(todayDate.getDate() - (6 - d));
            const dateToCheckISO = dateToCheck.toISOString().split('T')[0];

            let focusForThisDay = 0;
            if (state.pomodoro && state.pomodoro.sessions && Array.isArray(state.pomodoro.sessions)) {
                state.pomodoro.sessions.forEach(session => {
                    if (session.type === 'focus' && new Date(session.startTime).toISOString().split('T')[0] === dateToCheckISO) {
                        focusForThisDay += Math.round((session.duration || 0) / 60);
                    }
                });
            }
            newDailyFocusData[d] = focusForThisDay;
        }
        state.pomodoro.dailyFocusData = newDailyFocusData;

        state.dailyTaskCompletionData = shiftArray(state.dailyTaskCompletionData);
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
        if (el) {
            el.textContent = (typeof value === 'number' && isNaN(value)) ? '0' : value;
        }
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

    setText('daily-record-value', formatUnit(state.dailyRecord.value, "questão", "questões"));
    setText('daily-record-date', state.dailyRecord.date || "-");
    updateStreakUI();
    setText('peak-activity-day', state.peakActivity.dayName || "-");
    setText('peak-activity-questions', formatUnit(state.peakActivity.questions, "questão", "questões"));

    const streakTargetValueEl = document.getElementById('streak-target-value');
    if (streakTargetValueEl) {
        streakTargetValueEl.textContent = state.goals.streak;
    }

    const dailyGoalInput = document.getElementById('daily-goal-input');
    if (dailyGoalInput) dailyGoalInput.value = state.goals.daily;
    const weeklyGoalInput = document.getElementById('weekly-goal-input');
    if (weeklyGoalInput) weeklyGoalInput.value = state.goals.weekly;
    const monthlyGoalInput = document.getElementById('monthly-goal-input');
    if (monthlyGoalInput) monthlyGoalInput.value = state.goals.monthly;
    const yearlyGoalInput = document.getElementById('yearly-goal-input');
    if (yearlyGoalInput) yearlyGoalInput.value = state.goals.yearly;
    const streakGoalInput = document.getElementById('streak-goal-input');
    if (streakGoalInput) streakGoalInput.value = state.goals.streak;


    updateWeeklyChartDataOnly();
    updatePomodoroChartDataOnly();
    updateTasksChartDataOnly();

    updatePomodoroUI();
    renderTasks();
    updateScrollIndicator();
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
        const numCount = Number(count);
        if (!isNaN(numCount) && numCount >= maxQuestions) {
            maxQuestions = numCount;
            peakDayOriginalIndex = index;
        }
    });

    if (peakDayOriginalIndex !== -1 && maxQuestions > 0) {
        const today = new Date();
        const daysAgo = 6 - peakDayOriginalIndex;
        const peakDate = new Date(today);
        peakDate.setDate(today.getDate() - daysAgo);

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
        if (typeof streakData.current !== 'number' || isNaN(streakData.current) || streakData.current < 0) streakData.current = 0;
        if (typeof streakData.history !== 'object' || streakData.history === null) streakData.history = {};
    } catch (e) {
        console.error("Error parsing streak data from localStorage:", e);
        streakData = { current: 0, lastValidDate: null, history: {} };
    }

    const goalMetToday = todayQuestions >= dailyGoal && dailyGoal > 0;
    const wasGoalMetForTodayInHistory = streakData.history[todayISO] !== undefined && Number(streakData.history[todayISO]) >= dailyGoal;

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
    }


    state.currentStreak.days = streakData.current;
    state.currentStreak.lastCompletionDate = streakData.lastValidDate;
    state.currentStreak.history = streakData.history;

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
            streakData.lastValidDate = yesterdayISO;
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
    setText('current-streak-value', formatUnit(state.currentStreak.days, "dia", "dias"));

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
        const dailyGoalInput = document.getElementById('daily-goal-input');
        if (dailyGoalInput) dailyGoalInput.value = state.goals.daily;
        const weeklyGoalInput = document.getElementById('weekly-goal-input');
        if (weeklyGoalInput) weeklyGoalInput.value = state.goals.weekly;
        const monthlyGoalInput = document.getElementById('monthly-goal-input');
        if (monthlyGoalInput) monthlyGoalInput.value = state.goals.monthly;
        const yearlyGoalInput = document.getElementById('yearly-goal-input');
        if (yearlyGoalInput) yearlyGoalInput.value = state.goals.yearly;
        const streakGoalInput = document.getElementById('streak-goal-input');
        if (streakGoalInput) streakGoalInput.value = state.goals.streak;

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
    const streakGoal = parseInt(document.getElementById('streak-goal-input').value);

    if (isNaN(daily) || daily < 1 || isNaN(weekly) || weekly < 1 || isNaN(monthly) || monthly < 1 || isNaN(yearly) || yearly < 1 || isNaN(streakGoal) || streakGoal < 1) {
        showCustomAlert("Todas as metas devem ser números positivos.", "Erro de Validação"); return;
    }
    state.goals = { daily, weekly, monthly, yearly, streak: streakGoal };
    saveState();
    updateUI();
    updateStreak();
    closeGoalsModal();
}

// Gerenciamento de Tema e Cor Primária
function toggleTheme() {
    state.isDarkMode = !state.isDarkMode;
    applyCurrentThemeAndMode();
    saveState();
}

function applyPrimaryColor(color) {
    document.documentElement.style.setProperty('--primary-color-light', color);
    document.documentElement.style.setProperty('--primary-color-dark', color);
    const rgbArray = hexToRgbArray(color);
    if (rgbArray) {
        document.documentElement.style.setProperty('--primary-color-light-rgb', rgbArray.join(', '));
        document.documentElement.style.setProperty('--primary-color-dark-rgb', rgbArray.join(', '));
    }
}

function applyCurrentThemeAndMode() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const faviconEl = document.getElementById('favicon');
    const docElement = document.documentElement;

    Object.keys(VISUAL_MODES).forEach(modeKey => {
        body.classList.remove(`theme-mode-${modeKey}`);
    });

    if (state.visuals.currentVisualMode && state.visuals.currentVisualMode !== 'default') {
        body.classList.add(`theme-mode-${state.visuals.currentVisualMode}`);
    }

    docElement.classList.toggle('light-theme-active', !state.isDarkMode);
    body.classList.toggle('light', !state.isDarkMode);

    if (themeIcon) {
        themeIcon.className = state.isDarkMode ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    }

    let currentPrimaryColor = PREDEFINED_PALETTES.electricBlue.primary;
    if (state.visuals.currentPalette === 'custom') {
        currentPrimaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color-dark').trim() || PREDEFINED_PALETTES.electricBlue.primary;
    } else if (PREDEFINED_PALETTES[state.visuals.currentPalette]) {
        currentPrimaryColor = PREDEFINED_PALETTES[state.visuals.currentPalette].primary;
    }

    if (getComputedStyle(document.documentElement).getPropertyValue('--primary-color-dark').trim() !== currentPrimaryColor) {
        applyPrimaryColor(currentPrimaryColor);
    }


    if (faviconEl) {
        faviconEl.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='${encodeURIComponent(currentPrimaryColor)}' class='bi bi-check2-square' viewBox='0 0 16 16'><path d='M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8A1.5 1.5 0 0 1 12.5 3v1.5a.5.5 0 0 1-1 0V3a.5.5 0 0 0-.5-.5H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 1 0 1H3z'/><path d='m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z'/></svg>`;
    }

    if (weeklyChartInstance) weeklyChartInstance.destroy();
    setupChart(false);
    if (pomodoroChartInstance) pomodoroChartInstance.destroy();
    setupPomodoroChart(false);
    if (tasksChartInstance) tasksChartInstance.destroy();
    setupTasksChart(false);

    updatePomodoroUI();
    renderTasks();
    updateThemeModalButtons();
}

// Configuração dos Gráficos (Genérica)
function createChartConfig(canvasId, chartData, label, yAxisLabel, tooltipLabelPrefix, dataFormatter = (val) => val) {
    const chartCanvas = document.getElementById(canvasId);
    if (!chartCanvas) return null;
    const ctx = chartCanvas.getContext('2d');

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim();
    const gridColor = state.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = state.isDarkMode ? '#AAA' : '#555';
    const tooltipBackgroundColor = state.isDarkMode ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipTextColor = state.isDarkMode ? '#FFFFFF' : '#222';
    const bodyBgColor = getComputedStyle(document.body).backgroundColor;

    const gradient = ctx.createLinearGradient(0, 0, 0, chartCanvas.height * 0.8);
    try {
        gradient.addColorStop(0, hexToRgba(primaryColor, 0.3));
        gradient.addColorStop(1, hexToRgba(primaryColor, 0));
    } catch (e) {
        gradient.addColorStop(0, 'rgba(0,122,255,0.3)');
        gradient.addColorStop(1, 'rgba(0,122,255,0)');
        console.warn("Chart gradient color fallback used for:", canvasId, e);
    }

    const dayLabels = getLast7DayLabels();

    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: dayLabels,
            datasets: [{
                label: label,
                data: [...chartData],
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
            animation: { duration: 0 },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor, drawBorder: false },
                    ticks: { color: textColor, precision: 0, callback: dataFormatter },
                    title: { display: true, text: yAxisLabel, color: textColor, font: { size: 10 } },
                    afterDataLimits: (axis) => {
                        if (axis.max === 0 && axis.min === 0) {
                            axis.max = (yAxisLabel.toLowerCase().includes("minutos")) ? 10 : 1;
                        }
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: textColor }
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
                        label: (item) => `${tooltipLabelPrefix}: ${dataFormatter(item.raw)}`
                    }
                }
            },
            interaction: { mode: 'index', intersect: false },
            hover: { mode: 'nearest', intersect: true }
        }
    });
}

// Funções específicas de setup de gráficos
function setupChart(animateInitialRender = true) {
    if (weeklyChartInstance) weeklyChartInstance.destroy();
    const data = (window.state && Array.isArray(window.state.weeklyActivityData) && window.state.weeklyActivityData.length === 7)
        ? window.state.weeklyActivityData
        : [0, 0, 0, 0, 0, 0, 0];

    weeklyChartInstance = createChartConfig('weeklyActivityChart', data, 'Questões', 'Nº de Questões', 'Questões');
    if (weeklyChartInstance) weeklyChartInstance.options.animation.duration = animateInitialRender ? 800 : 0;
}
function updateWeeklyChartDataOnly() {
    if (!window.state || !Array.isArray(window.state.weeklyActivityData) || window.state.weeklyActivityData.length !== 7) {
        console.warn("TASKIFY_CHART: weeklyActivityData inválido ou ausente. Recriando gráfico.");
        setupChart(false);
        return;
    }
    if (weeklyChartInstance) {
        weeklyChartInstance.data.datasets[0].data = [...window.state.weeklyActivityData];
        weeklyChartInstance.update('none');
    } else {
        setupChart(false);
    }
}

function setupPomodoroChart(animateInitialRender = true) {
    if (pomodoroChartInstance) pomodoroChartInstance.destroy();
    const data = (state.pomodoro && Array.isArray(state.pomodoro.dailyFocusData) && state.pomodoro.dailyFocusData.length === 7)
        ? state.pomodoro.dailyFocusData
        : [0, 0, 0, 0, 0, 0, 0];
    pomodoroChartInstance = createChartConfig(
        'weeklyPomodoroFocusChart', data, 'Tempo de Foco', 'Minutos de Foco', 'Foco',
        (value) => value.toFixed(0) + ' min'
    );
    if (pomodoroChartInstance) pomodoroChartInstance.options.animation.duration = animateInitialRender ? 800 : 0;
}
function updatePomodoroChartDataOnly() {
    if (!state.pomodoro || !Array.isArray(state.pomodoro.dailyFocusData) || state.pomodoro.dailyFocusData.length !== 7) {
        console.warn("TASKIFY_CHART: Pomodoro dailyFocusData inválido ou ausente. Recriando gráfico.");
        setupPomodoroChart(false);
        return;
    }
    if (pomodoroChartInstance) {
        pomodoroChartInstance.data.datasets[0].data = [...state.pomodoro.dailyFocusData];
        pomodoroChartInstance.update('none');
    } else {
        setupPomodoroChart(false);
    }
}

function setupTasksChart(animateInitialRender = true) {
    if (tasksChartInstance) tasksChartInstance.destroy();
    const data = (Array.isArray(state.dailyTaskCompletionData) && state.dailyTaskCompletionData.length === 7)
        ? state.dailyTaskCompletionData
        : [0, 0, 0, 0, 0, 0, 0];
    tasksChartInstance = createChartConfig('weeklyTasksCompletedChart', data, 'Tarefas Concluídas', 'Nº de Tarefas', 'Tarefas');
    if (tasksChartInstance) tasksChartInstance.options.animation.duration = animateInitialRender ? 800 : 0;
}
function updateTasksChartDataOnly() {
    if (!Array.isArray(state.dailyTaskCompletionData) || state.dailyTaskCompletionData.length !== 7) {
        console.warn("TASKIFY_CHART: dailyTaskCompletionData inválido ou ausente. Recriando gráfico.");
        setupTasksChart(false);
        return;
    }
    if (tasksChartInstance) {
        tasksChartInstance.data.datasets[0].data = [...state.dailyTaskCompletionData];
        tasksChartInstance.update('none');
    } else {
        setupTasksChart(false);
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
                initialHistory = (typeof streakData.history === 'object' && streakData.history !== null) ? streakData.history : {};
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
    state.currentStreak.history = initialHistory;

    const currentStreakDataToStore = {
        current: state.currentStreak.days,
        lastValidDate: state.currentStreak.lastCompletionDate,
        history: state.currentStreak.history
    };
    localStorage.setItem('taskify-streak', JSON.stringify(currentStreakDataToStore));

    updateStreak();
    updateStreakUI();
}

// --- Funções do Pomodoro ---
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function updatePomodoroUI() {
    const pomodoro = state.pomodoro;
    const timerDisplay = document.getElementById('pomodoro-timer-display');
    const statusDisplay = document.getElementById('pomodoro-status');
    const cyclesCountValueDisplay = document.getElementById('pomodoro-cycles-count-value');
    const startBtn = document.getElementById('pomodoro-start-btn');
    const pauseBtn = document.getElementById('pomodoro-pause-btn');

    if (timerDisplay) timerDisplay.textContent = formatTime(pomodoro.currentTime);

    if (statusDisplay) {
        if (pomodoro.timerRunning) {
            statusDisplay.textContent = pomodoro.mode === 'focus' ? 'Foco Ativo...' : (pomodoro.mode === 'shortBreak' ? 'Pausa Curta...' : 'Pausa Longa...');
        } else {
            if (pomodoro.lastModeEnded) {
                const nextModeText = pomodoro.mode === 'focus' ? 'Foco' : (pomodoro.mode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa');
                statusDisplay.textContent = `Próximo: ${nextModeText}`;
            } else {
                statusDisplay.textContent = `Pronto para ${pomodoro.mode === 'focus' ? 'focar?' : (pomodoro.mode === 'shortBreak' ? 'uma pausa curta?' : 'uma pausa longa?')}`;
            }
        }
    }

    if (cyclesCountValueDisplay) cyclesCountValueDisplay.textContent = pomodoro.totalPomodorosToday;

    if (startBtn && pauseBtn) {
        startBtn.style.display = pomodoro.timerRunning ? 'none' : 'inline-block';
        pauseBtn.style.display = pomodoro.timerRunning ? 'inline-block' : 'none';

        if (pomodoro.mode === 'focus') {
            startBtn.classList.remove('break-mode');
            if (timerDisplay) timerDisplay.classList.remove('break-mode');
        } else {
            startBtn.classList.add('break-mode');
            if (timerDisplay) timerDisplay.classList.add('break-mode');
        }

        if (!pomodoro.timerRunning) {
            const isAtFullDurationForCurrentMode = pomodoro.currentTime ===
                (pomodoro.mode === 'focus' ? pomodoro.focusDuration :
                    (pomodoro.mode === 'shortBreak' ? pomodoro.shortBreakDuration :
                        pomodoro.longBreakDuration));
            startBtn.textContent = isAtFullDurationForCurrentMode ? 'Iniciar' : 'Continuar';
        }
    }

    if (pomodoro.timerRunning) {
        document.title = `${formatTime(pomodoro.currentTime)} - ${pomodoro.mode === 'focus' ? 'Foco' : 'Pausa'} | Taskify`;
    } else {
        const dailyGoalPercentage = state.goals.daily > 0 ? Math.round((state.todayCount / state.goals.daily) * 100) : 0;
        document.title = `(${dailyGoalPercentage}%) Taskify`;
    }
}

function playSound(soundElement) {
    if (!soundElement) {
        console.warn("playSound: soundElement é nulo ou indefinido.");
        return;
    }
    if (typeof soundElement.play === 'function') {
        soundElement.currentTime = 0;
        soundElement.play()
            .catch(error => {
                console.warn(`TASKIFY_SOUND: Erro ao tocar som ${soundElement.id}:`, error);
            });
    } else {
        console.warn(`playSound: ${soundElement.id} não tem uma função play.`);
    }
}

function handlePomodoroTick() {
    if (!state.pomodoro.timerRunning) return;
    state.pomodoro.currentTime--;
    if (state.pomodoro.currentTime < 0) handlePomodoroCycleEnd();
    else updatePomodoroUI();
}

function handlePomodoroCycleEnd() {
    const endedMode = state.pomodoro.mode;
    let actualDurationSeconds = 0;

    if (endedMode === 'focus') actualDurationSeconds = state.pomodoro.focusDuration - Math.max(0, state.pomodoro.currentTime);
    else if (endedMode === 'shortBreak') actualDurationSeconds = state.pomodoro.shortBreakDuration - Math.max(0, state.pomodoro.currentTime);
    else actualDurationSeconds = state.pomodoro.longBreakDuration - Math.max(0, state.pomodoro.currentTime);

    if (endedMode === 'focus' && actualDurationSeconds > 0) {
        if (state.pomodoro.dailyFocusData && state.pomodoro.dailyFocusData.length === 7) {
            state.pomodoro.dailyFocusData[6] += Math.round(actualDurationSeconds / 60);
        }
        logPomodoroSession(endedMode, actualDurationSeconds);
        updatePomodoroChartDataOnly();
    }

    state.pomodoro.timerRunning = false;
    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }

    let nextModeMessage = "";
    if (endedMode === 'focus') {
        state.pomodoro.totalPomodorosToday++;
        state.pomodoro.currentCycleInSet++;
        if (state.pomodoro.enableSound && focusEndSound) playSound(focusEndSound);
        if (state.pomodoro.currentCycleInSet >= state.pomodoro.cyclesBeforeLongBreak) {
            state.pomodoro.mode = 'longBreak';
            state.pomodoro.currentTime = state.pomodoro.longBreakDuration;
            state.pomodoro.currentCycleInSet = 0;
            nextModeMessage = "Hora da pausa longa!";
        } else {
            state.pomodoro.mode = 'shortBreak';
            state.pomodoro.currentTime = state.pomodoro.shortBreakDuration;
            nextModeMessage = "Hora da pausa curta!";
        }
    } else {
        if (state.pomodoro.enableSound && breakEndSound) playSound(breakEndSound);
        state.pomodoro.mode = 'focus';
        state.pomodoro.currentTime = state.pomodoro.focusDuration;
        nextModeMessage = "Hora de focar!";
    }
    state.pomodoro.lastModeEnded = endedMode;
    updatePomodoroUI();
    saveState();

    showCustomAlert(
        `Ciclo de ${endedMode === 'focus' ? 'Foco' : (endedMode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa')} terminado! ${nextModeMessage}`,
        "Pomodoro",
        () => {
            const pomodoroSectionEl = document.querySelector('.pomodoro-section');
            if (pomodoroSectionEl) setTimeout(() => pomodoroSectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            const currentEndedMode = state.pomodoro.lastModeEnded;
            if ((currentEndedMode === 'focus' && state.pomodoro.autoStartBreaks) ||
                ((currentEndedMode === 'shortBreak' || currentEndedMode === 'longBreak') && state.pomodoro.autoStartFocus)) {
                startPomodoro();
            }
        }
    );
}


function startPomodoro() {
    if (state.pomodoro.timerRunning) return;
    checkAllResets();
    state.pomodoro.timerRunning = true;
    state.pomodoro.lastModeEnded = null;
    if (pomodoroInterval) clearInterval(pomodoroInterval);
    pomodoroInterval = setInterval(handlePomodoroTick, 1000);
    updatePomodoroUI();
    saveState();
}

function pausePomodoro() {
    if (!state.pomodoro.timerRunning) return;
    state.pomodoro.timerRunning = false;
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    updatePomodoroUI();
    saveState();
}

function resetPomodoro() {
    const wasRunning = state.pomodoro.timerRunning;
    const endedMode = state.pomodoro.mode;
    const timeRemaining = state.pomodoro.currentTime;

    if (wasRunning && endedMode === 'focus') {
        let timeSpentSeconds = state.pomodoro.focusDuration - timeRemaining;
        if (timeSpentSeconds > 0) {
            if (state.pomodoro.dailyFocusData && state.pomodoro.dailyFocusData.length === 7) {
                state.pomodoro.dailyFocusData[6] += Math.round(timeSpentSeconds / 60);
            }
            logPomodoroSession(endedMode, timeSpentSeconds);
        }
    }

    state.pomodoro.timerRunning = false;
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    state.pomodoro.lastModeEnded = null;
    if (state.pomodoro.mode === 'focus') state.pomodoro.currentTime = state.pomodoro.focusDuration;
    else if (state.pomodoro.mode === 'shortBreak') state.pomodoro.currentTime = state.pomodoro.shortBreakDuration;
    else if (state.pomodoro.mode === 'longBreak') state.pomodoro.currentTime = state.pomodoro.longBreakDuration;
    updatePomodoroUI();
    updatePomodoroChartDataOnly();
    saveState();
}

function openPomodoroSettingsModal() {
    const modal = document.getElementById('pomodoro-settings-modal');
    const overlay = document.getElementById('pomodoro-settings-modal-overlay');
    if (modal && overlay) {
        document.getElementById('pomodoro-focus-duration-input').value = state.pomodoro.focusDuration / 60;
        document.getElementById('pomodoro-short-break-duration-input').value = state.pomodoro.shortBreakDuration / 60;
        document.getElementById('pomodoro-long-break-duration-input').value = state.pomodoro.longBreakDuration / 60;
        document.getElementById('pomodoro-cycles-before-long-break-input').value = state.pomodoro.cyclesBeforeLongBreak;
        document.getElementById('pomodoro-auto-start-breaks-checkbox').checked = state.pomodoro.autoStartBreaks;
        document.getElementById('pomodoro-auto-start-focus-checkbox').checked = state.pomodoro.autoStartFocus;
        document.getElementById('pomodoro-enable-sound-checkbox').checked = state.pomodoro.enableSound;
        overlay.classList.add('show');
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

function closePomodoroSettingsModal() {
    const modal = document.getElementById('pomodoro-settings-modal');
    const overlay = document.getElementById('pomodoro-settings-modal-overlay');
    if (modal && overlay) {
        modal.classList.remove('show');
        overlay.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

function savePomodoroSettings() {
    const focusDuration = parseInt(document.getElementById('pomodoro-focus-duration-input').value) * 60;
    const shortBreakDuration = parseInt(document.getElementById('pomodoro-short-break-duration-input').value) * 60;
    const longBreakDuration = parseInt(document.getElementById('pomodoro-long-break-duration-input').value) * 60;
    const cyclesBeforeLongBreak = parseInt(document.getElementById('pomodoro-cycles-before-long-break-input').value);
    const autoStartBreaks = document.getElementById('pomodoro-auto-start-breaks-checkbox').checked;
    const autoStartFocus = document.getElementById('pomodoro-auto-start-focus-checkbox').checked;
    const enableSound = document.getElementById('pomodoro-enable-sound-checkbox').checked;

    if (isNaN(focusDuration) || focusDuration < 60 ||
        isNaN(shortBreakDuration) || shortBreakDuration < 60 ||
        isNaN(longBreakDuration) || longBreakDuration < 60 ||
        isNaN(cyclesBeforeLongBreak) || cyclesBeforeLongBreak < 1) {
        showCustomAlert("Configurações do Pomodoro inválidas. Verifique os valores (duração mínima de 1 minuto).", "Erro de Validação");
        return;
    }

    state.pomodoro.focusDuration = focusDuration;
    state.pomodoro.shortBreakDuration = shortBreakDuration;
    state.pomodoro.longBreakDuration = longBreakDuration;
    state.pomodoro.cyclesBeforeLongBreak = cyclesBeforeLongBreak;
    state.pomodoro.autoStartBreaks = autoStartBreaks;
    state.pomodoro.autoStartFocus = autoStartFocus;
    state.pomodoro.enableSound = enableSound;

    if (!state.pomodoro.timerRunning) {
        if (state.pomodoro.mode === 'focus') state.pomodoro.currentTime = state.pomodoro.focusDuration;
        else if (state.pomodoro.mode === 'shortBreak') state.pomodoro.currentTime = state.pomodoro.shortBreakDuration;
        else if (state.pomodoro.mode === 'longBreak') state.pomodoro.currentTime = state.pomodoro.longBreakDuration;
        state.pomodoro.lastModeEnded = null;
    }

    saveState();
    updatePomodoroUI();
    closePomodoroSettingsModal();
}

function logPomodoroSession(type, durationInSeconds) {
    if (durationInSeconds <= 0) return;
    const session = {
        startTime: new Date(Date.now() - durationInSeconds * 1000).toISOString(),
        endTime: new Date().toISOString(),
        duration: durationInSeconds,
        type: type
    };
    state.pomodoro.sessions.push(session);
}

function initPomodoro() {
    focusEndSound = document.getElementById('focus-end-sound');
    breakEndSound = document.getElementById('break-end-sound');
    const pomodoroSettingsForm = document.getElementById('pomodoro-settings-form');
    if (pomodoroSettingsForm) {
        pomodoroSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePomodoroSettings();
        });
    }
    const pomodoroSettingsModalOverlay = document.getElementById('pomodoro-settings-modal-overlay');
    if (pomodoroSettingsModalOverlay) {
        pomodoroSettingsModalOverlay.addEventListener('click', closePomodoroSettingsModal);
    }
    updatePomodoroUI();
}

// --- Funções de Tarefas ---
function renderTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    taskList.innerHTML = '';
    const todayISO = getTodayISO();

    generateRecurringTaskInstances();

    const tasksToDisplay = state.tasks.filter(task => {
        // CORREÇÃO BUG 1: Não renderiza se deletada para hoje
        if (task.deletedThisInstanceOfDay && task.assignedDate === todayISO) {
            return false;
        }
        if (task.isRecurringInstance) {
            return task.assignedDate === todayISO;
        }
        return true;
    });


    const sortedTasks = [...tasksToDisplay].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const aDateStr = a.assignedDate || "0000-00-00";
        const bDateStr = b.assignedDate || "0000-00-00";
        const aIsTodayOrNull = a.assignedDate === todayISO || a.assignedDate === null;
        const bIsTodayOrNull = b.assignedDate === todayISO || b.assignedDate === null;
        if (aIsTodayOrNull && !bIsTodayOrNull) return -1;
        if (!aIsTodayOrNull && bIsTodayOrNull) return 1;
        if (aDateStr < bDateStr) return -1;
        if (aDateStr > bDateStr) return 1;
        return new Date(a.createdAt) - new Date(b.createdAt);
    });


    if (sortedTasks.length === 0) {
        const emptyTaskMessage = document.createElement('li');
        emptyTaskMessage.className = 'task-list-empty-message';
        emptyTaskMessage.textContent = 'Nenhuma tarefa para hoje. Adicione algumas!';
        taskList.appendChild(emptyTaskMessage);
    } else {
        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            if (task.completed) li.classList.add('completed');
            li.dataset.taskId = task.id;
            li.setAttribute('draggable', 'true');
            li.addEventListener('dragstart', handleDragStart);
            li.addEventListener('dragend', handleDragEnd);

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'task-item-checkbox';
            checkbox.checked = task.completed;
            checkbox.addEventListener('change', () => toggleTaskComplete(task.id));

            const textSpan = document.createElement('span');
            textSpan.className = 'task-item-text';
            textSpan.textContent = task.text;

            if (task.isRecurringInstance || task.sourcePatternId) {
                const recurringIcon = document.createElement('i');
                recurringIcon.className = 'bi bi-arrow-repeat task-recurring-icon';
                recurringIcon.title = 'Tarefa Recorrente';
                textSpan.prepend(recurringIcon);
            }


            if (task.assignedDate && task.assignedDate !== todayISO) {
                const dateIndicator = document.createElement('span');
                dateIndicator.className = 'task-assigned-date-indicator';
                const assignedDateParts = task.assignedDate.split('-');
                const assignedDateObj = new Date(parseInt(assignedDateParts[0]), parseInt(assignedDateParts[1]) - 1, parseInt(assignedDateParts[2]));
                assignedDateObj.setHours(0, 0, 0, 0);
                const todayDateObj = new Date(); todayDateObj.setHours(0, 0, 0, 0);
                const tomorrowDateObj = new Date(todayDateObj); tomorrowDateObj.setDate(todayDateObj.getDate() + 1);
                const yesterdayDateObj = new Date(todayDateObj); yesterdayDateObj.setDate(todayDateObj.getDate() - 1);

                if (assignedDateObj.getTime() === yesterdayDateObj.getTime()) dateIndicator.textContent = 'Ontem';
                else if (assignedDateObj.getTime() === tomorrowDateObj.getTime()) dateIndicator.textContent = 'Amanhã';
                else dateIndicator.textContent = formatDateToDDMMYYYY(task.assignedDate);
                textSpan.appendChild(dateIndicator);
            } else if (task.assignedDate === todayISO && !task.isRecurringInstance) {
                const dateIndicator = document.createElement('span');
                dateIndicator.className = 'task-assigned-date-indicator';
                dateIndicator.textContent = 'Hoje';
                textSpan.appendChild(dateIndicator);
            }


            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'task-item-delete-btn';
            deleteBtn.innerHTML = '<i class="bi bi-trash3-fill"></i>';
            deleteBtn.setAttribute('aria-label', 'Deletar tarefa');
            deleteBtn.addEventListener('click', () => deleteTask(task.id));

            li.appendChild(checkbox);
            li.appendChild(textSpan);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
        });
    }
    updateTasksCounter();
}

function updateTasksCounter() {
    const tasksCounter = document.getElementById('tasks-counter');
    if (!tasksCounter) return;
    const todayISO = getTodayISO();
    const displayedTasks = state.tasks.filter(task => {
        if (task.deletedThisInstanceOfDay && task.assignedDate === todayISO) return false; // CORREÇÃO BUG 1
        if (task.isRecurringInstance) return task.assignedDate === getTodayISO();
        return true;
    });
    const completedDisplayedTasks = displayedTasks.filter(task => task.completed).length;
    tasksCounter.textContent = `${completedDisplayedTasks}/${displayedTasks.length}`;
}


function addTask(event) {
    event.preventDefault();
    checkAllResets();
    const taskInput = document.getElementById('task-input');
    const taskText = taskInput.value.trim();
    const selectedDates = taskDatePicker.selectedDates;
    let assignedDateValue = null;
    if (selectedDates.length > 0) {
        const dateObj = selectedDates[0];
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        assignedDateValue = `${year}-${month}-${day}`;
    }

    if (taskText === '') {
        showCustomAlert('Por favor, insira o texto da tarefa.', 'Tarefa Inválida');
        return;
    }

    const newTask = {
        id: Date.now().toString(),
        text: taskText,
        completed: false,
        createdAt: new Date().toISOString(),
        completionDate: null,
        assignedDate: assignedDateValue,
        isRecurringInstance: false,
        sourcePatternId: null
    };

    state.tasks.push(newTask);
    taskInput.value = '';
    taskDatePicker.setDate(new Date(), true);
    renderTasks();
    saveState();
}


function toggleTaskComplete(taskId) {
    checkAllResets();
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        const task = state.tasks[taskIndex];
        const wasCompleted = task.completed;
        task.completed = !task.completed;
        task.completionDate = task.completed ? new Date().toISOString() : null;

        const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.toggle('completed', task.completed);
            const checkbox = taskElement.querySelector('.task-item-checkbox');
            if (checkbox) checkbox.checked = task.completed;
        }

        updateTasksCounter();

        const completionDateForChart = task.completed ? new Date(task.completionDate) : new Date();
        completionDateForChart.setHours(0, 0, 0, 0);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round((today.getTime() - completionDateForChart.getTime()) / oneDay);

        if (diffDays >= 0 && diffDays < 7) {
            const dayIndexInChart = 6 - diffDays;
            if (state.dailyTaskCompletionData && state.dailyTaskCompletionData.length === 7 && dayIndexInChart >= 0 && dayIndexInChart < 7) {
                if (task.completed && !wasCompleted) state.dailyTaskCompletionData[dayIndexInChart]++;
                else if (!task.completed && wasCompleted) state.dailyTaskCompletionData[dayIndexInChart] = Math.max(0, state.dailyTaskCompletionData[dayIndexInChart] - 1);
            }
        }
        saveState();
        updateTasksChartDataOnly();
        if (task.completed || wasCompleted) renderTasks();
    }
}


function deleteTask(taskId) {
    checkAllResets();
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        const deletedTask = state.tasks[taskIndex];

        if (deletedTask.isRecurringInstance || deletedTask.sourcePatternId) {
            openDeleteRecurringTaskModal(deletedTask);
            return;
        }

        state.tasks.splice(taskIndex, 1);
        // renderTasks() será chamado por confirmDeleteRecurringTask ou aqui se não for recorrente
        const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        if (taskElement) taskElement.remove(); // Remove da UI imediatamente
        updateTasksCounter();


        if (deletedTask.completed && deletedTask.completionDate) {
            const completionDateForChart = new Date(deletedTask.completionDate);
            completionDateForChart.setHours(0, 0, 0, 0);
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const oneDay = 24 * 60 * 60 * 1000;
            const diffDays = Math.round((today.getTime() - completionDateForChart.getTime()) / oneDay);
            if (diffDays >= 0 && diffDays < 7) {
                const dayIndexInChart = 6 - diffDays;
                if (state.dailyTaskCompletionData && state.dailyTaskCompletionData.length === 7 && dayIndexInChart >= 0 && dayIndexInChart < 7) {
                    state.dailyTaskCompletionData[dayIndexInChart] = Math.max(0, state.dailyTaskCompletionData[dayIndexInChart] - 1);
                }
            }
        }
        // Só re-renderiza se a lista ficar vazia para mostrar a mensagem
        if (state.tasks.filter(t => !(t.deletedThisInstanceOfDay && t.assignedDate === getTodayISO()) && (t.isRecurringInstance ? t.assignedDate === getTodayISO() : true)).length === 0) {
            renderTasks();
        }

        saveState();
        updateTasksChartDataOnly();
    }
}


// --- Funções de Drag and Drop para Tarefas ---
function handleDragStart(e) {
    draggedItem = e.target;
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => { if (draggedItem) draggedItem.classList.add('dragging'); }, 0);
}

function handleDragEnd(e) {
    if (draggedItem) draggedItem.classList.remove('dragging');
    draggedItem = null;
    document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove());
}

function handleDragOver(e) {
    e.preventDefault();
    const taskList = document.getElementById('task-list');
    const afterElement = getDragAfterElement(taskList, e.clientY);
    document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove());
    const placeholder = document.createElement('li');
    placeholder.classList.add('drag-over-placeholder');
    if (afterElement == null) taskList.appendChild(placeholder);
    else taskList.insertBefore(placeholder, afterElement);
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedItem) return;
    const taskList = document.getElementById('task-list');
    const draggedItemId = draggedItem.dataset.taskId;
    const originalIndex = state.tasks.findIndex(task => task.id === draggedItemId);
    if (originalIndex === -1) {
        console.error("Tarefa arrastada não encontrada no estado.");
        if (draggedItem) draggedItem.classList.remove('dragging');
        draggedItem = null;
        document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove());
        return;
    }
    const [movedTask] = state.tasks.splice(originalIndex, 1);
    const afterElement = getDragAfterElement(taskList, e.clientY);
    let newIndex;
    if (afterElement) {
        const afterElementId = afterElement.dataset.taskId;
        const targetIndexInState = state.tasks.findIndex(task => task.id === afterElementId);
        newIndex = targetIndexInState !== -1 ? targetIndexInState : state.tasks.length;
    } else {
        newIndex = state.tasks.length;
    }
    state.tasks.splice(newIndex, 0, movedTask);
    if (draggedItem) draggedItem.classList.remove('dragging');
    draggedItem = null;
    document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove());
    renderTasks();
    saveState();
}


function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}


function initTasks() {
    const taskForm = document.getElementById('task-form');
    if (taskForm) taskForm.addEventListener('submit', addTask);
    const taskList = document.getElementById('task-list');
    if (taskList) {
        taskList.addEventListener('dragover', handleDragOver);
        taskList.addEventListener('drop', handleDrop);
    }
    const taskDateInput = document.getElementById('task-assigned-date');
    if (taskDateInput && typeof flatpickr === 'function') {
        taskDatePicker = flatpickr(taskDateInput, {
            dateFormat: "d/m/Y", defaultDate: "today", locale: "pt", allowInput: true,
        });
    } else if (taskDateInput) {
        taskDateInput.value = getTodayISO(); taskDateInput.type = "date"; taskDateInput.placeholder = "";
    }
    renderTasks();
}

// --- Funções de Tarefas Recorrentes ---
function setupRecurringDaysCheckboxes() {
    const checkboxes = document.querySelectorAll('.recurring-days-checkbox-group input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const label = e.target.closest('label');
            if (label) {
                label.classList.toggle('checked', e.target.checked);
            }
        });
    });
}


function openRecurringTaskPatternModal(patternId = null) {
    const modal = document.getElementById('recurring-task-modal');
    const overlay = document.getElementById('recurring-task-modal-overlay');
    const form = document.getElementById('recurring-task-form');
    const modalTitle = document.getElementById('recurring-task-modal-title');
    const modalDescription = document.getElementById('recurring-task-modal-description');
    const submitButton = form.querySelector('button[type="submit"]');
    const recurringTaskNameInput = document.getElementById('recurring-task-name'); // Input no modal


    if (!modal || !overlay || !form || !modalTitle || !modalDescription || !submitButton || !recurringTaskNameInput) {
        console.error("Elementos do modal de tarefa recorrente não encontrados.");
        return;
    }
    form.reset();
    form.dataset.editingPatternId = '';
    document.querySelectorAll('.recurring-days-checkbox-group input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        const label = cb.closest('label');
        if (label) label.classList.remove('checked');
    });

    // MELHORIA 2: Preencher nome da tarefa do input geral
    if (!patternId) { // Apenas se estiver ADICIONANDO um novo padrão
        const taskInputGeneral = document.getElementById('task-input');
        if (taskInputGeneral) {
            const generalTaskText = taskInputGeneral.value.trim();
            if (generalTaskText) {
                recurringTaskNameInput.value = generalTaskText;
                // Opcional: Limpar o input geral. Por enquanto, vamos deixar como está.
                // taskInputGeneral.value = '';
            }
        }
    }


    const startDateInput = document.getElementById('recurring-task-start-date');
    const endDateInput = document.getElementById('recurring-task-end-date');

    if (startDateInput && typeof flatpickr === 'function') {
        if (!recurringTaskStartDatePicker) {
            recurringTaskStartDatePicker = flatpickr(startDateInput, { dateFormat: "d/m/Y", defaultDate: "today", locale: "pt", allowInput: true });
        } else {
            recurringTaskStartDatePicker.setDate(new Date(), true);
        }
    }

    if (endDateInput && typeof flatpickr === 'function') {
        if (!recurringTaskEndDatePicker) {
            recurringTaskEndDatePicker = flatpickr(endDateInput, { dateFormat: "d/m/Y", locale: "pt", allowInput: true });
        }
        recurringTaskEndDatePicker.clear();
    }


    if (patternId) {
        const pattern = state.recurringTaskPatterns.find(p => p.id === patternId);
        if (pattern) {
            modalTitle.textContent = 'Editar Padrão Recorrente';
            modalDescription.textContent = 'Ajuste sua rotina de estudos ou hábitos existentes.';
            submitButton.innerHTML = '<i class="bi bi-check-lg"></i> Salvar Alterações';
            form.dataset.editingPatternId = patternId;
            recurringTaskNameInput.value = pattern.name; // Já pegamos o elemento acima
            pattern.daysOfWeek.forEach(dayIndex => {
                const checkbox = document.getElementById(`recurring-day-${dayIndex}`);
                if (checkbox) {
                    checkbox.checked = true;
                    const label = checkbox.closest('label');
                    if (label) label.classList.add('checked');
                }
            });
            if (recurringTaskStartDatePicker && pattern.startDate) recurringTaskStartDatePicker.setDate(pattern.startDate, true, "Y-m-d");
            if (recurringTaskEndDatePicker && pattern.endDate) recurringTaskEndDatePicker.setDate(pattern.endDate, true, "Y-m-d");
        } else {
            modalTitle.textContent = 'Adicionar Padrão Recorrente';
            modalDescription.textContent = 'Configure uma nova rotina de estudos ou hábitos.';
            submitButton.innerHTML = '<i class="bi bi-plus-lg"></i> Salvar Padrão';
        }
    } else {
        modalTitle.textContent = 'Adicionar Padrão Recorrente';
        modalDescription.textContent = 'Configure uma nova rotina de estudos ou hábitos.';
        submitButton.innerHTML = '<i class="bi bi-plus-lg"></i> Salvar Padrão';
    }

    renderRecurringTaskPatterns();
    overlay.classList.add('show');
    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

function closeRecurringTaskPatternModal() {
    const modal = document.getElementById('recurring-task-modal');
    const overlay = document.getElementById('recurring-task-modal-overlay');
    if (modal && overlay) {
        modal.classList.remove('show');
        overlay.classList.remove('show');
        document.body.classList.remove('modal-open');
        const form = document.getElementById('recurring-task-form');
        if (form) form.reset();
        document.querySelectorAll('.recurring-days-checkbox-group input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
            const label = cb.closest('label');
            if (label) label.classList.remove('checked');
        });
    }
}

function saveRecurringTaskPattern(event) {
    event.preventDefault();
    const form = document.getElementById('recurring-task-form');
    const patternId = form.dataset.editingPatternId;
    const name = document.getElementById('recurring-task-name').value.trim();
    if (!name) { showCustomAlert("O nome da tarefa recorrente é obrigatório.", "Erro de Validação"); return; }

    const daysOfWeek = [];
    for (let i = 0; i < 7; i++) {
        const checkbox = document.getElementById(`recurring-day-${i}`);
        if (checkbox && checkbox.checked) daysOfWeek.push(parseInt(checkbox.value, 10));
    }
    if (daysOfWeek.length === 0) { showCustomAlert("Selecione pelo menos um dia da semana.", "Erro de Validação"); return; }

    const startDateSelected = recurringTaskStartDatePicker.selectedDates;
    if (!startDateSelected || startDateSelected.length === 0) { showCustomAlert("A data de início é obrigatória.", "Erro de Validação"); return; }
    const startDate = formatDateToISO(recurringTaskStartDatePicker.input.value);

    let endDate = null;
    const endDateSelected = recurringTaskEndDatePicker.selectedDates;
    if (endDateSelected && endDateSelected.length > 0) {
        endDate = formatDateToISO(recurringTaskEndDatePicker.input.value);
        if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
            showCustomAlert("A data de término não pode ser anterior à data de início.", "Erro de Validação"); return;
        }
    }

    if (patternId) {
        const patternIndex = state.recurringTaskPatterns.findIndex(p => p.id === patternId);
        if (patternIndex > -1) {
            const todayISO = getTodayISO();
            state.tasks = state.tasks.filter(task => {
                if (task.sourcePatternId === patternId) {
                    if (!task.completed && task.assignedDate >= todayISO) {
                        return false;
                    }
                }
                return true;
            });
            state.recurringTaskPatterns[patternIndex] = { ...state.recurringTaskPatterns[patternIndex], name, daysOfWeek, startDate, endDate, updatedAt: new Date().toISOString() };
        }
    } else {
        state.recurringTaskPatterns.push({ id: Date.now().toString(), name, frequency: 'weekly', daysOfWeek, startDate, endDate, createdAt: new Date().toISOString() });
    }

    closeRecurringTaskPatternModal();
    renderRecurringTaskPatterns();
    generateRecurringTaskInstances();
    renderTasks();
    saveState();
}

function deleteRecurringTaskPattern(patternId) {
    showCustomAlert(
        "Tem certeza que deseja excluir este padrão recorrente?<br><br>Todas as suas ocorrências futuras (não concluídas) também serão removidas.<br>Ocorrências passadas e concluídas serão mantidas.",
        "Confirmar Exclusão de Padrão",
        () => {
            state.recurringTaskPatterns = state.recurringTaskPatterns.filter(p => p.id !== patternId);
            const todayISO = getTodayISO();
            state.tasks = state.tasks.filter(task => {
                if (task.sourcePatternId === patternId) {
                    if (task.completed) return true;
                    if (task.assignedDate && task.assignedDate < todayISO) return true;
                    return false;
                }
                return true;
            });
            renderRecurringTaskPatterns();
            renderTasks();
            saveState();
        }
    );
}


function renderRecurringTaskPatterns() {
    const patternsListEl = document.getElementById('recurring-patterns-list');
    const patternsCountEl = document.getElementById('recurring-patterns-count');

    if (!patternsListEl || !patternsCountEl) {
        console.error("Elemento da lista de padrões ou contador não encontrado.");
        return;
    }

    patternsListEl.innerHTML = '';
    const patterns = state.recurringTaskPatterns;

    if (patterns.length === 0) {
        patternsListEl.innerHTML = '<li class="recurring-pattern-empty-message">Nenhum padrão recorrente criado.</li>';
        patternsCountEl.textContent = '0 padrões';
    } else {
        patternsCountEl.textContent = `${patterns.length} ${patterns.length === 1 ? 'padrão' : 'padrões'}`;
    }

    const dayNamesShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    patterns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    patterns.forEach(pattern => {
        const li = document.createElement('li');
        li.className = 'recurring-pattern-item';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'recurring-pattern-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'recurring-pattern-name';
        nameSpan.textContent = pattern.name;

        const detailsGroup = document.createElement('div');
        detailsGroup.className = 'recurring-pattern-details-group';

        const daysPillsContainer = document.createElement('div');
        daysPillsContainer.className = 'recurring-pattern-days';
        pattern.daysOfWeek.sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
            .map(d => dayNamesShort[d]).forEach(dayText => {
                const pill = document.createElement('span');
                pill.className = 'day-pill';
                pill.textContent = dayText;
                daysPillsContainer.appendChild(pill);
            });


        const datesSpan = document.createElement('span');
        datesSpan.className = 'recurring-pattern-dates';
        let dateText = `<span class="date-label">Início:</span> ${formatDateToDDMMYYYY(pattern.startDate)}`;
        if (pattern.endDate) dateText += ` • <span class="date-label">Fim:</span> ${formatDateToDDMMYYYY(pattern.endDate)}`;
        else dateText += " • <span class=\"date-label\">Contínuo</span>";
        datesSpan.innerHTML = dateText;

        detailsGroup.appendChild(daysPillsContainer);
        detailsGroup.appendChild(datesSpan);

        infoDiv.appendChild(nameSpan);
        infoDiv.appendChild(detailsGroup);


        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'recurring-pattern-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-icon-recurring edit';
        editBtn.innerHTML = '<i class="bi bi-pencil-fill"></i>';
        editBtn.title = "Editar Padrão";
        editBtn.addEventListener('click', () => openRecurringTaskPatternModal(pattern.id));

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon-recurring delete';
        deleteBtn.innerHTML = '<i class="bi bi-trash3-fill"></i>';
        deleteBtn.title = "Excluir Padrão";
        deleteBtn.addEventListener('click', () => deleteRecurringTaskPattern(pattern.id));

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);

        li.appendChild(infoDiv);
        li.appendChild(actionsDiv);
        patternsListEl.appendChild(li);
    });
}


function generateRecurringTaskInstances() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split('T')[0];
    let newTasksAdded = false;

    const activePatternIds = new Set(state.recurringTaskPatterns.map(p => p.id));
    state.tasks = state.tasks.filter(task => {
        if (task.isRecurringInstance && task.sourcePatternId) {
            if (!activePatternIds.has(task.sourcePatternId) && task.assignedDate >= todayISO && !task.completed) {
                newTasksAdded = true;
                return false;
            }
            const pattern = state.recurringTaskPatterns.find(p => p.id === task.sourcePatternId);
            if (pattern && pattern.endDate && task.assignedDate > pattern.endDate && !task.completed) {
                newTasksAdded = true;
                return false;
            }
        }
        return true;
    });


    state.recurringTaskPatterns.forEach(pattern => {
        const patternStartDate = new Date(pattern.startDate); patternStartDate.setHours(0, 0, 0, 0);
        const patternEndDate = pattern.endDate ? new Date(pattern.endDate) : null;
        if (patternEndDate) patternEndDate.setHours(0, 0, 0, 0);

        if (patternStartDate > today) return;
        if (patternEndDate && patternEndDate < today) return;

        const dayOfWeekToday = today.getDay();

        if (pattern.daysOfWeek.includes(dayOfWeekToday)) {
            const existingTask = state.tasks.find(task =>
                task.sourcePatternId === pattern.id && task.assignedDate === todayISO
            );
            // Só cria se não existir NENHUMA versão (nem a marcada como deletedThisInstanceOfDay)
            if (!existingTask) {
                state.tasks.push({
                    id: `${pattern.id}-${todayISO}`,
                    text: pattern.name,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    assignedDate: todayISO,
                    sourcePatternId: pattern.id,
                    isRecurringInstance: true
                    // Não adicionar deletedThisInstanceOfDay aqui ao criar
                });
                newTasksAdded = true;
            }
        }
    });
}

function updateDeleteRecurringTaskModalUI(selectedOptionValue) {
    const warningMessageContainer = document.getElementById('delete-recurring-warning-message');
    const warningMessageTextEl = warningMessageContainer.querySelector('span');
    const warningMessageIconEl = warningMessageContainer.querySelector('i');
    const confirmBtn = document.getElementById('btn-confirm-delete-recurring-action');

    confirmBtn.classList.remove('btn-danger-style');
    warningMessageContainer.classList.remove('danger');
    warningMessageIconEl.className = 'bi bi-exclamation-triangle-fill';

    switch (selectedOptionValue) {
        case 'this':
            warningMessageTextEl.textContent = 'Apenas esta ocorrência será removida. A tarefa recorrente continuará normalmente.';
            confirmBtn.textContent = 'Excluir Ocorrência';
            break;
        case 'future':
            warningMessageTextEl.textContent = 'Removerá esta e as futuras. Ocorrências passadas e concluídas serão mantidas.';
            confirmBtn.textContent = 'Excluir Futuras';
            break;
        case 'all':
            warningMessageTextEl.innerHTML = 'Ação irreversível: Toda a série recorrente será permanentemente excluída.';
            confirmBtn.textContent = 'Excluir Série Completa';
            confirmBtn.classList.add('btn-danger-style');
            warningMessageContainer.classList.add('danger');
            warningMessageIconEl.className = 'bi bi-trash3-fill';
            break;
    }
}


function openDeleteRecurringTaskModal(taskInstance) {
    const modal = document.getElementById('delete-recurring-task-modal');
    const overlay = document.getElementById('delete-recurring-task-modal-overlay');
    if (!modal || !overlay) return;
    modal.dataset.deletingTaskId = taskInstance.id;

    const firstOptionRadio = modal.querySelector('input[name="delete-recurring-option"][value="this"]');
    if (firstOptionRadio) {
        firstOptionRadio.checked = true;
        updateDeleteRecurringTaskModalUI('this');
        document.querySelectorAll('.delete-option-card').forEach(card => card.classList.remove('selected'));
        firstOptionRadio.closest('.delete-option-card').classList.add('selected');

    }

    overlay.classList.add('show');
    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

function closeDeleteRecurringTaskModal() {
    const modal = document.getElementById('delete-recurring-task-modal');
    const overlay = document.getElementById('delete-recurring-task-modal-overlay');
    if (modal && overlay) {
        modal.classList.remove('show');
        overlay.classList.remove('show');
        document.body.classList.remove('modal-open');
        delete modal.dataset.deletingTaskId;
    }
}

function confirmDeleteRecurringTask() {
    const modal = document.getElementById('delete-recurring-task-modal');
    const taskId = modal.dataset.deletingTaskId;
    if (!taskId) return;

    const selectedOptionRadio = modal.querySelector('input[name="delete-recurring-option"]:checked');
    if (!selectedOptionRadio) {
        showCustomAlert("Por favor, selecione uma opção de exclusão.", "Opção Necessária");
        return;
    }
    const optionValue = selectedOptionRadio.value;

    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) {
        closeDeleteRecurringTaskModal();
        showCustomAlert("Tarefa não encontrada para exclusão.", "Erro");
        return;
    }

    const taskInstance = state.tasks[taskIndex];
    const patternId = taskInstance.sourcePatternId;
    let tasksModified = false;
    let patternsModified = false;

    if (optionValue === 'this') {
        if (taskInstance.isRecurringInstance && taskInstance.assignedDate === getTodayISO()) {
            // CORREÇÃO BUG 1: Marca a tarefa para não ser renderizada/regerada hoje
            taskInstance.deletedThisInstanceOfDay = true;
        } else {
            // Se não for recorrente de hoje (ex: tarefa normal ou recorrente de outra data), remove normalmente
            state.tasks.splice(taskIndex, 1);
        }
        tasksModified = true;
    } else if (optionValue === 'future' && patternId) {
        const instanceDateObj = new Date(taskInstance.assignedDate);
        instanceDateObj.setHours(0, 0, 0, 0);

        const pattern = state.recurringTaskPatterns.find(p => p.id === patternId);
        if (pattern) {
            const dayBeforeInstance = new Date(instanceDateObj);
            dayBeforeInstance.setDate(instanceDateObj.getDate() - 1);
            const newEndDate = dayBeforeInstance.toISOString().split('T')[0];

            if (!pattern.endDate || new Date(newEndDate) < new Date(pattern.endDate)) {
                if (new Date(newEndDate) >= new Date(pattern.startDate)) {
                    pattern.endDate = newEndDate;
                    patternsModified = true;
                } else {
                    state.recurringTaskPatterns = state.recurringTaskPatterns.filter(p => p.id !== patternId);
                    patternsModified = true;
                }
            }
        }
        state.tasks = state.tasks.filter(t => {
            if (t.sourcePatternId === patternId) {
                const tDateObj = new Date(t.assignedDate);
                tDateObj.setHours(0, 0, 0, 0);
                if (tDateObj >= instanceDateObj && !t.completed) {
                    tasksModified = true;
                    return false;
                }
            }
            return true;
        });

    } else if (optionValue === 'all' && patternId) {
        state.recurringTaskPatterns = state.recurringTaskPatterns.filter(p => {
            if (p.id === patternId) { patternsModified = true; return false; }
            return true;
        });
        state.tasks = state.tasks.filter(t => {
            if (t.sourcePatternId === patternId) {
                if (!t.completed) {
                    tasksModified = true;
                    return false;
                }
            }
            return true;
        });
    }

    closeDeleteRecurringTaskModal();
    if (tasksModified || patternsModified) { // Se houve qualquer modificação
        renderTasks(); // Re-renderiza a lista de tarefas
        if (patternsModified) renderRecurringTaskPatterns();
        saveState();
        updateTasksChartDataOnly(); // Atualiza o gráfico de tarefas se necessário
    }
}




// --- Funções de Temas e Aparência ---
function openThemesModal() {
    const modal = document.getElementById('themes-modal');
    const overlay = document.getElementById('themes-modal-overlay');
    if (modal && overlay) {
        populateThemesModal();
        overlay.classList.add('show');
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

function closeThemesModal() {
    const modal = document.getElementById('themes-modal');
    const overlay = document.getElementById('themes-modal-overlay');
    if (modal && overlay) {
        modal.classList.remove('show');
        overlay.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

function populateThemesModal() {
    const paletteContainer = document.getElementById('palette-buttons-container');
    const modeContainer = document.getElementById('mode-buttons-container');
    if (!paletteContainer || !modeContainer) return;

    paletteContainer.innerHTML = '';
    Object.keys(PREDEFINED_PALETTES).forEach(key => {
        const palette = PREDEFINED_PALETTES[key];
        const btn = document.createElement('button');
        btn.className = 'palette-btn';
        btn.style.backgroundColor = palette.primary;
        btn.dataset.paletteKey = key;
        btn.setAttribute('aria-label', palette.name);
        const checkIcon = document.createElement('i');
        checkIcon.className = 'bi bi-check-lg active-check';
        btn.appendChild(checkIcon);
        if (key === state.visuals.currentPalette) btn.classList.add('active');
        btn.addEventListener('click', () => applyPalette(key));
        paletteContainer.appendChild(btn);
    });

    modeContainer.innerHTML = '';
    Object.keys(VISUAL_MODES).forEach(key => {
        const mode = VISUAL_MODES[key];
        const btn = document.createElement('button');
        btn.className = 'mode-btn';
        btn.dataset.modeKey = key;
        const iconEl = document.createElement('i');
        iconEl.className = `bi ${mode.icon} mode-icon`;
        const titleEl = document.createElement('span');
        titleEl.className = 'mode-title';
        titleEl.textContent = mode.name;
        const subtitleEl = document.createElement('span');
        subtitleEl.className = 'mode-subtitle';
        subtitleEl.textContent = mode.subtitle;
        const activeDot = document.createElement('span');
        activeDot.className = 'active-dot';
        btn.appendChild(iconEl);
        btn.appendChild(titleEl);
        btn.appendChild(subtitleEl);
        btn.appendChild(activeDot);
        if (key === state.visuals.currentVisualMode) btn.classList.add('active');
        btn.addEventListener('click', () => applyVisualMode(key));
        modeContainer.appendChild(btn);
    });
    updateThemeModalButtons();
}

function updateThemeModalButtons() {
    const paletteBtns = document.querySelectorAll('.palette-btn');
    if (paletteBtns) {
        paletteBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.paletteKey === state.visuals.currentPalette);
        });
    }
    const modeBtns = document.querySelectorAll('.mode-btn');
    if (modeBtns) {
        modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.modeKey === state.visuals.currentVisualMode);
        });
    }
}

function applyPalette(paletteName) {
    if (PREDEFINED_PALETTES[paletteName]) {
        const newPrimaryColor = PREDEFINED_PALETTES[paletteName].primary;
        state.visuals.currentPalette = paletteName;
        applyPrimaryColor(newPrimaryColor);
        applyCurrentThemeAndMode();
        saveState();
        updateThemeModalButtons();
    }
}

function applyVisualMode(modeName) {
    if (VISUAL_MODES[modeName]) {
        state.visuals.currentVisualMode = modeName;
        applyCurrentThemeAndMode();
        saveState();
        updateThemeModalButtons();
    }
}

function initThemes() {
    const themesModalOverlay = document.getElementById('themes-modal-overlay');
    if (themesModalOverlay) themesModalOverlay.addEventListener('click', closeThemesModal);
    applyCurrentThemeAndMode();
}

// --- Custom Alert System ---
function showCustomAlert(message, title = 'Alerta', onConfirmCallback = null) {
    const alertOverlay = document.getElementById('custom-alert-overlay');
    const alertModal = document.getElementById('custom-alert-modal');
    const alertTitleEl = document.getElementById('custom-alert-title');
    const alertMessageEl = document.getElementById('custom-alert-message');
    let alertOkBtn = document.getElementById('custom-alert-ok-btn');

    if (!alertOverlay || !alertModal || !alertTitleEl || !alertMessageEl || !alertOkBtn) {
        console.error("Elementos do modal de alerta personalizado não encontrados. Usando alert padrão.");
        alert(`${title}: ${message}`);
        if (onConfirmCallback && typeof onConfirmCallback === 'function') onConfirmCallback();
        return;
    }

    alertTitleEl.textContent = title;
    alertMessageEl.innerHTML = message.replace(/\n/g, '<br>');

    const newOkBtn = alertOkBtn.cloneNode(true);
    alertOkBtn.parentNode.replaceChild(newOkBtn, alertOkBtn);
    alertOkBtn = newOkBtn;

    const closeAlert = () => {
        alertModal.classList.remove('show');
        alertOverlay.classList.remove('show');
        alertOkBtn.removeEventListener('click', closeAlert);
        alertOverlay.removeEventListener('click', closeAlertOnOverlay);
        if (onConfirmCallback && typeof onConfirmCallback === 'function') {
            onConfirmCallback();
        }
    };

    const closeAlertOnOverlay = (event) => {
        if (event.target === alertOverlay) {
            closeAlert();
        }
    };

    alertOkBtn.addEventListener('click', closeAlert);
    alertOverlay.addEventListener('click', closeAlertOnOverlay);

    alertOverlay.classList.add('show');
    alertModal.classList.add('show');
    alertOkBtn.focus();
}
window.showCustomAlert = showCustomAlert;

// --- Modal do Guia de Boas-Vindas ---
function openWelcomeGuideModal() {
    const modal = document.getElementById('welcome-guide-modal');
    const overlay = document.getElementById('welcome-guide-modal-overlay');
    if (modal && overlay) {
        const checkbox = document.getElementById('dont-show-guide-again-checkbox');
        if (checkbox) checkbox.checked = false;
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
function openConfirmResetModal() {
    closeGoalsModal();
    const modal = document.getElementById('confirm-reset-modal');
    const overlay = document.getElementById('confirm-reset-modal-overlay');
    if (modal && overlay) {
        overlay.classList.add('show');
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

function closeConfirmResetModal() {
    const modal = document.getElementById('confirm-reset-modal');
    const overlay = document.getElementById('confirm-reset-modal-overlay');
    if (modal && overlay) {
        modal.classList.remove('show');
        overlay.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

function performFullReset() {
    localStorage.removeItem('taskify-state');
    localStorage.removeItem('taskify-theme');
    localStorage.removeItem('taskify-primary-color');
    localStorage.removeItem('taskify-streak');
    localStorage.removeItem('taskify-welcomeGuideDismissed');
    localStorage.removeItem('taskify-palette');
    localStorage.removeItem('taskify-visual-mode');
    location.reload();
}

function handleResetAppData() {
    openConfirmResetModal();
}

function updateFooterYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
}

// --- Scroll Indicator Logic ---
function updateScrollIndicator() {
    const scrollIndicator = document.getElementById('scroll-indicator');
    const productivityArea = document.querySelector('.productivity-focus-area');
    if (!scrollIndicator || !productivityArea) return;

    if (window.innerWidth < 769) {
        scrollIndicator.classList.remove('visible');
        scrollIndicator.classList.add('collapsed');
        productivityArea.classList.add('visible');
        return;
    }

    const statsGrid = document.querySelector('.stats-grid');
    const bottomCards = document.querySelector('.bottom-cards');
    const activitySection = document.querySelector('.activity-section');
    let firstPageContentHeight = 0;
    if (statsGrid) firstPageContentHeight += statsGrid.offsetHeight + parseInt(getComputedStyle(statsGrid).marginBottom || '0');
    if (bottomCards) firstPageContentHeight += bottomCards.offsetHeight + parseInt(getComputedStyle(bottomCards).marginBottom || '0');
    if (activitySection) firstPageContentHeight += activitySection.offsetHeight + parseInt(getComputedStyle(activitySection).marginBottom || '0');

    const hasSecondPageContent = productivityArea.offsetHeight > 50;
    const contentEntryThreshold = firstPageContentHeight * 0.20;
    const indicatorHideThreshold = firstPageContentHeight * 0.60;

    if (hasSecondPageContent && document.documentElement.scrollHeight > (window.innerHeight + 50)) {
        if (window.scrollY < indicatorHideThreshold) {
            scrollIndicator.classList.add('visible');
            scrollIndicator.classList.remove('collapsed');
        } else {
            scrollIndicator.classList.remove('visible');
            scrollIndicator.classList.add('collapsed');
        }
        if (window.scrollY > contentEntryThreshold) {
            productivityArea.classList.add('visible');
        } else {
            productivityArea.classList.remove('visible');
        }

    } else {
        scrollIndicator.classList.remove('visible');
        scrollIndicator.classList.add('collapsed');
        productivityArea.classList.add('visible');
    }
}

window.addEventListener('scroll', updateScrollIndicator, { passive: true });
window.addEventListener('resize', updateScrollIndicator);


// Inicialização Principal
async function init() {
    const loaderElement = document.getElementById('loader');
    if (loaderElement) loaderElement.style.display = 'flex';

    loadState();

    initThemes();
    checkAllResets();
    initStreak();
    initPomodoro();
    initTasks();

    const recurringTaskForm = document.getElementById('recurring-task-form');
    if (recurringTaskForm) recurringTaskForm.addEventListener('submit', saveRecurringTaskPattern);

    const recurringTaskModalOverlay = document.getElementById('recurring-task-modal-overlay');
    if (recurringTaskModalOverlay) {
        recurringTaskModalOverlay.addEventListener('click', (e) => {
            if (e.target === recurringTaskModalOverlay) closeRecurringTaskPatternModal();
        });
    }
    const recurringTaskModalCloseBtn = document.querySelector('#recurring-task-modal .modal-close-btn');
    if (recurringTaskModalCloseBtn) recurringTaskModalCloseBtn.addEventListener('click', closeRecurringTaskPatternModal);

    setupRecurringDaysCheckboxes();

    document.querySelectorAll('input[name="delete-recurring-option"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateDeleteRecurringTaskModalUI(e.target.value);
            document.querySelectorAll('.delete-option-card').forEach(card => {
                card.classList.remove('selected');
            });
            if (e.target.checked) {
                e.target.closest('.delete-option-card').classList.add('selected');
            }
        });
    });
    const btnConfirmDeleteRecurringAction = document.getElementById('btn-confirm-delete-recurring-action');
    if (btnConfirmDeleteRecurringAction) btnConfirmDeleteRecurringAction.addEventListener('click', () => confirmDeleteRecurringTask());

    const btnCancelDeleteRecurring = document.getElementById('btn-cancel-delete-recurring');
    if (btnCancelDeleteRecurring) btnCancelDeleteRecurring.addEventListener('click', closeDeleteRecurringTaskModal);
    const deleteRecurringModalOverlay = document.getElementById('delete-recurring-task-modal-overlay');
    if (deleteRecurringModalOverlay) {
        deleteRecurringModalOverlay.addEventListener('click', (e) => {
            if (e.target === deleteRecurringModalOverlay) closeDeleteRecurringTaskModal();
        });
    }
    const deleteRecurringModalCloseBtn = document.querySelector('#delete-recurring-task-modal .modal-close-btn');
    if (deleteRecurringModalCloseBtn) deleteRecurringModalCloseBtn.addEventListener('click', closeDeleteRecurringTaskModal);


    renderRecurringTaskPatterns();
    generateRecurringTaskInstances();

    await loadAndSetupRetrospective();

    updateFooterYear();

    if (weeklyChartInstance) weeklyChartInstance.destroy();
    setupChart(true);
    if (pomodoroChartInstance) pomodoroChartInstance.destroy();
    setupPomodoroChart(true);
    if (tasksChartInstance) tasksChartInstance.destroy();
    setupTasksChart(true);

    updateUI();

    const goalsForm = document.getElementById('goals-form');
    if (goalsForm) goalsForm.addEventListener('submit', (e) => { e.preventDefault(); saveGoals(); });
    const goalsOverlay = document.getElementById('goals-modal-overlay');
    if (goalsOverlay) goalsOverlay.addEventListener('click', closeGoalsModal);

    const btnResetAppData = document.getElementById('btn-reset-app-data');
    if (btnResetAppData) btnResetAppData.addEventListener('click', handleResetAppData);

    const confirmResetModalOverlay = document.getElementById('confirm-reset-modal-overlay');
    if (confirmResetModalOverlay) confirmResetModalOverlay.addEventListener('click', closeConfirmResetModal);
    const confirmResetModalCloseBtn = document.getElementById('confirm-reset-modal-close-btn');
    if (confirmResetModalCloseBtn) confirmResetModalCloseBtn.addEventListener('click', closeConfirmResetModal);
    const btnCancelResetConfirmation = document.getElementById('btn-cancel-reset-confirmation');
    if (btnCancelResetConfirmation) btnCancelResetConfirmation.addEventListener('click', closeConfirmResetModal);
    const btnConfirmResetAction = document.getElementById('btn-confirm-reset-action');
    if (btnConfirmResetAction) btnConfirmResetAction.addEventListener('click', performFullReset);

    const welcomeGuideModalOverlay = document.getElementById('welcome-guide-modal-overlay');
    if (welcomeGuideModalOverlay) welcomeGuideModalOverlay.addEventListener('click', closeWelcomeGuideModal);
    const welcomeGuideModalCloseBtn = document.getElementById('welcome-guide-modal-close-btn');
    if (welcomeGuideModalCloseBtn) welcomeGuideModalCloseBtn.addEventListener('click', closeWelcomeGuideModal);
    const btnCloseWelcomeGuide = document.getElementById('btn-close-welcome-guide');
    if (btnCloseWelcomeGuide) btnCloseWelcomeGuide.addEventListener('click', closeWelcomeGuideModal);

    if (localStorage.getItem('taskify-welcomeGuideDismissed') !== 'true') {
        openWelcomeGuideModal();
    }

    setInterval(() => {
        checkAllResets();
        const prevTaskCount = state.tasks.filter(t => !(t.deletedThisInstanceOfDay && t.assignedDate === getTodayISO()) && (t.isRecurringInstance ? t.assignedDate === getTodayISO() : true)).length;
        generateRecurringTaskInstances();
        const currentTaskCount = state.tasks.filter(t => !(t.deletedThisInstanceOfDay && t.assignedDate === getTodayISO()) && (t.isRecurringInstance ? t.assignedDate === getTodayISO() : true)).length;

        if (state.lastAccessDate !== new Date().toDateString() || prevTaskCount !== currentTaskCount) {
            renderTasks();
            saveState();
        }
    }, 60 * 1000);


    window.taskifyStateReady = true;
    document.dispatchEvent(new CustomEvent('taskifyStateReady', {
        detail: { taskifyAppState: JSON.parse(JSON.stringify(window.state || {})) }
    }));

    setTimeout(() => {
        if (loaderElement) {
            loaderElement.style.opacity = '0';
            setTimeout(() => {
                loaderElement.style.display = 'none';
            }, 500);
        }
    }, 250);
}

document.addEventListener('DOMContentLoaded', async () => {
    await init();
});

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
            this.x = x; this.y = y; this.size = Math.random() * 4 + 1.5;
            this.baseSize = this.size; this.color = color;
            this.speedX = Math.random() * 2 - 1;
            this.speedY = Math.random() * 2 - 1;
            this.life = Math.random() * 60 + 30;
            this.initialLife = this.life;
        }
        update() {
            this.x += this.speedX; this.y += this.speedY; this.life--;
            if (this.life > 0) this.size = this.baseSize * (this.life / this.initialLife);
            if (this.size < 0.1) this.size = 0;
        }
        draw() {
            if (this.size > 0) {
                ctx.fillStyle = this.color;
                ctx.globalAlpha = Math.max(0, this.life / this.initialLife * 0.7);
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
            }
        }
    }

    function handleParticles(timestamp) {
        const isMouseInsideWindow = currentMouseX >= 0 && currentMouseX <= window.innerWidth &&
            currentMouseY >= 0 && currentMouseY <= window.innerHeight;

        let particleEnabled = true;
        if (typeof state !== 'undefined' && state.visuals && state.visuals.currentVisualMode === 'focus') {
            particleEnabled = false;
        }

        if (particleEnabled && isMouseInsideWindow && timestamp - lastParticleTime > particleCooldown) {
            let primaryColor = '#0A7CFF';
            try {
                if (typeof state !== 'undefined' && state.isDarkMode !== undefined) {
                    primaryColor = getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim();
                } else {
                    primaryColor = localStorage.getItem('taskify-primary-color') || '#0A7CFF';
                }
            } catch (e) { console.warn("Erro ao obter cor primária para partículas:", e); }

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
                particlesArray.splice(i, 1); i--;
            }
        }
    }

    function animateParticles(timestamp) {
        ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        handleParticles(timestamp);
        for (let i = 0; i < particlesArray.length; i++) particlesArray[i].draw();
        requestAnimationFrame(animateParticles);
    }
    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
        setupParticleListeners(); requestAnimationFrame(animateParticles);
    } else {
        document.addEventListener('DOMContentLoaded', () => {
            setupParticleListeners(); requestAnimationFrame(animateParticles);
        });
    }
} else {
    console.warn("Elemento #particle-canvas não encontrado. Animação de partículas desabilitada.");
}


// --- Carregamento e Configuração da Retrospectiva ---
async function loadAndSetupRetrospective() {
    retrospectiveModalEl = document.getElementById('retrospective-modal');
    retrospectiveModalOverlayEl = document.getElementById('retrospective-modal-overlay');
    const btnOpenRetrospectiveMain = document.getElementById('btn-open-retrospective');

    if (!retrospectiveModalEl || !retrospectiveModalOverlayEl || !btnOpenRetrospectiveMain) {
        console.error('TASKIFY_MAIN: Elementos base da retrospectiva não encontrados. A retrospectiva pode não funcionar.');
        if (btnOpenRetrospectiveMain) btnOpenRetrospectiveMain.style.display = 'none';
        return;
    }

    btnOpenRetrospectiveMain.addEventListener('click', () => {
        if (typeof window.openRetrospectiveView === 'function') {
            window.openRetrospectiveView();
        } else {
            console.error("TASKIFY_MAIN: Função window.openRetrospectiveView() não está definida.");
        }
    });

    retrospectiveModalOverlayEl.addEventListener('click', (event) => {
        if (event.target === retrospectiveModalOverlayEl) {
            if (typeof window.closeRetrospectiveView === 'function') {
                window.closeRetrospectiveView();
            }
        }
    });

    if (!retrospectiveModalEl.querySelector('.retrospective-screen')) {
        try {
            const response = await fetch('retrospective.html');
            if (!response.ok) {
                throw new Error(`Falha ao carregar retrospective.html: ${response.status} ${response.statusText}`);
            }
            const htmlContent = await response.text();
            retrospectiveModalEl.innerHTML = htmlContent;

            if (typeof window.initializeRetrospectiveInternals === 'function') {
                window.initializeRetrospectiveInternals();
            } else {
                console.error("TASKIFY_MAIN: Função window.initializeRetrospectiveInternals() não definida após carregar HTML.");
            }
        } catch (error) {
            console.error('TASKIFY_MAIN: Falha ao carregar e configurar retrospective.html:', error);
            const alertFn = typeof window.showCustomAlert === 'function' ? window.showCustomAlert : alert;
            alertFn('Erro crítico ao carregar a retrospectiva. Verifique o console.', 'Erro');
            btnOpenRetrospectiveMain.style.display = 'none';
        }
    } else {
        if (typeof window.initializeRetrospectiveInternals === 'function') {
            window.initializeRetrospectiveInternals();
        } else {
            console.error("TASKIFY_MAIN: Função window.initializeRetrospectiveInternals() não definida (HTML já presente).");
        }
    }
}
