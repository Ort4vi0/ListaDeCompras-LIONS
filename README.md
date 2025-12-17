# 🦁 LionsDash (LIONS)

**LionsDash** é uma aplicação web completa para gerenciamento de listas de compras e controle de orçamento. O sistema permite criar múltiplos orçamentos, adicionar itens com sugestões inteligentes de preço e acompanhar seus gastos em tempo real.

## ✨ Funcionalidades Principais

*   **Hub de Orçamentos**: Crie listas separadas para diferentes ocasiões (ex: Mercado Semanal, Churrasco, Farmácia).
*   **Sugestões Inteligentes**: O sistema aprende os preços dos produtos que você adiciona e sugere automaticamente quando você começa a digitar.
*   **Modo Loja**: Uma interface simplificada e focada para usar enquanto você está no mercado fazendo as compras.
*   **Controle Financeiro**: Barra de progresso em tempo real mostrando quanto você já gastou do seu limite estipulado.
*   **Temas**: Suporte completo a **Modo Escuro** e Claro.
*   **Confirmações de Segurança**: Evite exclusões acidentais com modais de confirmação configuráveis.

## 🚀 Tecnologias Utilizadas

### Frontend (`/FRONT`)
*   **HTML5 & CSS3**
*   **JavaScript (Vanilla)**: Lógica de estado reativa e manipulação de DOM.
*   **Tailwind CSS**: Estilização moderna e responsiva (via CDN).
*   **Lucide Icons**: Ícones vetoriais leves e bonitos.

### Backend (`/API`)
*   **Node.js & Express**: Servidor robusto e performático.
*   **MongoDB & Mongoose**: Banco de dados NoSQL para flexibilidade.
*   **Arquitetura em Camadas**: Organizado em Controllers, Services e Repositories para fácil manutenção.

## 📂 Estrutura do Projeto

```
lions/
├── API/                 # Backend (Servidor Node.js)
│   ├── src/
│   │   ├── config/      # Configurações (DB, env)
│   │   ├── controllers/ # Controladores das rotas
│   │   ├── models/      # Schemas do Mongoose
│   │   ├── repositories/# Acesso direto ao Banco de Dados
│   │   ├── routes/      # Definição das rotas da API
│   │   ├── services/    # Regras de negócio
│   │   ├── app.js       # Configuração do Express
│   │   └── server.js    # Ponto de entrada
│   ├── .env             # Variáveis de ambiente
│   └── package.json
│
└── FRONT/               # Frontend (Interface Web)
    └── lions.html       # Aplicação Single Page (SPA)
```

## 🛠️ Como Rodar o Projeto

### Pré-requisitos
*   Node.js instalado.
*   MongoDB (Local ou Atlas).

### 1. Configurando a API (Backend)

1.  Abra o terminal na pasta `API`:
    ```bash
    cd API
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure as variáveis de ambiente. Crie um arquivo `.env` na pasta `API` (se não existir) e adicione:
    ```env
    MONGO_URI=sua_string_de_conexao_mongodb
    PORT=3000
    NODE_ENV=development
    ```
4.  Inicie o servidor:
    ```bash
    npm start
    ```
    *O servidor rodará em `http://localhost:3000`*

### 2. Rodando o Frontend

1.  Vá até a pasta `FRONT`.
2.  Abra o arquivo `lions.html` no seu navegador preferido.
    *   *Dica: Para uma melhor experiência, use uma extensão como "Live Server" no VS Code.*

## 📖 Guia de Uso Rápido

1.  **Criar Orçamento**: No Hub inicial, clique em "Novo Orçamento", dê um nome e defina um limite de gastos.
2.  **Adicionar Itens**: Entre no orçamento, digite o nome do produto. Se já existir no histórico, o preço será sugerido. Ajuste a quantidade e clique em `+` ou pressione `Enter`.
3.  **Ir às Compras**: Ao chegar no mercado, clique no botão "Ir às Compras" no topo. A tela mudará para facilitar a marcação dos itens que você colocar no carrinho.
4.  **Finalizar**: Ao terminar, clique em "Finalizar Compra". Os itens marcados serão removidos e o orçamento será atualizado.

---
Desenvolvido com 💜 para facilitar suas compras.
