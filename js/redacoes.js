// js/redacoes.js

// Variáveis globais de UI
let redacoesSectionContent, redacoesHeader, redacoesTitle, btnAddRedacaoMain,
    redacoesFiltersContainer, btnManageRedacaoEixos,
    redacoesCategorySectionsContainer, redacoesEmptyMessage;

let redacaoFormModal, redacaoFormModalOverlay, redacaoFormModalCloseBtn,
    redacaoModalTitle, redacaoForm, redacaoIdInput, redacaoTemaInput,
    redacaoEixoSelect, redacaoDataInput,
    redacaoC1Select, redacaoC2Select, redacaoC3Select, redacaoC4Select, redacaoC5Select,
    redacaoStatusSelect, redacaoTempoGastoInput,
    redacaoFormCancelBtn, formGroupCompetencias;

let redacaoEixosModal, redacaoEixosModalOverlay, redacaoEixosModalCloseBtn,
    redacaoAddEixoForm, redacaoNewEixoNameInput, redacaoEixosListEl,
    redacaoEixosDoneBtn;

let redacaoConfirmDeleteModal, redacaoConfirmDeleteModalOverlay, redacaoConfirmDeleteCloseBtn,
    redacaoConfirmDeleteTitle, redacaoConfirmDeleteMessage,
    redacaoBtnCancelDeleteConfirmation, redacaoBtnConfirmDeleteAction;

let redacaoDatePickerInstance;

let redacoesState = {
    redacoes: [],
    eixosTematicos: [],
    editingRedacaoId: null,
    editingEixoId: null,
    currentEixoFilter: 'all',
    itemToDelete: { type: null, id: null },
    charts: {},
    expandedRowTracker: {},
    isDarkModeGlobal: true // Será atualizado pelo listener
};

const DEFAULT_REDACAO_EIXOS_MODULE = [
    { id: 'educacao', nome: 'Educação' }, { id: 'saude', nome: 'Saúde' },
    { id: 'meio_ambiente', nome: 'Meio Ambiente' }, { id: 'tecnologia', nome: 'Tecnologia' },
    { id: 'cultura', nome: 'Cultura' }, { id: 'seguranca', nome: 'Segurança' },
    { id: 'economia', nome: 'Economia' }
];

function formatRedacaoStatus(statusKey) {
    const statusMap = {
        'corrigida': 'Corrigida',
        'aguardando_correcao': 'Aguardando Correção',
        'rascunho': 'Rascunho Inicial'
    };
    return statusMap[statusKey] || statusKey;
}

function populateRedacaoEixosSelect(selectElement) {
    if (!selectElement) {
        console.error("Elemento select de eixos não fornecido ou inválido para popular.");
        return;
    }
    const currentValue = selectElement.value;
    selectElement.innerHTML = '<option value="">Selecione um eixo temático...</option>';

    if (!redacoesState.eixosTematicos || redacoesState.eixosTematicos.length === 0) {
        const option = document.createElement('option');
        option.value = "";
        option.textContent = "Nenhum eixo cadastrado";
        option.disabled = true;
        selectElement.appendChild(option);
    } else {
        redacoesState.eixosTematicos.forEach(eixo => {
            const option = document.createElement('option');
            option.value = eixo.id;
            option.textContent = eixo.nome;
            selectElement.appendChild(option);
        });
    }

    if (redacoesState.eixosTematicos.some(eixo => eixo.id === currentValue)) {
        selectElement.value = currentValue;
    } else if (selectElement.options.length > 1 && selectElement.options[0].value === "") {
        selectElement.value = "";
    }
}


function initRedacoesModule() {
    console.log("Taskify - Módulo Redações: Iniciando initRedacoesModule...");
    redacoesSectionContent = document.getElementById('redacoes-section-content');
    if (!redacoesSectionContent) {
        console.error("Taskify - Módulo Redações: Seção principal 'redacoes-section-content' não encontrada.");
        return;
    }
    btnAddRedacaoMain = document.getElementById('btn-add-redacao-main');
    redacoesFiltersContainer = document.getElementById('redacoes-filters-container');
    btnManageRedacaoEixos = document.getElementById('btn-manage-redacao-eixos');
    redacoesCategorySectionsContainer = document.getElementById('redacoes-category-sections-container');
    redacoesEmptyMessage = document.getElementById('redacoes-empty-message');
    redacaoFormModal = document.getElementById('redacao-form-modal');
    redacaoFormModalOverlay = document.getElementById('redacao-form-modal-overlay');
    redacaoFormModalCloseBtn = document.getElementById('redacao-form-modal-close-btn');
    redacaoModalTitle = document.getElementById('redacao-modal-title');
    redacaoForm = document.getElementById('redacao-form');
    redacaoIdInput = document.getElementById('redacao-id-input');
    redacaoTemaInput = document.getElementById('redacao-tema-input');
    redacaoEixoSelect = document.getElementById('redacao-eixo-select');
    redacaoDataInput = document.getElementById('redacao-data-input');
    redacaoC1Select = document.getElementById('redacao-c1-input');
    redacaoC2Select = document.getElementById('redacao-c2-input');
    redacaoC3Select = document.getElementById('redacao-c3-input');
    redacaoC4Select = document.getElementById('redacao-c4-input');
    redacaoC5Select = document.getElementById('redacao-c5-input');
    redacaoStatusSelect = document.getElementById('redacao-status-select');
    redacaoTempoGastoInput = document.getElementById('redacao-tempo-gasto-input');
    redacaoFormCancelBtn = document.getElementById('redacao-form-cancel-btn');
    formGroupCompetencias = redacaoForm ? redacaoForm.querySelector('.form-group-competencias') : null;
    redacaoEixosModal = document.getElementById('redacao-eixos-modal');
    redacaoEixosModalOverlay = document.getElementById('redacao-eixos-modal-overlay');
    redacaoEixosModalCloseBtn = document.getElementById('redacao-eixos-modal-close-btn');
    redacaoAddEixoForm = document.getElementById('redacao-add-eixo-form');
    redacaoNewEixoNameInput = document.getElementById('redacao-new-eixo-name-input');
    redacaoEixosListEl = document.getElementById('redacao-eixos-list');
    redacaoEixosDoneBtn = document.getElementById('redacao-eixos-done-btn');
    // Não precisamos dos seletores do modal de confirmação de exclusão, pois ele foi removido
    // redacaoConfirmDeleteModal = document.getElementById('redacao-confirm-delete-modal');
    // redacaoConfirmDeleteModalOverlay = document.getElementById('redacao-confirm-delete-modal-overlay');
    // redacaoConfirmDeleteCloseBtn = document.getElementById('redacao-confirm-delete-close-btn');
    // redacaoConfirmDeleteTitle = document.getElementById('redacao-confirm-delete-title');
    // redacaoConfirmDeleteMessage = document.getElementById('redacao-confirm-delete-message');
    // redacaoBtnCancelDeleteConfirmation = document.getElementById('redacao-btn-cancel-delete-confirmation');
    // redacaoBtnConfirmDeleteAction = document.getElementById('redacao-btn-confirm-delete-action');

    loadRedacoesStateLocal();
    if (redacaoDataInput && typeof flatpickr === 'function') {
        redacaoDatePickerInstance = flatpickr(redacaoDataInput, {
            dateFormat: "d/m/Y", defaultDate: "today", locale: "pt", allowInput: true,
            theme: redacoesState.isDarkModeGlobal ? "dark" : "light"
        });
    } else if (redacaoDataInput) {
        console.warn("Flatpickr não carregado, usando input date nativo para redações.");
        redacaoDataInput.type = 'date';
        try { redacaoDataInput.valueAsDate = new Date(); } catch(e) { redacaoDataInput.value = getTodayISO();}
    }

    if (btnAddRedacaoMain) btnAddRedacaoMain.addEventListener('click', () => openRedacaoFormModal());
    if (btnManageRedacaoEixos) btnManageRedacaoEixos.addEventListener('click', openRedacaoEixosModal);
    if (redacaoForm) redacaoForm.addEventListener('submit', handleSaveRedacao);
    if (redacaoFormModalOverlay) redacaoFormModalOverlay.addEventListener('click', (e) => { if (e.target === redacaoFormModalOverlay) closeModal('redacao-form-modal'); });
    if (redacaoFormModalCloseBtn) redacaoFormModalCloseBtn.addEventListener('click', () => closeModal('redacao-form-modal'));
    if (redacaoFormCancelBtn) redacaoFormCancelBtn.addEventListener('click', () => closeModal('redacao-form-modal'));
    if (redacaoEixosModalOverlay) redacaoEixosModalOverlay.addEventListener('click', (e) => { if (e.target === redacaoEixosModalOverlay) closeModal('redacao-eixos-modal'); });
    if (redacaoEixosModalCloseBtn) redacaoEixosModalCloseBtn.addEventListener('click', () => closeModal('redacao-eixos-modal'));
    if (redacaoAddEixoForm) redacaoAddEixoForm.addEventListener('submit', handleAddRedacaoEixo);
    if (redacaoEixosDoneBtn) redacaoEixosDoneBtn.addEventListener('click', () => { closeModal('redacao-eixos-modal'); renderRedacaoEixosFiltro(); renderAllRedacaoEixoSections(); });
    // if (redacaoBtnConfirmDeleteAction) redacaoBtnConfirmDeleteAction.addEventListener('click', executeDeleteRedacaoItemLocal); // Removido listener do botão de confirmação

    if (redacaoStatusSelect && redacaoStatusSelect._redacaoStatusListenerAttached !== true) {
        redacaoStatusSelect.addEventListener('change', toggleRedacaoNotaFieldsBasedOnStatus);
        redacaoStatusSelect._redacaoStatusListenerAttached = true;
    }

    renderRedacaoEixosFiltro();
    renderAllRedacaoEixoSections();
    console.log("Taskify - Módulo Redações: Inicializado com sucesso no final de init.");
}

function loadRedacoesStateLocal() {
    const mainState = window.state || {};
    const redacoesAppFromGlobal = mainState.redacoesApp || { redacoes: [], eixosTematicos: [] };
    redacoesState.redacoes = (Array.isArray(redacoesAppFromGlobal.redacoes) ? redacoesAppFromGlobal.redacoes : [])
        .map(r => ({
            ...r,
            c1: r.c1 !== null && r.c1 !== undefined ? parseFloat(r.c1) : null,
            c2: r.c2 !== null && r.c2 !== undefined ? parseFloat(r.c2) : null,
            c3: r.c3 !== null && r.c3 !== undefined ? parseFloat(r.c3) : null,
            c4: r.c4 !== null && r.c4 !== undefined ? parseFloat(r.c4) : null,
            c5: r.c5 !== null && r.c5 !== undefined ? parseFloat(r.c5) : null,
            notaTotal: r.notaTotal !== null && r.notaTotal !== undefined ? parseFloat(r.notaTotal) : null,
            tempoGastoMinutos: r.tempoGastoMinutos !== undefined && !isNaN(parseInt(r.tempoGastoMinutos, 10)) ? parseInt(r.tempoGastoMinutos, 10) : null,
        }));
    redacoesState.eixosTematicos = Array.isArray(redacoesAppFromGlobal.eixosTematicos) ? redacoesAppFromGlobal.eixosTematicos : [];
    if (redacoesState.eixosTematicos.length === 0) {
        redacoesState.eixosTematicos = JSON.parse(JSON.stringify(DEFAULT_REDACAO_EIXOS_MODULE));
        saveRedacoesStateLocal();
    }
    redacoesState.isDarkModeGlobal = mainState.isDarkMode !== undefined ? mainState.isDarkMode : true;
    console.log("Estado das redações carregado:", JSON.parse(JSON.stringify(redacoesState)));
}

function saveRedacoesStateLocal() {
    if (window.state) {
        if (!window.state.redacoesApp) window.state.redacoesApp = { redacoes: [], eixosTematicos: [] };
        window.state.redacoesApp.redacoes = redacoesState.redacoes.map(r => {
            const { conteudo, conteudoTipo, nomeArquivoImagem, feedback, ...rest } = r;
            return rest;
        });
        window.state.redacoesApp.eixosTematicos = redacoesState.eixosTematicos;
        if (typeof window.saveState === 'function') window.saveState();
    }
    console.log("Estado das redações salvo.");
}

function toggleRedacaoNotaFieldsBasedOnStatus() {
    const statusSelecionado = redacaoStatusSelect.value;
    const notasSaoObrigatoriasOuVisiveis = statusSelecionado === 'corrigida';

    const competenciaSelects = [redacaoC1Select, redacaoC2Select, redacaoC3Select, redacaoC4Select, redacaoC5Select];
    competenciaSelects.forEach(select => {
        if (select) {
            select.disabled = !notasSaoObrigatoriasOuVisiveis;
        }
    });

    if (formGroupCompetencias) {
        formGroupCompetencias.style.opacity = notasSaoObrigatoriasOuVisiveis ? '1' : '0.5';
        formGroupCompetencias.style.pointerEvents = notasSaoObrigatoriasOuVisiveis ? 'auto' : 'none';
        
        const legend = formGroupCompetencias.querySelector('legend');
        if (legend) {
            const asteriskSpanId = 'competencias-required-asterisk-redacao';
            let asteriskSpan = legend.querySelector(`#${asteriskSpanId}`);
            if (notasSaoObrigatoriasOuVisiveis) {
                if (!asteriskSpan) {
                    asteriskSpan = document.createElement('span');
                    asteriskSpan.id = asteriskSpanId;
                    asteriskSpan.className = 'required-asterisk';
                    asteriskSpan.textContent = ' *';
                    legend.appendChild(asteriskSpan);
                }
                asteriskSpan.style.display = 'inline';
            } else {
                if (asteriskSpan) asteriskSpan.style.display = 'none';
            }
        }
    }
}


function openRedacaoFormModal(redacaoId = null) {
    if (!redacaoFormModal || !redacaoModalTitle || !redacaoForm || !redacaoEixoSelect ||
        !redacaoDatePickerInstance || !redacaoStatusSelect || !redacaoTemaInput ||
        !redacaoC1Select || !redacaoC2Select || !redacaoC3Select || !redacaoC4Select || !redacaoC5Select ||
        !redacaoTempoGastoInput) {
        console.error("Elementos do formulário de redação não encontrados para abrir.");
        return;
    }
    redacaoForm.reset();
    populateRedacaoEixosSelect(redacaoEixoSelect); 

    if (redacaoId) {
        redacoesState.editingRedacaoId = redacaoId;
        redacaoModalTitle.innerHTML = '<i class="bi bi-pencil-fill"></i> Editar Redação';
        const redacao = redacoesState.redacoes.find(r => r.id === redacaoId);
        if (redacao) {
            redacaoIdInput.value = redacao.id;
            redacaoTemaInput.value = redacao.tema;
            redacaoEixoSelect.value = redacao.eixoId;
            if (redacaoDatePickerInstance && redacao.data) redacaoDatePickerInstance.setDate(redacao.data, true);
            else if (redacaoDatePickerInstance) redacaoDatePickerInstance.setDate(new Date(), true);
            
            redacaoC1Select.value = redacao.c1 !== null && redacao.c1 !== undefined ? String(redacao.c1) : '0';
            redacaoC2Select.value = redacao.c2 !== null && redacao.c2 !== undefined ? String(redacao.c2) : '0';
            redacaoC3Select.value = redacao.c3 !== null && redacao.c3 !== undefined ? String(redacao.c3) : '0';
            redacaoC4Select.value = redacao.c4 !== null && redacao.c4 !== undefined ? String(redacao.c4) : '0';
            redacaoC5Select.value = redacao.c5 !== null && redacao.c5 !== undefined ? String(redacao.c5) : '0';

            redacaoStatusSelect.value = redacao.status || 'corrigida';
            redacaoTempoGastoInput.value = formatMinutesToHHMM(redacao.tempoGastoMinutos) || '';
        }
    } else {
        redacoesState.editingRedacaoId = null;
        redacaoModalTitle.innerHTML = '<i class="bi bi-plus-circle-fill"></i> Adicionar Redação';
        if (redacaoDatePickerInstance) redacaoDatePickerInstance.setDate(new Date(), true);
        redacaoC1Select.value = '0'; redacaoC2Select.value = '0'; redacaoC3Select.value = '0';
        redacaoC4Select.value = '0'; redacaoC5Select.value = '0';
        redacaoStatusSelect.value = 'corrigida';
        redacaoTempoGastoInput.value = '';
    }

    toggleRedacaoNotaFieldsBasedOnStatus();
    openModal('redacao-form-modal');
    if (redacaoTemaInput) redacaoTemaInput.focus();
}

async function handleSaveRedacao(event) {
    event.preventDefault();
    const statusSelecionado = redacaoStatusSelect.value;
    const notasSaoObrigatorias = statusSelecionado === 'corrigida';

    if (!redacaoTemaInput.value.trim() || !redacaoEixoSelect.value || !redacaoDataInput.value) {
        showRedacaoCustomAlert("Preencha os campos Tema, Eixo Temático e Data.", "Campos Obrigatórios"); return;
    }

    let dataISO = null;
    if (redacaoDatePickerInstance && redacaoDatePickerInstance.selectedDates.length > 0) { dataISO = redacaoDatePickerInstance.selectedDates[0].toISOString().split('T')[0]; }
    else if (redacaoDataInput.value) { dataISO = formatDateToISO(redacaoDataInput.value); if (!dataISO) { showRedacaoCustomAlert("Data inválida.", "Erro"); return; }}

    let c1 = null, c2 = null, c3 = null, c4 = null, c5 = null, notaTotal = null;
    const competenciaSelects = [redacaoC1Select, redacaoC2Select, redacaoC3Select, redacaoC4Select, redacaoC5Select];

    if (notasSaoObrigatorias) {
        c1 = parseFloat(redacaoC1Select.value); c2 = parseFloat(redacaoC2Select.value);
        c3 = parseFloat(redacaoC3Select.value); c4 = parseFloat(redacaoC4Select.value);
        c5 = parseFloat(redacaoC5Select.value);
        
        if (isNaN(c1) || isNaN(c2) || isNaN(c3) || isNaN(c4) || isNaN(c5)) {
            showRedacaoCustomAlert("Todas as notas das competências são obrigatórias para o status 'Corrigida' e devem ser numéricas.", "Notas Inválidas");
            return;
        }
        notaTotal = c1 + c2 + c3 + c4 + c5;
    } else {
        const notasInput = competenciaSelects.map(select => parseFloat(select.value));
        
        c1 = !isNaN(notasInput[0]) ? notasInput[0] : null;
        c2 = !isNaN(notasInput[1]) ? notasInput[1] : null;
        c3 = !isNaN(notasInput[2]) ? notasInput[2] : null;
        c4 = !isNaN(notasInput[3]) ? notasInput[3] : null;
        c5 = !isNaN(notasInput[4]) ? notasInput[4] : null;

        if (c1 !== null && c2 !== null && c3 !== null && c4 !== null && c5 !== null) {
             notaTotal = c1 + c2 + c3 + c4 + c5;
        } else {
            notaTotal = null;
        }
        if (statusSelecionado !== 'corrigida' && 
            (c1 === 0 || c1 === null) && (c2 === 0 || c2 === null) && (c3 === 0 || c3 === null) && 
            (c4 === 0 || c4 === null) && (c5 === 0 || c5 === null) && 
            (notaTotal === 0 || notaTotal === null) ) {
            c1 = c2 = c3 = c4 = c5 = notaTotal = null;
        }
    }

    const tempoGastoMinutos = parseHHMMToMinutes(redacaoTempoGastoInput.value);

    const redacaoObject = {
        id: redacoesState.editingRedacaoId || `red-${Date.now()}`,
        tema: redacaoTemaInput.value.trim(),
        eixoId: redacaoEixoSelect.value,
        data: dataISO,
        c1: c1, c2: c2, c3: c3, c4: c4, c5: c5,
        notaTotal: notaTotal,
        status: statusSelecionado,
        tempoGastoMinutos: tempoGastoMinutos,
        updatedAt: new Date().toISOString()
    };

    if (redacoesState.editingRedacaoId) {
        const index = redacoesState.redacoes.findIndex(r => r.id === redacoesState.editingRedacaoId);
        if (index > -1) redacoesState.redacoes[index] = { ...redacoesState.redacoes[index], ...redacaoObject };
    } else {
        redacaoObject.createdAt = new Date().toISOString();
        redacoesState.redacoes.push(redacaoObject);
    }

    saveRedacoesStateLocal();
    renderAllRedacaoEixoSections();
    closeModal('redacao-form-modal');
}

function openRedacaoEixosModal() { if (!redacaoEixosModal) return; renderRedacaoEixosLista(); openModal('redacao-eixos-modal'); if (redacaoNewEixoNameInput) redacaoNewEixoNameInput.focus(); }
function handleAddRedacaoEixo(event) {
    event.preventDefault();
    if (!redacaoNewEixoNameInput) { console.error("Input de novo eixo não encontrado."); return; }
    const nomeEixo = redacaoNewEixoNameInput.value.trim();
    if (!nomeEixo) { showRedacaoCustomAlert("Digite o nome do novo eixo.", "Nome Vazio"); return; }
    if (redacoesState.eixosTematicos.some(e => e.nome.toLowerCase() === nomeEixo.toLowerCase())) { showRedacaoCustomAlert("Eixo já existe.", "Duplicado"); return; }
    redacoesState.eixosTematicos.push({ id: `eixo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, nome: nomeEixo });
    saveRedacoesStateLocal();
    renderRedacaoEixosLista();
    populateRedacaoEixosSelect(redacaoEixoSelect);
    redacaoNewEixoNameInput.value = '';
}

function renderRedacaoEixosLista() {
    if (!redacaoEixosListEl) return;
    redacaoEixosListEl.innerHTML = '';
    if (!redacoesState.eixosTematicos || redacoesState.eixosTematicos.length === 0) {
        redacaoEixosListEl.innerHTML = '<li class="category-item-empty">Nenhum eixo temático criado.</li>';
        return;
    }
    redacoesState.eixosTematicos.forEach(eixo => {
        const li = document.createElement('li'); li.className = 'category-item'; li.dataset.eixoId = eixo.id;
        const nameSpan = document.createElement('span'); nameSpan.className = 'category-item-name'; nameSpan.textContent = eixo.nome;
        const actionsDiv = document.createElement('div'); actionsDiv.className = 'category-item-actions';
        const editBtn = document.createElement('button'); editBtn.className = 'btn-icon edit-category-btn'; editBtn.innerHTML = '<i class="bi bi-pencil-fill"></i>'; editBtn.title = "Editar Eixo";
        editBtn.addEventListener('click', () => {
            const novoNome = prompt(`Editar eixo: "${eixo.nome}"`, eixo.nome);
            if (novoNome !== null) handleEditRedacaoEixoLocal(eixo.id, novoNome);
        });
        const deleteBtn = document.createElement('button'); deleteBtn.className = 'btn-icon delete-category-btn'; deleteBtn.innerHTML = '<i class="bi bi-trash3-fill"></i>'; deleteBtn.title = "Excluir Eixo";
        deleteBtn.addEventListener('click', () => handleDeleteRedacaoEixoLocal(eixo.id));
        actionsDiv.appendChild(editBtn); actionsDiv.appendChild(deleteBtn);
        li.appendChild(nameSpan); li.appendChild(actionsDiv);
        redacaoEixosListEl.appendChild(li);
    });
}
function handleEditRedacaoEixoLocal(eixoId, novoNome) {
    const nomeTrimmed = novoNome.trim();
    if (!nomeTrimmed) { showRedacaoCustomAlert("O nome do eixo não pode ser vazio.", "Nome Inválido"); return; }
    const eixo = redacoesState.eixosTematicos.find(e => e.id === eixoId);
    if (eixo && !redacoesState.eixosTematicos.some(e => e.nome.toLowerCase() === nomeTrimmed.toLowerCase() && e.id !== eixoId)) {
        eixo.nome = nomeTrimmed;
        saveRedacoesStateLocal();
        renderRedacaoEixosLista();
        populateRedacaoEixosSelect(redacaoEixoSelect);
        renderRedacaoEixosFiltro();
        renderAllRedacaoEixoSections();
    } else { showRedacaoCustomAlert("Já existe um eixo com este nome ou o nome é inválido.", "Erro ao Editar"); }
}

function handleDeleteRedacaoEixoLocal(eixoId) {
    // Verifica se há redações associadas antes de tentar excluir o eixo
    if (redacoesState.redacoes.some(r => r.eixoId === eixoId)) {
        showRedacaoCustomAlert("Existem redações associadas a este eixo. Não pode ser excluído.", "Eixo em Uso");
        return;
    }
    // Se não houver redações associadas, prossegue com a exclusão direta
    executeDeleteRedacaoItemLocal('eixo', eixoId);
}

function executeDeleteRedacaoItemLocal(type, id) { // Modificado para aceitar type e id
    if (!type || !id) {
        console.warn("executeDeleteRedacaoItemLocal chamado sem tipo ou ID.");
        return;
    }
    if (type === 'redacao') {
        redacoesState.redacoes = redacoesState.redacoes.filter(r => r.id !== id);
    } else if (type === 'eixo') {
        // A verificação de uso já foi feita em handleDeleteRedacaoEixoLocal
        redacoesState.eixosTematicos = redacoesState.eixosTematicos.filter(e => e.id !== id);
        if (redacoesState.currentEixoFilter === id) redacoesState.currentEixoFilter = 'all';
        renderRedacaoEixosFiltro();
        populateRedacaoEixosSelect(redacaoEixoSelect);
    }
    saveRedacoesStateLocal();
    renderAllRedacaoEixoSections();
    // closeModal('redacao-confirm-delete-modal'); // Não é mais necessário se não há confirmação
}

function requestDeleteRedacao(redacaoId) {
    // Chama diretamente a exclusão da redação
    executeDeleteRedacaoItemLocal('redacao', redacaoId);
}

function renderRedacaoEixosFiltro() {
    if (!redacoesFiltersContainer) return;
    const manageEixosButtonOriginal = document.getElementById('btn-manage-redacao-eixos');
    redacoesFiltersContainer.innerHTML = '';

    const btnTodos = document.createElement('button');
    btnTodos.className = 'btn btn-filter-eixo';
    btnTodos.textContent = 'Todos';
    btnTodos.dataset.eixoId = 'all';
    btnTodos.classList.toggle('active', redacoesState.currentEixoFilter === 'all');
    btnTodos.addEventListener('click', () => filterRedacoesByEixo('all'));
    redacoesFiltersContainer.appendChild(btnTodos);

    (redacoesState.eixosTematicos || []).forEach(eixo => {
        const btnEixo = document.createElement('button');
        btnEixo.className = 'btn btn-filter-eixo';
        btnEixo.textContent = eixo.nome;
        btnEixo.dataset.eixoId = eixo.id;
        btnEixo.classList.toggle('active', redacoesState.currentEixoFilter === eixo.id);
        btnEixo.addEventListener('click', () => filterRedacoesByEixo(eixo.id));
        redacoesFiltersContainer.appendChild(btnEixo);
    });
    if (manageEixosButtonOriginal) redacoesFiltersContainer.appendChild(manageEixosButtonOriginal);
}

function filterRedacoesByEixo(eixoId) {
    redacoesState.currentEixoFilter = eixoId;
    renderRedacaoEixosFiltro();
    renderAllRedacaoEixoSections();
}

function renderAllRedacaoEixoSections() {
    if (!redacoesCategorySectionsContainer || !redacoesEmptyMessage) return;
    redacoesCategorySectionsContainer.innerHTML = '';
    Object.values(redacoesState.charts).forEach(chart => { if (chart) chart.destroy(); });
    redacoesState.charts = {};
    redacoesState.expandedRowTracker = {};

    const hasAnyRedacao = redacoesState.redacoes.length > 0;
    redacoesEmptyMessage.style.display = 'none';

    if (redacoesState.currentEixoFilter === 'all') {
        if (hasAnyRedacao) {
            renderRedacaoEixoSectionContent('all', 'Todas as Redações');
        } else {
            redacoesEmptyMessage.textContent = "Nenhuma redação registrada ainda. Que tal adicionar a primeira?";
            redacoesEmptyMessage.style.display = 'block';
        }
    } else {
        const eixoFiltrado = redacoesState.eixosTematicos.find(e => e.id === redacoesState.currentEixoFilter);
        if (eixoFiltrado) {
            const redacoesNesteEixo = redacoesState.redacoes.filter(r => r.eixoId === eixoFiltrado.id);
            if (redacoesNesteEixo.length > 0) {
                renderRedacaoEixoSectionContent(eixoFiltrado.id, eixoFiltrado.nome);
            } else {
                 redacoesEmptyMessage.textContent = `Nenhuma redação registrada para o eixo "${escapeHtml(eixoFiltrado.nome)}".`;
                 redacoesEmptyMessage.style.display = 'block';
            }
        } else {
            redacoesState.currentEixoFilter = 'all';
            renderRedacaoEixosFiltro();
            renderAllRedacaoEixoSections();
        }
    }
}

function renderRedacaoEixoSectionContent(eixoId, eixoNome) {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'redacao-eixo-section';
    sectionEl.dataset.eixoId = eixoId;

    const headerEl = document.createElement('div');
    headerEl.className = 'redacao-eixo-header';
    const titleEl = document.createElement('h3');
    titleEl.className = 'redacao-eixo-title';
    titleEl.textContent = eixoNome;
    headerEl.appendChild(titleEl);

    const chartFiltersEl = document.createElement('div');
    chartFiltersEl.className = 'redacao-eixo-chart-filters';
    chartFiltersEl.innerHTML = `
        <select class="redacao-metric-filter" data-eixo-id="${eixoId}" aria-label="Filtrar métrica do gráfico">
            <option value="notaTotal">Nota Total</option>
            <option value="c1">Competência 1</option>
            <option value="c2">Competência 2</option>
            <option value="c3">Competência 3</option>
            <option value="c4">Competência 4</option>
            <option value="c5">Competência 5</option>
        </select>
        <select class="redacao-period-filter" data-eixo-id="${eixoId}" aria-label="Filtrar período do gráfico">
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="lastYear">Último Ano</option>
            <option value="allTime" selected>Desde o Início</option>
        </select>
    `;
    headerEl.appendChild(chartFiltersEl);
    sectionEl.appendChild(headerEl);

    const chartContainerEl = document.createElement('div');
    chartContainerEl.className = 'redacao-eixo-chart-container';
    const canvasEl = document.createElement('canvas');
    canvasEl.id = `redacao-chart-${eixoId}`;
    chartContainerEl.appendChild(canvasEl);
    sectionEl.appendChild(chartContainerEl);

    const summaryBarEl = document.createElement('div');
    summaryBarEl.className = 'redacoes-summary-bar';
    summaryBarEl.id = `redacoes-summary-bar-${eixoId}`;
    sectionEl.appendChild(summaryBarEl);

    const gridEl = document.createElement('div');
    gridEl.className = 'redacoes-grid';
    gridEl.id = `redacoes-grid-${eixoId}`;
    sectionEl.appendChild(gridEl);

    if (redacoesCategorySectionsContainer) redacoesCategorySectionsContainer.appendChild(sectionEl);

    const metricFilterSelect = chartFiltersEl.querySelector('.redacao-metric-filter');
    const periodFilterSelect = chartFiltersEl.querySelector('.redacao-period-filter');
    if(metricFilterSelect) metricFilterSelect.addEventListener('change', () => updateRedacaoEixoChart(eixoId));
    if(periodFilterSelect) periodFilterSelect.addEventListener('change', () => {
        updateRedacaoEixoChart(eixoId);
        updateRedacaoEixoSummary(eixoId);
    });

    renderRedacoesGridForEixoLocal(eixoId, gridEl);
    updateRedacaoEixoChart(eixoId);
    updateRedacaoEixoSummary(eixoId);
}

function renderRedacoesGridForEixoLocal(eixoId, gridContainer) {
    gridContainer.innerHTML = '';
    gridContainer.className = 'redacoes-grid';
    if (!redacoesState.expandedRowTracker[eixoId]) {
        redacoesState.expandedRowTracker[eixoId] = {};
    }

    const redacoesParaRenderizar = (eixoId === 'all')
        ? [...redacoesState.redacoes]
        : redacoesState.redacoes.filter(r => r.eixoId === eixoId);

    redacoesParaRenderizar.sort((a, b) => new Date(b.data) - new Date(a.data));

    if (redacoesParaRenderizar.length === 0 && eixoId !== 'all') {
        return;
    }

    let numCols = 1;
    if (window.innerWidth >= 1200) {
        numCols = 3; gridContainer.classList.add('redacoes-grid-3-col');
    } else if (window.innerWidth >= 992) {
        numCols = Math.min(redacoesParaRenderizar.length, 3);
        if (numCols === 1) gridContainer.classList.add('redacoes-grid-1-col');
        else if (numCols === 2) gridContainer.classList.add('redacoes-grid-2-col');
        else gridContainer.classList.add('redacoes-grid-3-col');
    } else if (window.innerWidth >= 768) {
        numCols = Math.min(redacoesParaRenderizar.length, 2);
        if (numCols === 1) gridContainer.classList.add('redacoes-grid-1-col');
        else gridContainer.classList.add('redacoes-grid-2-col');
    } else {
        gridContainer.classList.add('redacoes-grid-1-col'); numCols = 1;
    }

    redacoesParaRenderizar.forEach((redacao, index) => {
        const card = createRedacaoCardElementLocal(redacao, eixoId, index, numCols);
        gridContainer.appendChild(card);
    });
}

function createRedacaoCardElementLocal(redacao, eixoId, indexInGrid, numGridCols) {
    const card = document.createElement('div');
    card.className = 'redacao-card';
    card.dataset.redacaoId = redacao.id;
    card.dataset.gridRow = Math.floor(indexInGrid / numGridCols);

    const eixoTematicoObj = redacoesState.eixosTematicos.find(e => e.id === redacao.eixoId);
    const eixoNome = eixoTematicoObj ? eixoTematicoObj.nome : 'Sem Eixo';

    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'redacao-card-summary';
    summaryDiv.innerHTML = `
        <div class="redacao-card-header">
            <div class="redacao-card-title-group">
                <h3 class="redacao-card-tema">${escapeHtml(redacao.tema)}</h3>
            </div>
            <button class="redacao-card-options-btn" aria-label="Opções da redação">
                <i class="bi bi-three-dots-vertical"></i>
            </button>
        </div>
        <div class="redacao-card-info-line">
            <span class="redacao-card-eixo">${escapeHtml(eixoNome)}</span>
            <span class="redacao-card-data">
                <i class="bi bi-calendar-event"></i>
                ${formatDateToDDMMYYYY(redacao.data)}
            </span>
            <div class="redacao-card-expand-icon"><i class="bi bi-chevron-down"></i></div>
        </div>
    `;

    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'redacao-card-details';

    card.appendChild(summaryDiv);
    card.appendChild(detailsDiv);

    const optionsBtn = card.querySelector('.redacao-card-options-btn');
    optionsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showRedacaoCardOptionsMenu(e.currentTarget, redacao.id);
    });

    summaryDiv.addEventListener('click', (e) => {
        if (e.target.closest('.redacao-card-options-btn')) return;
        toggleRedacaoCardExpansionLocal(card, eixoId);
    });

    if (redacoesState.expandedRowTracker[eixoId] && redacoesState.expandedRowTracker[eixoId][card.dataset.gridRow]) {
        card.classList.add('expanded');
        detailsDiv.innerHTML = '';
        populateRedacaoCardDetails(detailsDiv, redacao);
        detailsDiv.style.display = 'flex';
        requestAnimationFrame(() => {
            detailsDiv.style.maxHeight = detailsDiv.scrollHeight + "px";
            detailsDiv.style.opacity = '1';
            detailsDiv.style.paddingTop = '20px';
            detailsDiv.style.paddingBottom = '20px';
        });
    }
    return card;
}

function populateRedacaoCardDetails(detailsContainer, redacao) {
    if (!detailsContainer || !redacao) return;

    let notaTotalCalculada = null;
    if (redacao.c1 !== null && redacao.c2 !== null && redacao.c3 !== null && redacao.c4 !== null && redacao.c5 !== null &&
        typeof redacao.c1 === 'number' && typeof redacao.c2 === 'number' && typeof redacao.c3 === 'number' &&
        typeof redacao.c4 === 'number' && typeof redacao.c5 === 'number') {
        notaTotalCalculada = redacao.c1 + redacao.c2 + redacao.c3 + redacao.c4 + redacao.c5;
    }
    
    const notaFinalExibida = redacao.notaTotal !== null ? redacao.notaTotal : (notaTotalCalculada !== null ? notaTotalCalculada : '--');

    let statusHtml = '';
    if (redacao.status && typeof formatRedacaoStatus === 'function') {
        statusHtml = `<div class="redacao-card-status-info"><strong>${formatRedacaoStatus(redacao.status)}</strong></div>`;
    } else if (redacao.status) {
        statusHtml = `<div class="redacao-card-status-info"><strong>${escapeHtml(redacao.status)}</strong></div>`;
    }

    let notasCompetenciasHtml = '<div class="redacao-details-notas-grid">';
    for (let i = 1; i <= 5; i++) {
        notasCompetenciasHtml += `<div class="redacao-competencia-display">
                        <span class="competencia-label">C${i}</span>
                        <span class="competencia-nota">${redacao[`c${i}`] !== null && redacao[`c${i}`] !== undefined ? redacao[`c${i}`] : '--'}</span>
                      </div>`;
    }
    notasCompetenciasHtml += '</div>';

    detailsContainer.innerHTML = `
        <div class="redacao-details-grid-v2">
            <div class="redacao-metric-display-v2">
                <div class="metric-header">
                    <i class="bi bi-file-earmark-check metric-icon"></i>
                    <span class="metric-label">Nota</span>
                </div>
                <div class="metric-value">${notaFinalExibida}</div>
            </div>
            <div class="redacao-metric-display-v2">
                <div class="metric-header">
                    <i class="bi bi-clock-history metric-icon"></i>
                    <span class="metric-label">Tempo Gasto</span>
                </div>
                <div class="metric-value">${redacao.tempoGastoMinutos && typeof formatMinutesToHHMM === 'function' ? formatMinutesToHHMM(redacao.tempoGastoMinutos) : (redacao.tempoGastoMinutos ? redacao.tempoGastoMinutos + ' min' : '--')}</div>
            </div>
        </div>
        ${notasCompetenciasHtml}
        ${statusHtml}
    `;
}


function toggleRedacaoCardExpansionLocal(clickedCard, eixoId) {
    const gridContainer = clickedCard.closest('.redacoes-grid');
    if (!gridContainer) return;

    const rowIndexOfClickedCard = parseInt(clickedCard.dataset.gridRow, 10);
    const shouldBeExpanded = !clickedCard.classList.contains('expanded');

    if (!redacoesState.expandedRowTracker[eixoId]) {
        redacoesState.expandedRowTracker[eixoId] = {};
    }

    redacoesState.expandedRowTracker[eixoId][rowIndexOfClickedCard] = shouldBeExpanded;

    if (shouldBeExpanded) {
        for (const row in redacoesState.expandedRowTracker[eixoId]) {
            if (parseInt(row, 10) !== rowIndexOfClickedCard) {
                redacoesState.expandedRowTracker[eixoId][row] = false;
            }
        }
    }

    const cardsInGrid = Array.from(gridContainer.querySelectorAll('.redacao-card'));
    cardsInGrid.forEach(card => {
        const cardRow = parseInt(card.dataset.gridRow, 10);
        const detailsDiv = card.querySelector('.redacao-card-details');
        const redacaoId = card.dataset.redacaoId;
        const redacao = redacoesState.redacoes.find(r => r.id === redacaoId);

        if (detailsDiv) {
            if (redacoesState.expandedRowTracker[eixoId][cardRow]) { 
                if (redacao) {
                    detailsDiv.innerHTML = ''; 
                    populateRedacaoCardDetails(detailsDiv, redacao);
                } else if (detailsDiv.innerHTML.trim() === '' && card === clickedCard) {
                    console.warn(`Dados da redação ${redacaoId} não encontrados para popular detalhes no momento da expansão.`);
                }

                card.classList.add('expanded');
                detailsDiv.style.display = 'flex'; 
                void detailsDiv.offsetWidth; 

                requestAnimationFrame(() => {
                    detailsDiv.style.maxHeight = detailsDiv.scrollHeight + "px";
                    detailsDiv.style.opacity = '1';
                });

            } else { 
                if (card.classList.contains('expanded')) {
                    card.classList.remove('expanded');
                    detailsDiv.style.maxHeight = '0';
                    detailsDiv.style.opacity = '0';
                    setTimeout(() => {
                        if (!card.classList.contains('expanded')) {
                            detailsDiv.style.display = 'none';
                            detailsDiv.innerHTML = ''; 
                        }
                    }, 360); 
                }
            }
        }
    });
}


function showRedacaoCardOptionsMenu(buttonElement, redacaoId) {
    const existingMenu = document.querySelector('.simulado-card-options-menu'); 
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'simulado-card-options-menu'; 

    const editButton = document.createElement('button');
    editButton.innerHTML = '<i class="bi bi-pencil-fill"></i> Editar';
    editButton.addEventListener('click', () => { openRedacaoFormModal(redacaoId); menu.remove(); });

    const deleteButton = document.createElement('button');
    deleteButton.innerHTML = '<i class="bi bi-trash3-fill"></i> Excluir';
    deleteButton.addEventListener('click', () => { requestDeleteRedacao(redacaoId); menu.remove(); });

    menu.appendChild(editButton);
    menu.appendChild(deleteButton);
    document.body.appendChild(menu);

    const rect = buttonElement.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
    menu.style.left = `${rect.left + window.scrollX - menu.offsetWidth + rect.width}px`;

    function closeMenuOnClickOutside(event) {
        if (!menu.contains(event.target) && event.target !== buttonElement && !buttonElement.contains(event.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenuOnClickOutside, true);
        }
    }
    setTimeout(() => document.addEventListener('click', closeMenuOnClickOutside, true), 0);
}

function updateRedacaoEixoSummary(eixoId) {
    const summaryBarEl = document.getElementById(`redacoes-summary-bar-${eixoId}`);
    if (!summaryBarEl) return;

    const periodFilterSelect = document.querySelector(`.redacao-period-filter[data-eixo-id="${eixoId}"]`);
    const selectedPeriod = periodFilterSelect ? periodFilterSelect.value : 'allTime';

    let redacoesParaSumario = (eixoId === 'all')
        ? [...redacoesState.redacoes]
        : redacoesState.redacoes.filter(r => r.eixoId === eixoId);

    const now = new Date();
    if (selectedPeriod !== 'allTime') {
        redacoesParaSumario = redacoesParaSumario.filter(r => {
            const dataRedacao = new Date(r.data + "T00:00:00Z");
            if (selectedPeriod === '7days') return (now - dataRedacao) / (1000 * 60 * 60 * 24) <= 7;
            if (selectedPeriod === '30days') return (now - dataRedacao) / (1000 * 60 * 60 * 24) <= 30;
            if (selectedPeriod === 'lastYear') { const o = new Date(now); o.setFullYear(now.getFullYear() - 1); return dataRedacao >= o && dataRedacao <= now; }
            return true;
        });
    }

    const totalCount = redacoesParaSumario.length;
    let somaNotasTotais = 0;
    let countNotasValidas = 0;
    let somaTempoGasto = 0;
    let countRedacoesComTempo = 0;
    const pendingCount = redacoesParaSumario.filter(r => r.status !== 'corrigida').length;

    redacoesParaSumario.forEach(r => {
        if (r.status === 'corrigida') {
            const notaTotalNum = r.notaTotal !== null ? parseFloat(r.notaTotal) : null;
            if (typeof notaTotalNum === 'number' && !isNaN(notaTotalNum)) {
                somaNotasTotais += notaTotalNum;
                countNotasValidas++;
            }
            if (r.tempoGastoMinutos !== null && r.tempoGastoMinutos > 0) {
                somaTempoGasto += r.tempoGastoMinutos;
                countRedacoesComTempo++;
            }
        }
    });

    const avgNotaTotal = countNotasValidas > 0 ? Math.round(somaNotasTotais / countNotasValidas) : "--";
    const avgTempoFormatado = countRedacoesComTempo > 0 && typeof formatMinutesToHHMM === 'function' ? formatMinutesToHHMM(Math.round(somaTempoGasto / countRedacoesComTempo)) : '--';


    summaryBarEl.innerHTML = `
        <div class="redacoes-summary-item"><i class="bi bi-files"></i><span class="redacoes-summary-value">${totalCount}</span><span class="redacoes-summary-label">Total</span></div>
        <div class="redacoes-summary-item"><i class="bi bi-graph-up-arrow"></i><span class="redacoes-summary-value">${avgNotaTotal}</span><span class="redacoes-summary-label">Média Geral</span></div>
        <div class="redacoes-summary-item"><i class="bi bi-clock-history"></i><span class="redacoes-summary-value">${avgTempoFormatado}</span><span class="redacoes-summary-label">Tempo Médio</span></div>
        <div class="redacoes-summary-item"><i class="bi bi-card-checklist"></i><span class="redacoes-summary-value">${pendingCount}</span><span class="redacoes-summary-label">Pendentes</span></div>
    `;
}

function updateRedacaoEixoChart(eixoId) {
    const canvasId = `redacao-chart-${eixoId}`;
    const canvas = document.getElementById(canvasId);
    if (!canvas) { console.warn(`Canvas ${canvasId} não encontrado para o gráfico.`); return; }

    const metricFilterSelect = document.querySelector(`.redacao-metric-filter[data-eixo-id="${eixoId}"]`);
    const periodFilterSelect = document.querySelector(`.redacao-period-filter[data-eixo-id="${eixoId}"]`);
    if (!metricFilterSelect || !periodFilterSelect) { console.warn("Filtros do gráfico de redação não encontrados."); return; }

    const selectedMetricKey = metricFilterSelect.value;
    const selectedPeriod = periodFilterSelect.value;

    let redacoesParaGrafico = (eixoId === 'all')
        ? [...redacoesState.redacoes]
        : redacoesState.redacoes.filter(r => r.eixoId === eixoId);

    redacoesParaGrafico = redacoesParaGrafico.filter(r => 
        r.status === 'corrigida' && 
        r[selectedMetricKey] !== null && 
        r[selectedMetricKey] !== undefined && 
        !isNaN(parseFloat(r[selectedMetricKey]))
    );

    const now = new Date();
    if (selectedPeriod !== 'allTime') {
        redacoesParaGrafico = redacoesParaGrafico.filter(r => {
            const dataRedacao = new Date(r.data + "T00:00:00Z");
            if (selectedPeriod === '7days') return (now - dataRedacao) / (1000 * 60 * 60 * 24) <= 7;
            if (selectedPeriod === '30days') return (now - dataRedacao) / (1000 * 60 * 60 * 24) <= 30;
            if (selectedPeriod === 'lastYear') { const o = new Date(now); o.setFullYear(now.getFullYear() - 1); return dataRedacao >= o && dataRedacao <= now; }
            return true;
        });
    }

    redacoesParaGrafico.sort((a, b) => new Date(a.data) - new Date(b.data));

    const labels = redacoesParaGrafico.map(r => formatDateToDDMMYYYY(r.data));
    const data = redacoesParaGrafico.map(r => parseFloat(r[selectedMetricKey]));


    let yAxisLabel = 'Nota'; let tooltipLabelPrefix = 'Nota';
    if (selectedMetricKey.startsWith('c')) { yAxisLabel = `Nota C${selectedMetricKey.substring(1)}`; tooltipLabelPrefix = `C${selectedMetricKey.substring(1)}`; }
    else if (selectedMetricKey === 'notaTotal') { yAxisLabel = 'Nota Total'; tooltipLabelPrefix = 'Nota Total'; }

    const chartConfig = createRedacaoChartConfig(labels, data, yAxisLabel, tooltipLabelPrefix, val => Math.round(val), selectedMetricKey);

    if (redacoesState.charts[eixoId]) redacoesState.charts[eixoId].destroy();
    redacoesState.charts[eixoId] = new Chart(canvas.getContext('2d'), chartConfig);
}


function createRedacaoChartConfig(labels, data, yAxisLabel, tooltipLabelPrefix, dataFormatter, selectedMetricKey) {
    const isDarkMode = redacoesState.isDarkModeGlobal;
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
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: tooltipLabelPrefix, data: data, borderColor: primaryColor, backgroundColor: gradient, fill: true,
                tension: 0.3, pointBackgroundColor: primaryColor, pointBorderColor: bodyBgColor, pointBorderWidth: 1.5,
                pointHoverBackgroundColor: primaryColor, pointHoverBorderColor: bodyBgColor, pointHoverBorderWidth: 2,
                pointRadius: 4, pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 600 },
            scales: {
                y: {
                    beginAtZero: true,
                    suggestedMax: selectedMetricKey === 'notaTotal' ? 1000 : 200,
                    grid: { color: gridColor, drawBorder: false },
                    ticks: { color: textColor, precision: 0, callback: dataFormatter },
                    title: { display: true, text: yAxisLabel, color: textColor, font: { size: 11 } }
                },
                x: { grid: { display: false }, ticks: { color: textColor, autoSkip: true, maxTicksLimit: (labels.length > 15 ? 10 : labels.length) } }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true, backgroundColor: tooltipBackgroundColor, titleColor: tooltipTextColor, bodyColor: tooltipTextColor,
                    titleFont: { weight: 'bold', size: 13 }, bodyFont: { size: 12 }, padding: 10, cornerRadius: 6,
                    borderColor: primaryColor, borderWidth: 1, displayColors: false,
                    callbacks: { title: (items) => items[0].label, label: (item) => `${tooltipLabelPrefix}: ${dataFormatter(item.raw)}` }
                }
            },
            interaction: { mode: 'index', intersect: false }, hover: { mode: 'nearest', intersect: true }
        }
    };
}

document.addEventListener('taskifyThemeChanged', (event) => {
    if (event.detail && typeof event.detail.isDarkMode === 'boolean') {
        redacoesState.isDarkModeGlobal = event.detail.isDarkMode;
        if (redacaoDatePickerInstance && redacaoDatePickerInstance.calendarContainer) {
            const currentValue = redacaoDatePickerInstance.selectedDates[0] || new Date();
            redacaoDatePickerInstance.destroy();
            redacaoDatePickerInstance = flatpickr(redacaoDataInput, {
                dateFormat: "d/m/Y", defaultDate: currentValue, locale: "pt", allowInput: true,
                theme: redacoesState.isDarkModeGlobal ? "dark" : "light"
            });
        }
        Object.keys(redacoesState.charts).forEach(eixoId => {
            if (typeof updateRedacaoEixoChart === 'function' && redacoesState.charts[eixoId]) {
                updateRedacaoEixoChart(eixoId);
            }
        });
    }
});

if (typeof openModal === 'undefined') {
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById(`${modalId}-overlay`);
        if (modal && overlay) {
            overlay.classList.add('show');
            modal.classList.add('show');
            document.body.classList.add('modal-open');
            const focusable = modal.querySelector('input:not([type=hidden]), textarea, select, button');
            if (focusable) focusable.focus();
        }
    }
}
if (typeof closeModal === 'undefined') {
    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        const overlay = document.getElementById(`${modalId}-overlay`);
        if (modal && overlay) {
            modal.classList.remove('show');
            overlay.classList.remove('show');
            if (!document.querySelector('.modal.show')) {
                document.body.classList.remove('modal-open');
            }
        }
    }
}
if (typeof formatDateToISO === 'undefined') {
    window.formatDateToISO = function(ddmmyyyyString) {
        if (!ddmmyyyyString) return null;
        const parts = ddmmyyyyString.split('/');
        if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return null;
    }
}
if (typeof formatDateToDDMMYYYY === 'undefined') {
    window.formatDateToDDMMYYYY = function(isoDateString) {
        if (!isoDateString) return '';
        const date = new Date(isoDateString + "T00:00:00Z");
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}/${month}/${year}`;
    }
}
if (typeof escapeHtml === 'undefined') {
    window.escapeHtml = function(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;"); 
    };
}

if (typeof showRedacaoCustomAlert === 'undefined') {
    window.showRedacaoCustomAlert = function(message, title) {
        if (typeof window.showCustomAlert === 'function') window.showCustomAlert(message, title);
        else alert(`${title}: ${message}`);
    }
}
if (typeof getTodayISO === 'undefined') {
    window.getTodayISO = function() {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
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
if (typeof formatMinutesToHHMM === 'undefined') {
    window.formatMinutesToHHMM = function(totalMinutes) {
        if (totalMinutes === null || totalMinutes === undefined || isNaN(totalMinutes) || totalMinutes < 0) return null;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h${String(minutes).padStart(2, '0')}`;
    }
}
if (typeof parseHHMMToMinutes === 'undefined') {
    window.parseHHMMToMinutes = function(hhmmString) {
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
}

window.initRedacoesModule = initRedacoesModule;