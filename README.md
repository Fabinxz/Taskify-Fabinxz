<p align="center"> <h1 align="center">Taskify — Dashboard de Metas e Foco 🎯</h1> </p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/99139d62-6870-49dc-8bdf-665ad5b60472" alt="Taskify Dashboard Demo - Visão Geral" width="700">
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/ef6f015c-6e04-454d-8aba-ae82c08c044c" alt="Taskify Dashboard Demo - Pomodoro e Tarefas" width="700">
</p>
<p align="center">
  <img src="https://github.com/user-attachments/assets/148d6ffe-a2ed-4942-83da-e7f0d7b7f8b1" alt="Taskify Dashboard Demo - Retrospectiva" width="700">
</p>

Taskify é um dashboard responsivo e personalizável para acompanhamento de metas, gerenciamento de tarefas, sessões de foco com timer Pomodoro e análise de desempenho em estudos. Todos os dados são salvos localmente no seu navegador.

**👉** [Acesse a Demo](https://taskify-fabinxz.vercel.app/)

## 🚀 Funcionalidades Principais

*   **Contador de Progresso Dinâmico (Painel Principal):**
    *   Adicione e remova unidades de progresso (ex: questões resolvidas) facilmente.
    *   Input numérico para definir o "passo" (quantidade) de unidades por clique.
    *   Tooltips informativos.
*   **Acompanhamento Detalhado de Metas (Painel Principal):**
    *   Visualize seu progresso para metas diárias, semanais, mensais e anuais com anéis de progresso.
    *   Metas totalmente editáveis.
*   **Estatísticas de Performance (Painel Principal):**
    *   Recorde Diário de progresso.
    *   Streak Atual (dias consecutivos de metas diárias batidas) com barra de progresso.
    *   Pico de Atividade Semanal (dia da semana com maior progresso).
*   **Gerenciamento de Tarefas (Aba "Foco & Tarefas"):**
    *   Adicione, complete e delete tarefas.
    *   Atribua datas às tarefas (com seletor de data no formato DD/MM/AAAA).
    *   Arraste e solte para reordenar tarefas.
    *   **Rotina Semanal Configurável:**
        *   Defina tarefas recorrentes para cada dia da semana em um modal interativo.
        *   Adicione tarefas a dias específicos ou múltiplos dias selecionados.
        *   Edite e delete tarefas dentro da rotina.
        *   Tarefas da rotina são automaticamente adicionadas à lista principal no dia correspondente.
        *   Arraste e solte tarefas entre os dias dentro do modal de rotina.
*   **Timer Pomodoro Integrado (Aba "Foco & Tarefas"):**
    *   Configure durações de foco, pausas curtas e longas.
    *   Contador de ciclos de Pomodoro e estatísticas detalhadas das sessões do dia.
    *   Opções de início automático de pausas/foco e notificações sonoras.
*   **Módulos de Desempenho Acadêmico:**
    *   **Simulados (Aba "Simulados"):**
        *   Registre simulados com nome, categoria, data, acertos, total de questões, tempo gasto e status.
        *   Gerencie categorias de simulados (ENEM 1º Dia, Humanas, etc.).
        *   Visualize o desempenho por categoria, com gráfico de performance (percentual de acertos ou tempo gasto) e lista de simulados.
        *   Cards expansíveis com detalhes do simulado (acertos, percentual, tempo, desempenho, status).
        *   Resumo estatístico por categoria (total de simulados, média de acertos, tempo médio, pendentes).
    *   **Redações (Aba "Redações"):**
        *   Registre redações com tema, eixo temático, data, notas por competência (C1-C5), nota total, tempo gasto e status.
        *   Gerencie eixos temáticos (Educação, Saúde, etc.).
        *   Visualize o desempenho por eixo temático, com gráfico de notas (nota total ou por competência) e lista de redações.
        *   Cards expansíveis com detalhes da redação (notas, tempo, status).
        *   Resumo estatístico por eixo temático (total de redações, média geral de notas, tempo médio, pendentes).
*   **Visualização de Dados:**
    *   Gráfico de Atividade Semanal para questões resolvidas (Painel Principal).
    *   Gráfico Semanal de Tempo de Foco (Pomodoro) (Aba "Foco & Tarefas").
    *   Gráfico Semanal de Tarefas Concluídas (Aba "Foco & Tarefas").
    *   Gráficos de performance por categoria de simulado (Aba "Simulados").
    *   Gráficos de notas por eixo temático de redação (Aba "Redações").
    *   Todos os gráficos com filtros de período (últimos 7/30 dias, último ano, desde o início).
*   **Retrospectiva Mensal Interativa:**
    *   Visualize suas principais métricas do mês (questões, tarefas, foco).
    *   Descubra seu dia mais produtivo e padrões de produtividade.
    *   Compare seu desempenho com o mês anterior.
    *   Gere uma imagem da sua retrospectiva para compartilhar (com download e cópia para clipboard).
    *   Música ambiente opcional.
*   **Ampla Personalização Visual:**
    *   **Temas:** Escuro (padrão) e Claro.
    *   **Paletas de Cores:** Diversas opções predefinidas para a cor primária.
    *   **Modos Visuais:** Padrão, Foco Total, Profundo da Noite, Energia Vibrante.
*   **Responsivo:** Ótima experiência em desktops, tablets e celulares.
*   **Persistência Local:** Todos os dados e personalizações são salvos no `localStorage` do navegador.
*   **Favicon Dinâmico:** O ícone do site reflete a cor primária escolhida.
*   **Guia de Boas-Vindas:** Para novos usuários.

## 🛠️ Tecnologias

*   **HTML5**
*   **CSS3** (Flexbox, Grid, Variáveis CSS, Media Queries, Animações)
*   **JavaScript (ES6+)**
*   **Chart.js** (para gráficos)
*   **Flatpickr** (para seleção de data customizada)
*   **Bootstrap Icons** (para ícones)
*   **html2canvas** (para gerar imagem da retrospectiva)

## ⚡ Como Usar

1.  Clone o repositório:
    ```bash
    git clone https://github.com/Fabinxz/Taskify.git
    ```
2.  Navegue até o diretório do projeto:
    ```bash
    cd Taskify
    ```
3.  Abra o arquivo `index.html` no seu navegador de preferência.
    *(Não são necessárias etapas de build ou instalação de dependências complexas).*

## 🎨 Personalização Rápida

*   **Acesso aos Módulos:** Navegue pelas abas "Painel de Questões", "Foco & Tarefas", "Simulados" e "Redações" no cabeçalho.
*   **Aparência (Temas, Cores, Modos Visuais):** Clique no ícone de paleta <i class="bi bi-palette-fill"></i> no header.
*   **Tema Claro/Escuro:** Use o ícone de lua/sol <i class="bi bi-moon-fill"></i> / <i class="bi bi-sun-fill"></i> no header.
*   **Metas e Reset (Painel Principal):** Clique no ícone de lápis <i class="bi bi-pencil-square"></i> no header.
*   **Configurar Rotina Semanal (Tarefas):** Na aba "Foco & Tarefas", clique no botão "<i class="bi bi-arrow-repeat"></i> Configurar Rotina".
*   **Configurações do Pomodoro:** Na aba "Foco & Tarefas", clique no ícone de engrenagem <i class="bi bi-gear-fill"></i> na seção do Pomodoro.
*   **Gerenciar Categorias de Simulados:** Na aba "Simulados", clique em "<i class="bi bi-tags-fill"></i> Gerenciar Categorias".
*   **Gerenciar Eixos Temáticos (Redações):** Na aba "Redações", clique em "<i class="bi bi-diagram-3-fill"></i> Gerenciar Eixos Temáticos".
*   **Retrospectiva Mensal:** Clique no ícone de calendário com coração <i class="bi bi-calendar-heart-fill"></i> no canto inferior direito.

## 📂 Estrutura do Projeto

Taskify/
├── css/
│ ├── style.css           # Estilos principais da aplicação
│ ├── retrospective.css   # Estilos específicos da retrospectiva
│ ├── simulados.css       # Estilos para o módulo de Simulados
│ └── redacoes.css        # Estilos para o módulo de Redações
├── js/
│ ├── script.js           # Lógica principal da aplicação e módulo de Questões
│ ├── retrospective.js    # Lógica da funcionalidade de retrospectiva
│ ├── simulados.js        # Lógica para o módulo de Simulados
│ └── redacoes.js         # Lógica para o módulo de Redações
├── sounds/
│ ├── focus_end.mp3       # Som para fim do ciclo de foco Pomodoro
│ ├── break_end.mp3       # Som para fim do ciclo de pausa Pomodoro
│ └── BalloonPlanet - Echoes of Freedom.mp3 # Música para retrospectiva
├── index.html            # Página principal da aplicação
├── retrospective.html    # Estrutura HTML da retrospectiva (carregada dinamicamente)
└── README.md             # Este arquivo

## 💡 Melhorias Futuras (Ideias)

*   Sincronização de dados online (ex: Firebase, Supabase).
*   Notificações push para lembretes de metas ou fim de ciclos Pomodoro.
*   Opção de exportar/importar dados do usuário (JSON, CSV).
*   Mais opções de temas e customização de layout.
*   Gamificação mais elaborada com badges e níveis.
*   Integração com calendários externos.

---

Feito por [(Fabinxz)](https://www.instagram.com/fabiomachado7_/)

[![GitHub Profile](https://img.shields.io/badge/GitHub-Fabinxz-181717?style=for-the-badge&logo=github)](https://github.com/Fabinxz)