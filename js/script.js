
let weeklyChartInstance = null;
let pomodoroChartInstance = null;
let tasksChartInstance = null;
let pomodoroInterval = null;
let retrospectiveModalEl;
let retrospectiveModalOverlayEl;

// Elementos de áudio
let focusEndSound = null;
let breakEndSound = null;

// Variáveis para Drag and Drop de tarefas na lista principal
let draggedItem = null;

// Variáveis para Drag and Drop de tarefas no modal de padrão recorrente v2
let draggedPatternTaskItem_v2 = null;
let sourcePatternTaskList_v2 = null;
let currentEditingPatternTaskId_v2 = null;


// Flatpickr instances
let taskDatePicker = null;

let newPomodoroDetailsModal = null;
let newPomodoroDetailsModalOverlay = null;
let newPomodoroDetailsCloseBtnX = null;
let newPomodoroDetailsSessionsCount = null;
let newPomodoroDetailsTotalFocusTime = null;
let newPomodoroCycleList = null;
let newPomodoroDetailsEmptyMessage = null;
let newPomodoroDetailsBtnClose = null;
let newPomodoroDetailsBtnNewCycle = null;

// Elementos das Abas
let headerTabsContainer = null;
let tabButtons = [];
let tabContents = [];
let headerMenuBtn = null;
let tabsDropdown = null;


window.showCustomAlert = showCustomAlert;
window.taskifyStateReady = false;

if (typeof PREDEFINED_PALETTES_GLOBAL === 'undefined') {
    const PREDEFINED_PALETTES = {
        electricBlue: { name: 'Azul Elétrico', primary: '#0A7CFF' },
        emeraldGreen: { name: 'Verde Esmeralda', primary: '#00DB4D' },
        fieryRed: { name: 'Vermelho Ígneo', primary: '#D51818' },
        royalPurple: { name: 'Roxo Real', primary: '#852DD8' },
        sunnyOrange: { name: 'Laranja Solar', primary: '#FF8C00' }
    };
    window.PREDEFINED_PALETTES_GLOBAL = PREDEFINED_PALETTES;
}
const currentPalettes = window.PREDEFINED_PALETTES_GLOBAL;


const VISUAL_MODES = {
    default: { name: 'Padrão', icon: 'bi-display', subtitle: 'Experiência padrão Taskify' },
    focus: { name: 'Foco Total', icon: 'bi-bullseye', subtitle: 'Interface minimalista, menos distrações' },
    night: { name: 'Profundo da Noite', icon: 'bi-moon-stars', subtitle: 'Cores escuras e suaves para seus olhos' },
    motivational: { name: 'Energia Vibrante', icon: 'bi-lightning-charge', subtitle: 'Cores dinâmicas para te inspirar' }
};

const SINGLE_ROUTINE_ID = "minhaUnicaRotinaSemanal";

const CHART_PERIOD_SELECTORS_IDS = {
    weeklyActivity: 'weeklyActivityChartPeriodSelector',
    pomodoroFocus: 'weeklyPomodoroFocusChartPeriodSelector',
    tasksCompleted: 'weeklyTasksCompletedChartPeriodSelector'
};
const CHART_PERIOD_STORAGE_KEYS = {
    weeklyActivity: 'taskify-weeklyActivityChartPeriod',
    pomodoroFocus: 'taskify-pomodoroFocusChartPeriod',
    tasksCompleted: 'taskify-tasksCompletedChartPeriod'
};
const DEFAULT_CHART_PERIOD = '7days';


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
    weeklyActivityData: [0, 0, 0, 0, 0, 0, 0], // [Dia-6, ..., Dia-1, Hoje]
    dailyRecord: {
        value: 0,
        date: "-"
    },
    currentStreak: {
        days: 0,
        lastCompletionDate: null,
        history: {} // { "YYYY-MM-DD": count }
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
        dailyFocusData: [0, 0, 0, 0, 0, 0, 0] // [Dia-6, ..., Dia-1, Hoje]
    },
    tasks: [],
    dailyTaskCompletionData: [0, 0, 0, 0, 0, 0, 0], // [Dia-6, ..., Dia-1, Hoje]
    recurringTaskPatterns: [],
    visuals: {
        currentPalette: 'electricBlue',
        currentVisualMode: 'default'
    },
    chartPeriods: {
        weeklyActivity: DEFAULT_CHART_PERIOD,
        pomodoroFocus: DEFAULT_CHART_PERIOD,
        tasksCompleted: DEFAULT_CHART_PERIOD
    },
    simuladosApp: {
        simulados: [],
        categorias: []
    },
    redacoesApp: {
        redacoes: [],
        eixosTematicos: []
    },
    activeTab: 'tab-painel-principal'
};

let state = JSON.parse(JSON.stringify(initialDefaultState));
window.state = state;

// --- Funções de Navegação por Abas ---
function initTabs() {
    headerTabsContainer = document.querySelector('.header-tabs');
    tabButtons = document.querySelectorAll('.header-tab-btn');
    tabContents = document.querySelectorAll('.tab-content');
    headerMenuBtn = document.getElementById('header-menu-btn');

    if (!headerTabsContainer || tabButtons.length === 0 || tabContents.length === 0) {
        console.error("Elementos das abas não encontrados. A navegação por abas pode não funcionar.");
        return;
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            switchTab(tabId);
            if (tabsDropdown && tabsDropdown.classList.contains('show')) {
                tabsDropdown.classList.remove('show');
            }
        });
    });

    if (headerMenuBtn) {
        headerMenuBtn.addEventListener('click', toggleTabsDropdown);
    }

    const savedTab = localStorage.getItem('taskify-activeTab');
    if (savedTab && document.getElementById(savedTab)) {
        switchTab(savedTab);
    } else {
        switchTab(initialDefaultState.activeTab);
    }

    checkHeaderLayout();
    window.addEventListener('resize', checkHeaderLayout);
}

function switchTab(tabId) {
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
            content.classList.add('active');
        }
    });

    tabButtons.forEach(button => {
        button.classList.remove('active');
        if (button.dataset.tab === tabId) {
            button.classList.add('active');
        }
    });

    if (tabsDropdown) {
        const dropdownButtons = tabsDropdown.querySelectorAll('.header-tab-btn');
        dropdownButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.tab === tabId) {
                button.classList.add('active');
            }
        });
    }

    state.activeTab = tabId;
    localStorage.setItem('taskify-activeTab', tabId);
}

function toggleTabsDropdown() {
    if (!tabsDropdown) {
        tabsDropdown = document.createElement('div');
        tabsDropdown.className = 'tabs-dropdown';
        document.querySelector('.header').appendChild(tabsDropdown);

        tabButtons.forEach(originalButton => {
            if(originalButton.closest('.header-tabs')){
                const clone = originalButton.cloneNode(true);
                clone.addEventListener('click', () => {
                    switchTab(clone.dataset.tab);
                    tabsDropdown.classList.remove('show');
                });
                tabsDropdown.appendChild(clone);
            }
        });
    }
    tabsDropdown.classList.toggle('show');
}

function checkHeaderLayout() {
    if (!headerTabsContainer || !headerMenuBtn) return;
    const header = document.querySelector('.header');
    const logo = header.querySelector('.logo');
    const controls = header.querySelector('.header-controls');
    let availableWidth = header.offsetWidth - (logo ? logo.offsetWidth : 0) - (controls ? controls.offsetWidth : 0) - 60;
    let tabsWidth = 0;
    const mainTabButtons = headerTabsContainer.querySelectorAll('.header-tab-btn');
    mainTabButtons.forEach(btn => { tabsWidth += btn.offsetWidth + 5; });

    if (window.innerWidth <= 900 || tabsWidth > availableWidth) {
        headerTabsContainer.style.display = 'none';
        headerMenuBtn.style.display = 'flex';
    } else {
        headerTabsContainer.style.display = 'flex';
        headerMenuBtn.style.display = 'none';
        if (tabsDropdown && tabsDropdown.classList.contains('show')) {
            tabsDropdown.classList.remove('show');
        }
    }
}


// --- Funções Utilitárias e de Estado (existentes) ---
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setHours(0,0,0,0);
    return new Date(d.setDate(diff));
}

function getStartOfMonth(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setHours(0,0,0,0);
    return d;
}

function getStartOfYear(date) {
    const d = new Date(date.getFullYear(), 0, 1);
    d.setHours(0,0,0,0);
    return d;
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
        r = parseInt(hexVal[0] + hexVal[0], 16); g = parseInt(hexVal[1] + hexVal[1], 16); b = parseInt(hexVal[2] + hexVal[2], 16);
    } else {
        r = parseInt(hexVal.substring(0, 2), 16); g = parseInt(hexVal.substring(2, 4), 16); b = parseInt(hexVal.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function hexToRgbArray(hex) {
    if (!hex || typeof hex !== 'string') return null;
    let c = hex.substring(1);
    if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    if (c.length !== 6) return null;
    try {
        const bigint = parseInt(c, 16); if (isNaN(bigint)) return null;
        const r = (bigint >> 16) & 255; const g = (bigint >> 8) & 255; const b = bigint & 255;
        return [r, g, b];
    } catch (e) { console.error("Erro ao converter hex para RGB:", hex, e); return null; }
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
    if (dateParts.length === 3) return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    return isoDateString;
}

function formatDateToISO(ddmmyyyyString) {
    if (!ddmmyyyyString) return null;
    const parts = ddmmyyyyString.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return null;
}

function getNumColumnsForGrid(gridElement) {
    if (!gridElement) return 1;
    const gridComputedStyle = window.getComputedStyle(gridElement);
    const gridTemplateColumns = gridComputedStyle.getPropertyValue('grid-template-columns');
    const repeatMatch = gridTemplateColumns.match(/repeat\((\d+),/);
    if (repeatMatch && repeatMatch[1]) return parseInt(repeatMatch[1], 10);
    return (gridTemplateColumns.split(' ').filter(s => s.trim() !== '')).length || 1;
}

function loadState() {
    let themeToApply = initialDefaultState.isDarkMode;
    let primaryColorToApply = currentPalettes[initialDefaultState.visuals.currentPalette].primary;
    let currentPaletteName = initialDefaultState.visuals.currentPalette;
    let currentVisualModeName = initialDefaultState.visuals.currentVisualMode;
    const savedThemeSetting = localStorage.getItem('taskify-theme');
    if (savedThemeSetting !== null) themeToApply = savedThemeSetting === 'dark';
    const savedPrimaryColor = localStorage.getItem('taskify-primary-color');
    if (savedPrimaryColor) primaryColorToApply = savedPrimaryColor;
    const savedPaletteName = localStorage.getItem('taskify-palette');
    if (savedPaletteName && currentPalettes[savedPaletteName]) {
        currentPaletteName = savedPaletteName; primaryColorToApply = currentPalettes[currentPaletteName].primary;
    } else if (savedPaletteName === 'custom' && savedPrimaryColor) {
        currentPaletteName = 'custom'; primaryColorToApply = savedPrimaryColor;
    } else { currentPaletteName = initialDefaultState.visuals.currentPalette; primaryColorToApply = currentPalettes[currentPaletteName].primary; }
    const savedVisualMode = localStorage.getItem('taskify-visual-mode');
    if (savedVisualMode && VISUAL_MODES[savedVisualMode]) currentVisualModeName = savedVisualMode;
    document.documentElement.style.setProperty('--primary-color-light', primaryColorToApply);
    document.documentElement.style.setProperty('--primary-color-dark', primaryColorToApply);
    const rgbArray = hexToRgbArray(primaryColorToApply);
    if (rgbArray) { document.documentElement.style.setProperty('--primary-color-light-rgb', rgbArray.join(', ')); document.documentElement.style.setProperty('--primary-color-dark-rgb', rgbArray.join(', '));}
    let loadedState = null;
    try {
        const savedStateString = localStorage.getItem('taskify-state');
        if (savedStateString) loadedState = JSON.parse(savedStateString);
    } catch (e) { console.error("Error parsing 'taskify-state' from localStorage:", e); localStorage.removeItem('taskify-state'); }
    if (loadedState) {
        const mergeDeep = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    mergeDeep(target[key], source[key]);
                } else if (source[key] !== undefined) Object.assign(target, { [key]: source[key] });
            }
        };
        state = JSON.parse(JSON.stringify(initialDefaultState)); mergeDeep(state, loadedState);
        state.tasks = (state.tasks && Array.isArray(state.tasks)) ? state.tasks.map(task => ({ ...initialDefaultState.tasks[0], ...task, assignedDate: task.assignedDate || null, sourcePatternId: task.sourcePatternId || null, isRecurringInstance: task.isRecurringInstance || false })) : [...initialDefaultState.tasks];
        state.recurringTaskPatterns = (state.recurringTaskPatterns && Array.isArray(state.recurringTaskPatterns)) ? state.recurringTaskPatterns.map(p => ({ ...initialDefaultState.recurringTaskPatterns[0], ...p, id: SINGLE_ROUTINE_ID, tasksByDay: p.tasksByDay && typeof p.tasksByDay === 'object' ? { 0: Array.isArray(p.tasksByDay[0]) ? p.tasksByDay[0].map(taskDef => ({ ...taskDef, completed: taskDef.completed || false })) : [], 1: Array.isArray(p.tasksByDay[1]) ? p.tasksByDay[1].map(taskDef => ({ ...taskDef, completed: taskDef.completed || false })) : [], 2: Array.isArray(p.tasksByDay[2]) ? p.tasksByDay[2].map(taskDef => ({ ...taskDef, completed: taskDef.completed || false })) : [], 3: Array.isArray(p.tasksByDay[3]) ? p.tasksByDay[3].map(taskDef => ({ ...taskDef, completed: taskDef.completed || false })) : [], 4: Array.isArray(p.tasksByDay[4]) ? p.tasksByDay[4].map(taskDef => ({ ...taskDef, completed: taskDef.completed || false })) : [], 5: Array.isArray(p.tasksByDay[5]) ? p.tasksByDay[5].map(taskDef => ({ ...taskDef, completed: taskDef.completed || false })) : [], 6: Array.isArray(p.tasksByDay[6]) ? p.tasksByDay[6].map(taskDef => ({ ...taskDef, completed: taskDef.completed || false })) : [], } : { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] } })).slice(0, 1) : [...initialDefaultState.recurringTaskPatterns];
        if (loadedState.simuladosApp) { state.simuladosApp.simulados = (Array.isArray(loadedState.simuladosApp.simulados)) ? loadedState.simuladosApp.simulados : []; state.simuladosApp.categorias = (Array.isArray(loadedState.simuladosApp.categorias)) ? loadedState.simuladosApp.categorias : []; } else state.simuladosApp = JSON.parse(JSON.stringify(initialDefaultState.simuladosApp));
        if (loadedState.redacoesApp) { state.redacoesApp.redacoes = (Array.isArray(loadedState.redacoesApp.redacoes)) ? loadedState.redacoesApp.redacoes : []; state.redacoesApp.eixosTematicos = (Array.isArray(loadedState.redacoesApp.eixosTematicos)) ? loadedState.redacoesApp.eixosTematicos : []; } else state.redacoesApp = JSON.parse(JSON.stringify(initialDefaultState.redacoesApp));
        const numericKeys = ['todayCount', 'weeklyProgress', 'monthlyProgress', 'yearlyProgress'];
        numericKeys.forEach(key => { if (typeof state[key] !== 'number' || isNaN(state[key])) state[key] = initialDefaultState[key]; });
        const pomodoroLoadedState = state.pomodoro || {};
        state.pomodoro = { ...initialDefaultState.pomodoro, ...pomodoroLoadedState, timerRunning: false, enableSound: typeof pomodoroLoadedState.enableSound === 'boolean' ? pomodoroLoadedState.enableSound : initialDefaultState.pomodoro.enableSound, dailyFocusData: (pomodoroLoadedState.dailyFocusData && Array.isArray(pomodoroLoadedState.dailyFocusData) && pomodoroLoadedState.dailyFocusData.length === 7) ? pomodoroLoadedState.dailyFocusData.map(v => (typeof v === 'number' && !isNaN(v) ? v : 0)) : [...initialDefaultState.pomodoro.dailyFocusData] };
        if (!(pomodoroLoadedState.timerRunning && pomodoroLoadedState.currentTime > 0)) {
            if (state.pomodoro.mode === 'focus') state.pomodoro.currentTime = state.pomodoro.focusDuration;
            else if (state.pomodoro.mode === 'shortBreak') state.pomodoro.currentTime = state.pomodoro.shortBreakDuration;
            else if (state.pomodoro.mode === 'longBreak') state.pomodoro.currentTime = state.pomodoro.longBreakDuration;
            state.pomodoro.lastModeEnded = pomodoroLoadedState.lastModeEnded || null;
        }
    } else state = JSON.parse(JSON.stringify(initialDefaultState));
    state.isDarkMode = themeToApply; state.visuals.currentPalette = currentPaletteName; state.visuals.currentVisualMode = currentVisualModeName; state.activeTab = localStorage.getItem('taskify-activeTab') || initialDefaultState.activeTab;
    Object.keys(CHART_PERIOD_STORAGE_KEYS).forEach(key => { const savedPeriod = localStorage.getItem(CHART_PERIOD_STORAGE_KEYS[key]); if (savedPeriod && ['7days', '30days', 'lastYear', 'allTime'].includes(savedPeriod)) state.chartPeriods[key] = savedPeriod; else state.chartPeriods[key] = DEFAULT_CHART_PERIOD; });
    window.state = state;
}

function saveState() {
    try {
        const stateToSave = { ...state };
        if (stateToSave.recurringTaskPatterns && stateToSave.recurringTaskPatterns.length > 0) stateToSave.recurringTaskPatterns[0].id = SINGLE_ROUTINE_ID;
        if (!stateToSave.simuladosApp) stateToSave.simuladosApp = { simulados: [], categorias: [] };
        if (!stateToSave.redacoesApp) stateToSave.redacoesApp = { redacoes: [], eixosTematicos: [] };
        localStorage.setItem('taskify-state', JSON.stringify(stateToSave));
        localStorage.setItem('taskify-theme', state.isDarkMode ? 'dark' : 'light');
        if (state.visuals.currentPalette === 'custom') localStorage.setItem('taskify-primary-color', getComputedStyle(document.documentElement).getPropertyValue('--primary-color-dark').trim());
        else if (currentPalettes[state.visuals.currentPalette]) localStorage.setItem('taskify-primary-color', currentPalettes[state.visuals.currentPalette].primary);
        else localStorage.setItem('taskify-primary-color', currentPalettes.electricBlue.primary);
        localStorage.setItem('taskify-palette', state.visuals.currentPalette);
        localStorage.setItem('taskify-visual-mode', state.visuals.currentVisualMode);
        localStorage.setItem('taskify-activeTab', state.activeTab);
        Object.keys(CHART_PERIOD_STORAGE_KEYS).forEach(key => { if (state.chartPeriods[key]) localStorage.setItem(CHART_PERIOD_STORAGE_KEYS[key], state.chartPeriods[key]); });
    } catch (e) { console.error("Error saving state to localStorage:", e); }
}

function checkAllResets() {
    const todayStr = new Date().toDateString();
    if (state.lastAccessDate !== todayStr) { // Apenas executa a lógica de reset se for um novo dia
        checkAndResetDailyCounters(todayStr); // Passa todayStr para uso interno
        // As funções abaixo não precisam de todayStr pois usam o 'new Date()' internamente para a data atual
        checkAndResetWeeklyCounters();
        checkAndResetMonthlyCounters();
        checkAndResetYearlyCounters();
        if (state.pomodoro) {
            state.pomodoro.totalPomodorosToday = 0;
            state.pomodoro.sessions = state.pomodoro.sessions.filter(session => {
                try { const sessionDate = new Date(session.startTime); return sessionDate.toDateString() === todayStr; } catch (e) { return false; }
            });
        }
        state.lastAccessDate = todayStr; // Atualiza lastAccessDate APÓS todos os resets
        saveState(); // Salva o estado após os resets e atualização de lastAccessDate
    }
}

function checkAndResetDailyCounters(todayStr) { // todayStr é a data atual como string
    // A verificação state.lastAccessDate !== todayStr já foi feita em checkAllResets
    state.todayCount = 0;

    const arraysToShift = [
        'weeklyActivityData',
        'pomodoro.dailyFocusData',
        'dailyTaskCompletionData'
    ];

    arraysToShift.forEach(path => {
        let currentArray;
        let parent = state;
        const parts = path.split('.');
        if (parts.length > 1) {
            parent = parts.slice(0, -1).reduce((obj, part) => obj && obj[part], state);
            currentArray = parent ? parent[parts.pop()] : undefined;
        } else {
            currentArray = state[path];
        }

        if (currentArray && Array.isArray(currentArray) && currentArray.length === 7) {
            currentArray.shift();
            currentArray.push(0);
        } else {
            // Inicializa se não existir ou estiver malformado
            if (parent) {
                parent[parts.length > 0 ? parts.pop() : path] = [0,0,0,0,0,0,0];
            } else {
                 state[path] = [0,0,0,0,0,0,0]; // Para caminhos de nível único
            }
        }
    });

    state.tasks.forEach(task => { if (task.deletedThisInstanceOfDay) delete task.deletedThisInstanceOfDay; });
    if (state.recurringTaskPatterns.length > 0) {
        const routine = state.recurringTaskPatterns[0];
        for (const dayKey in routine.tasksByDay) routine.tasksByDay[dayKey].forEach(taskDef => taskDef.completed = false);
    }
}

function checkAndResetWeeklyCounters() {
    const currentWeekStartStr = getStartOfWeek(new Date()).toDateString();
    if (state.lastWeekStartDate !== currentWeekStartStr) {
        state.weeklyProgress = 0; state.lastWeekStartDate = currentWeekStartStr;
    }
}

function checkAndResetMonthlyCounters() {
    const currentMonthStartStr = getStartOfMonth(new Date()).toDateString();
    if (state.lastMonthStartDate !== currentMonthStartStr) {
        state.monthlyProgress = 0; state.lastMonthStartDate = currentMonthStartStr;
    }
}

function checkAndResetYearlyCounters() {
    const currentYearStartStr = getStartOfYear(new Date()).toDateString();
    if (state.lastYearStartDate !== currentYearStartStr) {
        state.yearlyProgress = 0; state.lastYearStartDate = currentYearStartStr;
    }
}

function updateCircularProgress(elementId, current, target) {
    const circle = document.getElementById(elementId); if (!circle) return;
    const radius = 52; const circumference = 2 * Math.PI * radius;
    if (circle.style.strokeDasharray !== `${circumference} ${circumference}`) circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const progress = target > 0 ? Math.min(current / target, 1) : 0;
    const dashoffsetValue = circumference * (1 - progress);
    circle.style.strokeDashoffset = dashoffsetValue;
}

function updateUI() {
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = (typeof value === 'number' && isNaN(value)) ? '0' : value; };
    setText('today-count', state.todayCount); setText('today-target', state.goals.daily); updateCircularProgress('today-progress', state.todayCount, state.goals.daily);
    setText('week-count', state.weeklyProgress); setText('week-target', state.goals.weekly); updateCircularProgress('week-progress', state.weeklyProgress, state.goals.weekly);
    setText('month-count', state.monthlyProgress); setText('month-target', state.goals.monthly); updateCircularProgress('month-progress', state.monthlyProgress, state.goals.monthly);
    setText('year-count', state.yearlyProgress); setText('year-target', state.goals.yearly); updateCircularProgress('year-progress', state.yearlyProgress, state.goals.yearly);
    setText('daily-record-value', formatUnit(state.dailyRecord.value, "questão", "questões")); setText('daily-record-date', state.dailyRecord.date || "-");
    updateStreakUI();
    setText('peak-activity-day', state.peakActivity.dayName || "-"); setText('peak-activity-questions', formatUnit(state.peakActivity.questions, "questão", "questões"));
    const streakTargetValueEl = document.getElementById('streak-target-value'); if (streakTargetValueEl) streakTargetValueEl.textContent = state.goals.streak;
    const dailyGoalInput = document.getElementById('daily-goal-input'); if (dailyGoalInput) dailyGoalInput.value = state.goals.daily;
    const weeklyGoalInput = document.getElementById('weekly-goal-input'); if (weeklyGoalInput) weeklyGoalInput.value = state.goals.weekly;
    const monthlyGoalInput = document.getElementById('monthly-goal-input'); if (monthlyGoalInput) monthlyGoalInput.value = state.goals.monthly;
    const yearlyGoalInput = document.getElementById('yearly-goal-input'); if (yearlyGoalInput) yearlyGoalInput.value = state.goals.yearly;
    const streakGoalInput = document.getElementById('streak-goal-input'); if (streakGoalInput) streakGoalInput.value = state.goals.streak;
    Object.keys(CHART_PERIOD_SELECTORS_IDS).forEach(chartKey => { const selector = document.getElementById(CHART_PERIOD_SELECTORS_IDS[chartKey]); if (selector && state.chartPeriods[chartKey]) selector.value = state.chartPeriods[chartKey]; });
    updateAllChartsForCurrentPeriods();
    updatePomodoroUI(); renderTasks(); updateCounterTooltips();
}

function getChartDataForPeriod(dataType, period) {
    let labels = []; let data = []; const today = new Date();
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    if (period === '7days') {
        labels = getLast7DayLabels();
        if (dataType === 'questions') data = state.weeklyActivityData ? [...state.weeklyActivityData] : Array(7).fill(0);
        else if (dataType === 'focus') data = state.pomodoro.dailyFocusData ? [...state.pomodoro.dailyFocusData] : Array(7).fill(0);
        else if (dataType === 'tasks') data = state.dailyTaskCompletionData ? [...state.dailyTaskCompletionData] : Array(7).fill(0);
    } else if (period === '30days') {
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today); date.setDate(today.getDate() - i);
            labels.push(`${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`);
            const dateISO = date.toISOString().split('T')[0];
            if (dataType === 'questions') data.push(state.currentStreak.history[dateISO] || 0);
            else if (dataType === 'focus') { let focusForDay = 0; state.pomodoro.sessions.forEach(s => { if (s.type === 'focus' && new Date(s.startTime).toISOString().split('T')[0] === dateISO) focusForDay += Math.round(s.duration / 60); }); data.push(focusForDay); }
            else if (dataType === 'tasks') { let tasksForDay = 0; state.tasks.forEach(t => { if (t.completed && t.completionDate && new Date(t.completionDate).toISOString().split('T')[0] === dateISO) tasksForDay++; }); data.push(tasksForDay); }
        }
    } else if (period === 'lastYear') {
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1); labels.push(monthNames[date.getMonth()]);
            let monthlyValue = 0;
            if (dataType === 'questions') { Object.keys(state.currentStreak.history).forEach(dayISO => { const entryDate = new Date(dayISO); if (entryDate.getFullYear() === date.getFullYear() && entryDate.getMonth() === date.getMonth()) monthlyValue += state.currentStreak.history[dayISO]; }); }
            else if (dataType === 'focus') { state.pomodoro.sessions.forEach(s => { if (s.type === 'focus') { const entryDate = new Date(s.startTime); if (entryDate.getFullYear() === date.getFullYear() && entryDate.getMonth() === date.getMonth()) monthlyValue += Math.round(s.duration / 60); } }); }
            else if (dataType === 'tasks') { state.tasks.forEach(t => { if (t.completed && t.completionDate) { const entryDate = new Date(t.completionDate); if (entryDate.getFullYear() === date.getFullYear() && entryDate.getMonth() === date.getMonth()) monthlyValue++; } }); }
            data.push(monthlyValue);
        }
    } else if (period === 'allTime') {
        let firstDate = new Date();
        if (dataType === 'questions' && Object.keys(state.currentStreak.history).length > 0) firstDate = new Date(Math.min(...Object.keys(state.currentStreak.history).map(d => new Date(d).getTime())));
        else if (dataType === 'focus' && state.pomodoro.sessions.length > 0) firstDate = new Date(Math.min(...state.pomodoro.sessions.map(s => new Date(s.startTime).getTime())));
        else if (dataType === 'tasks' && state.tasks.some(t => t.completed && t.completionDate)) firstDate = new Date(Math.min(...state.tasks.filter(t=>t.completed && t.completionDate).map(t => new Date(t.completionDate).getTime())));
        const startYear = firstDate.getFullYear(); const startMonth = firstDate.getMonth();
        const currentYear = today.getFullYear(); const currentMonth = today.getMonth();
        for (let y = startYear; y <= currentYear; y++) {
            const monthStart = (y === startYear) ? startMonth : 0; const monthEnd = (y === currentYear) ? currentMonth : 11;
            for (let m = monthStart; m <= monthEnd; m++) {
                labels.push(`${monthNames[m]}/${String(y).slice(-2)}`); let monthlyValue = 0;
                if (dataType === 'questions') { Object.keys(state.currentStreak.history).forEach(dayISO => { const entryDate = new Date(dayISO); if (entryDate.getFullYear() === y && entryDate.getMonth() === m) monthlyValue += state.currentStreak.history[dayISO]; }); }
                else if (dataType === 'focus') { state.pomodoro.sessions.forEach(s => { if (s.type === 'focus') { const entryDate = new Date(s.startTime); if (entryDate.getFullYear() === y && entryDate.getMonth() === m) monthlyValue += Math.round(s.duration / 60); } }); }
                else if (dataType === 'tasks') { state.tasks.forEach(t => { if (t.completed && t.completionDate) { const entryDate = new Date(t.completionDate); if (entryDate.getFullYear() === y && entryDate.getMonth() === m) monthlyValue++; } }); }
                data.push(monthlyValue);
            }
        }
    }
    return { labels, data };
}

function updateChartWithNewPeriod(chartInstance, chartKey, dataType, yAxisLabel, tooltipLabelPrefix, dataFormatter) {
    const period = state.chartPeriods[chartKey]; const { labels, data } = getChartDataForPeriod(dataType, period);
    if (chartInstance) {
        chartInstance.data.labels = labels; chartInstance.data.datasets[0].data = data;
        const chartCanvas = chartInstance.canvas; const ctx = chartCanvas.getContext('2d');
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim();
        if (chartInstance.config.type === 'line') {
            const gradient = ctx.createLinearGradient(0, 0, 0, chartCanvas.height * 0.8);
            try { gradient.addColorStop(0, hexToRgba(primaryColor, 0.3)); gradient.addColorStop(1, hexToRgba(primaryColor, 0)); } catch (e) { gradient.addColorStop(0, 'rgba(0,122,255,0.3)'); gradient.addColorStop(1, 'rgba(0,122,255,0)'); }
            chartInstance.data.datasets[0].backgroundColor = gradient; chartInstance.data.datasets[0].pointBackgroundColor = primaryColor;
        } else if (chartInstance.config.type === 'bar') { chartInstance.data.datasets[0].backgroundColor = primaryColor; chartInstance.data.datasets[0].borderColor = primaryColor; chartInstance.data.datasets[0].hoverBackgroundColor = hexToRgba(primaryColor, 0.8); chartInstance.data.datasets[0].hoverBorderColor = primaryColor; }
        chartInstance.data.datasets[0].borderColor = primaryColor; chartInstance.options.plugins.tooltip.borderColor = primaryColor;
        chartInstance.options.scales.y.title.text = yAxisLabel; chartInstance.options.plugins.tooltip.callbacks.label = (item) => `${tooltipLabelPrefix}: ${dataFormatter(item.raw)}`;
        chartInstance.update();
    }
}

function updateAllChartsForCurrentPeriods(animate = true) {
    const animationDuration = animate ? 800 : 0;
    if (weeklyChartInstance) weeklyChartInstance.options.animation.duration = animationDuration;
    if (pomodoroChartInstance) pomodoroChartInstance.options.animation.duration = animationDuration;
    if (tasksChartInstance) tasksChartInstance.options.animation.duration = animationDuration;
    updateChartWithNewPeriod(weeklyChartInstance, 'weeklyActivity', 'questions', 'Nº de Questões', 'Questões', val => val);
    updateChartWithNewPeriod(pomodoroChartInstance, 'pomodoroFocus', 'focus', 'Minutos de Foco', 'Foco', val => `${val.toFixed(0)} min`);
    updateChartWithNewPeriod(tasksChartInstance, 'tasksCompleted', 'tasks', 'Nº de Tarefas', 'Tarefas', val => val);
}

function handleChartPeriodChange(chartKey) {
    const selector = document.getElementById(CHART_PERIOD_SELECTORS_IDS[chartKey]);
    if (selector) { const newPeriod = selector.value; state.chartPeriods[chartKey] = newPeriod; saveState(); updateUI(); }
}

function updateDailyRecord() {
    let maxQuestionsInHistory = 0;
    let dateOfMaxQuestionsISO = null;

    for (const dateISO in state.currentStreak.history) {
        const count = state.currentStreak.history[dateISO];
        if (count > maxQuestionsInHistory) {
            maxQuestionsInHistory = count;
            dateOfMaxQuestionsISO = dateISO;
        } else if (count === maxQuestionsInHistory) {
            // Prioriza a data mais recente em caso de empate, ou 'hoje' se for um dos empatados
            if (!dateOfMaxQuestionsISO || dateISO > dateOfMaxQuestionsISO || dateISO === getTodayISO()) {
                 dateOfMaxQuestionsISO = dateISO;
            }
        }
    }
    
    if (maxQuestionsInHistory > 0 && dateOfMaxQuestionsISO) {
        state.dailyRecord.value = maxQuestionsInHistory;
        const dateParts = dateOfMaxQuestionsISO.split('-');
        state.dailyRecord.date = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]))
            .toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
    } else {
        state.dailyRecord.value = 0;
        state.dailyRecord.date = "-";
    }
}


function getStepValue() {
    const stepInput = document.getElementById('questions-step-input'); let step = parseInt(stepInput.value, 10);
    if (isNaN(step) || step < 1) { step = 1; stepInput.value = "1"; } return step;
}

function updateCounterTooltips() {
    const step = getStepValue(); const decrementBtn = document.getElementById('decrement-btn'); const incrementBtn = document.getElementById('increment-btn'); const stepInput = document.getElementById('questions-step-input');
    if (decrementBtn) decrementBtn.title = `Diminuir ${step} ${step === 1 ? 'questão' : 'questões'}`;
    if (incrementBtn) incrementBtn.title = `Aumentar ${step} ${step === 1 ? 'questão' : 'questões'}`;
    if (stepInput) stepInput.title = "Define a quantidade de questões por clique";
}

function incrementToday() {
    checkAllResets(); const step = getStepValue();
    state.todayCount += step; state.weeklyProgress += step; state.monthlyProgress += step; state.yearlyProgress += step;
    const todayISO = getTodayISO();
    state.currentStreak.history[todayISO] = (state.currentStreak.history[todayISO] || 0) + step;
    if (state.weeklyActivityData && state.weeklyActivityData.length === 7) state.weeklyActivityData[6] = state.currentStreak.history[todayISO];
    updateDailyRecord(); updatePeakActivity(); updateStreak(); saveState(); updateUI();
}

function decrementToday() {
    checkAllResets(); const step = getStepValue();
    const previousTodayCount = state.todayCount;
    state.todayCount = Math.max(0, state.todayCount - step);
    const actualDecrementAmount = previousTodayCount - state.todayCount;
    if (actualDecrementAmount > 0) {
        state.weeklyProgress = Math.max(0, state.weeklyProgress - actualDecrementAmount);
        state.monthlyProgress = Math.max(0, state.monthlyProgress - actualDecrementAmount);
        state.yearlyProgress = Math.max(0, state.yearlyProgress - actualDecrementAmount);
        const todayISO = getTodayISO();
        state.currentStreak.history[todayISO] = Math.max(0, (state.currentStreak.history[todayISO] || 0) - actualDecrementAmount);
        if (state.weeklyActivityData && state.weeklyActivityData.length === 7) state.weeklyActivityData[6] = state.currentStreak.history[todayISO] || 0;
    }
    updateDailyRecord(); updatePeakActivity(); updateStreak(); saveState(); updateUI();
}

function updatePeakActivity() {
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const today = new Date();
    let maxQuestions = 0;
    let peakDayName = "-";

    for (let i = 0; i < 7; i++) { // Itera pelos últimos 7 dias, incluindo hoje
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateISO = date.toISOString().split('T')[0];
        const questionsOnThisDay = state.currentStreak.history[dateISO] || 0;

        if (questionsOnThisDay > maxQuestions) {
            maxQuestions = questionsOnThisDay;
            peakDayName = dayNames[date.getDay()];
        } else if (questionsOnThisDay === maxQuestions && maxQuestions > 0) {
            // Em caso de empate, pode-se priorizar o dia mais recente, se desejado.
            // A lógica atual mantém o primeiro dia encontrado com o valor máximo.
            // Para priorizar o mais recente (que seria o `i` menor):
            peakDayName = dayNames[date.getDay()];
        }
    }
    state.peakActivity.dayName = maxQuestions > 0 ? peakDayName : "-";
    state.peakActivity.questions = maxQuestions;
}


function updateStreak() {
    const todayISO = getTodayISO(); const dailyGoal = state.goals.daily;
    const todayQuestionsCountFromHistory = state.currentStreak.history[todayISO] || 0;
    let { current, lastValidDate, history } = state.currentStreak; history = history || {};
    const goalMetToday = todayQuestionsCountFromHistory >= dailyGoal && dailyGoal > 0;
    if (lastValidDate === todayISO) {
        if (!goalMetToday) {
            current = Math.max(0, current - 1); let newLastValid = null;
            for (let i = 1; i <= current; i++) { const prevDate = new Date(todayISO); prevDate.setDate(prevDate.getDate() - i); const prevDateISO = prevDate.toISOString().split('T')[0]; if (history[prevDateISO] && history[prevDateISO] >= dailyGoal) { newLastValid = prevDateISO; break; } }
            lastValidDate = newLastValid; if (current === 0) lastValidDate = null;
        }
    } else {
        if (goalMetToday) {
            const yesterday = new Date(todayISO); yesterday.setDate(yesterday.getDate() - 1); const yesterdayISO = yesterday.toISOString().split('T')[0];
            if (lastValidDate === yesterdayISO) current += 1; else current = 1;
            lastValidDate = todayISO;
        } else {
            const todayDateObj = new Date(todayISO); const lastValidDateObj = lastValidDate ? new Date(lastValidDate) : null;
            if (lastValidDateObj) { const diffTime = todayDateObj - lastValidDateObj; const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); if (diffDays > 1) { current = 0; lastValidDate = null; } }
        }
    }
    state.currentStreak.days = current; state.currentStreak.lastCompletionDate = lastValidDate;
}

function saveStreakData(data) { localStorage.setItem('taskify-streak', JSON.stringify(data)); } // A updateStreak original chamava isso, mas agora o saveState global deve cuidar.

function updateStreakUI() {
    const setText = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    setText('current-streak-value', formatUnit(state.currentStreak.days, "dia", "dias"));
    const streakFillEl = document.getElementById('streak-progress-fill');
    if (streakFillEl) { const streakProgressPercent = state.goals.streak > 0 ? Math.min((state.currentStreak.days / state.goals.streak) * 100, 100) : 0; streakFillEl.style.width = `${streakProgressPercent}%`; }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId); const overlay = document.getElementById(`${modalId}-overlay`);
    if (modal && overlay) {
        overlay.classList.add('show'); modal.classList.add('show'); document.body.classList.add('modal-open');
        const focusable = modal.querySelector('input:not([type=hidden]), textarea, select, button'); if (focusable) focusable.focus();
        const modalContent = modal.querySelector('.modal-content'); if (modalContent) modalContent.scrollTop = 0;
    } else console.error(`Modal ou Overlay não encontrado para ID: ${modalId}`);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId); const overlay = document.getElementById(`${modalId}-overlay`);
    if (modal && overlay) { modal.classList.remove('show'); overlay.classList.remove('show'); if (!document.querySelector('.modal.show')) document.body.classList.remove('modal-open'); }
}

function openGoalsModal() {
    const dailyGoalInput = document.getElementById('daily-goal-input'); if (dailyGoalInput) dailyGoalInput.value = state.goals.daily;
    const weeklyGoalInput = document.getElementById('weekly-goal-input'); if (weeklyGoalInput) weeklyGoalInput.value = state.goals.weekly;
    const monthlyGoalInput = document.getElementById('monthly-goal-input'); if (monthlyGoalInput) monthlyGoalInput.value = state.goals.monthly;
    const yearlyGoalInput = document.getElementById('yearly-goal-input'); if (yearlyGoalInput) yearlyGoalInput.value = state.goals.yearly;
    const streakGoalInput = document.getElementById('streak-goal-input'); if (streakGoalInput) streakGoalInput.value = state.goals.streak;
    openModal('goals-modal');
}

function saveGoals() {
    const daily = parseInt(document.getElementById('daily-goal-input').value); const weekly = parseInt(document.getElementById('weekly-goal-input').value); const monthly = parseInt(document.getElementById('monthly-goal-input').value); const yearly = parseInt(document.getElementById('yearly-goal-input').value); const streakGoal = parseInt(document.getElementById('streak-goal-input').value);
    if (isNaN(daily) || daily < 1 || isNaN(weekly) || weekly < 1 || isNaN(monthly) || monthly < 1 || isNaN(yearly) || yearly < 1 || isNaN(streakGoal) || streakGoal < 1) { showCustomAlert("Todas as metas devem ser números positivos.", "Erro de Validação"); return; }
    state.goals = { daily, weekly, monthly, yearly, streak: streakGoal }; saveState(); updateUI(); updateStreak(); closeModal('goals-modal');
}

function toggleTheme() {
    state.isDarkMode = !state.isDarkMode; applyCurrentThemeAndMode(); saveState();
    document.dispatchEvent(new CustomEvent('taskifyThemeChanged', { detail: { isDarkMode: state.isDarkMode } }));
}

function applyPrimaryColor(color) {
    document.documentElement.style.setProperty('--primary-color-light', color); document.documentElement.style.setProperty('--primary-color-dark', color);
    const rgbArray = hexToRgbArray(color); if (rgbArray) { document.documentElement.style.setProperty('--primary-color-light-rgb', rgbArray.join(', ')); document.documentElement.style.setProperty('--primary-color-dark-rgb', rgbArray.join(', ')); }
}

function applyCurrentThemeAndMode() {
    const body = document.body; const themeIcon = document.getElementById('theme-icon'); const faviconEl = document.getElementById('favicon'); const docElement = document.documentElement;
    Object.keys(VISUAL_MODES).forEach(modeKey => body.classList.remove(`theme-mode-${modeKey}`));
    if (state.visuals.currentVisualMode && state.visuals.currentVisualMode !== 'default') body.classList.add(`theme-mode-${state.visuals.currentVisualMode}`);
    docElement.classList.toggle('light-theme-active', !state.isDarkMode); body.classList.toggle('light', !state.isDarkMode);
    if (themeIcon) themeIcon.className = state.isDarkMode ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    let currentPrimaryColor = currentPalettes.electricBlue.primary;
    if (state.visuals.currentPalette === 'custom') currentPrimaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color-dark').trim() || currentPalettes.electricBlue.primary;
    else if (currentPalettes[state.visuals.currentPalette]) currentPrimaryColor = currentPalettes[state.visuals.currentPalette].primary;
    applyPrimaryColor(currentPrimaryColor);
    if (faviconEl) { const faviconBaseColor = currentPrimaryColor; const faviconSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'><rect width='24' height='24' rx='4' fill='${faviconBaseColor}'/><path fill='white' d='M13.083 3.031a.5.5 0 0 0-.944-.313L5.986 13.41a.5.5 0 0 0 .38.738H11V21a.5.5 0 0 0 .893.33L17.83 10.33a.5.5 0 0 0-.743-.66l-3.087 2.7V3.57a.5.5 0 0 0-.5-.5zM12 4.553v5.377l2.49-2.18L12 4.553zm-1 5.92L8.046 13H11v-2.527z'/></svg>`; faviconEl.href = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`; }
    setupChart(false, state.chartPeriods.weeklyActivity); setupPomodoroChart(false, state.chartPeriods.pomodoroFocus); setupTasksChart(false, state.chartPeriods.tasksCompleted);
    updatePomodoroUI(); renderTasks(); updateThemeModalButtons();
}

function createChartConfig(canvasId, initialData, label, yAxisLabel, tooltipLabelPrefix, dataFormatter = (val) => val, chartType = 'line') {
    const chartCanvas = document.getElementById(canvasId); if (!chartCanvas) return null; const ctx = chartCanvas.getContext('2d');
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim();
    const gridColor = state.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'; const textColor = state.isDarkMode ? '#AAA' : '#555';
    const tooltipBackgroundColor = state.isDarkMode ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.95)'; const tooltipTextColor = state.isDarkMode ? '#FFFFFF' : '#222';
    const bodyBgColor = getComputedStyle(document.body).backgroundColor;
    let datasetOptions = { label: label, data: initialData.data, borderColor: primaryColor, tension: 0.4, pointBorderColor: bodyBgColor, pointBorderWidth: 1.5, pointHoverBackgroundColor: primaryColor, pointHoverBorderColor: bodyBgColor, pointHoverBorderWidth: 2, pointRadius: 4, pointHoverRadius: 7, };
    if (chartType === 'line') {
        const gradient = ctx.createLinearGradient(0, 0, 0, chartCanvas.height * 0.8);
        try { gradient.addColorStop(0, hexToRgba(primaryColor, 0.3)); gradient.addColorStop(1, hexToRgba(primaryColor, 0)); } catch (e) { gradient.addColorStop(0, 'rgba(0,122,255,0.3)'); gradient.addColorStop(1, 'rgba(0,122,255,0)'); console.warn("Chart gradient color fallback used for:", canvasId, e); }
        datasetOptions.backgroundColor = gradient; datasetOptions.fill = true; datasetOptions.pointBackgroundColor = primaryColor;
    } else if (chartType === 'bar') {
        datasetOptions.backgroundColor = primaryColor; datasetOptions.borderColor = primaryColor; datasetOptions.borderWidth = 1; datasetOptions.borderRadius = 4; datasetOptions.hoverBackgroundColor = hexToRgba(primaryColor, 0.8); datasetOptions.hoverBorderColor = primaryColor;
        delete datasetOptions.tension; delete datasetOptions.pointBackgroundColor; delete datasetOptions.pointBorderColor; delete datasetOptions.pointBorderWidth; delete datasetOptions.pointHoverBackgroundColor; delete datasetOptions.pointHoverBorderColor; delete datasetOptions.pointHoverBorderWidth; delete datasetOptions.pointRadius; delete datasetOptions.pointHoverRadius; delete datasetOptions.fill;
    }
    return new Chart(ctx, { type: chartType, data: { labels: initialData.labels, datasets: [datasetOptions] },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 800 }, scales: { y: { beginAtZero: true, grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, precision: 0, callback: dataFormatter }, title: { display: true, text: yAxisLabel, color: textColor, font: { size: 10 } }, afterDataLimits: (axis) => { if (axis.max === 0 && axis.min === 0) { axis.max = (yAxisLabel && yAxisLabel.toLowerCase().includes("minutos")) ? 10 : 1; if (chartType === 'bar') axis.max = 5; } } }, x: { grid: { display: chartType === 'line' ? false : true, color: gridColor, drawBorder: false }, ticks: { color: textColor } } }, plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: tooltipBackgroundColor, titleColor: tooltipTextColor, bodyColor: tooltipTextColor, titleFont: { weight: 'bold', size: 13 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6, borderColor: primaryColor, borderWidth: 1, displayColors: false, callbacks: { title: (items) => items[0].label, label: (item) => `${tooltipLabelPrefix}: ${dataFormatter(item.raw)}` } } }, interaction: { mode: 'index', intersect: false }, hover: { mode: 'nearest', intersect: true } }
    });
}

function setupChart(animateInitialRender = true, chartKey = 'weeklyActivity') {
    if (weeklyChartInstance) weeklyChartInstance.destroy();
    const period = state.chartPeriods[chartKey] || DEFAULT_CHART_PERIOD; const chartData = getChartDataForPeriod('questions', period);
    weeklyChartInstance = createChartConfig('weeklyActivityChart', chartData, 'Questões', 'Nº de Questões', 'Questões', val => val, 'line');
    if (weeklyChartInstance) weeklyChartInstance.options.animation.duration = animateInitialRender ? 800 : 0;
}

function setupPomodoroChart(animateInitialRender = true, chartKey = 'pomodoroFocus') {
    if (pomodoroChartInstance) pomodoroChartInstance.destroy();
    const period = state.chartPeriods[chartKey] || DEFAULT_CHART_PERIOD; const chartData = getChartDataForPeriod('focus', period);
    pomodoroChartInstance = createChartConfig('weeklyPomodoroFocusChart', chartData, 'Tempo de Foco', 'Minutos de Foco', 'Foco', (value) => `${parseFloat(value).toFixed(0)} min`, 'line');
    if (pomodoroChartInstance) pomodoroChartInstance.options.animation.duration = animateInitialRender ? 800 : 0;
}

function setupTasksChart(animateInitialRender = true, chartKey = 'tasksCompleted') {
    if (tasksChartInstance) tasksChartInstance.destroy();
    const period = state.chartPeriods[chartKey] || DEFAULT_CHART_PERIOD; const chartData = getChartDataForPeriod('tasks', period);
    tasksChartInstance = createChartConfig('weeklyTasksCompletedChart', chartData, 'Tarefas Concluídas', 'Nº de Tarefas', 'Tarefas', val => Math.round(val), 'bar');
    if (tasksChartInstance) tasksChartInstance.options.animation.duration = animateInitialRender ? 800 : 0;
}

// --- Funções de Inicialização e Lógica do Pomodoro, Tarefas, etc. (sem alterações significativas, exceto onde indicado) ---
// ... (código existente de initPomodoro, Pomodoro UI, Pomodoro Logic, Tasks, Themes, Modals, etc.)
// ... As funções que atualizam os arrays de 7 dias (`dailyFocusData`, `dailyTaskCompletionData`)
//     precisam garantir que o índice `[6]` seja atualizado para o dia atual.

function initStreak() {
    const savedData = localStorage.getItem('taskify-streak');
    let initialStreakDays = 0; let initialLastCompletionDate = null; let initialHistory = {};
    if (savedData) {
        try {
            const streakData = JSON.parse(savedData);
            if (streakData && typeof streakData.current === 'number' && streakData.current >= 0) { initialStreakDays = streakData.current; initialLastCompletionDate = streakData.lastValidDate || null; initialHistory = (typeof streakData.history === 'object' && streakData.history !== null) ? streakData.history : {}; } else localStorage.removeItem('taskify-streak');
        } catch (e) { console.error("Error parsing streak data in initStreak:", e); localStorage.removeItem('taskify-streak'); }
    }
    state.currentStreak.days = initialStreakDays; state.currentStreak.lastCompletionDate = initialLastCompletionDate; state.currentStreak.history = initialHistory;
    const currentStreakDataToStore = { current: state.currentStreak.days, lastValidDate: state.currentStreak.lastCompletionDate, history: state.currentStreak.history };
    localStorage.setItem('taskify-streak', JSON.stringify(currentStreakDataToStore));
    updateStreak(); updateStreakUI();
}

function formatTime(seconds) { const mins = Math.floor(seconds / 60); const secs = seconds % 60; return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`; }

function updatePomodoroUI() {
    const pomodoro = state.pomodoro; const timerDisplay = document.getElementById('pomodoro-timer-display'); const statusDisplay = document.getElementById('pomodoro-status'); const cyclesCountValueDisplay = document.getElementById('pomodoro-cycles-count-value'); const startBtn = document.getElementById('pomodoro-start-btn'); const pauseBtn = document.getElementById('pomodoro-pause-btn');
    if (timerDisplay) timerDisplay.textContent = formatTime(pomodoro.currentTime);
    if (statusDisplay) { if (pomodoro.timerRunning) statusDisplay.textContent = pomodoro.mode === 'focus' ? 'Foco Ativo...' : (pomodoro.mode === 'shortBreak' ? 'Pausa Curta...' : 'Pausa Longa...'); else { if (pomodoro.lastModeEnded) { const nextModeText = pomodoro.mode === 'focus' ? 'Foco' : (pomodoro.mode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa'); statusDisplay.textContent = `Próximo: ${nextModeText}`; } else statusDisplay.textContent = `Pronto para ${pomodoro.mode === 'focus' ? 'focar?' : (pomodoro.mode === 'shortBreak' ? 'uma pausa curta?' : 'uma pausa longa?')}`; } }
    if (cyclesCountValueDisplay) cyclesCountValueDisplay.textContent = pomodoro.totalPomodorosToday;
    if (startBtn && pauseBtn) { startBtn.style.display = pomodoro.timerRunning ? 'none' : 'inline-block'; pauseBtn.style.display = pomodoro.timerRunning ? 'inline-block' : 'none'; if (pomodoro.mode === 'focus') { startBtn.classList.remove('break-mode'); if (timerDisplay) timerDisplay.classList.remove('break-mode'); } else { startBtn.classList.add('break-mode'); if (timerDisplay) timerDisplay.classList.add('break-mode'); } if (!pomodoro.timerRunning) { const isAtFullDurationForCurrentMode = pomodoro.currentTime === (pomodoro.mode === 'focus' ? pomodoro.focusDuration : (pomodoro.mode === 'shortBreak' ? pomodoro.shortBreakDuration : pomodoro.longBreakDuration)); startBtn.textContent = isAtFullDurationForCurrentMode ? 'Iniciar' : 'Continuar'; } }
    if (pomodoro.timerRunning) document.title = `${formatTime(pomodoro.currentTime)} - ${pomodoro.mode === 'focus' ? 'Foco' : 'Pausa'} | Taskify`; else { const dailyGoalPercentage = state.goals.daily > 0 ? Math.round((state.todayCount / state.goals.daily) * 100) : 0; document.title = `(${dailyGoalPercentage}%) Taskify`; }
}

function playSound(soundElement) {
    if (!soundElement) { console.warn("playSound: soundElement é nulo ou indefinido."); return; }
    if (typeof soundElement.play === 'function') { soundElement.currentTime = 0; soundElement.play().catch(error => console.warn(`TASKIFY_SOUND: Erro ao tocar som ${soundElement.id}:`, error)); } else console.warn(`playSound: ${soundElement.id} não tem uma função play.`);
}

function handlePomodoroTick() {
    if (!state.pomodoro.timerRunning) return; state.pomodoro.currentTime--;
    if (state.pomodoro.currentTime < 0) handlePomodoroCycleEnd(); else updatePomodoroUI();
}

function handlePomodoroCycleEnd() {
    const endedMode = state.pomodoro.mode; let actualDurationSeconds = 0;
    if (endedMode === 'focus') actualDurationSeconds = state.pomodoro.focusDuration - Math.max(0, state.pomodoro.currentTime);
    else if (endedMode === 'shortBreak') actualDurationSeconds = state.pomodoro.shortBreakDuration - Math.max(0, state.pomodoro.currentTime);
    else actualDurationSeconds = state.pomodoro.longBreakDuration - Math.max(0, state.pomodoro.currentTime);
    if (endedMode === 'focus' && actualDurationSeconds > 0) {
        if (state.pomodoro.dailyFocusData && state.pomodoro.dailyFocusData.length === 7) state.pomodoro.dailyFocusData[6] += Math.round(actualDurationSeconds / 60);
        logPomodoroSession(endedMode, actualDurationSeconds); updateChartWithNewPeriod(pomodoroChartInstance, 'pomodoroFocus', 'focus', 'Minutos de Foco', 'Foco', val => `${val.toFixed(0)} min`);
    } else if (endedMode !== 'focus' && actualDurationSeconds > 0) logPomodoroSession(endedMode, actualDurationSeconds);
    state.pomodoro.timerRunning = false; if (pomodoroInterval) { clearInterval(pomodoroInterval); pomodoroInterval = null; }
    let nextModeMessage = "";
    if (endedMode === 'focus') {
        state.pomodoro.totalPomodorosToday++; state.pomodoro.currentCycleInSet++; if (state.pomodoro.enableSound && focusEndSound) playSound(focusEndSound);
        if (state.pomodoro.currentCycleInSet >= state.pomodoro.cyclesBeforeLongBreak) { state.pomodoro.mode = 'longBreak'; state.pomodoro.currentTime = state.pomodoro.longBreakDuration; state.pomodoro.currentCycleInSet = 0; nextModeMessage = "Hora da pausa longa!"; } else { state.pomodoro.mode = 'shortBreak'; state.pomodoro.currentTime = state.pomodoro.shortBreakDuration; nextModeMessage = "Hora da pausa curta!"; }
    } else { if (state.pomodoro.enableSound && breakEndSound) playSound(breakEndSound); state.pomodoro.mode = 'focus'; state.pomodoro.currentTime = state.pomodoro.focusDuration; nextModeMessage = "Hora de focar!"; }
    state.pomodoro.lastModeEnded = endedMode; updatePomodoroUI(); saveState();
    showCustomAlert(`Ciclo de ${endedMode === 'focus' ? 'Foco' : (endedMode === 'shortBreak' ? 'Pausa Curta' : 'Pausa Longa')} terminado! ${nextModeMessage}`, "Pomodoro", () => { const pomodoroSectionEl = document.querySelector('.pomodoro-section'); if (pomodoroSectionEl) setTimeout(() => pomodoroSectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); const currentEndedMode = state.pomodoro.lastModeEnded; if ((currentEndedMode === 'focus' && state.pomodoro.autoStartBreaks) || ((currentEndedMode === 'shortBreak' || currentEndedMode === 'longBreak') && state.pomodoro.autoStartFocus)) startPomodoro(); });
}

function startPomodoro() {
    if (state.pomodoro.timerRunning) return; checkAllResets(); state.pomodoro.timerRunning = true; state.pomodoro.lastModeEnded = null;
    if (pomodoroInterval) clearInterval(pomodoroInterval); pomodoroInterval = setInterval(handlePomodoroTick, 1000); updatePomodoroUI(); saveState();
}

function pausePomodoro() {
    if (!state.pomodoro.timerRunning) return; state.pomodoro.timerRunning = false; clearInterval(pomodoroInterval); pomodoroInterval = null; updatePomodoroUI(); saveState();
}

function resetPomodoro() {
    const wasRunning = state.pomodoro.timerRunning; const endedMode = state.pomodoro.mode; const timeRemaining = state.pomodoro.currentTime;
    if (wasRunning && endedMode === 'focus') { let timeSpentSeconds = state.pomodoro.focusDuration - timeRemaining; if (timeSpentSeconds > 0) { if (state.pomodoro.dailyFocusData && state.pomodoro.dailyFocusData.length === 7) state.pomodoro.dailyFocusData[6] += Math.round(timeSpentSeconds / 60); logPomodoroSession(endedMode, timeSpentSeconds); } } else if (wasRunning && endedMode !== 'focus') { let timeSpentSeconds = (endedMode === 'shortBreak' ? state.pomodoro.shortBreakDuration : state.pomodoro.longBreakDuration) - timeRemaining; if (timeSpentSeconds > 0) logPomodoroSession(endedMode, timeSpentSeconds); }
    state.pomodoro.timerRunning = false; clearInterval(pomodoroInterval); pomodoroInterval = null; state.pomodoro.lastModeEnded = null; state.pomodoro.mode = 'focus'; state.pomodoro.currentTime = state.pomodoro.focusDuration; updatePomodoroUI(); updateChartWithNewPeriod(pomodoroChartInstance, 'pomodoroFocus', 'focus', 'Minutos de Foco', 'Foco', val => `${val.toFixed(0)} min`); saveState();
}

function openPomodoroSettingsModal() { document.getElementById('pomodoro-focus-duration-input').value = state.pomodoro.focusDuration / 60; document.getElementById('pomodoro-short-break-duration-input').value = state.pomodoro.shortBreakDuration / 60; document.getElementById('pomodoro-long-break-duration-input').value = state.pomodoro.longBreakDuration / 60; document.getElementById('pomodoro-cycles-before-long-break-input').value = state.pomodoro.cyclesBeforeLongBreak; document.getElementById('pomodoro-auto-start-breaks-checkbox').checked = state.pomodoro.autoStartBreaks; document.getElementById('pomodoro-auto-start-focus-checkbox').checked = state.pomodoro.autoStartFocus; document.getElementById('pomodoro-enable-sound-checkbox').checked = state.pomodoro.enableSound; openModal('pomodoro-settings-modal'); }
function closePomodoroSettingsModal() { closeModal('pomodoro-settings-modal'); }

function savePomodoroSettings() {
    const focusDuration = parseInt(document.getElementById('pomodoro-focus-duration-input').value) * 60; const shortBreakDuration = parseInt(document.getElementById('pomodoro-short-break-duration-input').value) * 60; const longBreakDuration = parseInt(document.getElementById('pomodoro-long-break-duration-input').value) * 60; const cyclesBeforeLongBreak = parseInt(document.getElementById('pomodoro-cycles-before-long-break-input').value); const autoStartBreaks = document.getElementById('pomodoro-auto-start-breaks-checkbox').checked; const autoStartFocus = document.getElementById('pomodoro-auto-start-focus-checkbox').checked; const enableSound = document.getElementById('pomodoro-enable-sound-checkbox').checked;
    if (isNaN(focusDuration) || focusDuration < 60 || isNaN(shortBreakDuration) || shortBreakDuration < 60 || isNaN(longBreakDuration) || longBreakDuration < 60 || isNaN(cyclesBeforeLongBreak) || cyclesBeforeLongBreak < 1) { showCustomAlert("Configurações do Pomodoro inválidas. Verifique os valores (duração mínima de 1 minuto).", "Erro de Validação"); return; }
    state.pomodoro.focusDuration = focusDuration; state.pomodoro.shortBreakDuration = shortBreakDuration; state.pomodoro.longBreakDuration = longBreakDuration; state.pomodoro.cyclesBeforeLongBreak = cyclesBeforeLongBreak; state.pomodoro.autoStartBreaks = autoStartBreaks; state.pomodoro.autoStartFocus = autoStartFocus; state.pomodoro.enableSound = enableSound;
    if (!state.pomodoro.timerRunning) { if (state.pomodoro.mode === 'focus') state.pomodoro.currentTime = state.pomodoro.focusDuration; else if (state.pomodoro.mode === 'shortBreak') state.pomodoro.currentTime = state.pomodoro.shortBreakDuration; else if (state.pomodoro.mode === 'longBreak') state.pomodoro.currentTime = state.pomodoro.longBreakDuration; state.pomodoro.lastModeEnded = null; }
    saveState(); updatePomodoroUI(); closePomodoroSettingsModal();
}

function logPomodoroSession(type, durationInSeconds) { if (durationInSeconds <= 0) return; const session = { startTime: new Date(Date.now() - durationInSeconds * 1000).toISOString(), endTime: new Date().toISOString(), duration: durationInSeconds, type: type }; state.pomodoro.sessions.push(session); }

function populateNewPomodoroDetails() {
    if (!newPomodoroCycleList || !newPomodoroDetailsEmptyMessage || !newPomodoroDetailsSessionsCount || !newPomodoroDetailsTotalFocusTime) return;
    newPomodoroCycleList.innerHTML = ''; const todayISO = getTodayISO();
    const sessionsToday = state.pomodoro.sessions.filter(session => { try { return new Date(session.startTime).toISOString().split('T')[0] === todayISO; } catch (e) { return false; } });
    let totalFocusTimeMinutes = 0; sessionsToday.forEach(session => { if (session.type === 'focus') totalFocusTimeMinutes += Math.round((session.duration || 0) / 60); });
    newPomodoroDetailsSessionsCount.textContent = sessionsToday.length; newPomodoroDetailsTotalFocusTime.textContent = `${totalFocusTimeMinutes}min`;
    if (sessionsToday.length === 0) { newPomodoroDetailsEmptyMessage.style.display = 'block'; newPomodoroCycleList.style.display = 'none'; return; }
    newPomodoroDetailsEmptyMessage.style.display = 'none'; newPomodoroCycleList.style.display = 'block';
    sessionsToday.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    sessionsToday.forEach(session => {
        const li = document.createElement('li'); li.className = 'new-pomodoro-cycle-item';
        const iconDiv = document.createElement('div'); iconDiv.className = 'cycle-item-icon'; const icon = document.createElement('i');
        let sessionTypeText = '';
        if (session.type === 'focus') { icon.className = 'bi bi-stopwatch-fill'; sessionTypeText = 'Foco'; } else if (session.type === 'shortBreak') { icon.className = 'bi bi-cup-straw'; sessionTypeText = 'Pausa Curta'; } else if (session.type === 'longBreak') { icon.className = 'bi bi-cup-hot-fill'; sessionTypeText = 'Pausa Longa'; }
        iconDiv.appendChild(icon); const contentDiv = document.createElement('div'); contentDiv.className = 'cycle-item-content';
        const headerDiv = document.createElement('div'); headerDiv.className = 'cycle-item-header'; const typeSpan = document.createElement('span'); typeSpan.className = 'cycle-item-type'; typeSpan.textContent = sessionTypeText; headerDiv.appendChild(typeSpan);
        const detailsDiv = document.createElement('div'); detailsDiv.className = 'cycle-item-details'; const startTimeObj = new Date(session.startTime); const startTimeFormatted = `${String(startTimeObj.getHours()).padStart(2, '0')}:${String(startTimeObj.getMinutes()).padStart(2, '0')}`;
        let durationText; const durationMinutes = Math.round((session.duration || 0) / 60); if (durationMinutes > 0) durationText = `${durationMinutes} min`; else if (session.duration > 0) durationText = `< 1 min`; else durationText = `0 min`;
        detailsDiv.textContent = `${startTimeFormatted} · ${durationText}`;
        contentDiv.appendChild(headerDiv); contentDiv.appendChild(detailsDiv); li.appendChild(iconDiv); li.appendChild(contentDiv); newPomodoroCycleList.appendChild(li);
    });
}
function openNewPomodoroDetailsModal() { populateNewPomodoroDetails(); openModal('new-pomodoro-details-modal'); }
function closeNewPomodoroDetailsModal() { closeModal('new-pomodoro-details-modal'); }
function handleNewCycleFromDetailsModal() { closeNewPomodoroDetailsModal(); resetPomodoro(); startPomodoro(); const pomodoroSectionEl = document.querySelector('.pomodoro-section'); if (pomodoroSectionEl) pomodoroSectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

function initPomodoro() {
    focusEndSound = document.getElementById('focus-end-sound'); breakEndSound = document.getElementById('break-end-sound');
    newPomodoroDetailsModal = document.getElementById('new-pomodoro-details-modal'); newPomodoroDetailsModalOverlay = document.getElementById('new-pomodoro-details-modal-overlay'); newPomodoroDetailsCloseBtnX = document.getElementById('new-pomodoro-details-close-btn-x'); newPomodoroDetailsSessionsCount = document.getElementById('details-sessions-count'); newPomodoroDetailsTotalFocusTime = document.getElementById('details-total-focus-time'); newPomodoroCycleList = document.getElementById('new-pomodoro-cycle-list'); newPomodoroDetailsEmptyMessage = document.getElementById('new-pomodoro-details-empty-message'); newPomodoroDetailsBtnClose = document.getElementById('new-pomodoro-details-btn-close'); newPomodoroDetailsBtnNewCycle = document.getElementById('new-pomodoro-details-btn-new-cycle');
    const pomodoroSettingsForm = document.getElementById('pomodoro-settings-form'); if (pomodoroSettingsForm) pomodoroSettingsForm.addEventListener('submit', (e) => { e.preventDefault(); savePomodoroSettings(); });
    const pomodoroSettingsModalOverlay = document.getElementById('pomodoro-settings-modal-overlay'); if (pomodoroSettingsModalOverlay) pomodoroSettingsModalOverlay.addEventListener('click', (e) => { if (e.target === pomodoroSettingsModalOverlay) closePomodoroSettingsModal(); });
    const btnViewCycleStats = document.getElementById('btn-view-cycle-stats'); if (btnViewCycleStats) btnViewCycleStats.addEventListener('click', openNewPomodoroDetailsModal);
    if (newPomodoroDetailsModalOverlay) newPomodoroDetailsModalOverlay.addEventListener('click', (e) => { if (e.target === newPomodoroDetailsModalOverlay) closeNewPomodoroDetailsModal(); });
    if (newPomodoroDetailsCloseBtnX) newPomodoroDetailsCloseBtnX.addEventListener('click', closeNewPomodoroDetailsModal);
    if (newPomodoroDetailsBtnClose) newPomodoroDetailsBtnClose.addEventListener('click', closeNewPomodoroDetailsModal);
    if (newPomodoroDetailsBtnNewCycle) newPomodoroDetailsBtnNewCycle.addEventListener('click', handleNewCycleFromDetailsModal);
    updatePomodoroUI();
}

function renderTasks() {
    const taskList = document.getElementById('task-list'); if (!taskList) return; taskList.innerHTML = ''; const todayISO = getTodayISO();
    generateRecurringTaskInstances();
    const tasksToDisplay = state.tasks.filter(task => { if (task.deletedThisInstanceOfDay && task.assignedDate === todayISO) return false; if (task.isRecurringInstance) return task.assignedDate === getTodayISO(); return true; });
    const sortedTasks = [...tasksToDisplay].sort((a, b) => { if (a.completed !== b.completed) return a.completed ? 1 : -1; const aDateStr = a.assignedDate || "0000-00-00"; const bDateStr = b.assignedDate || "0000-00-00"; const aIsTodayOrNull = a.assignedDate === todayISO || a.assignedDate === null; const bIsTodayOrNull = b.assignedDate === todayISO || b.assignedDate === null; if (aIsTodayOrNull && !bIsTodayOrNull) return -1; if (!aIsTodayOrNull && bIsTodayOrNull) return 1; if (aDateStr < bDateStr) return -1; if (aDateStr > bDateStr) return 1; return new Date(a.createdAt) - new Date(b.createdAt); });
    if (sortedTasks.length === 0) { const emptyTaskMessage = document.createElement('li'); emptyTaskMessage.className = 'task-list-empty-message'; emptyTaskMessage.textContent = 'Nenhuma tarefa para hoje. Adicione algumas!'; taskList.appendChild(emptyTaskMessage); } else { sortedTasks.forEach(task => { const li = document.createElement('li'); li.className = 'task-item'; if (task.completed) li.classList.add('completed'); li.dataset.taskId = task.id; li.setAttribute('draggable', 'true'); li.addEventListener('dragstart', handleDragStart); li.addEventListener('dragend', handleDragEnd); const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'task-item-checkbox'; checkbox.checked = task.completed; checkbox.addEventListener('change', () => toggleTaskComplete(task.id, task.isRecurringInstance, task.sourcePatternId, task.originalPatternTaskId)); const textSpan = document.createElement('span'); textSpan.className = 'task-item-text'; textSpan.textContent = task.text; if (task.isRecurringInstance || task.sourcePatternId) { const recurringIcon = document.createElement('i'); recurringIcon.className = 'bi bi-arrow-repeat task-recurring-icon'; recurringIcon.title = 'Tarefa Recorrente'; textSpan.prepend(recurringIcon); } if (task.assignedDate && task.assignedDate !== todayISO) { const dateIndicator = document.createElement('span'); dateIndicator.className = 'task-assigned-date-indicator'; const assignedDateParts = task.assignedDate.split('-'); const assignedDateObj = new Date(parseInt(assignedDateParts[0]), parseInt(assignedDateParts[1]) - 1, parseInt(assignedDateParts[2])); assignedDateObj.setHours(0, 0, 0, 0); const todayDateObj = new Date(); todayDateObj.setHours(0, 0, 0, 0); const tomorrowDateObj = new Date(todayDateObj); tomorrowDateObj.setDate(todayDateObj.getDate() + 1); const yesterdayDateObj = new Date(todayDateObj); yesterdayDateObj.setDate(todayDateObj.getDate() - 1); if (assignedDateObj.getTime() === yesterdayDateObj.getTime()) dateIndicator.textContent = 'Ontem'; else if (assignedDateObj.getTime() === tomorrowDateObj.getTime()) dateIndicator.textContent = 'Amanhã'; else dateIndicator.textContent = formatDateToDDMMYYYY(task.assignedDate); textSpan.appendChild(dateIndicator); } else if (task.assignedDate === todayISO && !task.isRecurringInstance) { const dateIndicator = document.createElement('span'); dateIndicator.className = 'task-assigned-date-indicator'; dateIndicator.textContent = 'Hoje'; textSpan.appendChild(dateIndicator); } const deleteBtn = document.createElement('button'); deleteBtn.className = 'task-item-delete-btn'; deleteBtn.innerHTML = '<i class="bi bi-trash3-fill"></i>'; deleteBtn.setAttribute('aria-label', 'Deletar tarefa'); deleteBtn.addEventListener('click', () => deleteTask(task.id)); li.appendChild(checkbox); li.appendChild(textSpan); li.appendChild(deleteBtn); taskList.appendChild(li); }); }
    updateTasksCounter(); updateTaskProgressBar();
}

function updateTasksCounter() {
    const tasksCounter = document.getElementById('tasks-counter'); if (!tasksCounter) return; const todayISO = getTodayISO();
    const displayedTasks = state.tasks.filter(task => { if (task.deletedThisInstanceOfDay && task.assignedDate === todayISO) return false; if (task.isRecurringInstance) return task.assignedDate === getTodayISO(); return true; });
    const completedDisplayedTasks = displayedTasks.filter(task => task.completed).length; tasksCounter.textContent = `${completedDisplayedTasks}/${displayedTasks.length}`;
}

function updateTaskProgressBar() {
    const progressBarFill = document.getElementById('task-progress-bar-fill'); const progressPercentageText = document.getElementById('task-progress-percentage'); if (!progressBarFill || !progressPercentageText) return;
    const todayISO = getTodayISO(); const tasksForToday = state.tasks.filter(task => { if (task.deletedThisInstanceOfDay && task.assignedDate === todayISO) return false; if (task.isRecurringInstance) return task.assignedDate === todayISO; return true; });
    const totalTasks = tasksForToday.length; const completedTasks = tasksForToday.filter(task => task.completed).length;
    let percentage = 0; if (totalTasks > 0) percentage = Math.round((completedTasks / totalTasks) * 100);
    progressBarFill.style.width = `${percentage}%`; progressPercentageText.textContent = `${percentage}%`;
}

function addTask(event) {
    event.preventDefault(); checkAllResets(); const taskInput = document.getElementById('task-input'); const taskText = taskInput.value.trim(); const selectedDates = taskDatePicker.selectedDates; let assignedDateValue = null;
    if (selectedDates.length > 0) { const dateObj = selectedDates[0]; const year = dateObj.getFullYear(); const month = String(dateObj.getMonth() + 1).padStart(2, '0'); const day = String(dateObj.getDate()).padStart(2, '0'); assignedDateValue = `${year}-${month}-${day}`; }
    if (taskText === '') { showCustomAlert('Por favor, insira o texto da tarefa.', 'Tarefa Inválida'); return; }
    const newTask = { id: Date.now().toString(), text: taskText, completed: false, createdAt: new Date().toISOString(), completionDate: null, assignedDate: assignedDateValue, isRecurringInstance: false, sourcePatternId: null };
    state.tasks.push(newTask); taskInput.value = ''; taskDatePicker.setDate(new Date(), true); renderTasks(); saveState();
}

function toggleTaskComplete(taskId, isRecurringInstance = false, sourcePatternId = null, originalPatternTaskId = null) {
    checkAllResets(); const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        const task = state.tasks[taskIndex]; const wasCompleted = task.completed; task.completed = !task.completed; task.completionDate = task.completed ? new Date().toISOString() : null;
        const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`); if (taskElement) { taskElement.classList.toggle('completed', task.completed); const checkbox = taskElement.querySelector('.task-item-checkbox'); if (checkbox) checkbox.checked = task.completed; }
        updateTasksCounter(); updateTaskProgressBar();
        const todayISO = getTodayISO(); const completionDateForChart = task.completed ? new Date(task.completionDate) : new Date(); const dateForChartISO = completionDateForChart.toISOString().split('T')[0];
        if (dateForChartISO === todayISO) { if (state.dailyTaskCompletionData && state.dailyTaskCompletionData.length === 7) { if (task.completed && !wasCompleted) state.dailyTaskCompletionData[6]++; else if (!task.completed && wasCompleted) state.dailyTaskCompletionData[6] = Math.max(0, state.dailyTaskCompletionData[6] - 1); } }
        if (isRecurringInstance && sourcePatternId === SINGLE_ROUTINE_ID && task.assignedDate === getTodayISO()) { const routinePattern = state.recurringTaskPatterns.find(p => p.id === SINGLE_ROUTINE_ID); if (routinePattern) { const dayOfWeekToday = new Date().getDay(); if (routinePattern.tasksByDay[dayOfWeekToday]) { const routineTaskDef = routinePattern.tasksByDay[dayOfWeekToday].find(rt => rt.id === originalPatternTaskId); if (routineTaskDef) { routineTaskDef.completed = task.completed; const modalRecurringTaskModal = document.getElementById('recurring-task-modal'); if (modalRecurringTaskModal && modalRecurringTaskModal.classList.contains('show')) { const modalRoutineTaskCheckbox = modalRecurringTaskModal.querySelector(`.day-card-v2[data-day-index="${dayOfWeekToday}"] .task-item-recurrent-v2[data-task-id="${originalPatternTaskId}"] .task-routine-checkbox`); if (modalRoutineTaskCheckbox) modalRoutineTaskCheckbox.checked = task.completed; } } } } }
        saveState(); updateChartWithNewPeriod(tasksChartInstance, 'tasksCompleted', 'tasks', 'Nº de Tarefas', 'Tarefas', val => Math.round(val));
        if (task.completed || wasCompleted) renderTasks();
    }
}

function deleteTask(taskId) {
    checkAllResets(); const taskIndex = state.tasks.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
        const deletedTask = state.tasks[taskIndex]; if (deletedTask.isRecurringInstance || deletedTask.sourcePatternId) { openDeleteRecurringTaskModal(deletedTask); return; }
        state.tasks.splice(taskIndex, 1); const taskElement = document.querySelector(`.task-item[data-task-id="${taskId}"]`); if (taskElement) taskElement.remove();
        updateTasksCounter(); updateTaskProgressBar();
        if (deletedTask.completed && deletedTask.completionDate) { const completionDateForChart = new Date(deletedTask.completionDate); const dateForChartISO = completionDateForChart.toISOString().split('T')[0]; const todayISO = getTodayISO(); if (dateForChartISO === todayISO) { if (state.dailyTaskCompletionData && state.dailyTaskCompletionData.length === 7) state.dailyTaskCompletionData[6] = Math.max(0, state.dailyTaskCompletionData[6] - 1); } }
        if (state.tasks.filter(t => !(t.deletedThisInstanceOfDay && t.assignedDate === getTodayISO()) && (t.isRecurringInstance ? t.assignedDate === getTodayISO() : true)).length === 0) renderTasks();
        saveState(); updateChartWithNewPeriod(tasksChartInstance, 'tasksCompleted', 'tasks', 'Nº de Tarefas', 'Tarefas', val => Math.round(val));
    }
}

function handleDragStart(e) { draggedItem = e.target; e.dataTransfer.effectAllowed = 'move'; setTimeout(() => { if (draggedItem) draggedItem.classList.add('dragging'); }, 0); }
function handleDragEnd(e) { if (draggedItem) draggedItem.classList.remove('dragging'); draggedItem = null; document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove()); }
function handleDragOver(e) { e.preventDefault(); const taskList = document.getElementById('task-list'); const afterElement = getDragAfterElement(taskList, e.clientY); document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove()); const placeholder = document.createElement('li'); placeholder.classList.add('drag-over-placeholder'); if (afterElement == null) taskList.appendChild(placeholder); else taskList.insertBefore(placeholder, afterElement); }
function handleDrop(e) {
    e.preventDefault(); if (!draggedItem) return; const taskList = document.getElementById('task-list'); const draggedItemId = draggedItem.dataset.taskId; const originalIndex = state.tasks.findIndex(task => task.id === draggedItemId);
    if (originalIndex === -1) { console.error("Tarefa arrastada não encontrada no estado."); if (draggedItem) draggedItem.classList.remove('dragging'); draggedItem = null; document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove()); return; }
    const [movedTask] = state.tasks.splice(originalIndex, 1); const afterElement = getDragAfterElement(taskList, e.clientY); let newIndex;
    if (afterElement) { const afterElementId = afterElement.dataset.taskId; const targetIndexInState = state.tasks.findIndex(task => task.id === afterElementId); newIndex = targetIndexInState !== -1 ? targetIndexInState : state.tasks.length; } else newIndex = state.tasks.length;
    state.tasks.splice(newIndex, 0, movedTask); if (draggedItem) draggedItem.classList.remove('dragging'); draggedItem = null; document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove()); renderTasks(); saveState();
}
function getDragAfterElement(container, y) { const draggableElements = [...container.querySelectorAll('.task-item:not(.dragging)')]; return draggableElements.reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2; if (offset < 0 && offset > closest.offset) return { offset: offset, element: child }; else return closest; }, { offset: Number.NEGATIVE_INFINITY }).element; }

function initTasks() {
    const taskForm = document.getElementById('task-form'); if (taskForm) taskForm.addEventListener('submit', addTask);
    const taskList = document.getElementById('task-list'); if (taskList) { taskList.addEventListener('dragover', handleDragOver); taskList.addEventListener('drop', handleDrop); }
    const taskDateInput = document.getElementById('task-assigned-date');
    if (taskDateInput && typeof flatpickr === 'function') taskDatePicker = flatpickr(taskDateInput, { dateFormat: "d/m/Y", defaultDate: "today", locale: "pt", allowInput: true, });
    else if (taskDateInput) { taskDateInput.value = getTodayISO(); taskDateInput.type = "date"; taskDateInput.placeholder = ""; }
    renderTasks();
}

// Funções de Tarefas Recorrentes (Modal V2) - mantidas como estavam, pois não foram escopo da refatoração
function openRecurringTaskPatternModal_v2() { const modalId = "recurring-task-modal"; const modal = document.getElementById(modalId); if (!modal) return; const newTaskTextInput = document.getElementById('new-task-text-input-v2'); const modalSubtitle = document.getElementById('recurring-task-def-v2-modal-description'); const footerTip = document.getElementById('recurring-modal-footer-tip'); modal.dataset.modalType = "recurring-task-definition-v2"; currentEditingPatternTaskId_v2 = null; if (modalSubtitle) modalSubtitle.textContent = "Defina as tarefas para cada dia da sua semana e organize seus estudos de forma eficiente"; if (newTaskTextInput) { newTaskTextInput.value = ''; newTaskTextInput.placeholder = "Digite o nome da tarefa..."; } if (footerTip) footerTip.textContent = "Dica: Clique nos dias para selecioná-los e adicionar tarefas. Você também pode arrastar tarefas entre os dias para reorganizar!"; document.querySelectorAll('.day-card-v2').forEach(card => { card.classList.remove('selected'); const taskList = card.querySelector('.day-card-v2-tasks'); if (taskList) taskList.innerHTML = '<span class="no-tasks-msg">Nenhuma tarefa</span>'; }); updateSelectedDaysCount_v2(); let patternToLoad = null; if (state.recurringTaskPatterns && state.recurringTaskPatterns.length > 0 && state.recurringTaskPatterns[0].id === SINGLE_ROUTINE_ID) patternToLoad = state.recurringTaskPatterns[0]; if (patternToLoad && patternToLoad.tasksByDay) renderTasksInDayCards_v2(patternToLoad.tasksByDay); else document.querySelectorAll('.day-card-v2-tasks').forEach(list => { if (list) list.innerHTML = '<span class="no-tasks-msg">Nenhuma tarefa</span>'; }); updateDayTaskCounters_v2(); updateTotalRoutineTasksCount_v2(); const btnConfirmAdd = modal.querySelector('.btn-confirm-add-task-v2'); if (btnConfirmAdd && btnConfirmAdd._taskifyListenerAttached !== true) { btnConfirmAdd.addEventListener('click', handleConfirmAddTask_v2); btnConfirmAdd._taskifyListenerAttached = true; } if (newTaskTextInput && newTaskTextInput._taskifyEnterListenerAttached !== true) { newTaskTextInput.addEventListener('keypress', function (event) { if (event.key === 'Enter') { event.preventDefault(); handleConfirmAddTask_v2(); } }); newTaskTextInput._taskifyEnterListenerAttached = true; } modal.querySelectorAll('.day-card-v2').forEach(card => { if (card._taskifyCardListenerAttached !== true) { card.addEventListener('click', handleDayCardClick_v2); card._taskifyCardListenerAttached = true; } const taskListEl = card.querySelector('.day-card-v2-tasks'); if (taskListEl && taskListEl._taskifyDragListenerAttached !== true) { taskListEl.addEventListener('dragover', handlePatternTaskDragOver_v2); taskListEl.addEventListener('drop', handlePatternTaskDrop_v2); taskListEl._taskifyDragListenerAttached = true; } }); openModal(modalId); if (newTaskTextInput) newTaskTextInput.focus(); }
function closeRecurringTaskPatternModal() { const modalId = "recurring-task-modal"; const modal = document.getElementById(modalId); if (!modal) return; currentEditingPatternTaskId_v2 = null; if (modal.dataset.modalType === "recurring-task-definition-v2") { const newTaskTextInput = document.getElementById('new-task-text-input-v2'); if (newTaskTextInput) newTaskTextInput.value = ''; document.querySelectorAll('.day-card-v2.selected').forEach(card => card.classList.remove('selected')); updateSelectedDaysCount_v2(); document.querySelectorAll('.day-card-v2-tasks').forEach(list => { if (list) list.innerHTML = '<span class="no-tasks-msg">Nenhuma tarefa</span>'; }); } closeModal(modalId); }
function handleDayCardClick_v2(event) { if (event.target.closest('.btn-icon-recurrent-task-v2') || event.target.closest('.editing-task-input-v2') || event.target.closest('.task-routine-checkbox')) return; const card = event.currentTarget; card.classList.toggle('selected'); updateSelectedDaysCount_v2(); }
function updateSelectedDaysCount_v2() { const countEl = document.getElementById('recurring-v2-selected-days-count'); if (!countEl) return; const selectedCards = document.querySelectorAll('#recurring-task-modal[data-modal-type="recurring-task-definition-v2"] .day-card-v2.selected').length; if (selectedCards === 0) countEl.textContent = "Nenhum dia selecionado"; else if (selectedCards === 1) countEl.textContent = "1 dia selecionado"; else countEl.textContent = `${selectedCards} dias selecionados`; }
function handleSelectAllDays_v2() { document.querySelectorAll('#recurring-task-modal[data-modal-type="recurring-task-definition-v2"] .day-card-v2').forEach(card => card.classList.add('selected')); updateSelectedDaysCount_v2(); }
function handleClearDaySelection_v2() { document.querySelectorAll('#recurring-task-modal[data-modal-type="recurring-task-definition-v2"] .day-card-v2.selected').forEach(card => card.classList.remove('selected')); updateSelectedDaysCount_v2(); }
function handleConfirmAddTask_v2() { const taskTextInput = document.getElementById('new-task-text-input-v2'); const taskText = taskTextInput.value.trim(); const selectedCards = document.querySelectorAll('#recurring-task-modal[data-modal-type="recurring-task-definition-v2"] .day-card-v2.selected'); if (selectedCards.length === 0 && !currentEditingPatternTaskId_v2) { showCustomAlert("Selecione pelo menos um dia para adicionar a tarefa.", "Nenhum Dia Selecionado"); return; } if (!taskText) { showCustomAlert("Por favor, digite o nome da tarefa.", "Tarefa Vazia"); return; } if (currentEditingPatternTaskId_v2) { const routinePattern = state.recurringTaskPatterns.find(p => p.id === SINGLE_ROUTINE_ID); if (routinePattern && routinePattern.tasksByDay) { let taskUpdated = false; for (const dayIndex in routinePattern.tasksByDay) { const taskIndexToUpdate = routinePattern.tasksByDay[dayIndex].findIndex(t => t.id === currentEditingPatternTaskId_v2); if (taskIndexToUpdate > -1) { routinePattern.tasksByDay[dayIndex][taskIndexToUpdate].text = taskText; taskUpdated = true; } } if (taskUpdated) { renderTasksInDayCards_v2(routinePattern.tasksByDay); saveRecurringPatternDefinition_v2(false); } } currentEditingPatternTaskId_v2 = null; } else { selectedCards.forEach(card => { const taskList = card.querySelector('.day-card-v2-tasks'); if (taskList) { const noTasksMsg = taskList.querySelector('.no-tasks-msg'); if (noTasksMsg) noTasksMsg.remove(); const newTaskData = { id: `patternTask-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, text: taskText, completed: false, order: taskList.children.length }; const taskItemEl = createPatternTaskItemElement_v2(newTaskData); taskList.appendChild(taskItemEl); } }); saveRecurringPatternDefinition_v2(false); } taskTextInput.value = ''; document.querySelectorAll('#recurring-task-modal .day-card-v2.selected').forEach(card => card.classList.remove('selected')); updateSelectedDaysCount_v2(); updateDayTaskCounters_v2(); updateTotalRoutineTasksCount_v2(); }
function createPatternTaskItemElement_v2(taskData) { const li = document.createElement('li'); li.className = 'task-item-recurrent-v2 draggable'; li.setAttribute('draggable', 'true'); li.dataset.taskId = taskData.id || `tempId-${Date.now()}-${Math.random()}`; li.dataset.taskText = taskData.text; const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'task-routine-checkbox'; checkbox.id = `chk-routine-${taskData.id}`; checkbox.checked = taskData.completed || false; checkbox.addEventListener('change', (e) => handleRoutineTaskCheckboxChange_v2(e, taskData.id)); const textSpan = document.createElement('span'); textSpan.className = 'task-text-recurrent-v2'; textSpan.textContent = taskData.text; textSpan.addEventListener('click', () => { checkbox.checked = !checkbox.checked; const changeEvent = new Event('change', { bubbles: true }); checkbox.dispatchEvent(changeEvent); }); const actionsDiv = document.createElement('div'); actionsDiv.className = 'task-actions-recurrent-v2'; const editBtn = document.createElement('button'); editBtn.type = 'button'; editBtn.className = 'btn-icon-recurrent-task-v2 edit'; editBtn.innerHTML = '<i class="bi bi-pencil"></i>'; editBtn.title = "Editar Tarefa"; editBtn.addEventListener('click', () => handleEditPatternTask_v2(taskData.id, taskData.text)); const deleteBtn = document.createElement('button'); deleteBtn.type = 'button'; deleteBtn.className = 'btn-icon-recurrent-task-v2 delete'; deleteBtn.innerHTML = '<i class="bi bi-trash"></i>'; deleteBtn.title = "Excluir Tarefa da Rotina"; deleteBtn.addEventListener('click', (e) => { handleDeletePatternTask_v2(e.currentTarget.closest('li')); saveRecurringPatternDefinition_v2(false); updateDayTaskCounters_v2(); updateTotalRoutineTasksCount_v2(); }); actionsDiv.appendChild(editBtn); actionsDiv.appendChild(deleteBtn); li.appendChild(checkbox); li.appendChild(textSpan); li.appendChild(actionsDiv); li.addEventListener('dragstart', handlePatternTaskDragStart_v2); li.addEventListener('dragend', handlePatternTaskDragEnd_v2); return li; }
function handleEditPatternTask_v2(taskId, currentText) { const taskTextInput = document.getElementById('new-task-text-input-v2'); taskTextInput.value = currentText; taskTextInput.focus(); taskTextInput.select(); currentEditingPatternTaskId_v2 = taskId; document.querySelectorAll('#recurring-task-modal .day-card-v2.selected').forEach(card => card.classList.remove('selected')); updateSelectedDaysCount_v2(); }
function handleDeletePatternTask_v2(taskItemElement) { const taskIdToDelete = taskItemElement.dataset.taskId; const routinePattern = state.recurringTaskPatterns.find(p => p.id === SINGLE_ROUTINE_ID); if (routinePattern && routinePattern.tasksByDay) for (const dayIndex in routinePattern.tasksByDay) routinePattern.tasksByDay[dayIndex] = routinePattern.tasksByDay[dayIndex].filter(t => t.id !== taskIdToDelete); renderTasksInDayCards_v2(routinePattern ? routinePattern.tasksByDay : {}); }
function saveRecurringPatternDefinition_v2(closeModalAfterSave = true) { const dayCards = document.querySelectorAll('#recurring-task-modal[data-modal-type="recurring-task-definition-v2"] .day-card-v2'); const tasksByDay = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }; dayCards.forEach(card => { const dayIndex = card.dataset.dayIndex; const taskList = card.querySelector('.day-card-v2-tasks'); if (taskList) { tasksByDay[dayIndex] = []; Array.from(taskList.children).forEach((taskItemEl, index) => { if (taskItemEl.classList.contains('task-item-recurrent-v2')) { const taskTextEl = taskItemEl.querySelector('.task-text-recurrent-v2'); const checkboxEl = taskItemEl.querySelector('.task-routine-checkbox'); if (taskTextEl && checkboxEl) { const text = taskTextEl.textContent; tasksByDay[dayIndex].push({ id: taskItemEl.dataset.taskId, text: text, completed: checkboxEl.checked, order: index }); } } }); } }); const patternData = { id: SINGLE_ROUTINE_ID, name: "Minha Rotina Semanal", tasksByDay, updatedAt: new Date().toISOString() }; const existingPatternIndex = state.recurringTaskPatterns.findIndex(p => p.id === SINGLE_ROUTINE_ID); if (existingPatternIndex > -1) state.recurringTaskPatterns[existingPatternIndex] = { ...state.recurringTaskPatterns[existingPatternIndex], ...patternData }; else { patternData.startDate = getTodayISO(); patternData.createdAt = new Date().toISOString(); state.recurringTaskPatterns.push(patternData); } if (closeModalAfterSave) closeRecurringTaskPatternModal(); generateRecurringTaskInstances(); saveState(); updateDayTaskCounters_v2(); updateTotalRoutineTasksCount_v2(); }
function renderTasksInDayCards_v2(tasksByDay) { if (!tasksByDay || typeof tasksByDay !== 'object') { document.querySelectorAll('.day-card-v2-tasks').forEach(list => { if (list) list.innerHTML = '<span class="no-tasks-msg">Nenhuma tarefa</span>'; }); return; } const dayIndices = ["0", "1", "2", "3", "4", "5", "6"]; dayIndices.forEach(dayIndex => { const dayCard = document.querySelector(`#recurring-task-modal[data-modal-type="recurring-task-definition-v2"] .day-card-v2[data-day-index="${dayIndex}"]`); if (dayCard) { const taskListEl = dayCard.querySelector('.day-card-v2-tasks'); if (taskListEl) { taskListEl.innerHTML = ''; const tasksForThisDay = tasksByDay[dayIndex]; if (tasksForThisDay && Array.isArray(tasksForThisDay) && tasksForThisDay.length > 0) tasksForThisDay.sort((a, b) => (a.order || 0) - (b.order || 0)).forEach(taskDef => { if (taskDef && typeof taskDef.text === 'string') { if (parseInt(dayIndex) === new Date().getDay() && taskDef.id) { const mainListTaskId = `${SINGLE_ROUTINE_ID}-${taskDef.id}-${getTodayISO()}`; const mainListTask = state.tasks.find(t => t.id === mainListTaskId); if (mainListTask) taskDef.completed = mainListTask.completed; } const taskItemEl = createPatternTaskItemElement_v2(taskDef); taskListEl.appendChild(taskItemEl); } }); else taskListEl.innerHTML = '<span class="no-tasks-msg">Nenhuma tarefa</span>'; } } }); updateDayTaskCounters_v2(); updateTotalRoutineTasksCount_v2(); }
function handleRoutineTaskCheckboxChange_v2(event, routineTaskId) { const checkbox = event.target; const isChecked = checkbox.checked; const dayCard = checkbox.closest('.day-card-v2'); if (!dayCard) return; const dayIndex = dayCard.dataset.dayIndex; const routinePattern = state.recurringTaskPatterns.find(p => p.id === SINGLE_ROUTINE_ID); if (routinePattern && routinePattern.tasksByDay[dayIndex]) { const taskDef = routinePattern.tasksByDay[dayIndex].find(t => t.id === routineTaskId); if (taskDef) taskDef.completed = isChecked; } if (parseInt(dayIndex) === new Date().getDay()) { const mainListTaskId = `${SINGLE_ROUTINE_ID}-${routineTaskId}-${getTodayISO()}`; let mainListTask = state.tasks.find(t => t.id === mainListTaskId); if (mainListTask) { mainListTask.completed = isChecked; mainListTask.completionDate = isChecked ? new Date().toISOString() : null; } else { const taskDefForInstance = routinePattern?.tasksByDay[dayIndex]?.find(t => t.id === routineTaskId); if (taskDefForInstance) { const newTaskInstance = { id: mainListTaskId, text: taskDefForInstance.text, completed: isChecked, createdAt: new Date().toISOString(), completionDate: isChecked ? new Date().toISOString() : null, assignedDate: getTodayISO(), sourcePatternId: SINGLE_ROUTINE_ID, originalPatternTaskId: routineTaskId, isRecurringInstance: true }; state.tasks.push(newTaskInstance); } } renderTasks(); updateChartWithNewPeriod(tasksChartInstance, 'tasksCompleted', 'tasks', 'Nº de Tarefas', 'Tarefas', val => Math.round(val)); } saveRecurringPatternDefinition_v2(false); }
function handlePatternTaskDragStart_v2(e) { draggedPatternTaskItem_v2 = e.target; sourcePatternTaskList_v2 = e.target.closest('.day-card-v2-tasks'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', e.target.dataset.taskId); setTimeout(() => { if (draggedPatternTaskItem_v2) draggedPatternTaskItem_v2.classList.add('dragging'); }, 0); }
function handlePatternTaskDragEnd_v2(e) { if (draggedPatternTaskItem_v2) draggedPatternTaskItem_v2.classList.remove('dragging'); draggedPatternTaskItem_v2 = null; sourcePatternTaskList_v2 = null; document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove()); saveRecurringPatternDefinition_v2(false); updateDayTaskCounters_v2(); updateTotalRoutineTasksCount_v2(); }
function handlePatternTaskDragOver_v2(e) { e.preventDefault(); const targetList = e.target.closest('.day-card-v2-tasks'); if (!targetList) { e.dataTransfer.dropEffect = "none"; return; } e.dataTransfer.dropEffect = "move"; document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove()); const placeholder = document.createElement('li'); placeholder.classList.add('drag-over-placeholder'); const afterElement = getPatternTaskDragAfterElement_v2(targetList, e.clientY); if (afterElement == null) targetList.appendChild(placeholder); else targetList.insertBefore(placeholder, afterElement); }
function handlePatternTaskDrop_v2(e) { e.preventDefault(); const targetList = e.target.closest('.day-card-v2-tasks'); if (!targetList || !draggedPatternTaskItem_v2) { handlePatternTaskDragEnd_v2(); return; } document.querySelectorAll('.drag-over-placeholder').forEach(p => p.remove()); const afterElement = getPatternTaskDragAfterElement_v2(targetList, e.clientY); if (afterElement) targetList.insertBefore(draggedPatternTaskItem_v2, afterElement); else targetList.appendChild(draggedPatternTaskItem_v2); if (sourcePatternTaskList_v2 && sourcePatternTaskList_v2 !== targetList && sourcePatternTaskList_v2.children.length === 0) { const noTasksMsg = document.createElement('span'); noTasksMsg.className = 'no-tasks-msg'; noTasksMsg.textContent = 'Nenhuma tarefa'; sourcePatternTaskList_v2.appendChild(noTasksMsg); } const noTasksMsgInTarget = targetList.querySelector('.no-tasks-msg'); if (noTasksMsgInTarget && Array.from(targetList.children).some(child => child.classList.contains('task-item-recurrent-v2'))) noTasksMsgInTarget.remove(); }
function getPatternTaskDragAfterElement_v2(container, y) { const draggableElements = [...container.querySelectorAll('.task-item-recurrent-v2:not(.dragging)')]; return draggableElements.reduce((closest, child) => { const box = child.getBoundingClientRect(); const offset = y - box.top - box.height / 2; if (offset < 0 && offset > closest.offset) return { offset: offset, element: child }; else return closest; }, { offset: Number.NEGATIVE_INFINITY }).element; }
function generateRecurringTaskInstances() { const today = new Date(); today.setHours(0, 0, 0, 0); const todayISO = today.toISOString().split('T')[0]; let newTasksAddedOrRemoved = false; const activePatternIds = new Set(state.recurringTaskPatterns.map(p => p.id)); state.tasks = state.tasks.filter(task => { if (task.isRecurringInstance && task.sourcePatternId) { if (!activePatternIds.has(task.sourcePatternId)) { if (task.assignedDate >= todayISO && !task.completed) { newTasksAddedOrRemoved = true; return false; } } const pattern = state.recurringTaskPatterns.find(p => p.id === task.sourcePatternId); if (pattern && pattern.endDate && task.assignedDate > pattern.endDate) if (!task.completed) { newTasksAddedOrRemoved = true; return false; } } return true; }); state.recurringTaskPatterns.forEach(pattern => { if (pattern.id !== SINGLE_ROUTINE_ID) { pattern.id = SINGLE_ROUTINE_ID; newTasksAddedOrRemoved = true; } const patternStartDate = pattern.startDate ? new Date(pattern.startDate) : new Date(pattern.createdAt || getTodayISO()); patternStartDate.setHours(0, 0, 0, 0); const patternEndDate = pattern.endDate ? new Date(pattern.endDate) : null; if (patternEndDate) patternEndDate.setHours(0, 0, 0, 0); if (patternStartDate > today) return; if (patternEndDate && patternEndDate < today) return; const dayOfWeekToday = today.getDay(); if (pattern.tasksByDay && pattern.tasksByDay[dayOfWeekToday] && pattern.tasksByDay[dayOfWeekToday].length > 0) pattern.tasksByDay[dayOfWeekToday].forEach(taskDef => { const taskIdForInstance = `${pattern.id}-${taskDef.id}-${todayISO}`; const existingTask = state.tasks.find(task => task.id === taskIdForInstance); if (!existingTask) { state.tasks.push({ id: taskIdForInstance, text: taskDef.text, completed: taskDef.completed || false, createdAt: new Date().toISOString(), assignedDate: todayISO, sourcePatternId: pattern.id, originalPatternTaskId: taskDef.id, isRecurringInstance: true }); newTasksAddedOrRemoved = true; } else { if (existingTask.completed !== (taskDef.completed || false)) { const modalRecurringTaskModal = document.getElementById('recurring-task-modal'); const isModalOpenForThisDay = modalRecurringTaskModal && modalRecurringTaskModal.classList.contains('show') && document.querySelector(`.day-card-v2[data-day-index="${dayOfWeekToday}"] .task-item-recurrent-v2[data-task-id="${taskDef.id}"]`); if(!isModalOpenForThisDay){ existingTask.completed = taskDef.completed || false; existingTask.completionDate = existingTask.completed ? new Date().toISOString() : null; newTasksAddedOrRemoved = true; } } if (existingTask.text !== taskDef.text) { existingTask.text = taskDef.text; newTasksAddedOrRemoved = true; } } }); }); if (newTasksAddedOrRemoved) renderTasks(); else updateTaskProgressBar(); }
function updateDeleteRecurringTaskModalUI(selectedOptionValue) { const warningMessageContainer = document.getElementById('delete-recurring-warning-message'); const warningMessageTextEl = warningMessageContainer.querySelector('span'); const warningMessageIconEl = warningMessageContainer.querySelector('i'); const confirmBtn = document.getElementById('btn-confirm-delete-recurring-action'); confirmBtn.classList.remove('btn-danger-style'); warningMessageContainer.classList.remove('danger'); warningMessageIconEl.className = 'bi bi-exclamation-triangle-fill'; const optionFutureEl = document.querySelector('.delete-option-card input[name="delete-recurring-option"][value="future"]'); if (optionFutureEl && optionFutureEl.closest('.delete-option-card')) optionFutureEl.closest('.delete-option-card').style.display = 'none'; switch (selectedOptionValue) { case 'this': warningMessageTextEl.textContent = 'Apenas esta ocorrência será removida. A tarefa recorrente continuará normalmente.'; confirmBtn.textContent = 'Excluir Ocorrência'; break; case 'all': warningMessageTextEl.innerHTML = 'Ação irreversível: Toda a sua rotina semanal será permanentemente excluída.'; confirmBtn.textContent = 'Excluir Rotina Completa'; confirmBtn.classList.add('btn-danger-style'); warningMessageContainer.classList.add('danger'); warningMessageIconEl.className = 'bi bi-trash3-fill'; break; } }
function openDeleteRecurringTaskModal(taskInstance) { const modalId = 'delete-recurring-task-modal'; const modal = document.getElementById(modalId); if (!modal) return; modal.dataset.deletingTaskId = taskInstance.id; const optionFutureEl = modal.querySelector('.delete-option-card input[name="delete-recurring-option"][value="future"]'); if (optionFutureEl && optionFutureEl.closest('.delete-option-card')) optionFutureEl.closest('.delete-option-card').style.display = 'none'; const firstOptionRadio = modal.querySelector('input[name="delete-recurring-option"][value="this"]'); if (firstOptionRadio) { firstOptionRadio.checked = true; updateDeleteRecurringTaskModalUI('this'); document.querySelectorAll('.delete-option-card').forEach(card => card.classList.remove('selected')); firstOptionRadio.closest('.delete-option-card').classList.add('selected'); } openModal(modalId); }
function closeDeleteRecurringTaskModal() { const modal = document.getElementById('delete-recurring-task-modal'); delete modal.dataset.deletingTaskId; closeModal('delete-recurring-task-modal'); }
function confirmDeleteRecurringTask() { const modal = document.getElementById('delete-recurring-task-modal'); const taskId = modal.dataset.deletingTaskId; if (!taskId) return; const selectedOptionRadio = modal.querySelector('input[name="delete-recurring-option"]:checked'); if (!selectedOptionRadio) { showCustomAlert("Por favor, selecione uma opção de exclusão.", "Opção Necessária"); return; } const optionValue = selectedOptionRadio.value; const taskIndex = state.tasks.findIndex(t => t.id === taskId); if (taskIndex === -1) { closeDeleteRecurringTaskModal(); showCustomAlert("Tarefa não encontrada para exclusão.", "Erro"); return; } const taskInstance = state.tasks[taskIndex]; const patternId = taskInstance.sourcePatternId; let tasksModified = false; let patternsModified = false; if (optionValue === 'this') { if (taskInstance.isRecurringInstance && taskInstance.assignedDate === getTodayISO()) taskInstance.deletedThisInstanceOfDay = true; else state.tasks.splice(taskIndex, 1); tasksModified = true; } else if (optionValue === 'all' && patternId === SINGLE_ROUTINE_ID) { state.recurringTaskPatterns = []; patternsModified = true; state.tasks = state.tasks.filter(t => { if (t.sourcePatternId === SINGLE_ROUTINE_ID) { const taskDate = new Date(t.assignedDate + "T00:00:00"); const today = new Date(); today.setHours(0,0,0,0); if (taskDate >= today && !t.completed) { tasksModified = true; return false; } else if (taskDate < today) return true; else if (taskDate >= today && t.completed) return true; } return true; }); } closeDeleteRecurringTaskModal(); if (tasksModified || patternsModified) { renderTasks(); saveState(); updateChartWithNewPeriod(tasksChartInstance, 'tasksCompleted', 'tasks', 'Nº de Tarefas', 'Tarefas', val => Math.round(val)); } }
function updateDayTaskCounters_v2() { const dayIndices = { 0: "sunday", 1: "monday", 2: "tuesday", 3: "wednesday", 4: "thursday", 5: "friday", 6: "saturday" }; for (const dayIndex in dayIndices) { const dayKey = dayIndices[dayIndex]; const taskListEl = document.getElementById(`pattern-v2-tasks-${dayKey}`); const countEl = document.getElementById(`task-count-${dayKey}`); if (taskListEl && countEl) { const taskCount = taskListEl.querySelectorAll('.task-item-recurrent-v2').length; countEl.textContent = taskCount; } } }
function updateTotalRoutineTasksCount_v2() { const totalCountEl = document.getElementById('recurring-modal-total-tasks'); if (!totalCountEl) return; let totalTasks = 0; const routinePattern = state.recurringTaskPatterns.find(p => p.id === SINGLE_ROUTINE_ID); if (routinePattern && routinePattern.tasksByDay) for (const dayKey in routinePattern.tasksByDay) if (Array.isArray(routinePattern.tasksByDay[dayKey])) totalTasks += routinePattern.tasksByDay[dayKey].length; totalCountEl.textContent = `Total de tarefas: ${totalTasks}`; }
// --- Funções de Temas e Aparência (mantidas) ---
function openThemesModal() { populateThemesModal(); openModal('themes-modal'); }
function closeThemesModal() { closeModal('themes-modal'); }
function populateThemesModal() { const paletteContainer = document.getElementById('palette-buttons-container'); const modeContainer = document.getElementById('mode-buttons-container'); if (!paletteContainer || !modeContainer) return; paletteContainer.innerHTML = ''; Object.keys(currentPalettes).forEach(key => { const palette = currentPalettes[key]; const btn = document.createElement('button'); btn.className = 'palette-btn'; btn.style.backgroundColor = palette.primary; btn.dataset.paletteKey = key; btn.setAttribute('aria-label', palette.name); const checkIcon = document.createElement('i'); checkIcon.className = 'bi bi-check-lg active-check'; btn.appendChild(checkIcon); if (key === state.visuals.currentPalette) btn.classList.add('active'); btn.addEventListener('click', () => applyPalette(key)); paletteContainer.appendChild(btn); }); modeContainer.innerHTML = ''; Object.keys(VISUAL_MODES).forEach(key => { const mode = VISUAL_MODES[key]; const btn = document.createElement('button'); btn.className = 'mode-btn'; btn.dataset.modeKey = key; const iconEl = document.createElement('i'); iconEl.className = `bi ${mode.icon} mode-icon`; const titleEl = document.createElement('span'); titleEl.className = 'mode-title'; titleEl.textContent = mode.name; const subtitleEl = document.createElement('span'); subtitleEl.className = 'mode-subtitle'; subtitleEl.textContent = mode.subtitle; const activeDot = document.createElement('span'); activeDot.className = 'active-dot'; btn.appendChild(iconEl); btn.appendChild(titleEl); btn.appendChild(subtitleEl); btn.appendChild(activeDot); if (key === state.visuals.currentVisualMode) btn.classList.add('active'); btn.addEventListener('click', () => applyVisualMode(key)); modeContainer.appendChild(btn); }); updateThemeModalButtons(); }
function updateThemeModalButtons() { const paletteBtns = document.querySelectorAll('.palette-btn'); if (paletteBtns) paletteBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.paletteKey === state.visuals.currentPalette)); const modeBtns = document.querySelectorAll('.mode-btn'); if (modeBtns) modeBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.modeKey === state.visuals.currentVisualMode)); }
function applyPalette(paletteName) { if (currentPalettes[paletteName]) { const newPrimaryColor = currentPalettes[paletteName].primary; state.visuals.currentPalette = paletteName; applyPrimaryColor(newPrimaryColor); applyCurrentThemeAndMode(); saveState(); updateThemeModalButtons(); document.dispatchEvent(new CustomEvent('taskifyThemeChanged', { detail: { isDarkMode: state.isDarkMode, primaryColor: newPrimaryColor } })); } }
function applyVisualMode(modeName) { if (VISUAL_MODES[modeName]) { state.visuals.currentVisualMode = modeName; applyCurrentThemeAndMode(); saveState(); updateThemeModalButtons(); document.dispatchEvent(new CustomEvent('taskifyThemeChanged', { detail: { isDarkMode: state.isDarkMode, visualMode: modeName } })); } }
function initThemes() { const themesModalOverlay = document.getElementById('themes-modal-overlay'); if (themesModalOverlay) themesModalOverlay.addEventListener('click', (e) => { if (e.target === themesModalOverlay) closeModal('themes-modal'); }); applyCurrentThemeAndMode(); }
function showCustomAlert(message, title = 'Alerta', onConfirmCallback = null) { const alertOverlay = document.getElementById('custom-alert-overlay'); const alertModal = document.getElementById('custom-alert-modal'); const alertTitleEl = document.getElementById('custom-alert-title'); const alertMessageEl = document.getElementById('custom-alert-message'); let alertOkBtn = document.getElementById('custom-alert-ok-btn'); if (!alertOverlay || !alertModal || !alertTitleEl || !alertMessageEl || !alertOkBtn) { console.error("Elementos do modal de alerta personalizado não encontrados. Usando alert padrão."); alert(`${title}: ${message}`); if (onConfirmCallback && typeof onConfirmCallback === 'function') onConfirmCallback(); return; } alertTitleEl.textContent = title; alertMessageEl.innerHTML = message.replace(/\n/g, '<br>'); const newOkBtn = alertOkBtn.cloneNode(true); alertOkBtn.parentNode.replaceChild(newOkBtn, alertOkBtn); alertOkBtn = newOkBtn; const closeAlert = () => { alertModal.classList.remove('show'); alertOverlay.classList.remove('show'); alertOkBtn.removeEventListener('click', closeAlert); alertOverlay.removeEventListener('click', closeAlertOnOverlay); if (onConfirmCallback && typeof onConfirmCallback === 'function') onConfirmCallback(); }; const closeAlertOnOverlay = (event) => { if (event.target === alertOverlay) closeAlert(); }; alertOkBtn.addEventListener('click', closeAlert); alertOverlay.addEventListener('click', closeAlertOnOverlay); alertOverlay.classList.add('show'); alertModal.classList.add('show'); alertOkBtn.focus(); }
window.showCustomAlert = showCustomAlert;
// --- Funções do Guia de Boas-vindas e Reset (mantidas) ---
function openWelcomeGuideModal() { const checkbox = document.getElementById('dont-show-guide-again-checkbox'); if (checkbox) checkbox.checked = false; openModal('welcome-guide-modal'); }
function closeWelcomeGuideModal() { const checkbox = document.getElementById('dont-show-guide-again-checkbox'); if (checkbox && checkbox.checked) localStorage.setItem('taskify-welcomeGuideDismissed', 'true'); closeModal('welcome-guide-modal'); }
function openConfirmResetModal() { openModal('confirm-reset-modal'); }
function closeConfirmResetModal() { closeModal('confirm-reset-modal'); }
function performFullReset() { localStorage.removeItem('taskify-state'); localStorage.removeItem('taskify-theme'); localStorage.removeItem('taskify-primary-color'); localStorage.removeItem('taskify-streak'); localStorage.removeItem('taskify-welcomeGuideDismissed'); localStorage.removeItem('taskify-palette'); localStorage.removeItem('taskify-visual-mode'); localStorage.removeItem('taskify-activeTab'); Object.values(CHART_PERIOD_STORAGE_KEYS).forEach(key => localStorage.removeItem(key)); location.reload(); }
function handleResetAppData() { openConfirmResetModal(); }
function updateFooterYear() { const yearSpan = document.getElementById('current-year'); if (yearSpan) yearSpan.textContent = new Date().getFullYear(); }

// --- Função Principal de Inicialização ---
async function init() {
    const loaderElement = document.getElementById('loader'); if (loaderElement) loaderElement.style.display = 'flex';
    loadState(); initTabs(); initThemes(); checkAllResets(); initStreak(); initPomodoro(); initTasks();
    Object.keys(CHART_PERIOD_SELECTORS_IDS).forEach(chartKey => { const selector = document.getElementById(CHART_PERIOD_SELECTORS_IDS[chartKey]); if (selector) selector.addEventListener('change', () => handleChartPeriodChange(chartKey)); });
    const btnOpenRecurringModalV2 = document.getElementById('btn-open-recurring-task-modal'); if (btnOpenRecurringModalV2) btnOpenRecurringModalV2.onclick = () => openRecurringTaskPatternModal_v2();
    const recurringModalV2 = document.getElementById('recurring-task-modal'); if (recurringModalV2) { const btnConfirmAddV2 = recurringModalV2.querySelector('.btn-confirm-add-task-v2'); const btnSelectAllDaysV2 = recurringModalV2.querySelector('.btn-select-all-days'); const btnClearDaySelectionV2 = recurringModalV2.querySelector('.btn-clear-day-selection'); const newTaskTextInputV2 = document.getElementById('new-task-text-input-v2'); if (btnConfirmAddV2 && btnConfirmAddV2._taskifyListenerAttached !== true) { btnConfirmAddV2.addEventListener('click', handleConfirmAddTask_v2); btnConfirmAddV2._taskifyListenerAttached = true; } if (newTaskTextInputV2 && newTaskTextInputV2._taskifyEnterListenerAttached !== true) { newTaskTextInputV2.addEventListener('keypress', function (event) { if (event.key === 'Enter') { event.preventDefault(); handleConfirmAddTask_v2(); } }); newTaskTextInputV2._taskifyEnterListenerAttached = true; } if (btnSelectAllDaysV2 && btnSelectAllDaysV2._taskifyListenerAttached !== true) { btnSelectAllDaysV2.addEventListener('click', handleSelectAllDays_v2); btnSelectAllDaysV2._taskifyListenerAttached = true; } if (btnClearDaySelectionV2 && btnClearDaySelectionV2._taskifyListenerAttached !== true) { btnClearDaySelectionV2.addEventListener('click', handleClearDaySelection_v2); btnClearDaySelectionV2._taskifyListenerAttached = true; } recurringModalV2.querySelectorAll('.day-card-v2').forEach(card => { if (card._taskifyCardListenerAttached !== true) { card.addEventListener('click', handleDayCardClick_v2); card._taskifyCardListenerAttached = true; } const taskListEl = card.querySelector('.day-card-v2-tasks'); if (taskListEl && taskListEl._taskifyDragListenerAttached !== true) { taskListEl.addEventListener('dragover', handlePatternTaskDragOver_v2); taskListEl.addEventListener('drop', handlePatternTaskDrop_v2); taskListEl._taskifyDragListenerAttached = true; } }); }
    const recurringTaskModalOverlay = document.getElementById('recurring-task-modal-overlay'); if (recurringTaskModalOverlay) recurringTaskModalOverlay.addEventListener('click', (e) => { if (e.target === recurringTaskModalOverlay) { const modal = document.getElementById('recurring-task-modal'); if (modal && modal.classList.contains('show')) closeRecurringTaskPatternModal(); } });
    document.querySelectorAll('input[name="delete-recurring-option"]').forEach(radio => { radio.addEventListener('change', (e) => { updateDeleteRecurringTaskModalUI(e.target.value); document.querySelectorAll('.delete-option-card').forEach(card => card.classList.remove('selected')); if (e.target.checked) e.target.closest('.delete-option-card').classList.add('selected'); }); });
    const btnConfirmDeleteRecurringAction = document.getElementById('btn-confirm-delete-recurring-action'); if (btnConfirmDeleteRecurringAction) btnConfirmDeleteRecurringAction.addEventListener('click', () => confirmDeleteRecurringTask());
    const btnCancelDeleteRecurring = document.getElementById('btn-cancel-delete-recurring'); if (btnCancelDeleteRecurring) btnCancelDeleteRecurring.addEventListener('click', closeDeleteRecurringTaskModal);
    const deleteRecurringModalOverlay = document.getElementById('delete-recurring-task-modal-overlay'); if (deleteRecurringModalOverlay) deleteRecurringModalOverlay.addEventListener('click', (e) => { if (e.target === deleteRecurringModalOverlay) closeDeleteRecurringTaskModal(); });
    generateRecurringTaskInstances(); await loadAndSetupRetrospective(); updateFooterYear();
    setupChart(true, 'weeklyActivity'); setupPomodoroChart(true, 'pomodoroFocus'); setupTasksChart(true, 'tasksCompleted');
    updateUI();
    const goalsForm = document.getElementById('goals-form'); if (goalsForm) goalsForm.addEventListener('submit', (e) => { e.preventDefault(); saveGoals(); });
    const goalsOverlay = document.getElementById('goals-modal-overlay'); if (goalsOverlay) goalsOverlay.addEventListener('click', (e) => { if (e.target === goalsOverlay) closeModal('goals-modal'); });
    const btnResetAppData = document.getElementById('btn-reset-app-data'); if (btnResetAppData) btnResetAppData.addEventListener('click', handleResetAppData);
    const confirmResetModalOverlay = document.getElementById('confirm-reset-modal-overlay'); if (confirmResetModalOverlay) confirmResetModalOverlay.addEventListener('click', (e) => { if (e.target === confirmResetModalOverlay) closeModal('confirm-reset-modal'); });
    const confirmResetModalCloseBtn = document.getElementById('confirm-reset-modal-close-btn'); if (confirmResetModalCloseBtn) confirmResetModalCloseBtn.addEventListener('click', () => closeModal('confirm-reset-modal'));
    const btnCancelResetConfirmation = document.getElementById('btn-cancel-reset-confirmation'); if (btnCancelResetConfirmation) btnCancelResetConfirmation.addEventListener('click', () => closeModal('confirm-reset-modal'));
    const btnConfirmResetAction = document.getElementById('btn-confirm-reset-action'); if (btnConfirmResetAction) btnConfirmResetAction.addEventListener('click', performFullReset);
    const welcomeGuideModalOverlay = document.getElementById('welcome-guide-modal-overlay'); if (welcomeGuideModalOverlay) welcomeGuideModalOverlay.addEventListener('click', (e) => { if (e.target === welcomeGuideModalOverlay) closeWelcomeGuideModal(); });
    const welcomeGuideModalCloseBtn = document.getElementById('welcome-guide-modal-close-btn'); if (welcomeGuideModalCloseBtn) welcomeGuideModalCloseBtn.addEventListener('click', closeWelcomeGuideModal);
    const btnCloseWelcomeGuide = document.getElementById('btn-close-welcome-guide'); if (btnCloseWelcomeGuide) btnCloseWelcomeGuide.addEventListener('click', closeWelcomeGuideModal);
    if (localStorage.getItem('taskify-welcomeGuideDismissed') !== 'true') openWelcomeGuideModal();
    const questionsStepInput = document.getElementById('questions-step-input'); if (questionsStepInput) { questionsStepInput.addEventListener('input', updateCounterTooltips); questionsStepInput.addEventListener('change', updateCounterTooltips); }
    setInterval(() => { checkAllResets(); const prevTaskCount = state.tasks.filter(t => !(t.deletedThisInstanceOfDay && t.assignedDate === getTodayISO()) && (t.isRecurringInstance ? t.assignedDate === getTodayISO() : true)).length; generateRecurringTaskInstances(); const currentTaskCount = state.tasks.filter(t => !(t.deletedThisInstanceOfDay && t.assignedDate === getTodayISO()) && (t.isRecurringInstance ? t.assignedDate === getTodayISO() : true)).length; if (state.lastAccessDate !== new Date().toDateString() || prevTaskCount !== currentTaskCount) { renderTasks(); saveState(); } else if (prevTaskCount === currentTaskCount && state.lastAccessDate === new Date().toDateString()) updateTaskProgressBar(); }, 60 * 1000);
    if (typeof window.initSimuladosModule === 'function') window.initSimuladosModule(); else console.error("Taskify - Módulo Simulados (initSimuladosModule) não foi encontrado.");
    if (typeof window.initRedacoesModule === 'function') window.initRedacoesModule(); else console.error("Taskify - Módulo Redações (initRedacoesModule) não foi encontrado.");
    window.taskifyStateReady = true; document.dispatchEvent(new CustomEvent('taskifyStateReady', { detail: { taskifyAppState: JSON.parse(JSON.stringify(window.state || {})) } }));
    setTimeout(() => { if (loaderElement) { loaderElement.style.opacity = '0'; setTimeout(() => { loaderElement.style.display = 'none'; }, 500); } }, 250);
}

document.addEventListener('DOMContentLoaded', async () => { await init(); });

const particleCanvas = document.getElementById('particle-canvas');
if (particleCanvas) {
    const ctx = particleCanvas.getContext('2d'); let particlesArray = []; let lastParticleTime = 0; const particleCooldown = 30; let currentMouseX = -1000, currentMouseY = -1000;
    function resizeCanvas() { particleCanvas.width = window.innerWidth; particleCanvas.height = window.innerHeight; }
    function setupParticleListeners() { window.addEventListener('resize', resizeCanvas); document.addEventListener('mousemove', (e) => { currentMouseX = e.clientX; currentMouseY = e.clientY; }); document.addEventListener('touchmove', (e) => { if (e.touches.length > 0) { currentMouseX = e.touches[0].clientX; currentMouseY = e.touches[0].clientY; } }); document.addEventListener('mouseleave', () => { currentMouseX = -1000; currentMouseY = -1000; }); document.addEventListener('touchend', () => { currentMouseX = -1000; currentMouseY = -1000; }); resizeCanvas(); }
    class Particle { constructor(x, y, color) { this.x = x; this.y = y; this.size = Math.random() * 4 + 1.5; this.baseSize = this.size; this.color = color; this.speedX = Math.random() * 2 - 1; this.speedY = Math.random() * 2 - 1; this.life = Math.random() * 60 + 30; this.initialLife = this.life; } update() { this.x += this.speedX; this.y += this.speedY; this.life--; if (this.life > 0) this.size = this.baseSize * (this.life / this.initialLife); if (this.size < 0.1) this.size = 0; } draw() { if (this.size > 0) { ctx.fillStyle = this.color; ctx.globalAlpha = Math.max(0, this.life / this.initialLife * 0.7); ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; } } }
    function handleParticles(timestamp) { const isMouseInsideWindow = currentMouseX >= 0 && currentMouseX <= window.innerWidth && currentMouseY >= 0 && currentMouseY <= window.innerHeight; let particleEnabled = true; if (typeof state !== 'undefined' && state.visuals && state.visuals.currentVisualMode === 'focus') particleEnabled = false; if (particleEnabled && isMouseInsideWindow && timestamp - lastParticleTime > particleCooldown) { let primaryColor = '#0A7CFF'; try { if (typeof state !== 'undefined' && state.isDarkMode !== undefined) primaryColor = getComputedStyle(document.documentElement).getPropertyValue(state.isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim(); else primaryColor = localStorage.getItem('taskify-primary-color') || '#0A7CFF'; } catch (e) { console.warn("Erro ao obter cor primária para partículas:", e); } for (let i = 0; i < 1; i++) particlesArray.push(new Particle(currentMouseX + (Math.random() - 0.5) * 10, currentMouseY + (Math.random() - 0.5) * 10, primaryColor)); lastParticleTime = timestamp; } for (let i = 0; i < particlesArray.length; i++) { particlesArray[i].update(); if (particlesArray[i].life <= 0 || particlesArray[i].x < -20 || particlesArray[i].x > particleCanvas.width + 20 || particlesArray[i].y < -20 || particlesArray[i].y > particleCanvas.height + 20) { particlesArray.splice(i, 1); i--; } } }
    function animateParticles(timestamp) { ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height); handleParticles(timestamp); for (let i = 0; i < particlesArray.length; i++) particlesArray[i].draw(); requestAnimationFrame(animateParticles); }
    if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) { setupParticleListeners(); requestAnimationFrame(animateParticles); } else document.addEventListener('DOMContentLoaded', () => { setupParticleListeners(); requestAnimationFrame(animateParticles); });
} else console.warn("Elemento #particle-canvas não encontrado. Animação de partículas desabilitada.");

async function loadAndSetupRetrospective() {
    retrospectiveModalEl = document.getElementById('retrospective-modal'); retrospectiveModalOverlayEl = document.getElementById('retrospective-modal-overlay'); const btnOpenRetrospectiveMain = document.getElementById('btn-open-retrospective');
    if (!retrospectiveModalEl || !retrospectiveModalOverlayEl || !btnOpenRetrospectiveMain) { console.error('TASKIFY_MAIN: Elementos base da retrospectiva não encontrados. A retrospectiva pode não funcionar.'); if (btnOpenRetrospectiveMain) btnOpenRetrospectiveMain.style.display = 'none'; return; }
    btnOpenRetrospectiveMain.addEventListener('click', () => { if (typeof window.openRetrospectiveView === 'function') window.openRetrospectiveView(); else console.error("TASKIFY_MAIN: Função window.openRetrospectiveView() não está definida."); });
    retrospectiveModalOverlayEl.addEventListener('click', (event) => { if (event.target === retrospectiveModalOverlayEl) if (typeof window.closeRetrospectiveView === 'function') window.closeRetrospectiveView(); });
    if (!retrospectiveModalEl.querySelector('.retrospective-screen')) {
        try {
            const response = await fetch('retrospective.html'); if (!response.ok) throw new Error(`Falha ao carregar retrospective.html: ${response.status} ${response.statusText}`);
            const htmlContent = await response.text(); retrospectiveModalEl.innerHTML = htmlContent;
            if (typeof window.initializeRetrospectiveInternals === 'function') window.initializeRetrospectiveInternals(); else console.error("TASKIFY_MAIN: Função window.initializeRetrospectiveInternals() não definida após carregar HTML.");
        } catch (error) { console.error('TASKIFY_MAIN: Falha ao carregar e configurar retrospective.html:', error); const alertFn = typeof window.showCustomAlert === 'function' ? window.showCustomAlert : alert; alertFn('Erro crítico ao carregar a retrospectiva. Verifique o console.', 'Erro'); btnOpenRetrospectiveMain.style.display = 'none'; }
    } else if (typeof window.initializeRetrospectiveInternals === 'function') window.initializeRetrospectiveInternals(); else console.error("TASKIFY_MAIN: Função window.initializeRetrospectiveInternals() não definida (HTML já presente).");
}
