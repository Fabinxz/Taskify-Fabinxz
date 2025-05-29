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

Taskify é um dashboard responsivo e personalizável para acompanhamento de metas, gerenciamento de tarefas e sessões de foco com timer Pomodoro. Todos os dados são salvos localmente no seu navegador.

**👉** [Acesse a Demo](https://taskify-fabinxz.vercel.app/)

## 🚀 Funcionalidades Principais

*   **Contador de Progresso Dinâmico:** Adicione e remova unidades de progresso (ex: questões resolvidas) facilmente.
*   **Acompanhamento Detalhado de Metas:**
    *   Visualize seu progresso para metas diárias, semanais, mensais e anuais com anéis de progresso.
    *   Metas totalmente editáveis.
*   **Estatísticas de Performance:**
    *   Recorde Diário de progresso.
    *   Streak Atual (dias consecutivos de metas diárias batidas) com barra de progresso para a meta de streak.
    *   Pico de Atividade Semanal (dia da semana com maior progresso).
*   **Gerenciamento de Tarefas:**
    *   Adicione, complete e delete tarefas.
    *   Atribua datas às tarefas (com seletor de data no formato DD/MM/AAAA).
    *   Arraste e solte para reordenar tarefas.
*   **Timer Pomodoro Integrado:**
    *   Configure durações de foco, pausas curtas e longas.
    *   Contador de ciclos de Pomodoro.
    *   Opções de início automático de pausas/foco e notificações sonoras.
*   **Visualização de Dados:**
    *   Gráfico de Atividade Semanal (progresso dos últimos 7 dias).
    *   Gráfico Semanal de Tempo de Foco (Pomodoro).
    *   Gráfico Semanal de Tarefas Concluídas.
*   **Retrospectiva Mensal Interativa:**
    *   Visualize suas principais métricas do mês (questões, tarefas, foco).
    *   Descubra seu dia mais produtivo e padrões de produtividade.
    *   Compare seu desempenho com o mês anterior.
    *   Gere uma imagem da sua retrospectiva para compartilhar.
    *   Música ambiente opcional para a experiência.
*   **Ampla Personalização Visual:**
    *   **Temas:** Escuro (padrão) e Claro.
    *   **Paletas de Cores:** Diversas opções predefinidas para a cor primária do dashboard.
    *   **Modos Visuais:**
        *   Padrão: Experiência Taskify completa.
        *   Foco Total: Interface minimalista para menos distrações.
        *   Profundo da Noite: Cores escuras e suaves.
        *   Energia Vibrante: Cores dinâmicas e fundo com gradiente.
*   **Responsivo:** Ótima experiência em desktops, tablets e celulares.
*   **Persistência Local:** Seus dados e personalizações são salvos no navegador (`localStorage`).
*   **Favicon Dinâmico:** O ícone do site reflete a cor primária escolhida.
*   **Guia de Boas-Vindas:** Para novos usuários.

## 🛠️ Tecnologias

*   **HTML5**
*   **CSS3** (Flexbox, Grid, Variáveis CSS, Animações)
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

*   **Aparência (Temas, Cores, Modos Visuais):** Clique no ícone de paleta <i class="bi bi-palette-fill"></i> no header.
*   **Tema Claro/Escuro:** Use o ícone de lua/sol <i class="bi bi-moon-fill"></i> / <i class="bi bi-sun-fill"></i> no header.
*   **Metas e Reset:** Clique no ícone de lápis <i class="bi bi-pencil-square"></i> no header.
*   **Configurações do Pomodoro:** Clique no ícone de engrenagem <i class="bi bi-gear-fill"></i> na seção do Pomodoro.
*   **Retrospectiva Mensal:** Clique no ícone de calendário com coração <i class="bi bi-calendar-heart-fill"></i> no canto inferior direito.

## 📂 Estrutura do Projeto

Taskify/
├── css/
│ ├── style.css # Estilos principais da aplicação
│ └── retrospective.css # Estilos específicos da retrospectiva
├── js/
│ ├── script.js # Lógica principal da aplicação
│ └── retrospective.js # Lógica da funcionalidade de retrospectiva
├── sounds/
│ ├── focus_end.mp3 # Som para fim do ciclo de foco Pomodoro
│ ├── break_end.mp3 # Som para fim do ciclo de pausa Pomodoro
│ └── BalloonPlanet - Echoes of Freedom.mp3 # Música para retrospectiva
├── index.html # Página principal da aplicação
├── retrospective.html # Estrutura HTML da retrospectiva (carregada dinamicamente)
└── README.md # Este arquivo
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