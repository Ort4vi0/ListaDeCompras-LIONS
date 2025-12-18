const CONFIG = {
    // Versão
    VERSION: 'v1.0.8',

    // Cores dos Temas
    COLORS: {
        indigo: { name: 'Indigo (Padrão)', hex: '#6366f1', ring: '#a5b4fc', class: 'bg-indigo-500' },
        emerald: { name: 'Emerald (Verde)', hex: '#10b981', ring: '#6ee7b7', class: 'bg-emerald-500' },
        rose: { name: 'Rose (Rosa)', hex: '#f43f5e', ring: '#fda4af', class: 'bg-rose-500' },
        amber: { name: 'Amber (Laranja)', hex: '#f59e0b', ring: '#fcd34d', class: 'bg-amber-500' }
    },

    // Link da API
    API_BASE_URL: 'https://api-lionsdash.onrender.com/api',
    
    // App Identity
    APP_NAME: 'Otávio de Quadros Sonnenstrahl - LIONS',
    APP_SLOGAN: 'Dashboard para compras',
    
    // Configuracoes padroes para o site
    DEFAULT_THEME: 'dark', // 'light' or 'dark'
    DEFAULT_ROUND_VALUES: false,
    DEFAULT_ENABLE_SUGGESTIONS: true,
    DEFAULT_CONFIRMATIONS: {
        deleteBudget: true,
        deleteItem: true,
        deleteSuggestion: true,
        finishShop: true
    }
};
