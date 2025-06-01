// js/simulados.js

// Variáveis globais para elementos da UI de Simulados
let simuladoFormModal, simuladoFormModalOverlay, simuladoFormModalCloseBtn, simuladoModalTitle, simuladoForm, simuladoIdInput,
    simuladoNomeInput, simuladoCategoriaSelect, simuladoDataInput, simuladoAcertosInput, simuladoTotalQuestoesInput,
    simuladoTempoGastoInput, simuladoNotaInput, simuladoStatusSelect, simuladoObservacoesInput, simuladoFormCancelBtn,
    btnManageSimuladoCategories, simuladosFiltersContainer, simuladosGridContainer, simuladosEmptyMessage,
    simuladosTotalCountEl, simuladosAvgAccuracyEl, simuladosAvgTimeEl, simuladosPendingCountEl, btnAddSimuladoMain;

let simuladoCategoriesModal, simuladoCategoriesModalOverlay, simuladoCategoriesModalCloseBtn,
    simuladoAddCategoryForm, simuladoNewCategoryNameInput, simuladoCategoriesListEl, simuladoCategoriesDoneBtn;

let simuladoConfirmDeleteModal, simuladoConfirmDeleteModalOverlay, simuladoConfirmDeleteCloseBtn,
    simuladoConfirmDeleteTitle, simuladoConfirmDeleteMessage, simuladoBtnCancelDeleteConfirmation, simuladoBtnConfirmDeleteAction;

let simuladoDatePicker; // Instância do Flatpickr para o formulário de simulado

// Estado
let simuladosState = {
    simulados: [], // Array de objetos de simulado
    categorias: [], // Array de objetos de categoria
    editingSimuladoId: null,
    editingCategoriaId: null,
    currentCategoryFilter: 'all',
    itemToDelete: { type: null, id: null } // { type: 'simulado' | 'categoria', id: '...' }
};

const DEFAULT_SIMULADO_CATEGORIES = [
    { id: 'enem_geral', nome: 'ENEM Geral' },
    { id: 'enem_1_dia', nome: 'ENEM 1º Dia' },
    { id: 'enem_2_dia', nome: 'ENEM 2º Dia' },
    { id: 'linguagens', nome: 'Linguagens' },
    { id: 'humanas', nome: 'Humanas' },
    { id: 'natureza', nome: 'Natureza' },
    { id: 'matematica', nome: 'Matemática' },
    { id: 'vestibular_geral', nome: 'Vestibular Geral' }
];

// --- INICIALIZAÇÃO ---
function initSimulados() {
    console.log("Taskify - Módulo Simulados: Inicializando...");

    // Mapeamento de Elementos DOM
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
    simuladoNotaInput = document.getElementById('simulado-nota-input');
    simuladoStatusSelect = document.getElementById('simulado-status-select');
    simuladoObservacoesInput = document.getElementById('simulado-observacoes-input');
    simuladoFormCancelBtn = document.getElementById('simulado-form-cancel-btn');
    btnAddSimuladoMain = document.getElementById('btn-add-simulado-main');

    btnManageSimuladoCategories = document.getElementById('btn-manage-simulado-categories');
    simuladosFiltersContainer = document.getElementById('simulados-filters-container');
    simuladosGridContainer = document.getElementById('simulados-grid-container');
    simuladosEmptyMessage = document.getElementById('simulados-empty-message');

    simuladosTotalCountEl = document.getElementById('simulados-total-count');
    simuladosAvgAccuracyEl = document.getElementById('simulados-avg-accuracy');
    simuladosAvgTimeEl = document.getElementById('simulados-avg-time');
    simuladosPendingCountEl = document.getElementById('simulados-pending-count');

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

    // Carregar Dados
    loadSimuladosState();

    // Configurar Flatpickr para o campo de data do simulado
    if (simuladoDataInput && typeof flatpickr === 'function') {
        simuladoDatePicker = flatpickr(simuladoDataInput, {
            dateFormat: "d/m/Y",
            defaultDate: "today",
            locale: "pt",
            allowInput: true,
        });
    }

    // Adicionar Event Listeners
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


    // Renderização Inicial
    renderSimuladoCategoriasFiltro();
    renderSimuladosGrid();
    updateSimuladosSummary();

    console.log("Taskify - Módulo Simulados: Inicializado com sucesso.");
}

// --- GERENCIAMENTO DE ESTADO (localStorage) ---
function loadSimuladosState() {
    let loadedSimulados = [];
    let loadedCategorias = [];

    if (window.state && window.state.simuladosApp) {
        if (Array.isArray(window.state.simuladosApp.simulados)) {
            loadedSimulados = window.state.simuladosApp.simulados;
        } else if (window.state.simuladosApp.simulados) { // Se existe mas não é array
            console.warn("Taskify - Módulo Simulados: window.state.simuladosApp.simulados não é um array. Redefinindo para []. Valor encontrado:", window.state.simuladosApp.simulados);
            // Não atribui nada a loadedSimulados, então ele permanece []
        }

        if (Array.isArray(window.state.simuladosApp.categorias)) {
            loadedCategorias = window.state.simuladosApp.categorias;
        } else if (window.state.simuladosApp.categorias) { // Se existe mas não é array
            console.warn("Taskify - Módulo Simulados: window.state.simuladosApp.categorias não é um array. Redefinindo para []. Valor encontrado:", window.state.simuladosApp.categorias);
            // Não atribui nada a loadedCategorias, então ele permanece []
        }
    } else {
        const savedSimuladosString = localStorage.getItem('taskify-simulados');
        if (savedSimuladosString) {
            try {
                const parsed = JSON.parse(savedSimuladosString);
                if (Array.isArray(parsed)) {
                    loadedSimulados = parsed;
                } else {
                    console.warn("Taskify - Módulo Simulados: 'taskify-simulados' do localStorage não é um array. Redefinindo para []. Valor encontrado:", parsed);
                }
            } catch (e) {
                console.error("Taskify - Módulo Simulados: Erro ao parsear 'taskify-simulados' do localStorage. Redefinindo para [].", e);
            }
        }

        const savedCategoriasString = localStorage.getItem('taskify-simulados-categorias');
        if (savedCategoriasString) {
            try {
                const parsed = JSON.parse(savedCategoriasString);
                if (Array.isArray(parsed)) {
                    loadedCategorias = parsed;
                } else {
                    console.warn("Taskify - Módulo Simulados: 'taskify-simulados-categorias' do localStorage não é um array. Redefinindo para []. Valor encontrado:", parsed);
                }
            } catch (e) {
                console.error("Taskify - Módulo Simulados: Erro ao parsear 'taskify-simulados-categorias' do localStorage. Redefinindo para [].", e);
            }
        }
    }

    simuladosState.simulados = loadedSimulados;
    simuladosState.categorias = loadedCategorias;

    if (simuladosState.categorias.length === 0) {
        simuladosState.categorias = [...DEFAULT_SIMULADO_CATEGORIES];
    }
    console.log("Estado dos simulados carregado:", simuladosState);
}


function saveSimuladosState() {
    if (window.state) { // Integrando ao estado global
        if (!window.state.simuladosApp) {
            window.state.simuladosApp = {};
        }
        window.state.simuladosApp.simulados = simuladosState.simulados;
        window.state.simuladosApp.categorias = simuladosState.categorias;
        if (typeof window.saveState === 'function') { // Chama a função saveState global
            window.saveState();
        } else { // Fallback se a função global não existir
            localStorage.setItem('taskify-simulados', JSON.stringify(simuladosState.simulados));
            localStorage.setItem('taskify-simulados-categorias', JSON.stringify(simuladosState.categorias));
        }
    } else { // Fallback
        localStorage.setItem('taskify-simulados', JSON.stringify(simuladosState.simulados));
        localStorage.setItem('taskify-simulados-categorias', JSON.stringify(simuladosState.categorias));
    }
    console.log("Estado dos simulados salvo.");
}


// --- MODAL: Adicionar/Editar Simulado ---
function openSimuladoFormModal(simuladoId = null) {
    if (!simuladoFormModal || !simuladoModalTitle) return;
    simuladoForm.reset();
    populateSimuladoCategoriasSelect(simuladoCategoriaSelect);

    if (simuladoId) {
        simuladosState.editingSimuladoId = simuladoId;
        simuladoModalTitle.innerHTML = '<i class="bi bi-pencil-fill"></i> Editar Simulado';
        const simulado = simuladosState.simulados.find(s => s.id === simuladoId);
        if (simulado) {
            simuladoIdInput.value = simulado.id;
            simuladoNomeInput.value = simulado.nome;
            simuladoCategoriaSelect.value = simulado.categoriaId;
            if (simuladoDatePicker && simulado.dataRealizacao) simuladoDatePicker.setDate(simulado.dataRealizacao, true);
            else if (simuladoDataInput && simulado.dataRealizacao) simuladoDataInput.value = formatDateToDDMMYYYY(simulado.dataRealizacao); // Fallback se flatpickr não carregar
            simuladoAcertosInput.value = simulado.acertos;
            simuladoTotalQuestoesInput.value = simulado.totalQuestoes;
            simuladoTempoGastoInput.value = formatMinutesToHHMM(simulado.tempoGastoMinutos) || '';
            simuladoNotaInput.value = simulado.nota !== null ? simulado.nota : '';
            simuladoStatusSelect.value = simulado.status || 'corrigido';
            simuladoObservacoesInput.value = simulado.observacoes || '';
        }
    } else {
        simuladosState.editingSimuladoId = null;
        simuladoModalTitle.innerHTML = '<i class="bi bi-plus-circle-fill"></i> Adicionar Simulado';
        if (simuladoDatePicker) simuladoDatePicker.setDate(new Date(), true); // Data atual para novo
        else if (simuladoDataInput) simuladoDataInput.value = formatDateToDDMMYYYY(getTodayISO());
        simuladoStatusSelect.value = 'corrigido'; // Default
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
    // Validar campos
    if (!simuladoNomeInput.value.trim() || !simuladoCategoriaSelect.value || !simuladoDataInput.value ||
        simuladoAcertosInput.value === '' || simuladoTotalQuestoesInput.value === '') {
        showCustomAlert("Preencha todos os campos obrigatórios (*).", "Campos Vazios");
        return;
    }
    const acertos = parseInt(simuladoAcertosInput.value);
    const totalQuestoes = parseInt(simuladoTotalQuestoesInput.value);
    if (isNaN(acertos) || acertos < 0 || isNaN(totalQuestoes) || totalQuestoes < 1 || acertos > totalQuestoes) {
        showCustomAlert("Número de acertos ou total de questões inválido.", "Valores Inválidos");
        return;
    }

    let dataRealizacaoISO = null;
    if (simuladoDatePicker && simuladoDatePicker.selectedDates.length > 0) {
        dataRealizacaoISO = simuladoDatePicker.selectedDates[0].toISOString().split('T')[0];
    } else if (simuladoDataInput.value) { // Fallback para input de texto
        dataRealizacaoISO = formatDateToISO(simuladoDataInput.value);
        if (!dataRealizacaoISO) {
            showCustomAlert("Formato de data inválido. Use DD/MM/AAAA.", "Data Inválida");
            return;
        }
    }


    const simuladoData = {
        id: simuladosState.editingSimuladoId || `sim-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        nome: simuladoNomeInput.value.trim(),
        categoriaId: simuladoCategoriaSelect.value,
        dataRealizacao: dataRealizacaoISO,
        acertos: acertos,
        totalQuestoes: totalQuestoes,
        tempoGastoMinutos: parseHHMMToMinutes(simuladoTempoGastoInput.value),
        nota: simuladoNotaInput.value !== '' ? parseFloat(simuladoNotaInput.value) : null,
        status: simuladoStatusSelect.value,
        observacoes: simuladoObservacoesInput.value.trim(),
        updatedAt: new Date().toISOString()
    };

    if (simuladosState.editingSimuladoId) {
        const index = simuladosState.simulados.findIndex(s => s.id === simuladosState.editingSimuladoId);
        if (index > -1) {
            simuladosState.simulados[index] = { ...simuladosState.simulados[index], ...simuladoData };
        }
    } else {
        simuladoData.createdAt = new Date().toISOString();
        simuladosState.simulados.push(simuladoData);
    }

    saveSimuladosState();
    renderSimuladosGrid();
    updateSimuladosSummary();
    closeSimuladoFormModal();
}

// --- MODAL: Gerenciar Categorias ---
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
        renderSimuladoCategoriasFiltro(); // Atualiza os filtros na página principal
    }
}

function handleAddSimuladoCategory(event) {
    event.preventDefault();
    const nomeCategoria = simuladoNewCategoryNameInput.value.trim();
    if (!nomeCategoria) {
        showCustomAlert("Digite o nome da nova categoria.", "Nome Vazio");
        return;
    }
    if (simuladosState.categorias.some(cat => cat.nome.toLowerCase() === nomeCategoria.toLowerCase())) {
        showCustomAlert("Já existe uma categoria com este nome.", "Categoria Duplicada");
        return;
    }

    const novaCategoria = {
        id: `cat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        nome: nomeCategoria
    };
    simuladosState.categorias.push(novaCategoria);
    saveSimuladosState();
    renderSimuladoCategoriasLista();
    simuladoNewCategoryNameInput.value = '';
    simuladoNewCategoryNameInput.focus();
}

function handleEditSimuladoCategory(categoriaId, novoNome) {
    const categoria = simuladosState.categorias.find(cat => cat.id === categoriaId);
    if (categoria && novoNome.trim() && !simuladosState.categorias.some(cat => cat.nome.toLowerCase() === novoNome.trim().toLowerCase() && cat.id !== categoriaId)) {
        categoria.nome = novoNome.trim();
        saveSimuladosState();
        renderSimuladoCategoriasLista();
        populateSimuladoCategoriasSelect(simuladoCategoriaSelect); // Atualiza o select no form de simulado
    } else if (novoNome.trim() === '') {
        showCustomAlert("O nome da categoria não pode ser vazio.", "Nome Inválido");
    } else {
        showCustomAlert("Já existe uma categoria com este nome ou o nome é inválido.", "Erro ao Editar");
    }
}

function handleDeleteSimuladoCategory(categoriaId) {
    const simuladosNestaCategoria = simuladosState.simulados.filter(s => s.categoriaId === categoriaId).length;
    if (simuladosNestaCategoria > 0) {
        showCustomAlert(`Não é possível excluir esta categoria. Existem ${simuladosNestaCategoria} simulado(s) associado(s) a ela. Por favor, altere a categoria desses simulados primeiro.`, "Categoria em Uso");
        return;
    }

    simuladosState.itemToDelete = { type: 'categoria', id: categoriaId };
    openSimuladoConfirmDeleteModal(
        "Confirmar Exclusão de Categoria",
        `Tem certeza que deseja excluir a categoria "${simuladosState.categorias.find(c => c.id === categoriaId)?.nome || ''}"? Esta ação não pode ser desfeita.`
    );
}

// --- MODAL: Confirmação de Exclusão (Genérico) ---
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
        if (index > -1) {
            simuladosState.simulados.splice(index, 1);
            saveSimuladosState();
            renderSimuladosGrid();
            updateSimuladosSummary();
        }
    } else if (type === 'categoria') {
        const index = simuladosState.categorias.findIndex(cat => cat.id === id);
        if (index > -1) {
            simuladosState.categorias.splice(index, 1);
            saveSimuladosState();
            renderSimuladoCategoriasLista();
            renderSimuladoCategoriasFiltro(); // Atualiza os filtros na página principal
            populateSimuladoCategoriasSelect(simuladoCategoriaSelect);
            // Se a categoria excluída era o filtro atual, volta para "Todos"
            if (simuladosState.currentCategoryFilter === id) {
                simuladosState.currentCategoryFilter = 'all';
                renderSimuladosGrid();
                updateSimuladosSummary();
            }
        }
    }
    closeSimuladoConfirmDeleteModal();
}

function requestDeleteSimulado(simuladoId) {
    simuladosState.itemToDelete = { type: 'simulado', id: simuladoId };
    const simuladoNome = simuladosState.simulados.find(s => s.id === simuladoId)?.nome || "este simulado";
    openSimuladoConfirmDeleteModal(
        "Confirmar Exclusão de Simulado",
        `Tem certeza que deseja excluir "${simuladoNome}"? Esta ação não pode ser desfeita.`
    );
}


// --- RENDERIZAÇÃO ---
function renderSimuladoCategoriasFiltro() {
    if (!simuladosFiltersContainer) {
        console.error("Taskify - Módulo Simulados: Elemento simuladosFiltersContainer não encontrado.");
        return;
    }

    // 1. Guarda uma referência ao botão "Gerenciar Categorias" se ele existir no container
    const manageCategoriesButtonOriginal = document.getElementById('btn-manage-simulado-categories');

    // 2. Remove apenas os botões de filtro que foram adicionados dinamicamente anteriormente.
    //    Estes são os que têm a classe 'btn-filter'.
    const currentDynamicFilterButtons = simuladosFiltersContainer.querySelectorAll('.btn-filter');
    currentDynamicFilterButtons.forEach(btn => btn.remove());

    // 3. Cria e adiciona o botão "Todos"
    const btnTodos = document.createElement('button');
    btnTodos.className = 'btn btn-filter';
    btnTodos.textContent = 'Todos';
    btnTodos.dataset.categoryId = 'all';
    btnTodos.classList.toggle('active', simuladosState.currentCategoryFilter === 'all');
    btnTodos.addEventListener('click', () => filterSimuladosByCategoria('all'));

    // Adiciona o botão "Todos" antes do botão "Gerenciar Categorias" (se existir) ou no início
    if (manageCategoriesButtonOriginal && manageCategoriesButtonOriginal.parentNode === simuladosFiltersContainer) {
        simuladosFiltersContainer.insertBefore(btnTodos, manageCategoriesButtonOriginal);
    } else {
        simuladosFiltersContainer.prepend(btnTodos);
    }

    // 4. Cria e adiciona os botões para cada categoria
    simuladosState.categorias.forEach(cat => {
        const btnCat = document.createElement('button');
        btnCat.className = 'btn btn-filter';
        btnCat.textContent = cat.nome;
        btnCat.dataset.categoryId = cat.id;
        btnCat.classList.toggle('active', simuladosState.currentCategoryFilter === cat.id);
        btnCat.addEventListener('click', () => filterSimuladosByCategoria(cat.id));

        // Adiciona antes do botão "Gerenciar Categorias" (se existir)
        if (manageCategoriesButtonOriginal && manageCategoriesButtonOriginal.parentNode === simuladosFiltersContainer) {
            simuladosFiltersContainer.insertBefore(btnCat, manageCategoriesButtonOriginal);
        } else {
            simuladosFiltersContainer.appendChild(btnCat); // Adiciona ao final se o de gerenciar não estiver lá
        }
    });

    // 5. O listener do botão "Gerenciar Categorias" já foi adicionado no initSimulados,
    //    e como não o removemos, ele continua funcional.
}

function renderSimuladoCategoriasLista() {
    if (!simuladoCategoriesListEl) return;
    simuladoCategoriesListEl.innerHTML = '';
    if (simuladosState.categorias.length === 0) {
        simuladoCategoriesListEl.innerHTML = '<li class="category-item-empty">Nenhuma categoria criada.</li>';
        return;
    }
    simuladosState.categorias.forEach(cat => {
        const li = document.createElement('li');
        li.className = 'category-item';
        li.dataset.categoryId = cat.id;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'category-item-name';
        nameSpan.textContent = cat.nome;

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'category-item-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'btn-icon edit-category-btn';
        editBtn.innerHTML = '<i class="bi bi-pencil-fill"></i>';
        editBtn.title = "Editar Categoria";
        editBtn.addEventListener('click', () => {
            const novoNome = prompt(`Editar nome da categoria "${cat.nome}":`, cat.nome);
            if (novoNome !== null) { // Se o usuário não clicou em cancelar
                handleEditSimuladoCategory(cat.id, novoNome);
            }
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon delete-category-btn';
        deleteBtn.innerHTML = '<i class="bi bi-trash3-fill"></i>';
        deleteBtn.title = "Excluir Categoria";
        deleteBtn.addEventListener('click', () => handleDeleteSimuladoCategory(cat.id));

        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(deleteBtn);
        li.appendChild(nameSpan);
        li.appendChild(actionsDiv);
        simuladoCategoriesListEl.appendChild(li);
    });
}


function populateSimuladoCategoriasSelect(selectElement) {
    if (!selectElement) return;
    const currentValue = selectElement.value; // Salva valor atual para tentar restaurar
    selectElement.innerHTML = '<option value="">Selecione uma categoria...</option>';
    simuladosState.categorias.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nome;
        selectElement.appendChild(option);
    });
    // Tenta restaurar o valor selecionado anteriormente, se ainda existir
    if (simuladosState.categorias.some(cat => cat.id === currentValue)) {
        selectElement.value = currentValue;
    }
}

function renderSimuladosGrid() {
    if (!simuladosGridContainer || !simuladosEmptyMessage) return;
    simuladosGridContainer.innerHTML = '';

    const simuladosFiltrados = simuladosState.simulados.filter(s =>
        simuladosState.currentCategoryFilter === 'all' || s.categoriaId === simuladosState.currentCategoryFilter
    ).sort((a, b) => new Date(b.dataRealizacao) - new Date(a.dataRealizacao)); // Ordena por data mais recente

    if (simuladosFiltrados.length === 0) {
        simuladosEmptyMessage.style.display = 'block';
        return;
    }
    simuladosEmptyMessage.style.display = 'none';

    simuladosFiltrados.forEach(simulado => {
        const card = document.createElement('div');
        card.className = 'simulado-card';
        card.dataset.simuladoId = simulado.id;

        const categoriaNome = simuladosState.categorias.find(c => c.id === simulado.categoriaId)?.nome || 'Sem Categoria';
        const percentualAcertos = simulado.totalQuestoes > 0 ? ((simulado.acertos / simulado.totalQuestoes) * 100).toFixed(1) : '0.0';

        card.innerHTML = `
            <div class="simulado-card-header">
                <div class="simulado-card-title-group">
                    <h3 class="simulado-card-nome">${escapeHtml(simulado.nome)}</h3>
                    <div class="simulado-card-categoria-data">
                        <span class="simulado-card-categoria">${escapeHtml(categoriaNome)}</span>
                        <span>• Data: ${formatDateToDDMMYYYY(simulado.dataRealizacao)}</span>
                    </div>
                </div>
                <button class="simulado-card-options-btn" aria-label="Opções do simulado">
                    <i class="bi bi-three-dots-vertical"></i>
                </button>
            </div>
            <div class="simulado-card-body">
                <p class="simulado-card-metric">Acertos: <strong>${simulado.acertos} / ${simulado.totalQuestoes}</strong> (${percentualAcertos}%)</p>
                ${simulado.tempoGastoMinutos ? `<p class="simulado-card-metric">Tempo: <strong>${formatMinutesToHHMM(simulado.tempoGastoMinutos)}</strong></p>` : ''}
                ${simulado.nota !== null ? `<p class="simulado-card-metric">Nota: <strong>${simulado.nota.toFixed(2)}</strong></p>` : ''}
                <div class="simulado-progress-bar-container">
                    <div class="simulado-progress-bar">
                        <div class="simulado-progress-fill" style="width: ${percentualAcertos}%;"></div>
                    </div>
                </div>
            </div>
            ${simulado.status !== 'corrigido' ? `<div class="simulado-card-footer">Status: ${formatSimuladoStatus(simulado.status)}</div>` : ''}
        `;

        const optionsBtn = card.querySelector('.simulado-card-options-btn');
        optionsBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique no botão propague para o card
            // ABRIR UM DROPDOWN/MENU DE OPÇÕES AQUI (Editar, Excluir)
            showSimuladoCardOptionsMenu(e.currentTarget, simulado.id);
        });

        // card.addEventListener('click', () => {/* ABRIR MODAL DE DETALHES DO SIMULADO */});

        simuladosGridContainer.appendChild(card);
    });
}

function showSimuladoCardOptionsMenu(buttonElement, simuladoId) {
    // Remove qualquer menu de opções existente
    const existingMenu = document.querySelector('.simulado-card-options-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'simulado-card-options-menu'; // Estilizar no CSS

    const editButton = document.createElement('button');
    editButton.innerHTML = '<i class="bi bi-pencil-fill"></i> Editar';
    editButton.addEventListener('click', () => {
        openSimuladoFormModal(simuladoId);
        menu.remove();
    });

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="bi bi-trash3-fill"></i> Excluir';
    deleteButton.addEventListener('click', () => {
        requestDeleteSimulado(simuladoId);
        menu.remove();
    });

    menu.appendChild(editButton);
    menu.appendChild(deleteButton);
    document.body.appendChild(menu); // Adiciona ao body para evitar problemas de z-index

    // Posiciona o menu perto do botão
    const rect = buttonElement.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = `${rect.bottom + window.scrollY + 2}px`;
    menu.style.left = `${rect.left + window.scrollX - menu.offsetWidth + rect.width}px`; // Alinha à direita do botão

    // Listener para fechar o menu se clicar fora
    function closeMenuOnClickOutside(event) {
        if (!menu.contains(event.target) && event.target !== buttonElement && !buttonElement.contains(event.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenuOnClickOutside, true);
        }
    }
    setTimeout(() => document.addEventListener('click', closeMenuOnClickOutside, true), 0); // Adiciona após o evento de clique atual
}


// --- FILTRAGEM E SUMÁRIO ---
function filterSimuladosByCategoria(categoriaId) {
    simuladosState.currentCategoryFilter = categoriaId;
    const filterButtons = simuladosFiltersContainer.querySelectorAll('.btn-filter');
    filterButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.categoryId === categoriaId);
    });
    renderSimuladosGrid();
    updateSimuladosSummary();
}

function updateSimuladosSummary() {
    const simuladosParaSumario = simuladosState.simulados.filter(s =>
        simuladosState.currentCategoryFilter === 'all' || s.categoriaId === simuladosState.currentCategoryFilter
    );

    const totalCount = simuladosParaSumario.length;
    let totalAcertos = 0;
    let totalQuestoesConsideradasParaMedia = 0;
    let totalTempoMinutos = 0;
    let countSimuladosComTempo = 0;
    const pendingCount = simuladosParaSumario.filter(s => s.status === 'pendente_realizacao' || s.status === 'aguardando_correcao').length;

    simuladosParaSumario.forEach(s => {
        if (s.totalQuestoes > 0 && s.status === 'corrigido') {
            totalAcertos += s.acertos;
            totalQuestoesConsideradasParaMedia += s.totalQuestoes;
        }
        if (s.tempoGastoMinutos !== null && s.tempoGastoMinutos > 0 && s.status === 'corrigido') {
            totalTempoMinutos += s.tempoGastoMinutos;
            countSimuladosComTempo++;
        }
    });

    const avgAccuracy = totalQuestoesConsideradasParaMedia > 0 ? ((totalAcertos / totalQuestoesConsideradasParaMedia) * 100).toFixed(1) + '%' : '0.0%';
    const avgTimeFormatted = countSimuladosComTempo > 0 ? formatMinutesToHHMM(Math.round(totalTempoMinutos / countSimuladosComTempo)) : '0h00';

    if (simuladosTotalCountEl) simuladosTotalCountEl.textContent = totalCount;
    if (simuladosAvgAccuracyEl) simuladosAvgAccuracyEl.textContent = avgAccuracy;
    if (simuladosAvgTimeEl) simuladosAvgTimeEl.textContent = avgTimeFormatted;
    if (simuladosPendingCountEl) simuladosPendingCountEl.textContent = pendingCount;
}

// --- FUNÇÕES UTILITÁRIAS ---
function formatMinutesToHHMM(totalMinutes) {
    if (totalMinutes === null || totalMinutes === undefined || totalMinutes <= 0) return null; // ou '0h00m'
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h${String(minutes).padStart(2, '0')}`;
}

function parseHHMMToMinutes(hhmmString) {
    if (!hhmmString || typeof hhmmString !== 'string') return null;
    const parts = hhmmString.match(/(\d+)[h:]?(\d+)?m?/i); // Permite "3h30", "03:30", "3:30"
    if (!parts) return null;

    const hours = parseInt(parts[1], 10) || 0;
    const minutes = parseInt(parts[2], 10) || 0;

    if (isNaN(hours) || isNaN(minutes)) return null;
    return (hours * 60) + minutes;
}

function formatSimuladoStatus(statusKey) {
    const statusMap = {
        'corrigido': 'Corrigido',
        'aguardando_correcao': 'Aguardando Correção',
        'pendente_realizacao': 'Pendente'
    };
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

// --- FUNÇÕES GLOBAIS AUXILIARES (se necessário, como formatDateToISO, getTodayISO) ---
function getTodayISO() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateToDDMMYYYY(isoDateString) {
    if (!isoDateString) return '';
    try {
        const date = new Date(isoDateString + "T00:00:00"); // Adiciona T00:00:00 para evitar problemas de fuso
        if (isNaN(date.getTime())) return isoDateString; // Retorna original se for inválida
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return isoDateString; // Retorna original em caso de erro
    }
}

function formatDateToISO(ddmmyyyyString) {
    if (!ddmmyyyyString) return null;
    const parts = ddmmyyyyString.split('/');
    if (parts.length === 3) {
        const day = parts[0];
        const month = parts[1];
        const year = parts[2];
        // Validação simples do formato
        if (day.length === 2 && month.length === 2 && year.length === 4 &&
            !isNaN(parseInt(day)) && !isNaN(parseInt(month)) && !isNaN(parseInt(year))) {
            return `${year}-${month}-${day}`;
        }
    }
    return null; // Retorna null se o formato for inválido
}

// --- GARANTIR QUE initSiDmulados SEJA CHAMADO APÓS O ESTADO PRINCIPAL ---
// Modificado para ser chamado explicitamente pelo script.js
window.initSimuladosModule = initSimulados;

console.log("Taskify - Módulo Simulados: Carregado.");