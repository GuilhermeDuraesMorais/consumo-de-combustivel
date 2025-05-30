// script.js

document.addEventListener('DOMContentLoaded', () => {
    const appContainer = document.getElementById('app-container');
    let user = JSON.parse(localStorage.getItem('user'));
    let editingIndex = null; // Rastreia qual item do histórico está sendo editado
    let consumoChartInstance = null; // Para armazenar a instância do Chart.js para gráficos

    // Detecção de Tema
    const applyTheme = () => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Observa mudanças no tema do sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

    // --- Navegação e Carregamento de Página ---

    // Função para formatar data de 'aaaa-mm-dd' para 'dd/mm/aaaa'
    const formatarDataParaExibicao = (dataString) => {
        if (!dataString || !/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
            return dataString; // Retorna original se inválido ou não é o formato esperado
        }
        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
    };

    const loadPage = (page) => {
        try {
            user = JSON.parse(localStorage.getItem('user')); // Atualiza o estado do usuário ao carregar a página
            let pageContent = '';
            editingIndex = null; // Reseta o estado de edição ao mudar de página

            if (consumoChartInstance) { // Destrói a instância do gráfico existente ao mudar de página
                consumoChartInstance.destroy();
                consumoChartInstance = null;
            }

            if (!user && page !== 'login') {
                loadPage('login'); // Redireciona para login se não estiver logado
                return;
            }

            if (user && page === 'login') {
                loadPage('abastecimento'); // Redireciona para o app se estiver logado e tentando acessar o login
                return;
            }

            // Renderiza estrutura comum (Navbar + Área de Conteúdo) para usuários logados
            if (user && page !== 'login') {
                pageContent += `
                    <div class="container mx-auto p-4">
                        <nav class="card mb-6">
                            <div class="flex items-center justify-between">
                                <span class="text-lg font-semibold flex items-center">
                                    <i class="fas fa-gas-pump mr-2 text-xl text-blue-500"></i> Controle de Abastecimento
                                </span>
                                <div class="flex items-center space-x-4">
                                    <span id="user-info" class="text-sm hidden md:inline">Olá, ${user.nome} (${user.cs})</span>
                                    <button id="menu-button" class="text-xl focus:outline-none">
                                        <i class="fas fa-bars"></i>
                                    </button>
                                </div>
                            </div>
                            <div id="menu" class="hidden mt-4 space-y-2">
                                <a href="#" data-page="abastecimento" class="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><i class="fas fa-plus-circle w-5 mr-2"></i>Novo Abastecimento</a>
                                <a href="#" data-page="historico" class="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><i class="fas fa-history w-5 mr-2"></i>Histórico</a>
                                <a href="#" data-page="graficos" class="block px-4 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600"><i class="fas fa-chart-line w-5 mr-2"></i>Gráficos</a>
                                <a href="#" id="logout" class="block px-4 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400"><i class="fas fa-sign-out-alt w-5 mr-2"></i>Sair</a>
                            </div>
                        </nav>
                        <main id="content" class="card">
                            <!-- Conteúdo específico da página vai aqui -->
                        </main>
                    </div>
                `;
            }

            // Gera conteúdo específico da página
            let mainContent = '';
            switch (page) {
                case 'login':
                    mainContent = `
                        <div class="login-container">
                            <div class="login-box card">
                                <h2 class="text-2xl font-semibold text-center mb-6">
                                    <i class="fas fa-lock mr-2"></i>Login
                                </h2>
                                <div class="mb-4">
                                    <label for="cs">CS:</label>
                                    <input type="text" id="cs" placeholder="Digite seu CS (apenas números)" pattern="[0-9]*" inputmode="numeric">
                                </div>
                                <div class="mb-6">
                                    <label for="nome">Nome:</label>
                                    <input type="text" id="nome" placeholder="Digite seu nome">
                                </div>
                                <button id="login-button" class="btn btn-primary w-full">
                                    <i class="fas fa-sign-in-alt"></i>Entrar
                                </button>
                            </div>
                        </div>
                    `;
                    appContainer.innerHTML = mainContent; // Injeta diretamente para login
                    initLogin();
                    applyTheme(); // Aplica tema após injeção
                    return;

                case 'abastecimento':
                    mainContent = `
                        <h2 class="text-2xl font-semibold mb-6"><i class="fas fa-plus-circle mr-2"></i>Registrar Novo Abastecimento</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="mb-4">
                                <label for="data">Data:</label>
                                <input type="date" id="data">
                            </div>
                            <div class="mb-4">
                                <label for="frota">Frota:</label>
                                <input type="text" id="frota" placeholder="Número da Frota">
                            </div>
                            <div class="mb-4">
                                <label for="kmInicial">KM Inicial:</label>
                                <input type="number" id="kmInicial" placeholder="KM Inicial">
                            </div>
                            <div class="mb-4">
                                <label for="kmFinal">KM Final:</label>
                                <input type="number" id="kmFinal" placeholder="KM Final">
                            </div>
                            <div class="mb-4 md:col-span-2">
                                <label for="litros">Litros:</label>
                                <input type="number" id="litros" step="0.01" placeholder="Litros Abastecidos">
                            </div>
                        </div>
                        <div class="mt-6 text-right">
                            <button id="salvar-abastecimento" class="btn btn-success">
                                <i class="fas fa-save"></i>Salvar Registro
                            </button>
                        </div>
                    `;
                    break;

                case 'historico':
                    mainContent = `
                        <h2 class="text-2xl font-semibold mb-6"><i class="fas fa-history mr-2"></i>Histórico de Abastecimentos</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border border-dashed rounded-lg">
                            <div>
                                <label for="filtro-data">Filtrar por Data:</label>
                                <input type="date" id="filtro-data">
                            </div>
                            <div>
                                <label for="filtro-frota">Filtrar por Frota:</label>
                                <input type="text" id="filtro-frota" placeholder="Número da Frota">
                            </div>
                            <div class="filter-button-group">
                                 <button id="aplicar-filtro" class="btn btn-primary w-full md:w-auto">
                                    <i class="fas fa-filter"></i>Aplicar Filtro
                                </button>
                                 <button id="limpar-filtro" class="btn btn-danger w-full md:w-auto" title="Limpar Filtros">
                                    <i class="fas fa-times"></i>Limpar
                                </button>
                            </div>
                        </div>

                        <div class="table-responsive card p-0">
                            <table class="w-full">
                                <thead>
                                    <tr>
                                        <th>CS</th>
                                        <th>Data</th>
                                        <th>Frota</th>
                                        <th>KM Inicial</th>
                                        <th>KM Final</th>
                                        <th>Litros</th>
                                        <th>Consumo (L/km)</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody id="tabela-historico"></tbody>
                            </table>
                        </div>
                         <div id="historico-vazio" class="text-center text-muted py-6 hidden">
                            Nenhum abastecimento encontrado com os filtros aplicados.
                        </div>

                         <div class="mt-6 p-4 border border-dashed rounded-lg">
                            <h3 class="text-lg font-semibold mb-3"><i class="fas fa-file-pdf mr-2 text-red-500"></i>Gerar Relatório PDF</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label for="pdf-data-inicio">Data Início:</label>
                                    <input type="date" id="pdf-data-inicio">
                                </div>
                                <div>
                                    <label for="pdf-data-fim">Data Fim:</label>
                                    <input type="date" id="pdf-data-fim">
                                </div>
                                <div class="pdf-button-group">
                                    <button id="download-pdf-button" class="btn btn-danger w-full md:w-auto">
                                        <i class="fas fa-download"></i>Baixar PDF
                                    </button>
                                    <button id="share-pdf-button" class="btn btn-secondary w-full md:w-auto" title="Compartilhar PDF">
                                        <i class="fas fa-share"></i>Compartilhar
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                    break;
                case 'graficos':
                    mainContent = `
                        <h2 class="text-2xl font-semibold mb-6"><i class="fas fa-chart-line mr-2"></i>Análise Gráfica de Consumo</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 border border-dashed rounded-lg">
                            <div>
                                <label for="filtro-data-inicio-grafico">Data Início:</label>
                                <input type="date" id="filtro-data-inicio-grafico">
                            </div>
                            <div>
                                <label for="filtro-data-fim-grafico">Data Fim:</label>
                                <input type="date" id="filtro-data-fim-grafico">
                            </div>
                            <div>
                                <label for="filtro-frota-grafico">Filtrar por Frota (opcional):</label>
                                <input type="text" id="filtro-frota-grafico" placeholder="Número da Frota">
                            </div>
                            <div class="md:col-span-3 filter-button-group mt-2">
                                <button id="aplicar-filtro-grafico" class="btn btn-primary w-full md:w-auto">
                                    <i class="fas fa-filter"></i>Aplicar Filtro
                                </button>
                                <button id="limpar-filtro-grafico" class="btn btn-danger w-full md:w-auto" title="Limpar Filtros">
                                    <i class="fas fa-times"></i>Limpar
                                </button>
                            </div>
                        </div>

                        <div id="grafico-container" class="p-4 rounded-lg">
                            <canvas id="consumoChart"></canvas>
                        </div>
                        <div id="grafico-vazio" class="text-center text-muted py-6 hidden">
                            Nenhum dado de abastecimento encontrado para os filtros aplicados.
                        </div>
                    `;
                    break;
                default:
                    mainContent = '<p>Página não encontrada.</p>';
            }

            // Injeta estrutura comum e conteúdo da página (se não for login)
            if (page !== 'login') {
                appContainer.innerHTML = pageContent;
                const contentArea = document.getElementById('content');
                if(contentArea) {
                    contentArea.innerHTML = mainContent;
                } else {
                    console.error("Elemento #content não encontrado após renderização da navbar.");
                    appContainer.innerHTML = mainContent;
                }
            }


            // Inicializa elementos comuns (apenas se page !== 'login' e a navbar foi renderizada)
            if (user && page !== 'login') {
                const menuButton = document.getElementById('menu-button');
                const menu = document.getElementById('menu');
                if (menuButton && menu) {
                    menuButton.addEventListener('click', () => menu.classList.toggle('hidden'));
                     menu.addEventListener('click', (event) => {
                        const link = event.target.closest('a');
                        if (link && link.dataset.page) {
                            event.preventDefault();
                            loadPage(link.dataset.page);
                            menu.classList.add('hidden'); // Esconde o menu após clique
                        } else if (link && link.id === 'logout') {
                             event.preventDefault();
                             localStorage.removeItem('user');
                             localStorage.removeItem('lastVisitedPage');
                             loadPage('login');
                        }
                    });
                } else {
                    console.warn("Botão de menu ou menu não encontrado para inicializar.");
                }
            }

            // Inicializa scripts específicos da página
            if (page === 'abastecimento') initAbastecimento();
            else if (page === 'historico') initHistorico();
            else if (page === 'graficos') initGraficos();

            applyTheme(); // Aplica tema ao final do carregamento da página
        } catch (error) {
            console.error(`Erro ao carregar a página '${page}':`, error);
            appContainer.innerHTML = `<div class="p-6 text-red-600">Erro ao carregar conteúdo da página: ${error.message}. Verifique o console.</div>`;
        }
    };

    // --- Funções de Inicialização por Página ---

    function initLogin() {
        const loginButton = document.getElementById('login-button');
        const csInput = document.getElementById('cs');
        const nomeInput = document.getElementById('nome');

        if (!loginButton || !csInput || !nomeInput) {
            console.error("Elementos do formulário de login não encontrados.");
            return;
        }

        loginButton.addEventListener('click', () => {
            const cs = csInput.value.trim();
            const nome = nomeInput.value.trim();
            if (cs && nome) {
                 if (csInput.pattern && !new RegExp(`^${csInput.pattern}$`).test(cs)) {
                    alert('CS deve conter apenas números.');
                    csInput.focus();
                    return;
                }
                user = { cs: cs, nome: nome };
                localStorage.setItem('user', JSON.stringify(user));
                loadPage('abastecimento');
            } else {
                alert('Por favor, preencha seu CS e Nome.');
                if (!cs) csInput.focus(); else if (!nome) nomeInput.focus();
            }
        });
        nomeInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                loginButton.click();
            }
        });
         csInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                nomeInput.focus(); // Move focus to name input or trigger login
            }
        });
    }

    function initAbastecimento() {
        const dataInput = document.getElementById('data');
        const frotaInput = document.getElementById('frota');
        const kmInicialInput = document.getElementById('kmInicial');
        const kmFinalInput = document.getElementById('kmFinal');
        const litrosInput = document.getElementById('litros');
        const saveButton = document.getElementById('salvar-abastecimento');

        if (!dataInput || !frotaInput || !kmInicialInput || !kmFinalInput || !litrosInput || !saveButton) {
            console.error("Um ou mais elementos da página de abastecimento não foram encontrados.");
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        dataInput.value = today;

        saveButton.addEventListener('click', () => {
            const data = dataInput.value;
            const frota = frotaInput.value.trim();
            const kmInicial = parseFloat(kmInicialInput.value);
            const kmFinal = parseFloat(kmFinalInput.value);
            const litros = parseFloat(litrosInput.value);

            if (!data || !frota || isNaN(kmInicial) || isNaN(kmFinal) || isNaN(litros) || litros <= 0 || kmInicial < 0 || kmFinal < 0) {
                alert('Por favor, preencha todos os campos corretamente. Litros e KM devem ser positivos.');
                return;
            }
            if (kmFinal <= kmInicial) {
                alert('KM Final deve ser maior que KM Inicial.');
                kmFinalInput.focus();
                return;
            }

            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (!currentUser) {
                alert("Erro: Usuário não encontrado. Faça login novamente.");
                loadPage('login'); return;
            }

            const abastecimento = {
                id: Date.now().toString(), cs: currentUser.cs, data: data,
                frota: frota, kmInicial: kmInicial, kmFinal: kmFinal, litros: litros
            };

            let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
            abastecimentos.push(abastecimento);
            abastecimentos.sort((a, b) => new Date(b.data) - new Date(a.data)); // Ordena por data decrescente
            localStorage.setItem('abastecimentos', JSON.stringify(abastecimentos));

            alert('Abastecimento salvo com sucesso!');
            dataInput.value = today; // Mantém a data, reseta outros campos
            frotaInput.value = '';
            kmInicialInput.value = '';
            kmFinalInput.value = '';
            litrosInput.value = '';
            frotaInput.focus();
        });
    }

    function initHistorico() {
        const tabelaHistorico = document.getElementById('tabela-historico');
        const filtroData = document.getElementById('filtro-data');
        const filtroFrota = document.getElementById('filtro-frota');
        const aplicarFiltroButton = document.getElementById('aplicar-filtro');
        const limparFiltroButton = document.getElementById('limpar-filtro');
        const downloadPdfButton = document.getElementById('download-pdf-button');
        const sharePdfButton = document.getElementById('share-pdf-button');
        const pdfDataInicio = document.getElementById('pdf-data-inicio');
        const pdfDataFim = document.getElementById('pdf-data-fim');
        const historicoVazioMsg = document.getElementById('historico-vazio');

        if (!tabelaHistorico || !aplicarFiltroButton || !downloadPdfButton || !sharePdfButton || !pdfDataInicio || !pdfDataFim || !historicoVazioMsg) {
            console.error("Um ou mais elementos da página de histórico não foram encontrados.");
            return;
        }

        const exibirHistorico = (abastecimentosFiltrados) => {
            tabelaHistorico.innerHTML = '';
            historicoVazioMsg.classList.toggle('hidden', abastecimentosFiltrados.length > 0);

            if (abastecimentosFiltrados.length === 0) return;

            let allAbastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');

            abastecimentosFiltrados.forEach(abastecimento => {
                const kmRodados = abastecimento.kmFinal - abastecimento.kmInicial;
                // Consumo: Litros por KM (L/km)
                const consumo = (kmRodados > 0 && abastecimento.litros > 0) ? (abastecimento.litros / kmRodados) : 0;
                const row = document.createElement('tr');
                const currentUser = JSON.parse(localStorage.getItem('user')); // Recarrega user para garantir que é o atual
                const isOwner = currentUser && currentUser.cs === abastecimento.cs;
                const originalIndex = allAbastecimentos.findIndex(item => item.id === abastecimento.id);

                const consumoDisplay = (typeof consumo === 'number' && isFinite(consumo) && consumo > 0) ? consumo.toFixed(2) : 'N/A';
                const litrosDisplay = (typeof abastecimento.litros === 'number') ? abastecimento.litros.toFixed(2) : 'N/A';

                if (editingIndex === originalIndex && isOwner) {
                    row.innerHTML = `
                        <td>${abastecimento.cs}</td>
                        <td><input type="date" class="edit-input" value="${abastecimento.data || ''}" data-field="data"></td>
                        <td><input type="text" class="edit-input" value="${abastecimento.frota || ''}" data-field="frota"></td>
                        <td><input type="number" class="edit-input" value="${abastecimento.kmInicial || ''}" data-field="kmInicial" step="1" min="0"></td>
                        <td><input type="number" class="edit-input" value="${abastecimento.kmFinal || ''}" data-field="kmFinal" step="1" min="0"></td>
                        <td><input type="number" step="0.01" class="edit-input" value="${abastecimento.litros || ''}" data-field="litros" min="0"></td>
                        <td>${consumoDisplay} L/km</td>
                        <td class="whitespace-nowrap">
                            <button class="btn btn-success btn-sm salvar-button" data-original-index="${originalIndex}"><i class="fas fa-check"></i></button>
                            <button class="btn btn-secondary btn-sm cancelar-button"><i class="fas fa-times"></i></button>
                        </td>`;
                } else {
                    row.innerHTML = `
                        <td>${abastecimento.cs}</td>
                        <td>${formatarDataParaExibicao(abastecimento.data) || 'N/A'}</td>
                        <td>${abastecimento.frota || 'N/A'}</td>
                        <td>${abastecimento.kmInicial || 'N/A'}</td>
                        <td>${abastecimento.kmFinal || 'N/A'}</td>
                        <td>${litrosDisplay}</td>
                        <td>${consumoDisplay} L/km</td>
                        <td class="whitespace-nowrap">
                            ${isOwner ? `
                                <button class="btn btn-primary btn-sm editar-button" data-original-index="${originalIndex}"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-danger btn-sm excluir-button" data-original-index="${originalIndex}"><i class="fas fa-trash"></i></button>
                            ` : '<span class="text-xs text-muted">Outro</span>'}
                        </td>`;
                }
                tabelaHistorico.appendChild(row);
            });
            attachTableButtonListeners();
        };

        const attachTableButtonListeners = () => {
            tabelaHistorico.querySelectorAll('.editar-button, .excluir-button, .salvar-button, .cancelar-button').forEach(btn => {
                const newBtn = btn.cloneNode(true); // Clona para remover listeners antigos
                btn.parentNode.replaceChild(newBtn, btn);

                if (newBtn.classList.contains('editar-button')) {
                    newBtn.addEventListener('click', (e) => {
                        const idx = parseInt(e.currentTarget.dataset.originalIndex);
                        if (!isNaN(idx)) { editingIndex = idx; carregarHistorico(); }
                    });
                } else if (newBtn.classList.contains('excluir-button')) {
                    newBtn.addEventListener('click', (e) => {
                        const idx = parseInt(e.currentTarget.dataset.originalIndex);
                        if (!isNaN(idx) && confirm('Tem certeza que deseja excluir este registro?')) {
                            excluirAbastecimento(idx);
                        }
                    });
                } else if (newBtn.classList.contains('salvar-button')) {
                     newBtn.addEventListener('click', (e) => {
                        const idx = parseInt(e.currentTarget.dataset.originalIndex);
                        if (!isNaN(idx)) { salvarEdicao(idx, e.currentTarget.closest('tr')); }
                    });
                } else if (newBtn.classList.contains('cancelar-button')) {
                     newBtn.addEventListener('click', () => { editingIndex = null; carregarHistorico(); });
                }
            });
        };

        const excluirAbastecimento = (originalIndex) => {
            let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
            if (originalIndex >= 0 && originalIndex < abastecimentos.length) {
                abastecimentos.splice(originalIndex, 1);
                localStorage.setItem('abastecimentos', JSON.stringify(abastecimentos));
                editingIndex = null;
                carregarHistorico();
            } else { console.error("Índice inválido para exclusão:", originalIndex); }
        };

        const salvarEdicao = (originalIndex, rowElement) => {
            let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
            if (originalIndex >= 0 && originalIndex < abastecimentos.length && rowElement) {
                try {
                    const newData = {
                        cs: abastecimentos[originalIndex].cs, id: abastecimentos[originalIndex].id,
                        data: rowElement.querySelector('[data-field="data"]').value,
                        frota: rowElement.querySelector('[data-field="frota"]').value.trim(),
                        kmInicial: parseFloat(rowElement.querySelector('[data-field="kmInicial"]').value),
                        kmFinal: parseFloat(rowElement.querySelector('[data-field="kmFinal"]').value),
                        litros: parseFloat(rowElement.querySelector('[data-field="litros"]').value)
                    };

                    if (!newData.data || !newData.frota || isNaN(newData.kmInicial) || isNaN(newData.kmFinal) || isNaN(newData.litros) || newData.litros <= 0 || newData.kmInicial < 0 || newData.kmFinal < 0) {
                        alert('Erro: Todos os campos devem ser preenchidos corretamente.'); return;
                    }
                    if (newData.kmFinal <= newData.kmInicial) {
                        alert('Erro: KM Final deve ser maior que KM Inicial.'); return;
                    }

                    abastecimentos[originalIndex] = newData;
                    abastecimentos.sort((a, b) => new Date(b.data) - new Date(a.data)); // Re-sort after edit
                    localStorage.setItem('abastecimentos', JSON.stringify(abastecimentos));
                    editingIndex = null;
                    carregarHistorico();
                } catch (error) {
                    console.error("Erro ao salvar edição:", error);
                    alert("Ocorreu um erro ao salvar as alterações.");
                }
            } else { console.error("Índice ou elemento da linha inválido para salvar edição:", originalIndex); }
        };

        const carregarHistorico = () => {
            let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
            const dataFiltrada = filtroData.value;
            const frotaFiltrada = filtroFrota.value.trim().toLowerCase();
            let abastecimentosFiltrados = abastecimentos.filter(ab => {
                const matchData = !dataFiltrada || ab.data === dataFiltrada;
                const matchFrota = !frotaFiltrada || (ab.frota && ab.frota.toLowerCase().includes(frotaFiltrada));
                return matchData && matchFrota;
            });
            exibirHistorico(abastecimentosFiltrados);
        };

        const createPDFBlob = (dataInicio, dataFim) => {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();

                const currentUser = JSON.parse(localStorage.getItem('user'));
                if (!currentUser) {
                    console.error("createPDFBlob: Usuário não encontrado.");
                    return null;
                }

                let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
                let filteredPDF = abastecimentos.filter(ab =>
                    ab.cs === currentUser.cs && ab.data >= dataInicio && ab.data <= dataFim
                );

                if (filteredPDF.length === 0) {
                    console.warn("createPDFBlob: Nenhum registro encontrado para o período.");
                    return null;
                }

                filteredPDF.sort((a, b) => new Date(a.data) - new Date(b.data));

                const tableColumn = ["Data", "Frota", "KM Inicial", "KM Final", "Litros", "Consumo (L/km)"];
                const tableRows = filteredPDF.map(ab => {
                    const kmRodados = ab.kmFinal - ab.kmInicial;
                    const consumo = (kmRodados > 0 && ab.litros > 0 && typeof ab.kmFinal === 'number' && typeof ab.kmInicial === 'number')
                                    ? (ab.litros / kmRodados).toFixed(2) : 'N/A';
                    return [
                        formatarDataParaExibicao(ab.data) || 'N/A',
                        ab.frota || 'N/A',
                        ab.kmInicial || 'N/A',
                        ab.kmFinal || 'N/A',
                        (typeof ab.litros === 'number' ? ab.litros.toFixed(2) : 'N/A'),
                        consumo
                    ];
                });

                doc.setFontSize(16);
                doc.text(`Relatório - ${currentUser.nome} (${currentUser.cs})`, 14, 20);
                doc.setFontSize(10); doc.setTextColor(100);
                doc.text(`Período: ${formatarDataParaExibicao(dataInicio)} a ${formatarDataParaExibicao(dataFim)}`, 14, 26);

                doc.autoTable({
                    head: [tableColumn], body: tableRows, startY: 30, theme: 'striped',
                    headStyles: { fillColor: [41, 128, 185], fontSize: 9 }, bodyStyles: { fontSize: 8 }, margin: { top: 30 }
                });

                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.text(`Página ${i}/${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
                    doc.text(`Gerado: ${new Date().toLocaleString('pt-BR')}`, 14, doc.internal.pageSize.height - 10);
                }
                return doc.output('blob');
            } catch (pdfError) {
                console.error("Erro ao gerar PDF Blob:", pdfError);
                return null;
            }
        };

        downloadPdfButton.addEventListener('click', () => {
            const dataInicio = pdfDataInicio.value;
            const dataFim = pdfDataFim.value;

            if (!dataInicio || !dataFim) { alert("Por favor, selecione Data Início e Fim."); return; }
            if (new Date(dataFim) < new Date(dataInicio)) { alert("Data Fim não pode ser anterior à Data Início."); return; }

            const blob = createPDFBlob(dataInicio, dataFim);
            if (!blob) {
                alert("Não foi possível gerar o PDF para download. Verifique os filtros ou se há dados no período.");
                return;
            }
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Relatorio_Abastecimento_${dataInicio}_${dataFim}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        });

        sharePdfButton.addEventListener('click', async () => {
            const dataInicio = pdfDataInicio.value;
            const dataFim = pdfDataFim.value;

            if (!dataInicio || !dataFim) { alert("Por favor, selecione Data Início e Fim para compartilhar."); return; }
            if (new Date(dataFim) < new Date(dataInicio)) { alert("Data Fim não pode ser anterior à Data Início para compartilhar."); return; }

            const blob = createPDFBlob(dataInicio, dataFim);
            if (!blob) {
                alert("Não foi possível gerar o PDF para compartilhamento. Verifique os filtros ou se há dados no período.");
                return;
            }

            const fileName = `Relatorio_Abastecimento_${dataInicio}_${dataFim}.pdf`;
            const pdfFile = new File([blob], fileName, { type: 'application/pdf' });
            const shareData = {
                files: [pdfFile],
                title: 'Relatório de Abastecimento',
                text: `Segue o relatório de abastecimento para o período de ${formatarDataParaExibicao(dataInicio)} a ${formatarDataParaExibicao(dataFim)}.`,
            };

            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.error('Erro ao compartilhar:', err);
                    if (err.name !== 'AbortError') {
                        alert('Não foi possível compartilhar o PDF. Verifique as permissões ou tente fazer o download.');
                    }
                }
            } else if (navigator.share) { // Fallback for browsers that support share but not canShare with files
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.error('Erro ao compartilhar (fallback):', err);
                     if (err.name !== 'AbortError') {
                        alert('Não foi possível compartilhar o arquivo PDF diretamente. Tente fazer o download. (fallback)');
                    }
                }
            }
            else {
                alert('Seu navegador não suporta o compartilhamento de arquivos. Por favor, faça o download do PDF.');
            }
        });

        aplicarFiltroButton.addEventListener('click', carregarHistorico);
        limparFiltroButton.addEventListener('click', () => {
            if(filtroData) filtroData.value = '';
            if(filtroFrota) filtroFrota.value = '';
            carregarHistorico();
        });
        carregarHistorico(); // Carga inicial
    }

    function initGraficos() {
        const filtroDataInicioGrafico = document.getElementById('filtro-data-inicio-grafico');
        const filtroDataFimGrafico = document.getElementById('filtro-data-fim-grafico');
        const filtroFrotaGrafico = document.getElementById('filtro-frota-grafico');
        const aplicarFiltroGraficoButton = document.getElementById('aplicar-filtro-grafico');
        const limparFiltroGraficoButton = document.getElementById('limpar-filtro-grafico');
        const graficoContainerEl = document.getElementById('grafico-container');
        const graficoVazioMsgEl = document.getElementById('grafico-vazio');
        const chartCanvas = document.getElementById('consumoChart');

        if (!chartCanvas || !graficoContainerEl || !graficoVazioMsgEl || !aplicarFiltroGraficoButton || !limparFiltroGraficoButton) {
            console.error("Um ou mais elementos da página de gráficos não foram encontrados.");
            return;
        }
        const ctx = chartCanvas.getContext('2d');

        const metaConsumoTargetLKM = 0.86; // Meta de consumo em L/km

        const renderizarGrafico = (labels, dataConsumo, dataMeta) => {
            if (consumoChartInstance) {
                consumoChartInstance.destroy();
                consumoChartInstance = null;
            }
            const isDarkMode = document.documentElement.classList.contains('dark');
            const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
            const textColor = isDarkMode ? '#f3f4f6' : '#1f2937'; // Usando cores do tema atualizado

            consumoChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Consumo Real (L/km)',
                            data: dataConsumo,
                            borderColor: isDarkMode ? '#60a5fa' : '#2563eb', // Azul tema dark/light
                            backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.2)' : 'rgba(37, 99, 235, 0.2)',
                            tension: 0.1,
                            fill: false,
                        },
                        {
                            label: `Meta Consumo (${metaConsumoTargetLKM.toFixed(2)} L/km)`,
                            data: dataMeta,
                            borderColor: isDarkMode ? '#f87171' : '#dc2626', // Vermelho tema dark/light
                            backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                            borderDash: [5, 5],
                            pointRadius: 0,
                            tension: 0.1,
                            fill: false,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: { display: true, text: 'Consumo (L/km)', color: textColor },
                            grid: { color: gridColor },
                            ticks: { color: textColor }
                        },
                        x: {
                            title: { display: true, text: 'Data do Abastecimento', color: textColor },
                            grid: { color: gridColor },
                            ticks: { autoSkip: true, maxTicksLimit: 15, color: textColor }
                        }
                    },
                    plugins: {
                        legend: { labels: { color: textColor } },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    if (label) { label += ': '; }
                                    if (context.parsed.y !== null) {
                                        label += context.parsed.y.toFixed(2) + ' L/km';
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        };

        const carregarDadosParaGrafico = () => {
            const currentUser = JSON.parse(localStorage.getItem('user'));
            if (!currentUser) {
                graficoVazioMsgEl.textContent = "Usuário não encontrado. Faça login novamente.";
                graficoVazioMsgEl.classList.remove('hidden');
                graficoContainerEl.classList.add('hidden');
                if (consumoChartInstance) { consumoChartInstance.destroy(); consumoChartInstance = null; }
                return;
            }

            let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos') || '[]');
            abastecimentos = abastecimentos.filter(ab => ab.cs === currentUser.cs);

            const dataInicio = filtroDataInicioGrafico.value;
            const dataFim = filtroDataFimGrafico.value;
            const frotaFiltrada = filtroFrotaGrafico.value.trim().toLowerCase();

            if (dataInicio && dataFim && new Date(dataFim) < new Date(dataInicio)) {
                alert("Data Fim não pode ser anterior à Data Início para o filtro do gráfico.");
                graficoVazioMsgEl.textContent = "Período inválido. Data Fim não pode ser anterior à Data Início.";
                graficoVazioMsgEl.classList.remove('hidden');
                graficoContainerEl.classList.add('hidden');
                if (consumoChartInstance) { consumoChartInstance.destroy(); consumoChartInstance = null; }
                return;
            }

            abastecimentos = abastecimentos.filter(ab => {
                let matchData = true;
                if (dataInicio && ab.data < dataInicio) matchData = false;
                if (dataFim && ab.data > dataFim) matchData = false;
                const matchFrota = !frotaFiltrada || (ab.frota && ab.frota.toLowerCase().includes(frotaFiltrada));
                return matchData && matchFrota;
            });

            abastecimentos.sort((a, b) => new Date(a.data) - new Date(b.data));

            const labels = [];
            const dataConsumo = [];
            const dataMetaValores = []; 

            abastecimentos.forEach(ab => {
                const kmRodados = ab.kmFinal - ab.kmInicial;
                if (kmRodados > 0 && ab.litros > 0) { 
                    const consumo = ab.litros / kmRodados; // Litros por KM
                    labels.push(formatarDataParaExibicao(ab.data));
                    dataConsumo.push(consumo);
                    dataMetaValores.push(metaConsumoTargetLKM); 
                }
            });
            
            graficoVazioMsgEl.textContent = "Nenhum dado de abastecimento encontrado para os filtros aplicados.";
            graficoVazioMsgEl.classList.toggle('hidden', labels.length > 0);
            graficoContainerEl.classList.toggle('hidden', labels.length === 0);

            if (labels.length > 0) {
                renderizarGrafico(labels, dataConsumo, dataMetaValores);
            } else {
                if (consumoChartInstance) { consumoChartInstance.destroy(); consumoChartInstance = null; }
            }
        };

        aplicarFiltroGraficoButton.addEventListener('click', carregarDadosParaGrafico);
        limparFiltroGraficoButton.addEventListener('click', () => {
            const hoje = new Date();
            const umMesAtras = new Date();
            umMesAtras.setMonth(hoje.getMonth() - 1);
            if(filtroDataInicioGrafico) filtroDataInicioGrafico.value = umMesAtras.toISOString().split('T')[0];
            if(filtroDataFimGrafico) filtroDataFimGrafico.value = hoje.toISOString().split('T')[0];
            if(filtroFrotaGrafico) filtroFrotaGrafico.value = '';
            carregarDadosParaGrafico();
        });

        // Define datas padrão para os filtros de gráfico ao carregar a página
        const hoje = new Date();
        const umMesAtras = new Date();
        umMesAtras.setMonth(hoje.getMonth() - 1);
        if(filtroDataInicioGrafico && !filtroDataInicioGrafico.value) filtroDataInicioGrafico.value = umMesAtras.toISOString().split('T')[0];
        if(filtroDataFimGrafico && !filtroDataFimGrafico.value) filtroDataFimGrafico.value = hoje.toISOString().split('T')[0];
        
        carregarDadosParaGrafico(); // Carga inicial do gráfico
    }

    // --- Carregamento Inicial ---
    try {
        applyTheme(); // Aplica o tema primeiro
        const initialUser = JSON.parse(localStorage.getItem('user'));
        if (initialUser) {
            user = initialUser; // Garante que 'user' está definido globalmente
            const lastPage = localStorage.getItem('lastVisitedPage');
            loadPage(lastPage && ['abastecimento', 'historico', 'graficos'].includes(lastPage) ? lastPage : 'abastecimento');
        } else {
            loadPage('login');
        }

        window.addEventListener('beforeunload', () => {
            const contentElement = document.getElementById('content');
            const currentUserOnUnload = JSON.parse(localStorage.getItem('user'));
            if (contentElement && contentElement.innerHTML !== '' && currentUserOnUnload) { 
                const currentPageH2 = contentElement.querySelector('h2');
                if (currentPageH2) {
                    if (currentPageH2.textContent.includes("Novo Abastecimento")) localStorage.setItem('lastVisitedPage', 'abastecimento');
                    else if (currentPageH2.textContent.includes("Histórico")) localStorage.setItem('lastVisitedPage', 'historico');
                    else if (currentPageH2.textContent.includes("Análise Gráfica")) localStorage.setItem('lastVisitedPage', 'graficos');
                }
            } else if (!currentUserOnUnload) {
                 localStorage.removeItem('lastVisitedPage');
            }
        });
    } catch (criticalError) {
        console.error("Erro crítico na inicialização do script:", criticalError);
        if (appContainer) {
            appContainer.innerHTML = `
                <div style="padding: 20px; text-align: center; color: red; background-color: #fff0f0; border: 1px solid red; margin: 20px;">
                    <h1>Ocorreu um erro crítico ao carregar a aplicação.</h1>
                    <p>Por favor, tente recarregar a página. Se o problema persistir, verifique o console do navegador (F12) para mais detalhes técnicos.</p>
                    <p><strong>Detalhe do Erro:</strong> ${criticalError.message}</p>
                </div>
            `;
        }
    }
});