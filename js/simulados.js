// js/simulados.js

// Variáveis globais para elementos da UI de Simulados
let simuladoFormModal, simuladoFormModalOverlay, simuladoFormModalCloseBtn, simuladoModalTitle, simuladoForm, simuladoIdInput,
    simuladoNomeInput, simuladoCategoriaSelect, simuladoDataInput, simuladoAcertosInput, simuladoTotalQuestoesInput,
    simuladoTempoGastoInput, simuladoStatusSelect, simuladoFormCancelBtn,
    btnManageSimuladoCategories, simuladosFiltersContainer, simuladosCategorySectionsContainer, simuladosEmptyMessage,
    btnAddSimuladoMain;

let simuladoCategoriesModal, simuladoCategoriesModalOverlay, simuladoCategoriesModalCloseBtn,
    simuladoAddCategoryForm, simuladoNewCategoryNameInput, simuladoCategoriesListEl, simuladoCategoriesDoneBtn;

let simuladoConfirmDeleteModal, simuladoConfirmDeleteModalOverlay, simuladoConfirmDeleteCloseBtn,
    simuladoConfirmDeleteTitle, simuladoConfirmDeleteMessage, simuladoBtnCancelDeleteConfirmation, simuladoBtnConfirmDeleteAction;

let simuladoDatePicker;

let simuladosState = {
    simulados: [],
    categorias: [],
    editingSimuladoId: null,
    editingCategoriaId: null,
    currentCategoryFilter: 'all',
    itemToDelete: { type: null, id: null },
    charts: {},
    expandedRowTracker: {} // Rastreia o estado de expansão por linha de grid por categoria
};

const DEFAULT_SIMULADO_CATEGORIES = [
    { id: 'enem_1_dia', nome: 'ENEM 1º Dia' },
    { id: 'enem_2_dia', nome: 'ENEM 2º Dia' },
    { id: 'linguagens', nome: 'Linguagens' },
    { id: 'humanas', nome: 'Humanas' },
    { id: 'natureza', nome: 'Natureza' },
    { id: 'matematica', nome: 'Matemática' }
];

// --- INICIALIZAÇÃO ---
function initSimuladosModule() {
    console.log("Taskify - Módulo Simulados: Inicializando...");

    simuladoFormModal = document.getElementById('simulado-form-modal');
    simuladoFormModalOverlay = document.getElementById('simulado-form-modal-overlay');
    simuladoFormModalCloseBtn = document.getElementById('simulado-form-modal-close-btn');
    simuladoModalTitle = document.getElementById('simulado-modal-title');
    simuladoForm = document.getElementById('simulado-form');
    simuladoIdInput = document.getElementById('simulado-id-input');
    simuladoNomeInput = document.getElementById('simulado-nome-input');
    simuladoCategoriaSelect = document.getElementById('simulado-categoria-select');
    simuladoDataInput = document.getElementById('simulado-data-input');
    simuladoAcertosInput = document.getElementById('simulado-acertos-input');
    simuladoTotalQuestoesInput = document.getElementById('simulado-total-questoes-input');
    simuladoTempoGastoInput = document.getElementById('simulado-tempo-gasto-input');
    simuladoStatusSelect = document.getElementById('simulado-status-select');
    simuladoFormCancelBtn = document.getElementById('simulado-form-cancel-btn');
    btnAddSimuladoMain = document.getElementById('btn-add-simulado-main');
    btnManageSimuladoCategories = document.getElementById('btn-manage-simulado-categories');
    simuladosFiltersContainer = document.getElementById('simulados-filters-container');
    simuladosCategorySectionsContainer = document.getElementById('simulados-category-sections-container');
    simuladosEmptyMessage = document.getElementById('simulados-empty-message');
    simuladoCategoriesModal = document.getElementById('simulado-categories-modal');
    simuladoCategoriesModalOverlay = document.getElementById('simulado-categories-modal-overlay');
    simuladoCategoriesModalCloseBtn = document.getElementById('simulado-categories-modal-close-btn');
    simuladoAddCategoryForm = document.getElementById('simulado-add-category-form');
    simuladoNewCategoryNameInput = document.getElementById('simulado-new-category-name-input');
    simuladoCategoriesListEl = document.getElementById('simulado-categories-list');
    simuladoCategoriesDoneBtn = document.getElementById('simulado-categories-done-btn');
    simuladoConfirmDeleteModal = document.getElementById('simulado-confirm-delete-modal');
    simuladoConfirmDeleteModalOverlay = document.getElementById('simulado-confirm-delete-modal-overlay');
    simuladoConfirmDeleteCloseBtn = document.getElementById('simulado-confirm-delete-close-btn');
    simuladoConfirmDeleteTitle = document.getElementById('simulado-confirm-delete-title');
    simuladoConfirmDeleteMessage = document.getElementById('simulado-confirm-delete-message');
    simuladoBtnCancelDeleteConfirmation = document.getElementById('simulado-btn-cancel-delete-confirmation');
    simuladoBtnConfirmDeleteAction = document.getElementById('simulado-btn-confirm-delete-action');

    loadSimuladosState();

    if (simuladoDataInput && typeof flatpickr === 'function') {
        simuladoDatePicker = flatpickr(simuladoDataInput, {
            dateFormat: "d/m/Y", defaultDate: "today", locale: "pt", allowInput: true,
        });
    }

    if (btnAddSimuladoMain) btnAddSimuladoMain.addEventListener('click', () => openSimuladoFormModal());
    if (simuladoForm) simuladoForm.addEventListener('submit', handleSaveSimulado);
    if (simuladoFormModalOverlay) simuladoFormModalOverlay.addEventListener('click', (e) => { if (e.target === simuladoFormModalOverlay) closeSimuladoFormModal(); });
    if (simuladoFormModalCloseBtn) simuladoFormModalCloseBtn.addEventListener('click', closeSimuladoFormModal);
    if (simuladoFormCancelBtn) simuladoFormCancelBtn.addEventListener('click', closeSimuladoFormModal);
    if (btnManageSimuladoCategories) btnManageSimuladoCategories.addEventListener('click', openSimuladoCategoriesModal);
    if (simuladoCategoriesModalOverlay) simuladoCategoriesModalOverlay.addEventListener('click', (e) => { if (e.target === simuladoCategoriesModalOverlay) closeSimuladoCategoriesModal(); });
    if (simuladoCategoriesModalCloseBtn) simuladoCategoriesModalCloseBtn.addEventListener('click', closeSimuladoCategoriesModal);
    if (simuladoAddCategoryForm) simuladoAddCategoryForm.addEventListener('submit', handleAddSimuladoCategory);
    if (simuladoCategoriesDoneBtn) simuladoCategoriesDoneBtn.addEventListener('click', closeSimuladoCategoriesModal);
    if (simuladoConfirmDeleteModalOverlay) simuladoConfirmDeleteModalOverlay.addEventListener('click', (e) => { if (e.target === simuladoConfirmDeleteModalOverlay) closeSimuladoConfirmDeleteModal(); });
    if (simuladoConfirmDeleteCloseBtn) simuladoConfirmDeleteCloseBtn.addEventListener('click', closeSimuladoConfirmDeleteModal);
    if (simuladoBtnCancelDeleteConfirmation) simuladoBtnCancelDeleteConfirmation.addEventListener('click', closeSimuladoConfirmDeleteModal);
    if (simuladoBtnConfirmDeleteAction) simuladoBtnConfirmDeleteAction.addEventListener('click', executeDeleteSimuladoItem);

    renderSimuladoCategoriasFiltro();
    renderAllCategorySections();
    console.log("Taskify - Módulo Simulados: Inicializado com sucesso.");
}

function loadSimuladosState() {
    let loadedSimulados = [];
    let loadedCategorias = [];
    const mainState = window.state || {};
    const simuladosAppFromGlobal = mainState.simuladosApp || {};
    loadedSimulados = Array.isArray(simuladosAppFromGlobal.simulados) ? simuladosAppFromGlobal.simulados : [];
    loadedCategorias = Array.isArray(simuladosAppFromGlobal.categorias) ? simuladosAppFromGlobal.categorias : [];

    if (loadedSimulados.length === 0 && loadedCategorias.length === 0 && !mainState.simuladosApp) {
        const savedSimuladosString = localStorage.getItem('taskify-simulados');
        if (savedSimuladosString) { try { const p = JSON.parse(savedSimuladosString); if (Array.isArray(p)) loadedSimulados = p; } catch (e) { console.error("Erro parse simulados", e);}}
        const savedCategoriasString = localStorage.getItem('taskify-simulados-categorias');
        if (savedCategoriasString) { try { const p = JSON.parse(savedCategoriasString); if (Array.isArray(p)) loadedCategorias = p; } catch (e) { console.error("Erro parse categorias", e);}}
    }
    simuladosState.simulados = loadedSimulados.map(s => ({ ...s, acertos: parseInt(s.acertos, 10) || 0, totalQuestoes: parseInt(s.totalQuestoes, 10) || 0, nota: (s.nota !== undefined && s.nota !== null && !isNaN(parseFloat(s.nota))) ? parseFloat(s.nota) : null, tempoGastoMinutos: s.tempoGastoMinutos !== undefined && !isNaN(parseInt(s.tempoGastoMinutos, 10)) ? parseInt(s.tempoGastoMinutos, 10) : null, observacoes: s.observacoes || '' }));
    simuladosState.categorias = loadedCategorias;

    if (simuladosState.categorias.length === 0) {
        simuladosState.categorias = JSON.parse(JSON.stringify(DEFAULT_SIMULADO_CATEGORIES));
    } else {
        const enemGeralId = 'enem_geral'; 
        const enemGeralNome = 'ENEM Geral';
        simuladosState.categorias = simuladosState.categorias.filter(cat => !(cat.id === enemGeralId && cat.nome === enemGeralNome) && cat.nome !== enemGeralNome);
    }
    console.log("Estado dos simulados carregado:", JSON.parse(JSON.stringify(simuladosState)));
}

function saveSimuladosState() {
    if (window.state) {
        if (!window.state.simuladosApp) window.state.simuladosApp = {};
        window.state.simuladosApp.simulados = simuladosState.simulados;
        window.state.simuladosApp.categorias = simuladosState.categorias;
        if (typeof window.saveState === 'function') window.saveState();
        else localStorage.setItem('taskify-simulados-app', JSON.stringify(window.state.simuladosApp));
    } else {
        localStorage.setItem('taskify-simulados', JSON.stringify(simuladosState.simulados));
        localStorage.setItem('taskify-simulados-categorias', JSON.stringify(simuladosState.categorias));
    }
    console.log("Estado dos simulados salvo.");
}

function openSimuladoFormModal(simuladoId = null) {
    if (!simuladoFormModal || !simuladoModalTitle) return;
    simuladoForm.reset();
    populateSimuladoCategoriasSelect(simuladoCategoriaSelect);
    const obsGroup = document.getElementById('simulado-observacoes-input')?.closest('.form-group');
    if (obsGroup) obsGroup.style.display = 'none';

    if (simuladoId) {
        simuladosState.editingSimuladoId = simuladoId;
        simuladoModalTitle.innerHTML = '<i class="bi bi-pencil-fill"></i> Editar Simulado';
        const simulado = simuladosState.simulados.find(s => s.id === simuladoId);
        if (simulado) {
            simuladoIdInput.value = simulado.id;
            simuladoNomeInput.value = simulado.nome;
            simuladoCategoriaSelect.value = simulado.categoriaId;
            if (simuladoDatePicker && simulado.dataRealizacao) simuladoDatePicker.setDate(simulado.dataRealizacao, true);
            simuladoAcertosInput.value = simulado.acertos;
            simuladoTotalQuestoesInput.value = simulado.totalQuestoes;
            simuladoTempoGastoInput.value = formatMinutesToHHMM(simulado.tempoGastoMinutos) || '';
            simuladoStatusSelect.value = simulado.status || 'corrigido';
        }
    } else {
        simuladosState.editingSimuladoId = null;
        simuladoModalTitle.innerHTML = '<i class="bi bi-plus-circle-fill"></i> Adicionar Simulado';
        if (simuladoDatePicker) simuladoDatePicker.setDate(new Date(), true);
        simuladoStatusSelect.value = 'corrigido';
    }
    simuladoFormModalOverlay.classList.add('show');
    simuladoFormModal.classList.add('show');
    document.body.classList.add('modal-open');
    simuladoNomeInput.focus();
}

function closeSimuladoFormModal() {
    if (simuladoFormModal) {
        simuladoFormModal.classList.remove('show');
        simuladoFormModalOverlay.classList.remove('show');
        document.body.classList.remove('modal-open');
        simuladosState.editingSimuladoId = null;
    }
}

function handleSaveSimulado(event) {
    event.preventDefault();
    if (!simuladoNomeInput.value.trim() || !simuladoCategoriaSelect.value || !simuladoDataInput.value ||
        simuladoAcertosInput.value === '' || simuladoTotalQuestoesInput.value === '') {
        showSimuladoCustomAlert("Preencha todos os campos obrigatórios (*).", "Campos Vazios"); return;
    }
    const acertos = parseInt(simuladoAcertosInput.value);
    const totalQuestoes = parseInt(simuladoTotalQuestoesInput.value);
    if (isNaN(acertos) || acertos < 0 || isNaN(totalQuestoes) || totalQuestoes < 1 || acertos > totalQuestoes) {
        showSimuladoCustomAlert("Número de acertos ou total de questões inválido.", "Valores Inválidos"); return;
    }
    let dataRealizacaoISO = null;
    if (simuladoDatePicker && simuladoDatePicker.selectedDates.length > 0) {
        dataRealizacaoISO = simuladoDatePicker.selectedDates[0].toISOString().split('T')[0];
    } else if (simuladoDataInput.value) {
        dataRealizacaoISO = formatDateToISO(simuladoDataInput.value);
        if (!dataRealizacaoISO) { showSimuladoCustomAlert("Formato de data inválido. Use DD/MM/AAAA.", "Data Inválida"); return; }
    }
    const simuladoData = {
        id: simuladosState.editingSimuladoId || `sim-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        nome: simuladoNomeInput.value.trim(), categoriaId: simuladoCategoriaSelect.value, dataRealizacao: dataRealizacaoISO,
        acertos: acertos, totalQuestoes: totalQuestoes, tempoGastoMinutos: parseHHMMToMinutes(simuladoTempoGastoInput.value),
        nota: null, status: simuladoStatusSelect.value, observacoes: '', updatedAt: new Date().toISOString()
    };
    if (simuladosState.editingSimuladoId) {
        const index = simuladosState.simulados.findIndex(s => s.id === simuladosState.editingSimuladoId);
        if (index > -1) simuladosState.simulados[index] = { ...simuladosState.simulados[index], ...simuladoData };
    } else {
        simuladoData.createdAt = new Date().toISOString();
        simuladosState.simulados.push(simuladoData);
    }
    saveSimuladosState();
    renderAllCategorySections();
    closeSimuladoFormModal();
}

function openSimuladoCategoriesModal() {
    if (!simuladoCategoriesModal) return;
    renderSimuladoCategoriasLista();
    simuladoCategoriesModalOverlay.classList.add('show');
    simuladoCategoriesModal.classList.add('show');
    document.body.classList.add('modal-open');
    if (simuladoNewCategoryNameInput) simuladoNewCategoryNameInput.focus();
}

function closeSimuladoCategoriesModal() {
    if (simuladoCategoriesModal) {
        simuladoCategoriesModal.classList.remove('show');
        simuladoCategoriesModalOverlay.classList.remove('show');
        document.body.classList.remove('modal-open');
        renderSimuladoCategoriasFiltro();
        renderAllCategorySections();
    }
}

function handleAddSimuladoCategory(event) {
    event.preventDefault();
    const nomeCategoria = simuladoNewCategoryNameInput.value.trim();
    if (!nomeCategoria) { showSimuladoCustomAlert("Digite o nome da nova categoria.", "Nome Vazio"); return; }
    if (simuladosState.categorias.some(cat => cat.nome.toLowerCase() === nomeCategoria.toLowerCase())) {
        showSimuladoCustomAlert("Já existe uma categoria com este nome.", "Categoria Duplicada"); return;
    }
    const novaCategoria = { id: `cat-${Date.now()}-${Math.random().toString(16).slice(2)}`, nome: nomeCategoria };
    simuladosState.categorias.push(novaCategoria);
    saveSimuladosState(); renderSimuladoCategoriasLista();
    simuladoNewCategoryNameInput.value = ''; simuladoNewCategoryNameInput.focus();
}

function handleEditSimuladoCategory(categoriaId, novoNome) {
    const categoria = simuladosState.categorias.find(cat => cat.id === categoriaId);
    if (categoria && novoNome.trim() && !simuladosState.categorias.some(cat => cat.nome.toLowerCase() === novoNome.trim().toLowerCase() && cat.id !== categoriaId)) {
        categoria.nome = novoNome.trim();
        saveSimuladosState(); renderSimuladoCategoriasLista();
        populateSimuladoCategoriasSelect(simuladoCategoriaSelect);
    } else if (novoNome.trim() === '') {
        showSimuladoCustomAlert("O nome da categoria não pode ser vazio.", "Nome Inválido");
    } else { showSimuladoCustomAlert("Já existe uma categoria com este nome ou o nome é inválido.", "Erro ao Editar"); }
}

function handleDeleteSimuladoCategory(categoriaId) {
    const simuladosNestaCategoria = simuladosState.simulados.filter(s => s.categoriaId === categoriaId).length;
    if (simuladosNestaCategoria > 0) {
        showSimuladoCustomAlert(`Não é possível excluir. Existem ${simuladosNestaCategoria} simulado(s) nesta categoria.`, "Categoria em Uso"); return;
    }
    simuladosState.itemToDelete = { type: 'categoria', id: categoriaId };
    openSimuladoConfirmDeleteModal("Confirmar Exclusão", `Excluir a categoria "${simuladosState.categorias.find(c => c.id === categoriaId)?.nome || ''}"?`);
}

function openSimuladoConfirmDeleteModal(title, message) {
    if (!simuladoConfirmDeleteModal) return;
    simuladoConfirmDeleteTitle.textContent = title;
    simuladoConfirmDeleteMessage.textContent = message;
    simuladoConfirmDeleteModalOverlay.classList.add('show');
    simuladoConfirmDeleteModal.classList.add('show');
    document.body.classList.add('modal-open');
}

function closeSimuladoConfirmDeleteModal() {
    if (simuladoConfirmDeleteModal) {
        simuladoConfirmDeleteModal.classList.remove('show');
        simuladoConfirmDeleteModalOverlay.classList.remove('show');
        document.body.classList.remove('modal-open');
        simuladosState.itemToDelete = { type: null, id: null };
    }
}

function executeDeleteSimuladoItem() {
    const { type, id } = simuladosState.itemToDelete;
    if (!type || !id) return;
    if (type === 'simulado') {
        const index = simuladosState.simulados.findIndex(s => s.id === id);
        if (index > -1) simuladosState.simulados.splice(index, 1);
    } else if (type === 'categoria') {
        const index = simuladosState.categorias.findIndex(cat => cat.id === id);
        if (index > -1) simuladosState.categorias.splice(index, 1);
        renderSimuladoCategoriasFiltro();
        if (simuladosState.currentCategoryFilter === id) simuladosState.currentCategoryFilter = 'all';
    }
    saveSimuladosState(); renderAllCategorySections(); closeSimuladoConfirmDeleteModal();
}

function requestDeleteSimulado(simuladoId) {
    simuladosState.itemToDelete = { type: 'simulado', id: simuladoId };
    if (simuladosState.itemToDelete.type === 'simulado') {
        executeDeleteSimuladoItem();
    } else { 
        const categoriaNome = simuladosState.categorias.find(c => c.id === simuladoId)?.nome || "esta categoria";
        openSimuladoConfirmDeleteModal("Confirmar Exclusão", `Excluir "${categoriaNome}"? Esta ação não pode ser desfeita.`);
    }
}

function renderSimuladoCategoriasFiltro() {
    if (!simuladosFiltersContainer) return;
    const manageCategoriesButtonOriginal = document.getElementById('btn-manage-simulado-categories');
    simuladosFiltersContainer.innerHTML = '';
    const btnTodos = document.createElement('button');
    btnTodos.className = 'btn btn-filter'; btnTodos.textContent = 'Todos'; btnTodos.dataset.categoryId = 'all';
    btnTodos.classList.toggle('active', simuladosState.currentCategoryFilter === 'all');
    btnTodos.addEventListener('click', () => filterSimuladosByCategory('all'));
    simuladosFiltersContainer.appendChild(btnTodos);
    simuladosState.categorias.forEach(cat => {
        const btnCat = document.createElement('button');
        btnCat.className = 'btn btn-filter'; btnCat.textContent = cat.nome; btnCat.dataset.categoryId = cat.id;
        btnCat.classList.toggle('active', simuladosState.currentCategoryFilter === cat.id);
        btnCat.addEventListener('click', () => filterSimuladosByCategory(cat.id));
        simuladosFiltersContainer.appendChild(btnCat);
    });
    if (manageCategoriesButtonOriginal) simuladosFiltersContainer.appendChild(manageCategoriesButtonOriginal);
}

function renderSimuladoCategoriasLista() {
    if (!simuladoCategoriesListEl) return;
    simuladoCategoriesListEl.innerHTML = '';
    if (simuladosState.categorias.length === 0) {
        simuladoCategoriesListEl.innerHTML = '<li class="category-item-empty">Nenhuma categoria criada.</li>'; return;
    }
    simuladosState.categorias.forEach(cat => {
        const li = document.createElement('li'); li.className = 'category-item'; li.dataset.categoryId = cat.id;
        const nameSpan = document.createElement('span'); nameSpan.className = 'category-item-name'; nameSpan.textContent = cat.nome;
        const actionsDiv = document.createElement('div'); actionsDiv.className = 'category-item-actions';
        const editBtn = document.createElement('button'); editBtn.className = 'btn-icon edit-category-btn'; editBtn.innerHTML = '<i class="bi bi-pencil-fill"></i>'; editBtn.title = "Editar";
        editBtn.addEventListener('click', () => { const n = prompt(`Editar: "${cat.nome}"`, cat.nome); if (n !== null) handleEditSimuladoCategory(cat.id, n); });
        const deleteBtn = document.createElement('button'); deleteBtn.className = 'btn-icon delete-category-btn'; deleteBtn.innerHTML = '<i class="bi bi-trash3-fill"></i>'; deleteBtn.title = "Excluir";
        deleteBtn.addEventListener('click', () => {
            simuladosState.itemToDelete = { type: 'categoria', id: cat.id };
            openSimuladoConfirmDeleteModal("Confirmar Exclusão", `Excluir a categoria "${cat.nome}"? Lembre-se que só é possível excluir categorias sem simulados vinculados.`);
        });
        actionsDiv.appendChild(editBtn); actionsDiv.appendChild(deleteBtn);
        li.appendChild(nameSpan); li.appendChild(actionsDiv);
        simuladoCategoriesListEl.appendChild(li);
    });
}

function populateSimuladoCategoriasSelect(selectElement) {
    if (!selectElement) return;
    const currentValue = selectElement.value;
    selectElement.innerHTML = '<option value="">Selecione uma categoria...</option>';
    simuladosState.categorias.forEach(cat => {
        const option = document.createElement('option'); option.value = cat.id; option.textContent = cat.nome;
        selectElement.appendChild(option);
    });
    if (simuladosState.categorias.some(cat => cat.id === currentValue)) selectElement.value = currentValue;
}

function renderAllCategorySections() {
    if (!simuladosCategorySectionsContainer || !simuladosEmptyMessage) return;
    simuladosCategorySectionsContainer.innerHTML = '';
    Object.values(simuladosState.charts).forEach(chart => { if (chart) chart.destroy(); });
    simuladosState.charts = {};
    simuladosState.expandedRowTracker = {};

    const hasAnySimulado = simuladosState.simulados.length > 0;
    simuladosEmptyMessage.style.display = 'none';

    if (simuladosState.currentCategoryFilter === 'all') {
        if (hasAnySimulado) {
            renderCategorySection('all', 'Visão Geral de Todos os Simulados', true);
        } else {
            simuladosEmptyMessage.style.display = 'block';
        }
    } else {
        const categoriaFiltrada = simuladosState.categorias.find(c => c.id === simuladosState.currentCategoryFilter);
        if (categoriaFiltrada) {
            const simuladosNestaCategoria = simuladosState.simulados.filter(s => s.categoriaId === categoriaFiltrada.id);
            if (simuladosNestaCategoria.length > 0) {
                renderCategorySection(categoriaFiltrada.id, categoriaFiltrada.nome, false);
            } else {
                simuladosCategorySectionsContainer.innerHTML = `<p class="simulados-empty-message">Nenhum simulado registrado para a categoria "${escapeHtml(categoriaFiltrada.nome)}".</p>`;
            }
        } else {
            simuladosState.currentCategoryFilter = 'all';
            renderSimuladoCategoriasFiltro();
            renderAllCategorySections();
        }
    }
}

function renderCategorySection(categoryId, categoryName, isTodosSection = false) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'simulado-category-section';
    sectionEl.dataset.categoryId = categoryId;

    const headerEl = document.createElement('div');
    headerEl.className = 'simulado-category-header';
    const titleEl = document.createElement('h3');
    titleEl.className = 'simulado-category-title';
    titleEl.textContent = categoryName;
    headerEl.appendChild(titleEl);

    const chartFiltersEl = document.createElement('div');
    chartFiltersEl.className = 'simulado-category-chart-filters';
    chartFiltersEl.innerHTML = `
        <select class="simulado-metric-filter" data-category-id="${categoryId}" aria-label="Filtrar métrica do gráfico">
            <option value="accuracy">Porcentagem de Acertos</option>
            <option value="duration">Tempo Gasto</option>
        </select>
        <select class="simulado-period-filter" data-category-id="${categoryId}" aria-label="Filtrar período do gráfico">
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="lastYear">Último Ano</option>
            <option value="allTime" selected>Desde o Início</option>
        </select>
    `;
    headerEl.appendChild(chartFiltersEl);

    const chartContainerEl = document.createElement('div');
    chartContainerEl.className = 'simulado-category-chart-container';
    const canvasEl = document.createElement('canvas');
    canvasEl.id = `simulado-chart-${categoryId}`;
    chartContainerEl.appendChild(canvasEl);

    const summaryBarEl = document.createElement('div');
    summaryBarEl.className = 'simulados-summary-bar';
    summaryBarEl.id = `simulados-summary-bar-${categoryId}`;

    const gridEl = document.createElement('div');
    gridEl.className = 'simulados-grid';
    gridEl.id = `simulados-grid-${categoryId}`;

    sectionEl.appendChild(headerEl);
    sectionEl.appendChild(chartContainerEl);
    sectionEl.appendChild(summaryBarEl);
    sectionEl.appendChild(gridEl);
    simuladosCategorySectionsContainer.appendChild(sectionEl);

    const metricFilterSelect = chartFiltersEl.querySelector('.simulado-metric-filter');
    const periodFilterSelect = chartFiltersEl.querySelector('.simulado-period-filter');
    metricFilterSelect.addEventListener('change', () => updateSimuladoChart(categoryId));
    periodFilterSelect.addEventListener('change', () => {
        updateSimuladoChart(categoryId);
        updateCategorySummary(categoryId);
    });

    renderSimuladosGridForCategory(categoryId, gridEl);
    updateSimuladoChart(categoryId);
    updateCategorySummary(categoryId);
}

function renderSimuladosGridForCategory(categoryId, gridContainer) {
    gridContainer.innerHTML = '';
    gridContainer.className = 'simulados-grid'; 
    simuladosState.expandedRowTracker[categoryId] = simuladosState.expandedRowTracker[categoryId] || {};

    const simuladosParaRenderizar = (categoryId === 'all')
        ? [...simuladosState.simulados]
        : simuladosState.simulados.filter(s => s.categoriaId === categoryId);

    simuladosParaRenderizar.sort((a, b) => new Date(b.dataRealizacao) - new Date(a.dataRealizacao));

    if (simuladosParaRenderizar.length === 0) {
        if (categoryId !== 'all') {
            gridContainer.innerHTML = '<p class="simulados-empty-message">Nenhum simulado nesta categoria.</p>';
        }
        return;
    }
    
    const numColumns = getNumColumnsForGrid(gridContainer);

    simuladosParaRenderizar.forEach((simulado, index) => {
        const card = createSimuladoCardElement(simulado, categoryId, index, numColumns);
        gridContainer.appendChild(card);
    });
}

function createSimuladoCardElement(simulado, categoryId, indexInGrid, numGridCols) {
    const card = document.createElement('div');
    card.className = 'simulado-card';
    card.dataset.simuladoId = simulado.id;
    card.dataset.gridRow = Math.floor(indexInGrid / numGridCols);

    const categoriaNome = simuladosState.categorias.find(c => c.id === simulado.categoriaId)?.nome || 'Sem Categoria';
    const percentualAcertos = simulado.totalQuestoes > 0 ? Math.round((simulado.acertos / simulado.totalQuestoes) * 100) : 0; // Arredondado
    const desempenhoTexto = getDesempenhoTexto(percentualAcertos);
    const desempenhoClasse = getDesempenhoClasse(percentualAcertos);

    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'simulado-card-summary';
    summaryDiv.innerHTML = `
        <div class="simulado-card-header">
            <div class="simulado-card-title-group">
                <h3 class="simulado-card-nome">${escapeHtml(simulado.nome)}</h3>
            </div>
            <button class="simulado-card-options-btn" aria-label="Opções do simulado">
                <i class="bi bi-three-dots-vertical"></i>
            </button>
        </div>
        <div class="simulado-card-info-line">
            <span class="simulado-card-categoria">${escapeHtml(categoriaNome)}</span>
            <span class="simulado-card-data">
                <i class="bi bi-calendar-event"></i>
                ${formatDateToDDMMYYYY(simulado.dataRealizacao)}
            </span>
            <div class="simulado-card-expand-icon"><i class="bi bi-chevron-down"></i></div>
        </div>
    `;

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'simulado-card-details';
    detailsDiv.innerHTML = `
        <div class="simulado-details-grid">
            <div class="simulado-metric-display">
                <div class="metric-header">
                    <i class="bi bi-check2-circle metric-icon"></i>
                    <span class="metric-label">Acertos</span>
                </div>
                <div class="metric-value">${simulado.acertos} <span class="metric-value-small">/ ${simulado.totalQuestoes} (${percentualAcertos}%)</span></div> {/* Arredondado */}
            </div>
            <div class="simulado-metric-display">
                <div class="metric-header">
                    <i class="bi bi-clock-history metric-icon"></i>
                    <span class="metric-label">Tempo</span>
                </div>
                <div class="metric-value">${simulado.tempoGastoMinutos ? formatMinutesToHHMM(simulado.tempoGastoMinutos) : '--'}</div>
            </div>
        </div>
        <div class="simulado-progress-section">
            <div class="simulado-progress-header">
                <span class="progress-label-text">Percentual de Acertos</span>
                <span class="progress-percentage-text">${percentualAcertos}%</span> 
            </div>
            <div class="simulado-progress-bar-container">
                <div class="simulado-progress-bar">
                    <div class="simulado-progress-fill" style="width: ${percentualAcertos}%;"></div>
                </div>
            </div>
        </div>
        <div class="simulado-performance-section">
            <span class="performance-label"><i class="bi bi-award-fill"></i>Desempenho</span>
            <span class="performance-badge ${desempenhoClasse}">${desempenhoTexto}</span>
        </div>
        ${simulado.status ? `<div class="simulado-card-status-info">Status: <strong>${formatSimuladoStatus(simulado.status)}</strong></div>` : ''}
    `;

    card.appendChild(summaryDiv);
    card.appendChild(detailsDiv);

    const optionsBtn = card.querySelector('.simulado-card-options-btn');
    optionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showSimuladoCardOptionsMenu(e.currentTarget, simulado.id);
    });

    summaryDiv.addEventListener('click', (e) => {
        if (e.target.closest('.simulado-card-options-btn')) return;
        toggleSimuladoCardExpansion(card, categoryId);
    });
    
    if (simuladosState.expandedRowTracker[categoryId] && simuladosState.expandedRowTracker[categoryId][card.dataset.gridRow]) {
        card.classList.add('expanded');
        detailsDiv.style.display = 'flex';
        detailsDiv.style.maxHeight = detailsDiv.scrollHeight + "px";
        detailsDiv.style.opacity = '1';
    }
    return card;
}

function toggleSimuladoCardExpansion(clickedCard, categoryId) {
    const gridContainer = clickedCard.closest('.simulados-grid');
    if (!gridContainer) return;

    const rowIndexOfClickedCard = parseInt(clickedCard.dataset.gridRow, 10);
    // Determina se o card clicado deve ser expandido ou se já estava e deve ser colapsado.
    const shouldBeExpanded = !clickedCard.classList.contains('expanded');

    if (!simuladosState.expandedRowTracker[categoryId]) {
        simuladosState.expandedRowTracker[categoryId] = {};
    }

    // Atualiza o estado de rastreamento para a linha do card clicado
    simuladosState.expandedRowTracker[categoryId][rowIndexOfClickedCard] = shouldBeExpanded;

    // Se estamos expandindo o card clicado, colapsa outros cards em OUTRAS linhas
    if (shouldBeExpanded) {
        for (const row in simuladosState.expandedRowTracker[categoryId]) {
            if (parseInt(row, 10) !== rowIndexOfClickedCard) {
                simuladosState.expandedRowTracker[categoryId][row] = false;
            }
        }
    }

    const cardsInGrid = Array.from(gridContainer.querySelectorAll('.simulado-card'));
    cardsInGrid.forEach(card => {
        const cardRow = parseInt(card.dataset.gridRow, 10);
        const detailsDiv = card.querySelector('.simulado-card-details');
        const simuladoId = card.dataset.simuladoId;
        const simulado = simuladosState.simulados.find(s => s.id === simuladoId);

        if (detailsDiv) {
            if (simuladosState.expandedRowTracker[categoryId][cardRow]) { // Se este card (ou sua linha) deve ser expandido
                if (simulado) { // Garante que temos dados para popular
                    detailsDiv.innerHTML = ''; // Limpa antes de popular para garantir conteúdo fresco
                    populateSimuladoCardDetails(detailsDiv, simulado);
                } else if (detailsDiv.innerHTML.trim() === '' && card === clickedCard) {
                     console.warn(`Dados do simulado ${simuladoId} não encontrados para popular detalhes.`);
                }
                
                card.classList.add('expanded');
                detailsDiv.style.display = 'flex';
                void detailsDiv.offsetWidth; // Força reflow

                requestAnimationFrame(() => {
                    detailsDiv.style.maxHeight = detailsDiv.scrollHeight + "px";
                    detailsDiv.style.opacity = '1';
                });

            } else { // Se este card (ou sua linha) deve ser colapsado
                if (card.classList.contains('expanded')) {
                    card.classList.remove('expanded');
                    detailsDiv.style.maxHeight = '0';
                    detailsDiv.style.opacity = '0';

                    // Limpa o conteúdo após a transição para economizar memória e garantir scrollHeight=0
                    setTimeout(() => {
                        if (!card.classList.contains('expanded')) { // Checa novamente em caso de toggles rápidos
                            detailsDiv.style.display = 'none';
                            detailsDiv.innerHTML = '';
                        }
                    }, 360); // Duração um pouco maior que a transição CSS (0.35s)
                }
            }
        }
    });
}

function populateSimuladoCardDetails(detailsContainer, simulado) {
    if (!detailsContainer || !simulado) return;

    const percentualAcertos = simulado.totalQuestoes > 0 ? Math.round((simulado.acertos / simulado.totalQuestoes) * 100) : 0;
    const desempenhoTexto = getDesempenhoTexto(percentualAcertos); // Certifique-se que getDesempenhoTexto existe
    const desempenhoClasse = getDesempenhoClasse(percentualAcertos); // Certifique-se que getDesempenhoClasse existe

    detailsContainer.innerHTML = `
        <div class="simulado-details-grid">
            <div class="simulado-metric-display">
                <div class="metric-header">
                    <i class="bi bi-check2-circle metric-icon"></i>
                    <span class="metric-label">Acertos</span>
                </div>
                <div class="metric-value">${simulado.acertos} <span class="metric-value-small">/ ${simulado.totalQuestoes} (${percentualAcertos}%)</span></div>
            </div>
            <div class="simulado-metric-display">
                <div class="metric-header">
                    <i class="bi bi-clock-history metric-icon"></i>
                    <span class="metric-label">Tempo</span>
                </div>
                <div class="metric-value">${simulado.tempoGastoMinutos ? formatMinutesToHHMM(simulado.tempoGastoMinutos) : '--'}</div>
            </div>
        </div>
        <div class="simulado-progress-section">
            <div class="simulado-progress-header">
                <span class="progress-label-text">Percentual de Acertos</span>
                <span class="progress-percentage-text">${percentualAcertos}%</span>
            </div>
            <div class="simulado-progress-bar-container">
                <div class="simulado-progress-bar">
                    <div class="simulado-progress-fill" style="width: ${percentualAcertos}%;"></div>
                </div>
            </div>
        </div>
        <div class="simulado-performance-section">
            <span class="performance-label"><i class="bi bi-award-fill"></i>Desempenho</span>
            <span class="performance-badge ${desempenhoClasse}">${desempenhoTexto}</span>
        </div>
        ${simulado.status ? `<div class="simulado-card-status-info">Status: <strong>${formatSimuladoStatus(simulado.status)}</strong></div>` : ''}
    `;
}


function getDesempenhoTexto(percentual) {
    if (percentual >= 85) return "Excelente";
    if (percentual >= 70) return "Bom";
    if (percentual >= 50) return "Regular";
    return "Precisa Melhorar";
}

function getDesempenhoClasse(percentual) {
    if (percentual >= 85) return "excelente";
    if (percentual >= 70) return "bom";
    if (percentual >= 50) return "regular";
    return "precisa-melhorar";
}

function showSimuladoCardOptionsMenu(buttonElement, simuladoId) {
    const existingMenu = document.querySelector('.simulado-card-options-menu');
    if (existingMenu) existingMenu.remove();
    const menu = document.createElement('div');
    menu.className = 'simulado-card-options-menu';
    const editButton = document.createElement('button');
    editButton.innerHTML = '<i class="bi bi-pencil-fill"></i> Editar';
    editButton.addEventListener('click', () => { openSimuladoFormModal(simuladoId); menu.remove(); });
    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="bi bi-trash3-fill"></i> Excluir';
    deleteButton.addEventListener('click', () => { requestDeleteSimulado(simuladoId); menu.remove(); });
    menu.appendChild(editButton); menu.appendChild(deleteButton);
    document.body.appendChild(menu);
    const rect = buttonElement.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 2}px`;
    menu.style.left = `${rect.right + window.scrollX - menu.offsetWidth}px`;
    function closeMenuOnClickOutside(event) {
        if (!menu.contains(event.target) && event.target !== buttonElement && !buttonElement.contains(event.target)) {
            menu.remove(); document.removeEventListener('click', closeMenuOnClickOutside, true);
        }
    }
    setTimeout(() => document.addEventListener('click', closeMenuOnClickOutside, true), 0);
}

function filterSimuladosByCategory(categoryId) {
    simuladosState.currentCategoryFilter = categoryId;
    const filterButtons = simuladosFiltersContainer.querySelectorAll('.btn-filter');
    filterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.categoryId === categoryId));
    renderAllCategorySections();
}

function updateCategorySummary(categoryId) {
    const summaryBarEl = document.getElementById(`simulados-summary-bar-${categoryId}`);
    if (!summaryBarEl) return;
    const periodFilterSelect = document.querySelector(`.simulado-period-filter[data-category-id="${categoryId}"]`);
    const selectedPeriod = periodFilterSelect ? periodFilterSelect.value : 'allTime';
    let simuladosParaSumario = (categoryId === 'all')
        ? [...simuladosState.simulados]
        : simuladosState.simulados.filter(s => s.categoriaId === categoryId);
    const now = new Date();
    if (selectedPeriod !== 'allTime') {
        simuladosParaSumario = simuladosParaSumario.filter(s => {
            const dataSimulado = new Date(s.dataRealizacao + "T00:00:00");
            if (selectedPeriod === '7days') return (now - dataSimulado) / (1000 * 60 * 60 * 24) <= 7;
            if (selectedPeriod === '30days') return (now - dataSimulado) / (1000 * 60 * 60 * 24) <= 30;
            if (selectedPeriod === 'lastYear') {
                const oneYearAgo = new Date(now); oneYearAgo.setFullYear(now.getFullYear() - 1);
                return dataSimulado >= oneYearAgo && dataSimulado <= now;
            }
            return true;
        });
    }
    const totalCount = simuladosParaSumario.length; let totalAcertos = 0; let totalQuestoesConsideradasParaMedia = 0;
    let totalTempoMinutos = 0; let countSimuladosComTempo = 0;
    const pendingCount = simuladosParaSumario.filter(s => s.status === 'pendente_realizacao' || s.status === 'aguardando_correcao').length;
    simuladosParaSumario.forEach(s => {
        if (s.totalQuestoes > 0 && s.status === 'corrigido') {
            totalAcertos += s.acertos; totalQuestoesConsideradasParaMedia += s.totalQuestoes;
        }
        if (s.tempoGastoMinutos !== null && s.tempoGastoMinutos > 0 && s.status === 'corrigido') {
            totalTempoMinutos += s.tempoGastoMinutos; countSimuladosComTempo++;
        }
    });
    const avgAccuracy = totalQuestoesConsideradasParaMedia > 0 ? Math.round((totalAcertos / totalQuestoesConsideradasParaMedia) * 100) + '%' : '0%'; // Arredondado
    const avgTimeFormatted = countSimuladosComTempo > 0 ? formatMinutesToHHMM(Math.round(totalTempoMinutos / countSimuladosComTempo)) : '0h00';
    summaryBarEl.innerHTML = `
        <div class="summary-item"><i class="bi bi-file-earmark-text-fill"></i><span class="summary-value">${totalCount}</span><span class="summary-label">Total</span></div>
        <div class="summary-item"><i class="bi bi-graph-up"></i><span class="summary-value">${avgAccuracy}</span><span class="summary-label">Média Acertos</span></div>
        <div class="summary-item"><i class="bi bi-clock-fill"></i><span class="summary-value">${avgTimeFormatted}</span><span class="summary-label">Tempo Médio</span></div>
        <div class="summary-item"><i class="bi bi-calendar-week-fill"></i><span class="summary-value">${pendingCount}</span><span class="summary-label">Pendentes</span></div>
    `;
}

function updateSimuladoChart(categoryId) {
    const canvasId = `simulado-chart-${categoryId}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const metricFilterSelect = document.querySelector(`.simulado-metric-filter[data-category-id="${categoryId}"]`);
    const periodFilterSelect = document.querySelector(`.simulado-period-filter[data-category-id="${categoryId}"]`);
    if (!metricFilterSelect || !periodFilterSelect) return;
    const currentSelectedMetric = metricFilterSelect.value;
    const selectedPeriod = periodFilterSelect.value;
    let simuladosParaGrafico = (categoryId === 'all')
        ? [...simuladosState.simulados]
        : simuladosState.simulados.filter(s => s.categoriaId === categoryId);
    simuladosParaGrafico = simuladosParaGrafico.filter(s => s.status === 'corrigido');
    const now = new Date();
    if (selectedPeriod !== 'allTime') {
        simuladosParaGrafico = simuladosParaGrafico.filter(s => {
            const dataSimulado = new Date(s.dataRealizacao + "T00:00:00");
            if (selectedPeriod === '7days') return (now - dataSimulado) / (1000 * 60 * 60 * 24) <= 7;
            if (selectedPeriod === '30days') return (now - dataSimulado) / (1000 * 60 * 60 * 24) <= 30;
            if (selectedPeriod === 'lastYear') { const o = new Date(now); o.setFullYear(now.getFullYear() - 1); return dataSimulado >= o && dataSimulado <= now; }
            return true;
        });
    }
    simuladosParaGrafico.sort((a, b) => new Date(a.dataRealizacao) - new Date(b.dataRealizacao));
    const labels = simuladosParaGrafico.map(s => formatDateToDDMMYYYY(s.dataRealizacao));
    let data, yAxisLabel = '', tooltipLabelPrefix = '', dataFormatter = val => val;
    if (currentSelectedMetric === 'accuracy') {
        data = simuladosParaGrafico.map(s => s.totalQuestoes > 0 ? Math.round((s.acertos / s.totalQuestoes) * 100) : 0); // Arredondado
        yAxisLabel = '% de Acertos'; tooltipLabelPrefix = 'Acertos'; dataFormatter = val => `${Math.round(val)}%`; // Arredondado
    } else { // duration
        data = simuladosParaGrafico.map(s => s.tempoGastoMinutos || 0);
        yAxisLabel = 'Tempo Gasto (min)'; tooltipLabelPrefix = 'Tempo Gasto'; dataFormatter = val => `${Math.round(val)} min`;
    }
    const chartConfig = createSimuladoChartConfig(labels, data, yAxisLabel, tooltipLabelPrefix, dataFormatter, currentSelectedMetric);
    if (simuladosState.charts[categoryId]) simuladosState.charts[categoryId].destroy();
    simuladosState.charts[categoryId] = new Chart(canvas.getContext('2d'), chartConfig);
}

function createSimuladoChartConfig(labels, data, yAxisLabel, tooltipLabelPrefix, dataFormatter, selectedMetric) {
    const isDarkMode = simuladosState.isDarkModeGlobal !== undefined ? simuladosState.isDarkModeGlobal : (window.state ? window.state.isDarkMode : true);
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue(isDarkMode ? '--primary-color-dark' : '--primary-color-light').trim();
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDarkMode ? '#AAA' : '#555';
    const tooltipBackgroundColor = isDarkMode ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.95)';
    const tooltipTextColor = isDarkMode ? '#FFFFFF' : '#222';
    const bodyBgColor = getComputedStyle(document.body).backgroundColor;
    const canvasTemp = document.createElement('canvas');
    const ctxTemp = canvasTemp.getContext('2d');
    const gradient = ctxTemp.createLinearGradient(0,0,0, 200);
     try { gradient.addColorStop(0, hexToRgba(primaryColor, 0.3)); gradient.addColorStop(1, hexToRgba(primaryColor, 0)); }
     catch (e) { gradient.addColorStop(0, 'rgba(0,122,255,0.3)'); gradient.addColorStop(1, 'rgba(0,122,255,0)'); }
    return {
        type: 'line', data: { labels: labels, datasets: [{ label: tooltipLabelPrefix, data: data, borderColor: primaryColor, backgroundColor: gradient, fill: true, tension: 0.3, pointBackgroundColor: primaryColor, pointBorderColor: bodyBgColor, pointBorderWidth: 1.5, pointHoverBackgroundColor: primaryColor, pointHoverBorderColor: bodyBgColor, pointHoverBorderWidth: 2, pointRadius: 4, pointHoverRadius: 7 }] },
        options: { responsive: true, maintainAspectRatio: false, animation: { duration: 600 }, scales: { y: { beginAtZero: true, grid: { color: gridColor, drawBorder: false }, ticks: { color: textColor, precision: 0, callback: dataFormatter }, title: { display: true, text: yAxisLabel, color: textColor, font: { size: 11 } }, afterDataLimits: (axis) => { if (axis.max === 0 && axis.min === 0) axis.max = (selectedMetric === 'accuracy') ? 100 : 60; else if (selectedMetric === 'accuracy' && axis.max > 100) axis.max = 100; } }, x: { grid: { display: false }, ticks: { color: textColor, autoSkip: true, maxTicksLimit: 10 } } }, plugins: { legend: { display: false }, tooltip: { enabled: true, backgroundColor: tooltipBackgroundColor, titleColor: tooltipTextColor, bodyColor: tooltipTextColor, titleFont: { weight: 'bold', size: 13 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6, borderColor: primaryColor, borderWidth: 1, displayColors: false, callbacks: { title: (items) => items[0].label, label: (item) => `${tooltipLabelPrefix}: ${dataFormatter(item.raw)}` } } }, interaction: { mode: 'index', intersect: false }, hover: { mode: 'nearest', intersect: true } }
    };
}

function formatMinutesToHHMM(totalMinutes) {
    if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes) || totalMinutes < 0) return null;
    const hours = Math.floor(totalMinutes / 60); const minutes = totalMinutes % 60;
    return `${hours}h${String(minutes).padStart(2, '0')}`;
}

function parseHHMMToMinutes(hhmmString) {
    if (!hhmmString || typeof hhmmString !== 'string') return null;
    const regex = /(\d+)\s*h\s*(\d+)?m?|(\d+)\s*:\s*(\d+)|(\d+)\s*m/i;
    const parts = hhmmString.match(regex); if (!parts) return null;
    let hours = 0, minutes = 0;
    if (parts[1] !== undefined) { hours = parseInt(parts[1], 10); if (parts[2] !== undefined) minutes = parseInt(parts[2], 10); }
    else if (parts[3] !== undefined) { hours = parseInt(parts[3], 10); if (parts[4] !== undefined) minutes = parseInt(parts[4], 10); }
    else if (parts[5] !== undefined) { minutes = parseInt(parts[5], 10); } else return null;
    if (isNaN(hours) || isNaN(minutes)) return null;
    return (hours * 60) + minutes;
}

function formatSimuladoStatus(statusKey) {
    const statusMap = { 'corrigido': 'Corrigido', 'aguardando_correcao': 'Aguardando Correção', 'pendente_realizacao': 'Pendente' };
    return statusMap[statusKey] || 'Desconhecido';
}

function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


if (typeof hexToRgba === 'undefined' && typeof window !== 'undefined') {
    window.hexToRgba = function(hex, alpha = 1) {
        if (!hex || typeof hex !== 'string') return `rgba(0,0,0,${alpha})`;
        const hexVal = hex.startsWith('#') ? hex.slice(1) : hex;
        if (hexVal.length !== 3 && hexVal.length !== 6) return `rgba(0,0,0,${alpha})`;
        let r, g, b;
        if (hexVal.length === 3) { r = parseInt(hexVal[0] + hexVal[0], 16); g = parseInt(hexVal[1] + hexVal[1], 16); b = parseInt(hexVal[2] + hexVal[2], 16); }
        else { r = parseInt(hexVal.substring(0, 2), 16); g = parseInt(hexVal.substring(2, 4), 16); b = parseInt(hexVal.substring(4, 6), 16); }
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

function showSimuladoCustomAlert(message, title) {
    if (typeof window.showCustomAlert === 'function') window.showCustomAlert(message, title);
    else alert(`${title}: ${message}`);
}

document.addEventListener('taskifyStateReady', (event) => {
    if (event.detail && event.detail.taskifyAppState) {
        simuladosState.isDarkModeGlobal = event.detail.taskifyAppState.isDarkMode;
    }
});
document.addEventListener('taskifyThemeChanged', (event) => {
    if (event.detail && typeof event.detail.isDarkMode === 'boolean') {
        simuladosState.isDarkModeGlobal = event.detail.isDarkMode;
        Object.keys(simuladosState.charts).forEach(categoryId => updateSimuladoChart(categoryId));
    }
});

if (typeof window !== 'undefined' && typeof window.getNumColumnsForGrid === 'undefined') {
    window.getNumColumnsForGrid = function(gridElement) {
        if (!gridElement) return 1;
        try {
            const gridComputedStyle = window.getComputedStyle(gridElement);
            const gridTemplateColumns = gridComputedStyle.getPropertyValue('grid-template-columns');
            const repeatMatch = gridTemplateColumns.match(/repeat\((\d+),/);
            if (repeatMatch && repeatMatch[1]) {
                return parseInt(repeatMatch[1], 10);
            }
            const columnCount = (gridTemplateColumns.split(' ').filter(s => s.trim() !== '' && s.trim() !== 'none')).length;
            return columnCount > 0 ? columnCount : 1;
        } catch (e) {
            console.warn("Erro ao obter número de colunas do grid:", e);
            return 1; 
        }
    };
}

window.initSimuladosModule = initSimuladosModule;
console.log("Taskify - Módulo Simulados: Carregado e pronto para ajustes.");