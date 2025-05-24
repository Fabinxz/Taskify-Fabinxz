# Taskify - Seu Dashboard de Metas e Progresso 📝✨

<p align="center">
  <!-- Adicione seu GIF ou imagem principal do dashboard aqui -->
  <img src="URL_DA_SUA_IMAGEM_PRINCIPAL_OU_GIF_AQUI" alt="Taskify Dashboard Screenshot" width="700">
</p>

Taskify é um dashboard web interativo e responsivo projetado para ajudar você a acompanhar suas metas diárias, semanais, mensais e anuais de forma visual e motivadora. Com um design moderno (dark mode por padrão, com opção light mode), animações sutis e foco na experiência do usuário, Taskify torna o acompanhamento de progresso uma tarefa mais agradável.

## 🚀 Funcionalidades Principais

*   **Contador de Questões Dinâmico:** Incremente ou decremente facilmente suas tarefas/questões concluídas no dia, com valor de incremento personalizável.
*   **Visualização de Metas:** Acompanhe seu progresso em relação às metas:
    *   Diária
    *   Semanal
    *   Mensal
    *   Anual
*   **Indicadores de Performance:**
    *   **Recorde Diário:** Veja seu recorde de tarefas concluídas em um único dia e quando foi alcançado.
    *   **Streak Atual:** Mantenha a motivação acompanhando seus dias consecutivos de metas diárias batidas.
    *   **Pico de Atividade Semanal:** Identifique seu dia mais produtivo da semana.
*   **Gráfico de Atividade Semanal:** Visualize sua produtividade ao longo dos últimos 7 dias com um gráfico de linhas interativo.
*   **Temas Personalizáveis:**
    *   Alterne entre o tema **Escuro (Dark Mode)** e **Claro (Light Mode)**.
    *   **Cor Primária Dinâmica:** Personalize a cor de destaque principal do dashboard com um seletor de cores integrado ao logo.
*   **Metas Editáveis:** Defina e ajuste suas metas de progresso e streak através de um modal intuitivo.
*   **Design Responsivo:** Interface totalmente adaptada para desktops, tablets e dispositivos móveis, com header sticky e layout otimizado para telas menores.
*   **Persistência de Dados:** Suas contagens, metas, tema e cor primária são salvos localmente no seu navegador (`localStorage`), para que você não perca seu progresso.
*   **Animações e Efeitos Visuais:**
    *   Animações suaves nos contadores e gráficos.
    *   Efeito de partículas sutis seguindo o cursor do mouse.
    *   Loader elegante durante o carregamento inicial.
*   **Favicon Dinâmico:** O favicon do navegador reflete a cor primária escolhida.

## 📸 Screenshots

<!-- Coloque suas screenshots aqui! Use a sintaxe do Markdown: -->
<!-- Exemplo: -->
<p align="center">
  <img src="![image](https://github.com/user-attachments/assets/99c2fe2a-dd15-402c-b35e-e8dee60e57c0)
" alt="Desktop Dark Mode" width="45%">
       
  <img src="![image](https://github.com/user-attachments/assets/1dd23026-7589-423d-b3d0-fcf45bfaed41)
" alt="Desktop Light Mode" width="45%">
</p>
<p align="center"><em>Modo Desktop (Escuro e Claro)</em></p>

<br>

<p align="center">
  <img src="![image](https://github.com/user-attachments/assets/1c5a2294-25b7-4104-a021-ec25089af533)
" alt="Mobile Dark Mode" width="30%">
     
  <img src="![image](https://github.com/user-attachments/assets/d4dac5fd-e508-452e-8b14-8774a0c6e02d)
" alt="Mobile Light Mode" width="30%">
     
  <img src="![image](https://github.com/user-attachments/assets/c7479104-d5b9-4ce9-94f6-77e273f959ee)
" alt="Modal de Metas" width="30%">
</p>
<p align="center"><em>Modo Mobile e Modal de Edição de Metas</em></p>

## 🛠️ Tecnologias Utilizadas

*   **HTML5:** Estrutura semântica da página.
*   **CSS3:** Estilização, responsividade (Flexbox, Grid), variáveis CSS, transições e animações.
*   **JavaScript (ES6+):** Lógica da aplicação, manipulação do DOM, gerenciamento de estado, interatividade e persistência de dados com `localStorage`.
*   **Chart.js:** Biblioteca para criação de gráficos interativos.
*   **Bootstrap Icons:** Para os ícones utilizados na interface.

## ✨ Como Usar

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
    ```
2.  **Navegue até o diretório do projeto:**
    ```bash
    cd SEU_REPOSITORIO
    ```
3.  **Abra o arquivo `index.html`** no seu navegador de preferência.

Não é necessário nenhum build ou instalação de dependências complexas, pois o projeto utiliza CDNs para as bibliotecas externas (Chart.js e Bootstrap Icons) e é composto por arquivos estáticos.

## 🎨 Personalização

*   **Mudar a Cor Primária:** Clique no logo "Taskify" (ou "Tkfy" no mobile) no canto superior esquerdo. Um seletor de cores nativo do navegador aparecerá, permitindo que você escolha a cor de destaque do dashboard. A alteração é aplicada instantaneamente e salva.
*   **Alternar Tema:** Clique no ícone de lua (🌙) ou sol (☀️) no canto superior direito para alternar entre os modos escuro e claro. Sua preferência é salva.
*   **Editar Metas:** Clique no ícone de lápis (✏️) no canto superior direito para abrir o modal e definir suas metas diárias, semanais, mensais, anuais e de streak.

## 🕹️ Funcionalidades em Detalhe

### Contador de Questões
Localizado no header, permite adicionar ou remover questões concluídas no dia. O valor do passo (quantas questões são adicionadas/removidas por clique) pode ser editado diretamente no campo numérico entre os botões.

### Indicadores de Progresso (Hoje, Semana, Mês, Ano)
Cada card mostra:
*   O total de questões concluídas no período.
*   A meta definida para o período.
*   Um anel de progresso circular que se preenche conforme você se aproxima da meta.

### Cards de Informações Adicionais
*   **Recorde Diário:** Exibe o maior número de questões que você já completou em um único dia, junto com a data desse recorde.
*   **Streak Atual:** Mostra por quantos dias consecutivos você atingiu sua meta diária. Uma barra de progresso indica quão perto você está da sua meta de streak.
*   **Pico de Atividade Semanal:** Aponta o dia da semana em que você foi mais produtivo (mais questões) nos últimos 7 dias.

### Gráfico de Atividade Semanal
Um gráfico de linhas mostra a quantidade de questões concluídas em cada um dos últimos 7 dias, oferecendo uma visão clara da sua consistência e tendências.

## 📂 Estrutura do Projeto
Use code with caution.
Markdown
.
├── css/
│ └── style.css # Folha de estilos principal
├── js/
│ └── script.js # Lógica JavaScript da aplicação
├── index.html # Arquivo HTML principal
└── README.md # Este arquivo
## 💡 Possíveis Melhorias Futuras

*   [ ] Sincronização de dados entre dispositivos (usando um backend ou Firebase).
*   [ ] Notificações para lembrar de metas ou parabenizar por streaks.
*   [ ] Temas de cores pré-definidos.
*   [ ] Exportação/Importação de dados.
*   [ ] Internacionalização (i18n) para suportar múltiplos idiomas.
*   [ ] Testes unitários e de integração.

## 🤝 Contribuindo

Contribuições são bem-vindas! Se você tem ideias para melhorar o Taskify ou encontrou algum bug, sinta-se à vontade para:

1.  Fazer um Fork do projeto.
2.  Criar uma Branch para sua Feature (`git checkout -b feature/MinhaFeatureIncrivel`).
3.  Commitar suas mudanças (`git commit -m 'Adiciona MinhaFeatureIncrivel'`).
4.  Push para a Branch (`git push origin feature/MinhaFeatureIncrivel`).
5.  Abrir um Pull Request.

Por favor, certifique-se de que seu código segue as boas práticas e, se possível, adicione comentários para funcionalidades complexas.

## 📝 Licença

Este projeto é distribuído sob a Licença MIT. Veja o arquivo `LICENSE` (se você criar um) para mais detalhes, ou simplesmente declare:
Este projeto é licenciado sob a Licença MIT.

---

Feito com ❤️ por [Seu Nome/Usuário]
