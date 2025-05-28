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


window.showCustomAlert = showCustomAlert; 

window.taskifyStateReady = false; 

// Constantes de Temas e Paletas
const PREDEFINED_PALETTES = {
    electricBlue: { name: 'Azul Elétrico', primary: '#0A7CFF' },
    emeraldGreen: { name: 'Verde Esmeralda', primary: '#00DB4D' },
    fieryRed: { name: 'Vermelho Ígneo', primary: '#D51818' },
    royalPurple: { name: 'Roxo Real', primary: '#852DD8' },
    sunnyOrange: { name: 'Laranja Solar', primary: '#FF8C00' } // Alterado para Laranja Solar
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
    visuals: {
        currentPalette: 'electricBlue',
        currentVisualMode: 'default'
    }
};

let state = JSON.parse(JSON.stringify(initialDefaultState));
window.state = state; // Tornando o estado globalmente acessível

// Funções Utilitárias de Data, Cor e Formatação
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
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
    const rgbArray = hexToRgbArray(primaryColorToApply); // Usando a função global
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
                    assignedDate: task.assignedDate || null
                   }))
                : [...initialDefaultState.tasks],
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

    window.state = state; // Atualiza o estado global
}

function saveState() {
    try {
        const stateToSave = { ...state };
        // delete stateToSave.currentStreak; // Comentado, pois currentStreak é usado na retrospectiva

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

        const shiftArray = (arr) => {
            if (arr && Array.isArray(arr) && arr.length === 7) {
                arr.shift();
                arr.push(0);
            } else {
                return [0,0,0,0,0,0,0];
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
            state.pomodoro.sessions.forEach(session => {
                if (session.type === 'focus' && new Date(session.startTime).toISOString().split('T')[0] === dateToCheckISO) {
                    focusForThisDay += Math.round((session.duration || 0) / 60);
                }
            });
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

    document.getElementById('daily-goal-input').value = state.goals.daily;
    document.getElementById('weekly-goal-input').value = state.goals.weekly;
    document.getElementById('monthly-goal-input').value = state.goals.monthly;
    document.getElementById('yearly-goal-input').value = state.goals.yearly;
    document.getElementById('streak-goal-input').value = state.goals.streak;

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

    if(state.weeklyActivityData && state.weeklyActivityData.length === 7) {
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

        if(state.weeklyActivityData && state.weeklyActivityData.length === 7) {
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
        lastValid.setHours(0,0,0,0);
        todayDateObj.setHours(0,0,0,0);
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
            if (streakData.history[yesterdayISO] && Number(streakData.history[yesterdayISO]) >= state.goals.daily) {
                 streakData.lastValidDate = yesterdayISO;
            } else {
                 streakData.lastValidDate = yesterdayISO; // Mantém o dia anterior como válido mesmo que não tenha batido a meta, para recalcular o streak se necessário.
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
    const streakGoal = parseInt(document.getElementById('streak-goal-input').value);

    if (isNaN(daily) || daily < 1 || isNaN(weekly) || weekly < 1 || isNaN(monthly) || monthly < 1 || isNaN(yearly) || yearly < 1 || isNaN(streakGoal) || streakGoal < 1) {
        showCustomAlert("Todas as metas devem ser números positivos.", "Erro de Validação"); return;
    }
    state.goals = { daily, weekly, monthly, yearly, streak: streakGoal };
    saveState();
    updateUI();
    updateStreak(); // Atualiza o streak caso a meta diária tenha mudado
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
    applyCurrentThemeAndMode(); // Reaplicar tema e modo para atualizar cores dependentes
}

function applyCurrentThemeAndMode() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const faviconEl = document.getElementById('favicon');
    const docElement = document.documentElement;

    // Limpa classes de modo visual anteriores
    Object.keys(VISUAL_MODES).forEach(modeKey => {
        body.classList.remove(`theme-mode-${modeKey}`);
    });

    // Aplica o modo visual atual
    if (state.visuals.currentVisualMode && state.visuals.currentVisualMode !== 'default') {
        body.classList.add(`theme-mode-${state.visuals.currentVisualMode}`);
    }

    docElement.classList.toggle('light-theme-active', !state.isDarkMode);
    body.classList.toggle('light', !state.isDarkMode);

    if (themeIcon) {
        themeIcon.className = state.isDarkMode ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    }

    // Favicon dinâmico
    let currentPrimaryColor = PREDEFINED_PALETTES.electricBlue.primary; // Cor padrão de fallback
    if (state.visuals.currentPalette === 'custom') {
        currentPrimaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color-dark').trim() || PREDEFINED_PALETTES.electricBlue.primary;
    } else if (PREDEFINED_PALETTES[state.visuals.currentPalette]) {
        currentPrimaryColor = PREDEFINED_PALETTES[state.visuals.currentPalette].primary;
    }

    if (faviconEl) {
        faviconEl.href = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='${encodeURIComponent(currentPrimaryColor)}' class='bi bi-check2-square' viewBox='0 0 16 16'><path d='M3 14.5A1.5 1.5 0 0 1 1.5 13V3A1.5 1.5 0 0 1 3 1.5h8A1.5 1.5 0 0 1 12.5 3v1.5a.5.5 0 0 1-1 0V3a.5.5 0 0 0-.5-.5H3a.5.5 0 0 0-.5.5v10a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 1 0 1H3z'/><path d='m8.354 10.354 7-7a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0z'/></svg>`;
    }

    // Recria gráficos para aplicar novas cores de tema/primária
    if (weeklyChartInstance) weeklyChartInstance.destroy();
    setupChart(false); // Não animar na troca de tema
    if (pomodoroChartInstance) pomodoroChartInstance.destroy();
    setupPomodoroChart(false);
    if (tasksChartInstance) tasksChartInstance.destroy();
    setupTasksChart(false);

    updatePomodoroUI();
    renderTasks(); // Re-renderiza tarefas para aplicar estilos de tema (ex: cores de checkbox)
    updateThemeModalButtons(); // Atualiza estado visual dos botões no modal de temas
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
                pointBorderColor: bodyBgColor, // Cor de fundo do body para o anel do ponto
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
            animation: { duration: 0 }, // Desabilita animação inicial por padrão, controla via parâmetro
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor, drawBorder: false },
                    ticks: { color: textColor, precision: 0, callback: dataFormatter },
                    title: { display: true, text: yAxisLabel, color: textColor, font: { size: 10 } },
                    afterDataLimits: (axis) => { // Garante que o eixo Y não fique achatado se todos os valores forem 0
                        if (axis.max === 0 && axis.min === 0) {
                            axis.max = (yAxisLabel.toLowerCase().includes("minutos")) ? 10 : 1;
                        }
                    }
                },
                x: {
                    grid: { display: false }, // Remove grade vertical
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
                        title: (items) => items[0].label, // Mostra o dia da semana como título
                        label: (item) => `${tooltipLabelPrefix}: ${dataFormatter(item.raw)}`
                    }
                }
            },
            interaction: { mode: 'index', intersect: false }, // Tooltip aparece ao passar perto do ponto
            hover: { mode: 'nearest', intersect: true }
        }
    });
}

// Funções específicas de setup de gráficos
function setupChart(animateInitialRender = true) {
    if (weeklyChartInstance) weeklyChartInstance.destroy();
    const data = (window.state && Array.isArray(window.state.weeklyActivityData) && window.state.weeklyActivityData.length === 7)
                ? window.state.weeklyActivityData
                : [0,0,0,0,0,0,0]; // Fallback seguro

    weeklyChartInstance = createChartConfig('weeklyActivityChart', data, 'Questões', 'Nº de Questões', 'Questões');
    if(weeklyChartInstance) weeklyChartInstance.options.animation.duration = animateInitialRender ? 800 : 0;
}
function updateWeeklyChartDataOnly() {
    if (!window.state || !Array.isArray(window.state.weeklyActivityData) || window.state.weeklyActivityData.length !== 7) {
        console.warn("TASKIFY_CHART: weeklyActivityData inválido ou ausente. Recriando gráfico.");
        setupChart(false); // Recria sem animação
        return;
    }
    if (weeklyChartInstance) {
        weeklyChartInstance.data.datasets[0].data = [...window.state.weeklyActivityData];
        weeklyChartInstance.update('none'); // Atualiza sem animação
    } else {
        setupChart(false); // Se não existe, cria sem animação
    }
}

function setupPomodoroChart(animateInitialRender = true) {
    if (pomodoroChartInstance) pomodoroChartInstance.destroy();
     const data = (state.pomodoro && Array.isArray(state.pomodoro.dailyFocusData) && state.pomodoro.dailyFocusData.length === 7)
                ? state.pomodoro.dailyFocusData
                : [0,0,0,0,0,0,0];
    pomodoroChartInstance = createChartConfig(
        'weeklyPomodoroFocusChart', data, 'Tempo de Foco', 'Minutos de Foco', 'Foco',
        (value) => value.toFixed(0) + ' min' // Formata para mostrar 'X min'
    );
    if(pomodoroChartInstance) pomodoroChartInstance.options.animation.duration = animateInitialRender ? 800 : 0;
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
                : [0,0,0,0,0,0,0];
    tasksChartInstance = createChartConfig('weeklyTasksCompletedChart', data, 'Tarefas Concluídas', 'Nº de Tarefas', 'Tarefas');
    if(tasksChartInstance) tasksChartInstance.options.animation.duration = animateInitialRender ? 800 : 0;
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
                // Dados inválidos, remove para começar do zero na próxima vez
                localStorage.removeItem('taskify-streak');
            }
        } catch (e) {
            console.error("Error parsing streak data in initStreak:", e);
            localStorage.removeItem('taskify-streak'); // Remove dados corrompidos
        }
    }

    state.currentStreak.days = initialStreakDays;
    state.currentStreak.lastCompletionDate = initialLastCompletionDate;
    state.currentStreak.history = initialHistory;

    // Garante que os dados de streak no localStorage estão sincronizados com o estado inicial
    const currentStreakDataToStore = {
        current: state.currentStreak.days,
        lastValidDate: state.currentStreak.lastCompletionDate,
        history: state.currentStreak.history
    };
    localStorage.setItem('taskify-streak', JSON.stringify(currentStreakDataToStore));

    updateStreak(); // Verifica e atualiza o streak baseado nos dados carregados e na data atual
    updateStreakUI(); // Atualiza a interface
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

        // Aplica classe 'break-mode' para estilização condicional
        if (pomodoro.mode === 'focus') {
            startBtn.classList.remove('break-mode');
            if(timerDisplay) timerDisplay.classList.remove('break-mode');
        } else {
            startBtn.classList.add('break-mode');
            if(timerDisplay) timerDisplay.classList.add('break-mode');
        }

        // Altera texto do botão Iniciar/Continuar
        if (!pomodoro.timerRunning) {
            const isAtFullDurationForCurrentMode = pomodoro.currentTime ===
                (pomodoro.mode === 'focus' ? pomodoro.focusDuration :
                (pomodoro.mode === 'shortBreak' ? pomodoro.shortBreakDuration :
                 pomodoro.longBreakDuration));
            startBtn.textContent = isAtFullDurationForCurrentMode ? 'Iniciar' : 'Continuar';
        }
    }

    // Atualiza título da página
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
        soundElement.currentTime = 0; // Reinicia o áudio caso já esteja tocando
        console.log(`TASKIFY_SOUND: Tentando tocar: ${soundElement.id}`);
        soundElement.play()
            .then(() => {
                console.log(`TASKIFY_SOUND: Som ${soundElement.id} tocado com sucesso.`);
            })
            .catch(error => {
                // Erros de autoplay são comuns, especialmente antes da interação do usuário
                console.warn(`TASKIFY_SOUND: Erro ao tocar som ${soundElement.id}:`, error);
            });
    } else {
        console.warn(`playSound: ${soundElement.id} não tem uma função play.`);
    }
}

function handlePomodoroTick() {
    if (!state.pomodoro.timerRunning) return;

    state.pomodoro.currentTime--;

    if (state.pomodoro.currentTime < 0) {
        console.log("TASKIFY_POMO: Fim do ciclo detectado em handlePomodoroTick.");
        handlePomodoroCycleEnd();
    } else {
        updatePomodoroUI();
    }
}

function handlePomodoroCycleEnd() {
    console.log("TASKIFY_POMO: handlePomodoroCycleEnd iniciado. Modo encerrado:", state.pomodoro.mode);
    const endedMode = state.pomodoro.mode;
    let actualDurationSeconds = 0;

    // Calcula a duração real do ciclo que acabou de terminar
    if (endedMode === 'focus') {
        actualDurationSeconds = state.pomodoro.focusDuration - (state.pomodoro.currentTime < 0 ? -1 : state.pomodoro.currentTime); // Se currentTime ficou negativo, significa que o ciclo completou.
    } else if (endedMode === 'shortBreak') {
        actualDurationSeconds = state.pomodoro.shortBreakDuration - (state.pomodoro.currentTime < 0 ? -1 : state.pomodoro.currentTime);
    } else { // longBreak
        actualDurationSeconds = state.pomodoro.longBreakDuration - (state.pomodoro.currentTime < 0 ? -1 : state.pomodoro.currentTime);
    }
    actualDurationSeconds = Math.max(0, actualDurationSeconds); // Garante que não seja negativo
    console.log(`TASKIFY_POMO: Duração real do ciclo de ${endedMode}: ${actualDurationSeconds}s`);


    // Loga a sessão e atualiza dados do gráfico apenas se foi um ciclo de foco e teve duração
    if (endedMode === 'focus' && actualDurationSeconds > 0) {
        if(state.pomodoro.dailyFocusData && state.pomodoro.dailyFocusData.length === 7) {
            state.pomodoro.dailyFocusData[6] += Math.round(actualDurationSeconds / 60); // Adiciona minutos ao dia atual no gráfico
            console.log("TASKIFY_POMO: dailyFocusData[6] atualizado para:", state.pomodoro.dailyFocusData[6]);
        }
        logPomodoroSession(endedMode, actualDurationSeconds);
        updatePomodoroChartDataOnly(); // Atualiza o gráfico de foco
    }

    state.pomodoro.timerRunning = false;
    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
        console.log("TASKIFY_POMO: Timer parado e intervalo limpo em handlePomodoroCycleEnd.");
    }

    let nextModeMessage = "";

    if (endedMode === 'focus') {
        state.pomodoro.totalPomodorosToday++;
        state.pomodoro.currentCycleInSet++;
        console.log("TASKIFY_POMO: Ciclo de foco terminado. Total hoje:", state.pomodoro.totalPomodorosToday, "Ciclo no set:", state.pomodoro.currentCycleInSet);
        if (state.pomodoro.enableSound && focusEndSound) {
            console.log("TASKIFY_POMO: Tentando tocar focusEndSound.");
            playSound(focusEndSound);
        }
        if (state.pomodoro.currentCycleInSet >= state.pomodoro.cyclesBeforeLongBreak) {
            state.pomodoro.mode = 'longBreak';
            state.pomodoro.currentTime = state.pomodoro.longBreakDuration;
            state.pomodoro.currentCycleInSet = 0; // Reseta o contador de ciclos para a pausa longa
            nextModeMessage = "Hora da pausa longa!";
            console.log("TASKIFY_POMO: Próximo modo: longBreak");
        } else {
            state.pomodoro.mode = 'shortBreak';
            state.pomodoro.currentTime = state.pomodoro.shortBreakDuration;
            nextModeMessage = "Hora da pausa curta!";
            console.log("TASKIFY_POMO: Próximo modo: shortBreak");
        }
    } else { // Pausa (curta ou longa) terminou
        console.log("TASKIFY_POMO: Ciclo de pausa terminado.");
        if (state.pomodoro.enableSound && breakEndSound) {
            console.log("TASKIFY_POMO: Tentando tocar breakEndSound.");
            playSound(breakEndSound);
        }
        state.pomodoro.mode = 'focus';
        state.pomodoro.currentTime = state.pomodoro.focusDuration;
        nextModeMessage = "Hora de focar!";
        console.log("TASKIFY_POMO: Próximo modo: focus");
    }
    state.pomodoro.lastModeEnded = endedMode; // Guarda qual modo acabou de terminar

    updatePomodoroUI();
    saveState();

    // Alerta para o usuário sobre a mudança de ciclo
    showCustomAlert(
        `Ciclo de ${endedMode === 'focus' ? 'Foco' : (endedMode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa')} terminado! ${nextModeMessage}`,
        "Pomodoro",
        () => { // Callback após o usuário fechar o alerta
            console.log("TASKIFY_POMO: Callback do alerta executado.");
            // Foca na seção do Pomodoro
            const pomodoroSectionEl = document.querySelector('.pomodoro-section');
            if(pomodoroSectionEl) {
                // Pequeno delay para garantir que o alerta não interfira no scroll
                setTimeout(() => {
                    pomodoroSectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }

            // Lógica de início automático do próximo ciclo
            const currentEndedMode = state.pomodoro.lastModeEnded; // Pega o modo que acabou de terminar
            if ((currentEndedMode === 'focus' && state.pomodoro.autoStartBreaks) ||
                ((currentEndedMode === 'shortBreak' || currentEndedMode === 'longBreak') && state.pomodoro.autoStartFocus)) {
                console.log("TASKIFY_POMO: Iniciando próximo ciclo automaticamente após alerta.");
                startPomodoro();
            } else {
                console.log("TASKIFY_POMO: Não iniciando próximo ciclo automaticamente após alerta. lastModeEnded:", currentEndedMode, "autoStartBreaks:", state.pomodoro.autoStartBreaks, "autoStartFocus:", state.pomodoro.autoStartFocus);
            }
        }
    );
}


function startPomodoro() {
    console.log("TASKIFY_POMO: startPomodoro chamado. Timer rodando?", state.pomodoro.timerRunning);
    if (state.pomodoro.timerRunning) {
        console.log("TASKIFY_POMO: Timer já rodando, retornando.");
        return;
    }
    checkAllResets(); // Garante que os contadores diários estejam corretos
    state.pomodoro.timerRunning = true;
    state.pomodoro.lastModeEnded = null; // Limpa o último modo terminado ao iniciar um novo

    // Limpa qualquer intervalo anterior para evitar múltiplos timers
    if (pomodoroInterval) {
        console.log("TASKIFY_POMO: Limpando intervalo existente em startPomodoro. ID:", pomodoroInterval);
        clearInterval(pomodoroInterval);
    }
    pomodoroInterval = setInterval(handlePomodoroTick, 1000);
    console.log("TASKIFY_POMO: Novo intervalo definido. ID:", pomodoroInterval);

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
    const endedMode = state.pomodoro.mode; // Modo atual ANTES do reset
    const timeRemaining = state.pomodoro.currentTime;

    // Se estava rodando e era um ciclo de foco, loga o tempo focado
    if (wasRunning && endedMode === 'focus') {
        let timeSpentSeconds = 0;
        // Calcula o tempo que passou no ciclo de foco atual
        if(state.pomodoro.mode === 'focus') timeSpentSeconds = state.pomodoro.focusDuration - timeRemaining;
        
        if (timeSpentSeconds > 0) {
            if(state.pomodoro.dailyFocusData && state.pomodoro.dailyFocusData.length === 7) {
                state.pomodoro.dailyFocusData[6] += Math.round(timeSpentSeconds / 60);
            }
            logPomodoroSession(endedMode, timeSpentSeconds);
        }
    }

    // Para o timer
    state.pomodoro.timerRunning = false;
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
    state.pomodoro.lastModeEnded = null; // Reseta o último modo terminado

    // Reseta o tempo para a duração total do modo atual (antes de qualquer mudança pelo término do ciclo)
    if (state.pomodoro.mode === 'focus') state.pomodoro.currentTime = state.pomodoro.focusDuration;
    else if (state.pomodoro.mode === 'shortBreak') state.pomodoro.currentTime = state.pomodoro.shortBreakDuration;
    else if (state.pomodoro.mode === 'longBreak') state.pomodoro.currentTime = state.pomodoro.longBreakDuration;

    updatePomodoroUI();
    updatePomodoroChartDataOnly(); // Atualiza o gráfico caso tempo de foco tenha sido logado
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

    if (isNaN(focusDuration) || focusDuration < 60 || // Mínimo 1 minuto
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

    // Se o timer não estiver rodando, atualiza o tempo atual para a nova duração do modo atual
    if (!state.pomodoro.timerRunning) {
        if (state.pomodoro.mode === 'focus') state.pomodoro.currentTime = state.pomodoro.focusDuration;
        else if (state.pomodoro.mode === 'shortBreak') state.pomodoro.currentTime = state.pomodoro.shortBreakDuration;
        else if (state.pomodoro.mode === 'longBreak') state.pomodoro.currentTime = state.pomodoro.longBreakDuration;
        state.pomodoro.lastModeEnded = null; // Limpa o último modo se o timer não está rodando e as configurações foram alteradas
    }

    saveState();
    updatePomodoroUI();
    closePomodoroSettingsModal();
}

function logPomodoroSession(type, durationInSeconds) {
    if (durationInSeconds <= 0) return; // Não loga sessões de duração zero
    const session = {
        startTime: new Date(Date.now() - durationInSeconds * 1000).toISOString(), // Calcula o início
        endTime: new Date().toISOString(),
        duration: durationInSeconds, // Em segundos
        type: type
    };
    state.pomodoro.sessions.push(session);
    // Opcional: Limitar o número de sessões guardadas para não sobrecarregar o localStorage
    // if (state.pomodoro.sessions.length > 100) state.pomodoro.sessions.shift();
}

function initPomodoro() {
    // Pega os elementos de áudio do DOM
    focusEndSound = document.getElementById('focus-end-sound');
    breakEndSound = document.getElementById('break-end-sound');
    console.log("TASKIFY_POMO: focusEndSound element:", focusEndSound);
    console.log("TASKIFY_POMO: breakEndSound element:", breakEndSound);


    const pomodoroSettingsForm = document.getElementById('pomodoro-settings-form');
    if (pomodoroSettingsForm) {
        pomodoroSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            savePomodoroSettings();
        });
    }
    const pomodoroSettingsModalOverlay = document.getElementById('pomodoro-settings-modal-overlay');
    if(pomodoroSettingsModalOverlay) {
        pomodoroSettingsModalOverlay.addEventListener('click', closePomodoroSettingsModal);
    }
    updatePomodoroUI(); // Garante que a UI esteja correta ao carregar
}

// --- Funções de Tarefas ---
function renderTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    taskList.innerHTML = ''; // Limpa a lista antes de renderizar
    const todayISO = getTodayISO();

    // Ordena tarefas: pendentes primeiro, depois por data de atribuição (ou criação), e depois completas
    const sortedTasks = [...state.tasks].sort((a, b) => {
        // 1. Pendentes antes de completas
        if (a.completed !== b.completed) {
            return a.completed ? 1 : -1;
        }

        // Se ambas têm o mesmo status de conclusão, ordena pela data efetiva
        const aEffectiveDateStr = a.assignedDate || a.createdAt.split('T')[0];
        const bEffectiveDateStr = b.assignedDate || b.createdAt.split('T')[0];

        // Se uma é "hoje" (assignedDate é hoje OU null) e a outra não, "hoje" vem primeiro
        const aIsTodayOrNull = a.assignedDate === todayISO || a.assignedDate === null;
        const bIsTodayOrNull = b.assignedDate === todayISO || b.assignedDate === null;

        if (aIsTodayOrNull && !bIsTodayOrNull) return -1;
        if (!aIsTodayOrNull && bIsTodayOrNull) return 1;

        // Se ambas são "hoje" ou null, ou ambas têm datas específicas, ordena pela data
        const aDate = new Date(aEffectiveDateStr + "T00:00:00");
        const bDate = new Date(bEffectiveDateStr + "T00:00:00");

        if (aDate < bDate) return -1; // Mais antigas/próximas primeiro
        if (aDate > bDate) return 1;

        // Se as datas são iguais, ordena pela data de criação (mais antigas primeiro)
        return new Date(a.createdAt) - new Date(b.createdAt);
    });


    if (sortedTasks.length === 0) {
        const emptyTaskMessage = document.createElement('li');
        emptyTaskMessage.className = 'task-list-empty-message';
        emptyTaskMessage.textContent = 'Nenhuma tarefa por enquanto. Adicione algumas!';
        taskList.appendChild(emptyTaskMessage);
    } else {
        sortedTasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            if (task.completed) li.classList.add('completed');
            li.dataset.taskId = task.id;
            li.setAttribute('draggable', 'true'); // Habilita arrastar

            // Adiciona listeners de drag and drop
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

            // Indicador de data
            const dateIndicator = document.createElement('span');
            dateIndicator.className = 'task-assigned-date-indicator';
            
            const effectiveDateForDisplay = task.assignedDate || todayISO; // Usa hoje se assignedDate for null para fins de exibição
            
            if (effectiveDateForDisplay === todayISO) {
                dateIndicator.textContent = 'Hoje';
            } else {
                const assigned = new Date(effectiveDateForDisplay + "T00:00:00"); // Normaliza para meia-noite
                const today = new Date(todayISO + "T00:00:00");
                
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);

                if (assigned.toDateString() === yesterday.toDateString()) {
                    dateIndicator.textContent = 'Ontem';
                } else if (assigned.toDateString() === tomorrow.toDateString()) {
                    dateIndicator.textContent = 'Amanhã';
                } else {
                    dateIndicator.textContent = formatDateToDDMMYYYY(effectiveDateForDisplay);
                }
            }
            // Só adiciona o indicador se houver uma data atribuída (ou seja, não é nula)
            // e a data não for "hoje" (para não poluir tarefas sem data ou de hoje)
            if (task.assignedDate && task.assignedDate !== todayISO) {
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
    const completedTasks = state.tasks.filter(task => task.completed).length;
    const totalTasks = state.tasks.length;
    tasksCounter.textContent = `${completedTasks}/${totalTasks}`;
}


function addTask(event) {
    event.preventDefault();
    checkAllResets();
    const taskInput = document.getElementById('task-input');
    const taskDateInput = document.getElementById('task-assigned-date'); // Pega o input de data
    const taskText = taskInput.value.trim();
    const assignedDateValue = taskDateInput.value; // Valor YYYY-MM-DD ou string vazia

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
        assignedDate: (assignedDateValue && assignedDateValue !== getTodayISO()) ? assignedDateValue : null 
        // Salva null se a data for hoje ou vazia, caso contrário salva a data específica
    };
    state.tasks.push(newTask);
    taskInput.value = '';
    taskDateInput.value = getTodayISO(); // Reseta para a data de hoje
    renderTasks();
    saveState();
}

function toggleTaskComplete(taskId) {
    checkAllResets(); // Garante que os dados diários estejam corretos
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        const task = state.tasks[taskIndex];
        const wasCompleted = task.completed; // Estado anterior
        task.completed = !task.completed;
        task.completionDate = task.completed ? new Date().toISOString() : null;

        // Atualiza a UI do item específico
        const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.toggle('completed', task.completed);
            const checkbox = taskElement.querySelector('.task-item-checkbox');
            if (checkbox) checkbox.checked = task.completed;
        }

        updateTasksCounter(); // Atualiza o contador geral

        // Atualiza dados do gráfico de tarefas concluídas
        // Considera a data em que a tarefa FOI COMPLETADA para o gráfico
        const completionDateForChart = task.completed ? new Date(task.completionDate) : new Date(); // Usa hoje se desmarcada para subtrair
        completionDateForChart.setHours(0,0,0,0);

        const today = new Date();
        today.setHours(0,0,0,0);

        const oneDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round((today.getTime() - completionDateForChart.getTime()) / oneDay);

        // Se a tarefa foi completada/descompletada nos últimos 7 dias
        if (diffDays >= 0 && diffDays < 7) {
            const dayIndexInChart = 6 - diffDays; // 6 é hoje, 0 é 6 dias atrás
            if (state.dailyTaskCompletionData && state.dailyTaskCompletionData.length === 7 && dayIndexInChart >= 0 && dayIndexInChart < 7) {
                if (task.completed && !wasCompleted) { // Se marcou como completa
                    state.dailyTaskCompletionData[dayIndexInChart]++;
                } else if (!task.completed && wasCompleted) { // Se desmarcou
                    state.dailyTaskCompletionData[dayIndexInChart] = Math.max(0, state.dailyTaskCompletionData[dayIndexInChart] - 1);
                }
            }
        }

        saveState();
        updateTasksChartDataOnly(); // Atualiza apenas os dados do gráfico
    }
}


function deleteTask(taskId) {
    checkAllResets();
    const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        const deletedTask = state.tasks[taskIndex]; // Guarda a tarefa antes de remover
        
        state.tasks.splice(taskIndex, 1); // Remove do estado

        // Remove da UI
        const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.remove();
        }
        
        updateTasksCounter(); // Atualiza o contador

        // Se a tarefa deletada estava completa, ajusta o gráfico
        if (deletedTask.completed && deletedTask.completionDate) {
            const completionDateForChart = new Date(deletedTask.completionDate);
            completionDateForChart.setHours(0,0,0,0);

            const today = new Date();
            today.setHours(0,0,0,0);

            const oneDay = 24 * 60 * 60 * 1000;
            const diffDays = Math.round((today.getTime() - completionDateForChart.getTime()) / oneDay);


            if (diffDays >= 0 && diffDays < 7) {
                const dayIndexInChart = 6 - diffDays;
                 if(state.dailyTaskCompletionData && state.dailyTaskCompletionData.length === 7 && dayIndexInChart >= 0 && dayIndexInChart < 7) {
                    state.dailyTaskCompletionData[dayIndexInChart] = Math.max(0, state.dailyTaskCompletionData[dayIndexInChart] - 1);
                }
            }
        }
        
        // Se a lista ficou vazia, renderiza a mensagem de lista vazia
        if (state.tasks.length === 0) { 
            renderTasks();
        }

        saveState();
        updateTasksChartDataOnly(); // Atualiza o gráfico
    }
}


// --- Funções de Drag and Drop para Tarefas ---
function handleDragStart(e) {
    draggedItem = e.target; // O `li` que está sendo arrastado
    e.dataTransfer.effectAllowed = 'move';
    // Adiciona uma classe para estilizar o item arrastado (ex: opacidade)
    // Usar setTimeout para garantir que a classe seja adicionada após o evento dragstart
    setTimeout(() => {
        if (draggedItem) draggedItem.classList.add('dragging');
    }, 0);
}

function handleDragEnd(e) {
    // Limpa a classe de arrasto
    if (draggedItem) {
        draggedItem.classList.remove('dragging');
    }
    draggedItem = null;
    // Remove qualquer placeholder que possa ter ficado
    document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove());
}

function handleDragOver(e) {
    e.preventDefault(); // Necessário para permitir o drop
    const taskList = document.getElementById('task-list');
    const afterElement = getDragAfterElement(taskList, e.clientY);

    // Remove placeholder existente antes de adicionar um novo
    const existingPlaceholder = taskList.querySelector('.drag-over-placeholder');
    if (existingPlaceholder) {
        existingPlaceholder.remove();
    }

    const placeholder = document.createElement('li');
    placeholder.classList.add('drag-over-placeholder');
    if (afterElement == null) {
        taskList.appendChild(placeholder);
    } else {
        taskList.insertBefore(placeholder, afterElement);
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedItem) return;

    const taskList = document.getElementById('task-list');
    const draggedItemId = draggedItem.dataset.taskId;

    // Encontra o índice original da tarefa no array 'state.tasks'
    const originalIndex = state.tasks.findIndex(task => task.id === draggedItemId);
    if (originalIndex === -1) {
        console.error("Tarefa arrastada não encontrada no estado.");
        // Limpa o estado de arrasto
        draggedItem.classList.remove('dragging');
        draggedItem = null;
        document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove());
        return;
    }

    // Remove a tarefa do array e a guarda
    const [movedTask] = state.tasks.splice(originalIndex, 1);

    // Determina o novo índice baseado em onde o item foi solto
    const afterElement = getDragAfterElement(taskList, e.clientY);
    let newIndex;

    if (afterElement) {
        const afterElementId = afterElement.dataset.taskId;
        // Encontra o índice do elemento 'depois de' no array de tarefas ATUALIZADO (sem o item movido)
        const targetIndexInState = state.tasks.findIndex(task => task.id === afterElementId);
        if (targetIndexInState !== -1) {
            newIndex = targetIndexInState; // Insere ANTES do afterElement
        } else {
            // Fallback: se o afterElement não for encontrado no estado (improvável)
            // Adiciona ao final da lista de tarefas (já que foi removido do estado original)
            newIndex = state.tasks.length;
        }
    } else {
        // Soltou no final da lista
        newIndex = state.tasks.length;
    }
    
    // Insere a tarefa movida no novo índice
    state.tasks.splice(newIndex, 0, movedTask);

    // Limpa o estado de arrasto
    draggedItem.classList.remove('dragging');
    draggedItem = null;
    document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove());

    // Re-renderiza a lista de tarefas para refletir a nova ordem e salva o estado
    renderTasks();
    saveState();
}


function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2; // Distância do mouse para o centro do elemento filho
        // Se o offset é negativo (mouse está acima do centro) e mais próximo que o anterior
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element; // Retorna o elemento ou null se não houver mais próximo
}


function initTasks() {
    const taskForm = document.getElementById('task-form');
    if (taskForm) taskForm.addEventListener('submit', addTask);

    const taskList = document.getElementById('task-list');
    if (taskList) {
        taskList.addEventListener('dragover', handleDragOver);
        taskList.addEventListener('drop', handleDrop);
    }
    // Define a data de hoje como padrão no input de data ao carregar
    const taskDateInput = document.getElementById('task-assigned-date');
    if (taskDateInput) {
        taskDateInput.value = getTodayISO();
    }

    renderTasks(); // Renderiza tarefas existentes ao carregar
}

// --- Funções de Temas e Aparência ---
function openThemesModal() {
    const modal = document.getElementById('themes-modal');
    const overlay = document.getElementById('themes-modal-overlay');
    if (modal && overlay) {
        populateThemesModal(); // Popula o modal com as opções atuais
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

    paletteContainer.innerHTML = ''; // Limpa antes de popular
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

    modeContainer.innerHTML = ''; // Limpa antes de popular
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
    // Atualiza a classe 'active' dos botões de paleta
    document.querySelectorAll('.palette-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.paletteKey === state.visuals.currentPalette);
    });
    // Atualiza a classe 'active' dos botões de modo visual
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.modeKey === state.visuals.currentVisualMode);
    });
}

function applyPalette(paletteName) {
    if (PREDEFINED_PALETTES[paletteName]) {
        const newPrimaryColor = PREDEFINED_PALETTES[paletteName].primary;
        state.visuals.currentPalette = paletteName;
        applyPrimaryColor(newPrimaryColor); // Esta função já chama applyCurrentThemeAndMode
        saveState();
        updateThemeModalButtons(); // Atualiza os botões no modal
    }
}

function applyVisualMode(modeName) {
    if (VISUAL_MODES[modeName]) {
        state.visuals.currentVisualMode = modeName;
        applyCurrentThemeAndMode(); // Aplica o modo e atualiza o tema
        saveState();
        updateThemeModalButtons(); // Atualiza os botões no modal
    }
}

function initThemes() {
    const themesModalOverlay = document.getElementById('themes-modal-overlay');
    if (themesModalOverlay) themesModalOverlay.addEventListener('click', closeThemesModal);
    applyCurrentThemeAndMode(); // Aplica o tema e modo salvos ao carregar
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
    alertMessageEl.textContent = message;

    // Recria o botão OK para remover listeners antigos
    const newOkBtn = alertOkBtn.cloneNode(true);
    alertOkBtn.parentNode.replaceChild(newOkBtn, alertOkBtn);
    alertOkBtn = newOkBtn; // Atualiza a referência

    const closeAlert = () => {
        alertModal.classList.remove('show');
        alertOverlay.classList.remove('show');
        alertOkBtn.removeEventListener('click', closeAlert);
        alertOverlay.removeEventListener('click', closeAlertOnOverlay); // Remove o listener específico do overlay
        if (onConfirmCallback && typeof onConfirmCallback === 'function') {
            onConfirmCallback();
        }
    };

    const closeAlertOnOverlay = (event) => {
        if (event.target === alertOverlay) { // Garante que o clique foi no overlay e não no modal
            closeAlert();
        }
    };

    alertOkBtn.addEventListener('click', closeAlert);
    alertOverlay.addEventListener('click', closeAlertOnOverlay); // Adiciona listener no overlay

    alertOverlay.classList.add('show');
    alertModal.classList.add('show');
    alertOkBtn.focus(); // Foca no botão OK para acessibilidade
}
window.showCustomAlert = showCustomAlert; // Expondo para uso global, se necessário

// --- Modal do Guia de Boas-Vindas ---
function openWelcomeGuideModal() {
    const modal = document.getElementById('welcome-guide-modal');
    const overlay = document.getElementById('welcome-guide-modal-overlay');
    if (modal && overlay) {
        const checkbox = document.getElementById('dont-show-guide-again-checkbox');
        if (checkbox) checkbox.checked = false; // Garante que não esteja pré-marcado
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
    closeGoalsModal(); // Fecha o modal de metas se estiver aberto
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
    // Limpa todos os itens do localStorage relacionados ao Taskify
    localStorage.removeItem('taskify-state');
    localStorage.removeItem('taskify-theme');
    localStorage.removeItem('taskify-primary-color');
    localStorage.removeItem('taskify-streak');
    localStorage.removeItem('taskify-welcomeGuideDismissed');
    localStorage.removeItem('taskify-palette');
    localStorage.removeItem('taskify-visual-mode');
    // Adicione aqui outros itens que possam ser salvos no futuro

    // Recarrega a página para aplicar o estado padrão
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

    // Se a tela for pequena (mobile/tablet vertical), o indicador não é necessário
    if (window.innerWidth < 769) { // Corresponde ao breakpoint do CSS
        scrollIndicator.classList.remove('visible');
        scrollIndicator.classList.add('collapsed');
        productivityArea.classList.add('visible'); // Garante que a área de produtividade seja visível
        return;
    }

    // Calcula a altura do conteúdo da "primeira página"
    const statsGrid = document.querySelector('.stats-grid');
    const bottomCards = document.querySelector('.bottom-cards');
    const activitySection = document.querySelector('.activity-section');
    let firstPageContentHeight = 0;
    if (statsGrid) firstPageContentHeight += statsGrid.offsetHeight + parseInt(getComputedStyle(statsGrid).marginBottom || '0');
    if (bottomCards) firstPageContentHeight += bottomCards.offsetHeight + parseInt(getComputedStyle(bottomCards).marginBottom || '0');
    if (activitySection) firstPageContentHeight += activitySection.offsetHeight + parseInt(getComputedStyle(activitySection).marginBottom || '0');

    const hasSecondPageContent = productivityArea.offsetHeight > 50; // Verifica se há conteúdo significativo na área de produtividade
    const contentEntryThreshold = firstPageContentHeight * 0.20; // Quando a área de produtividade começa a aparecer
    const indicatorHideThreshold = firstPageContentHeight * 0.60; // Quando o indicador deve sumir

    // Verifica se há scroll suficiente para justificar o indicador
    if (hasSecondPageContent && document.documentElement.scrollHeight > (window.innerHeight + 50)) { // 50px de margem
        if (window.scrollY < indicatorHideThreshold) {
            scrollIndicator.classList.add('visible');
            scrollIndicator.classList.remove('collapsed');
        } else {
            scrollIndicator.classList.remove('visible');
            scrollIndicator.classList.add('collapsed');
        }
        // Animação de entrada da área de produtividade
        if (window.scrollY > contentEntryThreshold) productivityArea.classList.add('visible');
        else productivityArea.classList.remove('visible');

    } else { // Sem scroll suficiente ou sem conteúdo na segunda página
        scrollIndicator.classList.remove('visible');
        scrollIndicator.classList.add('collapsed');
        productivityArea.classList.add('visible'); // Garante visibilidade se não houver scroll
    }
}

window.addEventListener('scroll', updateScrollIndicator, { passive: true });
window.addEventListener('resize', updateScrollIndicator);


// Inicialização Principal
async function init() {
    const loaderElement = document.getElementById('loader');
    if(loaderElement) loaderElement.style.display = 'flex'; // Mostra o loader

    loadState(); // Carrega o estado, que também define window.state
    // window.state já é definido dentro de loadState()

    console.log("TASKIFY_MAIN: window.state definido após loadState():", JSON.parse(JSON.stringify(window.state || {})));

    initThemes();
    checkAllResets(); // Faz os resets diários, semanais etc.
    initStreak();
    initPomodoro();
    initTasks();

    await loadAndSetupRetrospective(); // Carrega e configura a retrospectiva

    updateFooterYear();

    // Configura gráficos com animação inicial
    if (weeklyChartInstance) weeklyChartInstance.destroy();
    setupChart(true);
    if (pomodoroChartInstance) pomodoroChartInstance.destroy();
    setupPomodoroChart(true);
    if (tasksChartInstance) tasksChartInstance.destroy();
    setupTasksChart(true);

    updateUI(); // Atualiza toda a UI com os dados carregados/resetados

    // Listeners dos modais e formulários
    const goalsForm = document.getElementById('goals-form');
    if (goalsForm) goalsForm.addEventListener('submit', (e) => { e.preventDefault(); saveGoals(); });
    const goalsOverlay = document.getElementById('goals-modal-overlay');
    if (goalsOverlay) goalsOverlay.addEventListener('click', closeGoalsModal);

    const btnResetAppData = document.getElementById('btn-reset-app-data');
    if (btnResetAppData) btnResetAppData.addEventListener('click', handleResetAppData);

    const confirmResetModalOverlay = document.getElementById('confirm-reset-modal-overlay');
    if(confirmResetModalOverlay) confirmResetModalOverlay.addEventListener('click', closeConfirmResetModal);
    const confirmResetModalCloseBtn = document.getElementById('confirm-reset-modal-close-btn');
    if(confirmResetModalCloseBtn) confirmResetModalCloseBtn.addEventListener('click', closeConfirmResetModal);
    const btnCancelResetConfirmation = document.getElementById('btn-cancel-reset-confirmation');
    if(btnCancelResetConfirmation) btnCancelResetConfirmation.addEventListener('click', closeConfirmResetModal);
    const btnConfirmResetAction = document.getElementById('btn-confirm-reset-action');
    if(btnConfirmResetAction) btnConfirmResetAction.addEventListener('click', performFullReset);

    // Guia de boas-vindas (removido o botão de abrir, pois não está no HTML fornecido)
    // const btnOpenGuide = document.getElementById('btn-open-guide');
    // if(btnOpenGuide) btnOpenGuide.addEventListener('click', openWelcomeGuideModal);
    const welcomeGuideModalOverlay = document.getElementById('welcome-guide-modal-overlay');
    if(welcomeGuideModalOverlay) welcomeGuideModalOverlay.addEventListener('click', closeWelcomeGuideModal);
    const welcomeGuideModalCloseBtn = document.getElementById('welcome-guide-modal-close-btn');
    if(welcomeGuideModalCloseBtn) welcomeGuideModalCloseBtn.addEventListener('click', closeWelcomeGuideModal);
    const btnCloseWelcomeGuide = document.getElementById('btn-close-welcome-guide');
    if(btnCloseWelcomeGuide) btnCloseWelcomeGuide.addEventListener('click', closeWelcomeGuideModal);

    if (localStorage.getItem('taskify-welcomeGuideDismissed') !== 'true') {
        openWelcomeGuideModal();
    }

    // Verifica resets periodicamente (ex: a cada minuto)
    setInterval(checkAllResets, 60000);

    // Sinaliza que o estado principal do Taskify está pronto
    window.taskifyStateReady = true;
    console.log("TASKIFY_MAIN: Disparando evento 'taskifyStateReady'. Estado enviado:", JSON.parse(JSON.stringify(window.state || {})));
    document.dispatchEvent(new CustomEvent('taskifyStateReady', {
        detail: { taskifyAppState: JSON.parse(JSON.stringify(window.state || {})) } // Envia uma cópia do estado
    }));
    console.log("TASKIFY_MAIN: Evento 'taskifyStateReady' disparado.");


    // Esconde o loader após um pequeno delay
    setTimeout(() => {
        if(loaderElement) {
            loaderElement.style.opacity = '0';
            setTimeout(() => {
                loaderElement.style.display = 'none';
            }, 500); // Tempo para a animação de fade out
        }
    }, 250); // Delay mínimo para mostrar o loader
}

document.addEventListener('DOMContentLoaded', async () => {
    await init();
});

// Animação de Partículas (Opcional, pode ser removida se não desejada)
const particleCanvas = document.getElementById('particle-canvas');
if (particleCanvas) {
    const ctx = particleCanvas.getContext('2d');
    let particlesArray = [];
    let lastParticleTime = 0;
    const particleCooldown = 30; // ms entre a criação de novas partículas
    let currentMouseX = -1000, currentMouseY = -1000; // Fora da tela inicialmente

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
        // Reseta a posição do mouse quando ele sai da janela ou o toque termina
        document.addEventListener('mouseleave', () => { currentMouseX = -1000; currentMouseY = -1000; });
        document.addEventListener('touchend', () => { currentMouseX = -1000; currentMouseY = -1000; });
        resizeCanvas(); // Define o tamanho inicial
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y; this.size = Math.random() * 4 + 1.5; // Tamanho entre 1.5 e 5.5
            this.baseSize = this.size; this.color = color;
            this.speedX = Math.random() * 2 - 1; // Velocidade X entre -1 e 1
            this.speedY = Math.random() * 2 - 1; // Velocidade Y entre -1 e 1
            this.life = Math.random() * 60 + 30; // Vida entre 30 e 90 frames
            this.initialLife = this.life;
        }
        update() {
            this.x += this.speedX; this.y += this.speedY; this.life--;
            if (this.life > 0) this.size = this.baseSize * (this.life / this.initialLife); // Diminui com o tempo
            if (this.size < 0.1) this.size = 0; // Garante que não seja negativo
        }
        draw() {
            if (this.size > 0) {
                ctx.fillStyle = this.color;
                ctx.globalAlpha = Math.max(0, this.life / this.initialLife * 0.7); // Fade out
                ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1; // Reseta alpha global
            }
        }
    }

    function handleParticles(timestamp) {
        const isMouseInsideWindow = currentMouseX >= 0 && currentMouseX <= window.innerWidth &&
                                    currentMouseY >= 0 && currentMouseY <= window.innerHeight;
        
        // Verifica se as partículas devem ser desabilitadas (ex: modo foco)
        let particleEnabled = true;
        if (typeof state !== 'undefined' && state.visuals && state.visuals.currentVisualMode === 'focus') {
            particleEnabled = false;
        }

        if (particleEnabled && isMouseInsideWindow && timestamp - lastParticleTime > particleCooldown) {
            let primaryColor = '#0A7CFF'; // Fallback
            try {
                // Pega a cor primária atual (claro ou escuro)
                if (typeof state !== 'undefined' && state.isDarkMode !== undefined) {
                    primaryColor = getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim();
                } else {
                    // Fallback se o estado não estiver pronto (raro aqui, mas seguro)
                    primaryColor = localStorage.getItem('taskify-primary-color') || '#0A7CFF';
                }
            } catch (e) { console.warn("Erro ao obter cor primária para partículas:", e); }

            for (let i = 0; i < 1; i++) { // Cria 1 partícula por vez para um efeito sutil
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
    // Garante que os listeners e a animação só comecem após o DOM estar pronto
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

// Função auxiliar para converter hex para array RGB (pode ser movida para um arquivo de utils se usada em múltiplos lugares)
function hexToRgbArray(hex) {
    if (!hex || typeof hex !== 'string') return null;
    let c = hex.substring(1); // Remove #
    if (c.length === 3) { // Converte de #RGB para #RRGGBB
        c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    }
    if (c.length !== 6) { // Formato inválido
        return null;
    }
    try {
        const bigint = parseInt(c, 16);
        if (isNaN(bigint)) return null; // Não é um número hexadecimal válido
        const r = (bigint >> 16) & 255;
        const g = (bigint >> 8) & 255;
        const b = bigint & 255;
        return [r, g, b];
    } catch (e) {
        console.error("Erro ao converter hex para RGB:", hex, e);
        return null;
    }
}

// --- Carregamento e Configuração da Retrospectiva ---
async function loadAndSetupRetrospective() {
    retrospectiveModalEl = document.getElementById('retrospective-modal');
    retrospectiveModalOverlayEl = document.getElementById('retrospective-modal-overlay');
    const btnOpenRetrospectiveMain = document.getElementById('btn-open-retrospective');

    if (!retrospectiveModalEl || !retrospectiveModalOverlayEl || !btnOpenRetrospectiveMain) {
        console.error('TASKIFY_MAIN: Elementos base da retrospectiva não encontrados. A retrospectiva pode não funcionar.');
        if(btnOpenRetrospectiveMain) btnOpenRetrospectiveMain.style.display = 'none'; // Esconde o botão se o modal não existe
        return;
    }

    // Listener para abrir a retrospectiva
    btnOpenRetrospectiveMain.addEventListener('click', () => {
        console.log("TASKIFY_MAIN: Botão 'btn-open-retrospective' clicado.");
        if (typeof window.openRetrospectiveView === 'function') {
            window.openRetrospectiveView();
        } else {
            console.error("TASKIFY_MAIN: Função window.openRetrospectiveView() não está definida. Verifique se retrospective.js foi carregado.");
        }
    });

    // Listener para fechar a retrospectiva clicando no overlay
    retrospectiveModalOverlayEl.addEventListener('click', (event) => {
        if (event.target === retrospectiveModalOverlayEl) { // Garante que o clique foi no overlay e não em um filho
            if (typeof window.closeRetrospectiveView === 'function') {
                window.closeRetrospectiveView();
            }
        }
    });

    // Verifica se o conteúdo da retrospectiva já foi carregado (evita recarregar)
    if (!retrospectiveModalEl.querySelector('.retrospective-screen')) { // Se não houver telas, carrega
        console.log("TASKIFY_MAIN: Carregando retrospective.html...");
        try {
            const response = await fetch('retrospective.html');
            if (!response.ok) {
                throw new Error(`Falha ao carregar retrospective.html: ${response.status} ${response.statusText}`);
            }
            const htmlContent = await response.text();
            retrospectiveModalEl.innerHTML = htmlContent; // Injeta o HTML da retrospectiva no modal
            console.log("TASKIFY_MAIN: retrospective.html carregado e injetado.");

            // Após carregar o HTML, inicializa os componentes internos da retrospectiva
            if (typeof window.initializeRetrospectiveInternals === 'function') {
                window.initializeRetrospectiveInternals();
                console.log("TASKIFY_MAIN: window.initializeRetrospectiveInternals() chamada com sucesso.");
            } else {
                console.error("TASKIFY_MAIN: Função window.initializeRetrospectiveInternals() não definida após carregar HTML.");
            }
        } catch (error) {
            console.error('TASKIFY_MAIN: Falha ao carregar e configurar retrospective.html:', error);
            const alertFn = typeof window.showCustomAlert === 'function' ? window.showCustomAlert : alert;
            alertFn('Erro crítico ao carregar a retrospectiva. Verifique o console.', 'Erro');
            btnOpenRetrospectiveMain.style.display = 'none'; // Esconde o botão se falhar
        }
    } else {
        // Se o HTML já existe, apenas garante que os internos sejam inicializados
        // (útil para hot-reloading ou cenários onde o script é recarregado mas o DOM persiste)
        console.log("TASKIFY_MAIN: retrospective.html já estava carregado. Garantindo inicialização dos internos.");
        if (typeof window.initializeRetrospectiveInternals === 'function') {
            window.initializeRetrospectiveInternals();
        } else {
             console.error("TASKIFY_MAIN: Função window.initializeRetrospectiveInternals() não definida (HTML já presente).");
        }
    }
}
