// --- CONFIGURAÇÃO E ESTADO ---
const state = {
    view: 'hub', // 'hub' | 'dashboard'
    budgets: [],
    activeBudgetId: null,
    editingItemId: null,

    // Global Settings
    shopMode: false,
    theme: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_THEME : 'dark',
    appName: typeof CONFIG !== 'undefined' ? CONFIG.APP_NAME : 'LionsDash',
    appSlogan: typeof CONFIG !== 'undefined' ? CONFIG.APP_SLOGAN : 'Dashboard',
    roundValues: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_ROUND_VALUES : false,
    enableSuggestions: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_ENABLE_SUGGESTIONS : true,
    showTutorialOnStart: localStorage.getItem('lions_show_tutorial') !== 'false', // Default true
    
    // Confirmation Settings
    confirmDeleteBudget: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_CONFIRMATIONS.deleteBudget : true,
    confirmDeleteItem: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_CONFIRMATIONS.deleteItem : true,
    confirmDeleteSuggestion: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_CONFIRMATIONS.deleteSuggestion : true,
    confirmFinishShop: typeof CONFIG !== 'undefined' ? CONFIG.DEFAULT_CONFIRMATIONS.finishShop : true,

    // Active Budget Data (Loaded from budgets array)
    budgetLimit: 500,
    budgetTitle: 'Orçamento Semanal',
    items: [],
    categories: ['Geral'],
    products: [], // Cache for suggestions
    searchTerm: '' // New search term state
};

// --- CAMADA DE SERVIÇO DE API (REAL) ---
const API_BASE = typeof CONFIG !== 'undefined' ? CONFIG.API_BASE_URL : 'http://localhost:3000/api';
const API_URL = `${API_BASE}/budgets`;
const PRODUCTS_URL = `${API_BASE}/products`;

const apiService = {
    // Products
    async fetchProducts() {
        try {
            const res = await fetch(PRODUCTS_URL);
            if (!res.ok) return [];
            return await res.json();
        } catch (e) {
            return [];
        }
    },

    async createProduct(product) {
        try {
            const res = await fetch(PRODUCTS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            return await res.json();
        } catch (e) {
            console.error(e);
        }
    },

    async deleteProduct(id) {
        try {
            await fetch(`${PRODUCTS_URL}/${id}`, {
                method: 'DELETE'
            });
        } catch (e) {
            console.error(e);
        }
    },

    // Budgets
    async fetchBudgets() {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return await res.json();
    },

    async createBudget(budget) {
        const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(budget)
        });
        return await res.json();
    },

    async updateBudget(id, data) {
        const res = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    },

    async deleteBudget(id) {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        return true;
    },

    async saveBudgets(budgets) {
        // Deprecated: Persistence is handled per-action.
    },

    // Items
    async fetchItems() {
        if (!state.activeBudgetId) return [];
        const res = await fetch(`${API_URL}/${state.activeBudgetId}`);
        const budget = await res.json();
        return budget.items || [];
    },

    async addItem(item) {
        if (!state.activeBudgetId) return item;
        const res = await fetch(`${API_URL}/${state.activeBudgetId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        const updatedBudget = await res.json();
        return updatedBudget.items[updatedBudget.items.length - 1];
    },

    async deleteItem(id) {
        if (!state.activeBudgetId) return;
        await fetch(`${API_URL}/${state.activeBudgetId}/items/${id}`, {
            method: 'DELETE'
        });
        return true;
    },

    async toggleItem(id, isChecked) {
        if (!state.activeBudgetId) return;
        await fetch(`${API_URL}/${state.activeBudgetId}/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checked: isChecked })
        });
    },

    async updateItem(id, item) {
        if (!state.activeBudgetId) return;
        await fetch(`${API_URL}/${state.activeBudgetId}/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
    },

    async deleteCategory(budgetId, categoryName) {
        if (!budgetId) return;
        await fetch(`${API_URL}/${budgetId}/categories/${encodeURIComponent(categoryName)}`, {
            method: 'DELETE'
        });
    }
};

// --- ELEMENTOS DO DOM ---
const dom = {
    body: document.getElementById('main-body'),
    header: document.getElementById('header'),
    backToHubBtn: document.getElementById('back-to-hub-btn'), // NEW
    logoIcon: document.getElementById('logo-icon'),
    logoIconBg: document.getElementById('logo-icon-bg'),
    modeText: document.getElementById('mode-text'),
    toggleBtn: document.getElementById('toggle-mode-btn'),
    themeBtn: document.getElementById('theme-toggle-btn'),
    
    // Sections
    hubSection: document.getElementById('hub-section'), // NEW
    hubGrid: document.getElementById('hub-grid'), // NEW
    dashboardSection: document.getElementById('dashboard-section'), // Renamed from main-section wrapper
    
    sidebar: document.getElementById('sidebar'),
    mainSection: document.getElementById('main-section'),
    addForm: document.getElementById('add-form'),
    itemsContainer: document.getElementById('items-container'),
    shopFooter: document.getElementById('shop-footer'),
    // Inputs
    inputName: document.getElementById('input-name'),
    inputCategory: document.getElementById('input-category'),
    categoryDropdownBtn: document.getElementById('category-dropdown-btn'),
    categoryDropdownMenu: document.getElementById('category-dropdown-menu'),
    selectedCategoryDisplay: document.getElementById('selected-category-display'),
    inputPrice: document.getElementById('input-price'),
    inputQuantity: document.getElementById('input-quantity'),
    inputUnit: document.getElementById('input-unit'),
    unitDropdownBtn: document.getElementById('unit-dropdown-btn'),
    unitDropdownMenu: document.getElementById('unit-dropdown-menu'),
    selectedUnitDisplay: document.getElementById('selected-unit-display'),
    addBtn: document.getElementById('add-btn'),
    // Displays
    budgetDisplay: document.getElementById('budget-display'),
    budgetTitleDisplay: document.getElementById('budget-title-display'),
    budgetLimitDisplay: document.getElementById('budget-limit-display'),
    progressBar: document.getElementById('progress-bar'),
    progressBarContainer: document.getElementById('progress-bar-container'),
    estimatedTotal: document.getElementById('estimated-total'),
    remainingBudget: document.getElementById('remaining-budget'),
    footerTotal: document.getElementById('footer-total'),
    footerRemainingCount: document.getElementById('footer-remaining-count'),
    // Theme specific
    budgetCard: document.getElementById('budget-card'),
    menuCard: document.getElementById('menu-card'),
    menuTitle: document.getElementById('menu-title'),
    // Modal Delete
    deleteModal: document.getElementById('delete-modal'),
    deleteModalContent: document.getElementById('delete-modal-content'),
    deleteModalTitle: document.getElementById('delete-modal-title'),
    deleteModalText: document.getElementById('delete-modal-text'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    // Add Item Modal
    addItemModal: document.getElementById('add-item-modal'),
    addItemModalContent: document.getElementById('add-item-modal-content'),
    addItemModalTitle: document.getElementById('add-item-modal-title'),
    cancelAddBtn: document.getElementById('cancel-add-btn'),
    // confirmAddBtn is dom.addBtn (reused ID)
    openAddModalBtn: document.getElementById('open-add-modal-btn'),
    
    // Recipes Elements
    recipesBtn: document.getElementById('recipes-btn'),
    recipesModal: document.getElementById('recipes-modal'),
    recipesModalContent: document.getElementById('recipes-modal-content'),
    recipesModalTitle: document.getElementById('recipes-modal-title'),
    closeRecipesModalBtn: document.getElementById('close-recipes-modal-btn'),
    recipesList: document.getElementById('recipes-list'),
    openNewRecipeModalBtn: document.getElementById('open-new-recipe-modal-btn'),
    
    newRecipeModal: document.getElementById('new-recipe-modal'),
    newRecipeModalContent: document.getElementById('new-recipe-modal-content'),
    newRecipeModalTitle: document.getElementById('new-recipe-modal-title'),
    recipeNameInput: document.getElementById('recipe-name-input'),
    recipeIngredientsList: document.getElementById('recipe-ingredients-list'),
    addIngredientBtn: document.getElementById('add-ingredient-btn'),
    cancelRecipeBtn: document.getElementById('cancel-recipe-btn'),
    saveRecipeBtn: document.getElementById('save-recipe-btn'),

    // Search
    searchInput: document.getElementById('search-input'),

    // Edit Modal
    editModal: document.getElementById('edit-modal'),
    editModalContent: document.getElementById('edit-modal-content'),
    editModalTitle: document.getElementById('edit-modal-title'),
    editNameInput: document.getElementById('edit-name-input'),
    editCategorySelect: document.getElementById('edit-category-select'), // Now a hidden input
    editCategoryDropdownBtn: document.getElementById('edit-category-dropdown-btn'),
    editCategoryDropdownMenu: document.getElementById('edit-category-dropdown-menu'),
    editSelectedCategoryDisplay: document.getElementById('edit-selected-category-display'),
    editPriceInput: document.getElementById('edit-price-input'),
    editQuantityInput: document.getElementById('edit-quantity-input'),
    editUnitInput: document.getElementById('edit-unit-input'),
    editUnitDropdownBtn: document.getElementById('edit-unit-dropdown-btn'),
    editUnitDropdownMenu: document.getElementById('edit-unit-dropdown-menu'),
    editSelectedUnitDisplay: document.getElementById('edit-selected-unit-display'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    saveEditBtn: document.getElementById('save-edit-btn'),
    // Modal Category
    addCategoryModal: document.getElementById('add-category-modal'),
    addCategoryModalContent: document.getElementById('add-category-modal-content'),
    addCategoryModalTitle: document.getElementById('add-category-modal-title'),
    newCategoryInput: document.getElementById('new-category-input'),
    cancelCategoryBtn: document.getElementById('cancel-category-btn'),
    confirmCategoryBtn: document.getElementById('confirm-category-btn'),
    // Finish Shopping
    finishShopBtn: document.getElementById('finish-shop-btn'),
    finishModal: document.getElementById('finish-modal'),
    finishModalContent: document.getElementById('finish-modal-content'),
    finishModalTitle: document.getElementById('finish-modal-title'),
    finishModalText: document.getElementById('finish-modal-text'),
    cancelFinishBtn: document.getElementById('cancel-finish-btn'),
    confirmFinishBtn: document.getElementById('confirm-finish-btn'),
    // Settings
    settingsBtn: document.getElementById('settings-btn'),
    settingsModal: document.getElementById('settings-modal'),
    settingsModalContent: document.getElementById('settings-modal-content'),
    settingsModalTitle: document.getElementById('settings-modal-title'),
    themeOptionsContainer: document.getElementById('theme-options-container'), // NEW
    appVersion: document.getElementById('app-version'), // NEW
    // settingsAppName removed
    settingsTutorialContainer: document.getElementById('settings-tutorial-container'),
    settingsTutorialToggle: document.getElementById('settings-tutorial-toggle'),
    settingsTutorialKnob: document.getElementById('settings-tutorial-knob'),
    settingsTutorialLabel: document.getElementById('settings-tutorial-label'),

    settingsRoundContainer: document.getElementById('settings-round-container'),
    settingsRoundToggle: document.getElementById('settings-round-toggle'),
    settingsRoundKnob: document.getElementById('settings-round-knob'),
    settingsRoundLabel: document.getElementById('settings-round-label'),
    // Suggestions Settings
    settingsSuggestionsContainer: document.getElementById('settings-suggestions-container'),
    settingsSuggestionsToggle: document.getElementById('settings-suggestions-toggle'),
    settingsSuggestionsKnob: document.getElementById('settings-suggestions-knob'),
    settingsSuggestionsLabel: document.getElementById('settings-suggestions-label'),
    
    // labelAppName removed
    cancelSettingsBtn: document.getElementById('cancel-settings-btn'),
    saveSettingsBtn: document.getElementById('save-settings-btn'),
    
    // Suggestions Dropdown
    suggestionsDropdown: document.getElementById('suggestions-dropdown'),

    // Confirmation Settings Elements
    settingsConfirmationsTitle: document.getElementById('settings-confirmations-title'),
    settingsConfirmBudgetContainer: document.getElementById('settings-confirm-budget-container'),
    settingsConfirmBudgetToggle: document.getElementById('settings-confirm-budget-toggle'),
    settingsConfirmBudgetKnob: document.getElementById('settings-confirm-budget-knob'),
    settingsConfirmBudgetLabel: document.getElementById('settings-confirm-budget-label'),

    settingsConfirmItemContainer: document.getElementById('settings-confirm-item-container'),
    settingsConfirmItemToggle: document.getElementById('settings-confirm-item-toggle'),
    settingsConfirmItemKnob: document.getElementById('settings-confirm-item-knob'),
    settingsConfirmItemLabel: document.getElementById('settings-confirm-item-label'),

    settingsConfirmSuggestionContainer: document.getElementById('settings-confirm-suggestion-container'),
    settingsConfirmSuggestionToggle: document.getElementById('settings-confirm-suggestion-toggle'),
    settingsConfirmSuggestionKnob: document.getElementById('settings-confirm-suggestion-knob'),
    settingsConfirmSuggestionLabel: document.getElementById('settings-confirm-suggestion-label'),

    settingsConfirmFinishContainer: document.getElementById('settings-confirm-finish-container'),
    settingsConfirmFinishToggle: document.getElementById('settings-confirm-finish-toggle'),
    settingsConfirmFinishKnob: document.getElementById('settings-confirm-finish-knob'),
    settingsConfirmFinishLabel: document.getElementById('settings-confirm-finish-label'),

    // Delete Suggestion Modal
    deleteSuggestionModal: document.getElementById('delete-suggestion-modal'),
    deleteSuggestionModalContent: document.getElementById('delete-suggestion-modal-content'),
    deleteSuggestionModalTitle: document.getElementById('delete-suggestion-modal-title'),
    deleteSuggestionModalText: document.getElementById('delete-suggestion-modal-text'),
    cancelDeleteSuggestionBtn: document.getElementById('cancel-delete-suggestion-btn'),
    confirmDeleteSuggestionBtn: document.getElementById('confirm-delete-suggestion-btn'),
    
    // New Budget Modal
    newBudgetModal: document.getElementById('new-budget-modal'),
    newBudgetModalContent: document.getElementById('new-budget-modal-content'),
    newBudgetModalTitle: document.getElementById('new-budget-modal-title'),
    newBudgetName: document.getElementById('new-budget-name'),
    newBudgetLimit: document.getElementById('new-budget-limit'),
    cancelNewBudgetBtn: document.getElementById('cancel-new-budget-btn'),
    createBudgetBtn: document.getElementById('create-budget-btn'),
    openNewBudgetModalBtn: document.getElementById('open-new-budget-modal-btn'),

    // Edit Hub Budget Modal
    editHubBudgetModal: document.getElementById('edit-hub-budget-modal'),
    editHubBudgetModalContent: document.getElementById('edit-hub-budget-modal-content'),
    editHubBudgetModalTitle: document.getElementById('edit-hub-budget-modal-title'),
    editHubBudgetName: document.getElementById('edit-hub-budget-name'),
    editHubBudgetLimit: document.getElementById('edit-hub-budget-limit'),
    cancelEditHubBudgetBtn: document.getElementById('cancel-edit-hub-budget-btn'),
    saveEditHubBudgetBtn: document.getElementById('save-edit-hub-budget-btn'),
    
    // Hub Theme Elements
    hubTitle: document.getElementById('hub-title'),
    hubSubtitle: document.getElementById('hub-subtitle'),

    // Delete Budget Modal
    deleteBudgetModal: document.getElementById('delete-budget-modal'),
    deleteBudgetModalContent: document.getElementById('delete-budget-modal-content'),
    deleteBudgetModalTitle: document.getElementById('delete-budget-modal-title'),
    deleteBudgetModalText: document.getElementById('delete-budget-modal-text'),
    cancelDeleteBudgetBtn: document.getElementById('cancel-delete-budget-btn'),
    confirmDeleteBudgetBtn: document.getElementById('confirm-delete-budget-btn'),

    // Tutorial Elements
    tutorialBtn: document.getElementById('tutorial-btn'),
    tutorialModal: document.getElementById('tutorial-modal'),
    tutorialModalContent: document.getElementById('tutorial-modal-content'),
    tutorialModalTitle: document.getElementById('tutorial-modal-title'),
    tutorialModalText: document.getElementById('tutorial-modal-text'),
    closeTutorialBtn: document.getElementById('close-tutorial-btn'),
    okTutorialBtn: document.getElementById('ok-tutorial-btn')
};

// --- LÓGICA DE NEGÓCIO E UI ---

function formatCurrency(value) {
    if (state.roundValues) {
        return Math.round(value).toFixed(0);
    }
    return value.toFixed(2);
}

function renderThemeOptions() {
    if (!dom.themeOptionsContainer || typeof CONFIG === 'undefined' || !CONFIG.COLORS) return;
    
    dom.themeOptionsContainer.innerHTML = '';
    
    Object.entries(CONFIG.COLORS).forEach(([key, color]) => {
        const btn = document.createElement('button');
        btn.onclick = () => setTheme(key);
        
        // Base classes
        let classes = 'w-8 h-8 rounded-full hover:ring-2 ring-offset-2 transition-all';
        
        // Add color class if exists
        if (color.class) {
            classes += ` ${color.class}`;
        }
        
        btn.className = classes;
        btn.title = color.name;
        
        // Add inline styles for hex (always prioritize hex to avoid theme override issues)
        if (color.hex) {
             btn.style.backgroundColor = color.hex;
        }
        if (color.ring) {
            btn.style.setProperty('--tw-ring-color', color.ring);
        }
        
        dom.themeOptionsContainer.appendChild(btn);
    });
}

async function init() {
    // Set Version
    if (dom.appVersion && typeof CONFIG !== 'undefined' && CONFIG.VERSION) {
        dom.appVersion.textContent = CONFIG.VERSION;
    }

    // Render Theme Options
    renderThemeOptions();

    const loadingOverlay = document.getElementById('loading-overlay');
    const progressBar = document.getElementById('loading-progress');
    const offlineWarning = document.getElementById('offline-warning');
    
    // Start progress animation
    if (progressBar) {
        // Small delay to ensure DOM is ready for transition
        setTimeout(() => {
            progressBar.style.width = '95%'; // Go to 95% over 3 minutes
        }, 100);
    }
    
    let retries = 0;
    const maxRetries = 3;

    // Loop until API connects
    while (true) {
        if (!navigator.onLine) {
            console.log('Offline detected. Skipping API fetch.');
            break;
        }

        try {
            // Carregar orçamentos
            const budgets = await apiService.fetchBudgets();
            state.budgets = budgets;

            // Carregar produtos (sugestões)
            state.products = await apiService.fetchProducts();
            // updateProductDatalist(); // Removed in favor of custom dropdown

            break; // Success!
        } catch (e) {
            console.log('Aguardando API...', e);
            retries++;
            if (retries >= maxRetries) {
                console.log('Max retries reached. Entering offline mode.');
                break;
            }
            await new Promise(r => setTimeout(r, 2000)); // Retry every 2s
        }
    }
    
    // Check if offline or failed
    if (!navigator.onLine || retries >= maxRetries) {
        if (offlineWarning) offlineWarning.classList.remove('hidden');
        // Initialize with empty state or cached data if implemented
        state.budgets = []; 
        state.products = [];
    }

    // Load Recipes
    loadRecipes();

    // Finish progress
    if (progressBar) {
        progressBar.style.transition = 'width 0.5s ease-out'; // Fast finish
        progressBar.style.width = '100%';
    }
    
    // Hide loading
    if (loadingOverlay) {
        // Wait for the fast finish
        await new Promise(r => setTimeout(r, 500));
        loadingOverlay.classList.add('opacity-0');
        setTimeout(() => loadingOverlay.classList.add('hidden'), 500);
    }
    
    renderAll();

    // Show Tutorial if enabled
    if (state.showTutorialOnStart) {
        openTutorialModal();
    }
}

function syncLocalState() {
    if (!state.activeBudgetId) return;
    const budgetIndex = state.budgets.findIndex(b => b.id === state.activeBudgetId);
    if (budgetIndex !== -1) {
        state.budgets[budgetIndex].items = state.items;
        state.budgets[budgetIndex].categories = state.categories;
        state.budgets[budgetIndex].title = state.budgetTitle;
        state.budgets[budgetIndex].limit = state.budgetLimit;
    }
}

async function saveActiveBudgetMetadata() {
    syncLocalState();
    
    // Persist metadata to API
    await apiService.updateBudget(state.activeBudgetId, {
        title: state.budgetTitle,
        limit: state.budgetLimit,
        categories: state.categories
    });
}

// --- HUB LOGIC ---

function openHub() {
    state.view = 'hub';
    state.activeBudgetId = null;
    state.shopMode = false; // Reset shop mode when going back to hub
    
    // Hide Share Button
    const shareBtn = document.getElementById('share-btn');
    if(shareBtn) shareBtn.classList.add('hidden');
    
    // Hide Back Button
    if(dom.backToHubBtn) dom.backToHubBtn.classList.add('hidden');

    renderAll();
}

function openDashboard(budgetId) {
    const budget = state.budgets.find(b => b.id === budgetId);
    if (!budget) return;

    state.activeBudgetId = budgetId;
    state.view = 'dashboard';
    
    // Show Share Button
    const shareBtn = document.getElementById('share-btn');
    if(shareBtn) shareBtn.classList.remove('hidden');

    // Show Back Button
    if(dom.backToHubBtn) dom.backToHubBtn.classList.remove('hidden');
    
    // Load budget data into active state
    state.budgetTitle = budget.title;
    state.budgetLimit = budget.limit;
    state.items = budget.items || [];
    state.categories = budget.categories || ['Geral'];
    
    renderAll();
}

function openNewBudgetModal() {
    dom.newBudgetName.value = '';
    dom.newBudgetLimit.value = '';
    // Reset validation styles
    dom.newBudgetName.classList.remove('ring-2', 'ring-rose-500');
    dom.newBudgetLimit.classList.remove('ring-2', 'ring-rose-500');
    dom.newBudgetModal.classList.remove('hidden');
    dom.newBudgetName.focus();
}

function closeNewBudgetModal() {
    dom.newBudgetModal.classList.add('hidden');
}

async function handleCreateBudget() {
    const name = dom.newBudgetName.value.trim();
    const limitValue = dom.newBudgetLimit.value;
    const limit = parseFloat(limitValue);

    // Reset validation
    dom.newBudgetName.classList.remove('ring-2', 'ring-rose-500');
    dom.newBudgetLimit.classList.remove('ring-2', 'ring-rose-500');

    let hasError = false;

    if (!name) {
        dom.newBudgetName.classList.add('ring-2', 'ring-rose-500');
        hasError = true;
    }

    if (!limitValue || isNaN(limit)) {
        dom.newBudgetLimit.classList.add('ring-2', 'ring-rose-500');
        hasError = true;
    }

    if (hasError) return;

    closeNewBudgetModal();

    const newBudget = {
        title: name,
        limit: limit,
        items: [],
        categories: ['Geral']
    };

    const created = await apiService.createBudget(newBudget);
    state.budgets.push(created);
    
    renderAll();
}

let editingBudgetId = null;

function openEditHubBudgetModal(id, event) {
    if(event) event.stopPropagation();
    if (!id || id === 'null' || id === 'undefined') {
        console.error('Tentativa de editar orçamento com ID inválido:', id);
        return;
    }

    const budget = state.budgets.find(b => b.id === id);
    if(!budget) return;

    editingBudgetId = id;
    dom.editHubBudgetName.value = budget.title;
    dom.editHubBudgetLimit.value = budget.limit;
    
    // Reset validation
    dom.editHubBudgetName.classList.remove('ring-2', 'ring-rose-500');
    dom.editHubBudgetLimit.classList.remove('ring-2', 'ring-rose-500');

    dom.editHubBudgetModal.classList.remove('hidden');
    dom.editHubBudgetName.focus();
}

function closeEditHubBudgetModal() {
    editingBudgetId = null;
    dom.editHubBudgetModal.classList.add('hidden');
}

async function handleSaveEditHubBudget() {
    if(!editingBudgetId || editingBudgetId === 'null' || editingBudgetId === 'undefined') return;

    const name = dom.editHubBudgetName.value.trim();
    const limitValue = dom.editHubBudgetLimit.value;
    const limit = parseFloat(limitValue);

     // Reset validation
    dom.editHubBudgetName.classList.remove('ring-2', 'ring-rose-500');
    dom.editHubBudgetLimit.classList.remove('ring-2', 'ring-rose-500');

    let hasError = false;
    if (!name) {
        dom.editHubBudgetName.classList.add('ring-2', 'ring-rose-500');
        hasError = true;
    }
    if (!limitValue || isNaN(limit)) {
        dom.editHubBudgetLimit.classList.add('ring-2', 'ring-rose-500');
        hasError = true;
    }

    if (hasError) return;

    const idToUpdate = editingBudgetId; // Capture ID before closing modal

    const budgetIndex = state.budgets.findIndex(b => b.id === idToUpdate);
    if(budgetIndex !== -1) {
        // Preserve existing properties (items, categories, etc)
        const updatedBudget = { 
            ...state.budgets[budgetIndex], 
            title: name, 
            limit: limit 
        };
        
        // Optimistic
        state.budgets[budgetIndex] = updatedBudget;
        renderHub();
        lucide.createIcons();
        closeEditHubBudgetModal();

        // API
        try {
            await apiService.updateBudget(idToUpdate, { title: name, limit: limit });
        } catch (error) {
            console.error('Failed to update budget:', error);
            // Revert on error if needed, or show alert
        }
    }
}

let budgetToDeleteId = null;

function openDeleteBudgetModal(id) {
    budgetToDeleteId = id;
    
    if (!state.confirmDeleteBudget) {
        confirmDeleteBudget();
        return;
    }

    dom.deleteBudgetModal.classList.remove('hidden');
}

function closeDeleteBudgetModal() {
    budgetToDeleteId = null;
    dom.deleteBudgetModal.classList.add('hidden');
}

async function confirmDeleteBudget() {
    if (budgetToDeleteId) {
        const id = budgetToDeleteId;
        closeDeleteBudgetModal();
        
        // Optimistic update
        state.budgets = state.budgets.filter(b => b.id !== id);
        renderAll();

        // Call API
        await apiService.deleteBudget(id);
    }
}

async function handleDuplicateBudget(id, e) {
    if (e) e.stopPropagation();
    const budget = state.budgets.find(b => b.id === id);
    if (!budget) return;

    const newBudget = {
        title: `${budget.title} (Cópia)`,
        limit: budget.limit,
        items: budget.items.map(item => ({ ...item, checked: false })),
        categories: budget.categories
    };

    try {
        const created = await apiService.createBudget(newBudget);
        state.budgets.push(created);
        renderAll();
    } catch (error) {
        console.error('Erro ao duplicar:', error);
        alert('Erro ao duplicar orçamento.');
    }
}

async function handleDeleteBudget(id, e) {
    if (e) e.stopPropagation();
    openDeleteBudgetModal(id);
}

// --- RENDERIZAÇÃO ---

function renderHub() {
    const grid = dom.hubGrid;
    grid.innerHTML = '';
    const isDark = state.theme === 'dark';

    state.budgets.forEach(budget => {
        if (!budget || !budget.id) return; // Skip invalid budgets

        const totalSpent = (budget.items || []).reduce((acc, item) => acc + (item.checked ? (item.price * (item.quantity || 1)) : 0), 0);
        const progress = Math.min((totalSpent / budget.limit) * 100, 100);
        
        const card = document.createElement('div');
        card.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-700 hover:border-indigo-500 transition-all cursor-pointer group relative'
            : 'bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-300 transition-all cursor-pointer group relative';
        
        card.onclick = () => openDashboard(budget.id);

        card.innerHTML = `
            <div class="flex justify-between items-start mb-4">
                <div class="p-3 rounded-xl ${isDark ? 'bg-gray-700 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} group-hover:scale-110 transition-transform">
                    <i data-lucide="shopping-bag" class="w-6 h-6"></i>
                </div>
                <div class="flex gap-1">
                    <button onclick="openEditHubBudgetModal('${budget.id}', event)" class="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 transition-colors" title="Editar">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="handleDuplicateBudget('${budget.id}', event)" class="p-2 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-slate-100 transition-colors" title="Duplicar">
                        <i data-lucide="copy" class="w-4 h-4"></i>
                    </button>
                    <button onclick="handleDeleteBudget('${budget.id}', event)" class="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors" title="Excluir">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
            
            <h3 class="text-lg font-bold mb-1 truncate ${isDark ? 'text-white' : 'text-slate-800'}" title="${budget.title}">${budget.title}</h3>
            <p class="text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'} mb-6">R$ ${formatCurrency(totalSpent)} / R$ ${formatCurrency(budget.limit)}</p>
            
            <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-slate-100'}">
                <div class="h-2 rounded-full ${progress > 90 ? 'bg-red-500' : 'bg-green-500'} transition-all" style="width: ${progress}%"></div>
            </div>
        `;
        grid.appendChild(card);
    });

    // Create New Card
    const createCard = document.createElement('div');
    createCard.className = isDark
        ? 'bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center text-gray-500 hover:text-indigo-400 hover:border-indigo-500 hover:bg-gray-800 transition-all cursor-pointer min-h-[200px]'
        : 'bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-white transition-all cursor-pointer min-h-[200px]';
    
    createCard.onclick = openNewBudgetModal;
    createCard.innerHTML = `
        <div class="p-4 rounded-full bg-slate-100 mb-4 group-hover:bg-indigo-50 transition-colors ${isDark ? 'bg-gray-700' : ''}">
            <i data-lucide="plus" class="w-6 h-6"></i>
        </div>
        <span class="font-medium">Criar Novo Orçamento</span>
    `;
    grid.appendChild(createCard);
}



function renderCategories() {
    const menu = dom.categoryDropdownMenu;
    const currentValue = dom.inputCategory.value;
    const isDark = state.theme === 'dark' || state.shopMode;
    const isShop = state.shopMode;
    menu.innerHTML = '';
    
    state.categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = isDark 
            ? 'px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-300 transition-colors flex items-center justify-between group'
            : 'px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-600 transition-colors flex items-center justify-between group';
        
        // Content wrapper
        const content = document.createElement('div');
        content.className = 'flex items-center gap-2 min-w-0 flex-1';
        
        const dotColor = isShop ? 'bg-shop-500' : 'bg-indigo-500';
        content.innerHTML = `<span class="w-2 h-2 rounded-full ${dotColor} flex-shrink-0"></span><span class="truncate" title="${cat}">${cat}</span>`;
        
        item.appendChild(content);

        // Delete button (only for non-Geral)
        if (cat !== 'Geral') {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1';
            deleteBtn.innerHTML = '<i data-lucide="trash-2" class="w-3 h-3"></i>';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                openDeleteCategoryModal(cat);
            };
            item.appendChild(deleteBtn);
        }

        item.onclick = () => selectCategory(cat);
        menu.appendChild(item);
    });
    
    // Divider
    const divider = document.createElement('div');
    divider.className = isDark ? 'h-px bg-gray-700 my-1' : 'h-px bg-slate-100 my-1';
    menu.appendChild(divider);

    // Opção para adicionar nova
    const newItem = document.createElement('div');
    let newItemClass = '';
    
    if (isShop) {
        newItemClass = isDark
            ? 'px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-shop-400 font-medium transition-colors flex items-center gap-2'
            : 'px-4 py-2 hover:bg-shop-50 cursor-pointer text-sm text-shop-600 font-medium transition-colors flex items-center gap-2';
    } else {
        newItemClass = isDark
            ? 'px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-indigo-400 font-medium transition-colors flex items-center gap-2'
            : 'px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-indigo-600 font-medium transition-colors flex items-center gap-2';
    }
    
    newItem.className = newItemClass;
    newItem.innerHTML = `<i data-lucide="plus" class="w-4 h-4"></i> Nova Categoria...`;
    newItem.onclick = () => {
        toggleCategoryDropdown();
        openAddCategoryModal();
    };
    menu.appendChild(newItem);

    // Restaurar valor se possível, senão Geral
    if (state.categories.includes(currentValue)) {
        selectCategory(currentValue, false);
    } else {
        selectCategory('Geral', false);
    }
    
    lucide.createIcons();
}

function toggleCategoryDropdown() {
    if (!dom.categoryDropdownMenu) return;
    dom.categoryDropdownMenu.classList.toggle('hidden');
    
    if (dom.categoryDropdownBtn) {
        const icon = dom.categoryDropdownBtn.querySelector('i') || dom.categoryDropdownBtn.querySelector('svg');
        if (icon) {
            if (dom.categoryDropdownMenu.classList.contains('hidden')) {
                icon.style.transform = 'rotate(0deg)';
            } else {
                icon.style.transform = 'rotate(180deg)';
            }
        }
    }
}

function selectCategory(cat, close = true) {
    dom.inputCategory.value = cat;
    dom.selectedCategoryDisplay.textContent = cat;
    if (close) toggleCategoryDropdown();
}

function renderUnitDropdown() {
    const menu = dom.unitDropdownMenu;
    if (!menu) return;
    
    const units = ['un', 'kg', 'g', 'L', 'ml', 'cx', 'pct'];
    const currentValue = dom.inputUnit ? dom.inputUnit.value : 'un';
    const isDark = state.theme === 'dark' || state.shopMode;
    menu.innerHTML = '';
    
    units.forEach(unit => {
        const item = document.createElement('div');
        item.className = isDark 
            ? 'px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-300 transition-colors text-center'
            : 'px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-600 transition-colors text-center';
        
        item.textContent = unit;
        item.onclick = () => selectUnit(unit);
        menu.appendChild(item);
    });

    // Restore value
    if (units.includes(currentValue)) {
        selectUnit(currentValue, false);
    } else {
        selectUnit('un', false);
    }
}

function toggleUnitDropdown() {
    if (!dom.unitDropdownMenu) return;
    dom.unitDropdownMenu.classList.toggle('hidden');
    
    if (dom.unitDropdownBtn) {
        const icon = dom.unitDropdownBtn.querySelector('i') || dom.unitDropdownBtn.querySelector('svg');
        if (icon) {
            if (dom.unitDropdownMenu.classList.contains('hidden')) {
                icon.style.transform = 'rotate(0deg)';
            } else {
                icon.style.transform = 'rotate(180deg)';
            }
        }
    }
}

function selectUnit(unit, close = true) {
    if(dom.inputUnit) dom.inputUnit.value = unit;
    if(dom.selectedUnitDisplay) dom.selectedUnitDisplay.textContent = unit;
    if (close) toggleUnitDropdown();
}

// --- EDIT MODAL DROPDOWNS ---

function renderEditCategories() {
    const menu = dom.editCategoryDropdownMenu;
    if (!menu) return;
    
    const currentValue = dom.editCategorySelect.value;
    const isDark = state.theme === 'dark'; // Edit modal always follows theme, not shop mode
    menu.innerHTML = '';
    
    state.categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = isDark 
            ? 'px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-300 transition-colors flex items-center justify-between group'
            : 'px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-600 transition-colors flex items-center justify-between group';
        
        const content = document.createElement('div');
        content.className = 'flex items-center gap-2 min-w-0 flex-1';
        content.innerHTML = `<span class="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></span><span class="truncate" title="${cat}">${cat}</span>`;
        item.appendChild(content);

        item.onclick = () => selectEditCategory(cat);
        menu.appendChild(item);
    });

    if (state.categories.includes(currentValue)) {
        selectEditCategory(currentValue, false);
    } else {
        selectEditCategory('Geral', false);
    }
}

function toggleEditCategoryDropdown() {
    if (!dom.editCategoryDropdownMenu) return;
    dom.editCategoryDropdownMenu.classList.toggle('hidden');
    
    if (dom.editCategoryDropdownBtn) {
        const icon = dom.editCategoryDropdownBtn.querySelector('i') || dom.editCategoryDropdownBtn.querySelector('svg');
        if (icon) {
            if (dom.editCategoryDropdownMenu.classList.contains('hidden')) {
                icon.style.transform = 'rotate(0deg)';
            } else {
                icon.style.transform = 'rotate(180deg)';
            }
        }
    }
}

function selectEditCategory(cat, close = true) {
    dom.editCategorySelect.value = cat;
    dom.editSelectedCategoryDisplay.textContent = cat;
    if (close) toggleEditCategoryDropdown();
}

function renderEditUnitDropdown() {
    const menu = dom.editUnitDropdownMenu;
    if (!menu) return;
    
    const units = ['un', 'kg', 'g', 'L', 'ml', 'cx', 'pct'];
    const currentValue = dom.editUnitInput ? dom.editUnitInput.value : 'un';
    const isDark = state.theme === 'dark';
    menu.innerHTML = '';
    
    units.forEach(unit => {
        const item = document.createElement('div');
        item.className = isDark 
            ? 'px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-300 transition-colors text-center'
            : 'px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-600 transition-colors text-center';
        
        item.textContent = unit;
        item.onclick = () => selectEditUnit(unit);
        menu.appendChild(item);
    });

    if (units.includes(currentValue)) {
        selectEditUnit(currentValue, false);
    } else {
        selectEditUnit('un', false);
    }
}

function toggleEditUnitDropdown() {
    if (!dom.editUnitDropdownMenu) return;
    dom.editUnitDropdownMenu.classList.toggle('hidden');
    
    if (dom.editUnitDropdownBtn) {
        const icon = dom.editUnitDropdownBtn.querySelector('i') || dom.editUnitDropdownBtn.querySelector('svg');
        if (icon) {
            if (dom.editUnitDropdownMenu.classList.contains('hidden')) {
                icon.style.transform = 'rotate(0deg)';
            } else {
                icon.style.transform = 'rotate(180deg)';
            }
        }
    }
}

function selectEditUnit(unit, close = true) {
    if(dom.editUnitInput) dom.editUnitInput.value = unit;
    if(dom.editSelectedUnitDisplay) dom.editSelectedUnitDisplay.textContent = unit;
    if (close) toggleEditUnitDropdown();
}

function renderAll() {
    // View Switching
    if (state.view === 'hub') {
        dom.hubSection.classList.remove('hidden');
        dom.dashboardSection.classList.add('hidden');
        dom.backToHubBtn.classList.add('hidden');
        renderHub();
    } else {
        dom.hubSection.classList.add('hidden');
        dom.dashboardSection.classList.remove('hidden');
        dom.backToHubBtn.classList.remove('hidden');
        
        renderStats();
        renderList();
    }

    renderHeaderInfo();
    updateTheme();
    lucide.createIcons();
}

function renderHeaderInfo() {
    const titleEl = dom.header.querySelector('h1');
    const sloganEl = dom.modeText;
    
    if (titleEl) titleEl.textContent = state.appName;
    if (sloganEl && !state.shopMode) sloganEl.textContent = state.appSlogan;
}

function renderStats() {
    const totalEstimated = state.items.reduce((acc, curr) => acc + (curr.price * (curr.quantity || 1)), 0);
    const totalInCart = state.items.filter(i => i.checked).reduce((acc, curr) => acc + (curr.price * (curr.quantity || 1)), 0);
    const remaining = state.budgetLimit - totalInCart;
    const rawProgress = (totalInCart / state.budgetLimit) * 100;
    const progress = Math.min(rawProgress, 100);
    const remainingCount = state.items.filter(i => !i.checked).length;

    // Atualiza Dashboard
    if (dom.budgetTitleDisplay) dom.budgetTitleDisplay.textContent = state.budgetTitle;
    dom.budgetDisplay.innerHTML = `R$ ${formatCurrency(totalInCart)} <span class="text-base font-normal opacity-60">/ R$ ${state.budgetLimit}</span>`;
    dom.progressBar.style.width = `${progress}%`;
    
    // Smart Progress Bar Colors
    let colorClass = 'bg-emerald-500';
    if (rawProgress > 100) colorClass = 'bg-purple-600 animate-pulse shadow-[0_0_10px_rgba(147,51,234,0.5)]';
    else if (rawProgress > 85) colorClass = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]';
    else if (rawProgress > 50) colorClass = 'bg-amber-500';

    dom.progressBar.className = `h-3 rounded-full transition-all duration-1000 ${colorClass}`;
    
    dom.estimatedTotal.textContent = `Est: R$ ${formatCurrency(totalEstimated)}`;
    dom.remainingBudget.textContent = `Resta: R$ ${formatCurrency(remaining)}`;

    // Atualiza Footer (Modo Loja)
    dom.footerTotal.textContent = `R$ ${formatCurrency(totalInCart)}`;
    dom.footerRemainingCount.textContent = remainingCount;
}

function handleSort(value) {
    state.sortBy = value;
    renderList();
}

function toggleSortDropdown() {
    const menu = document.getElementById('sort-dropdown-menu');
    if (!menu) return;
    menu.classList.toggle('hidden');
}

function selectSort(value, text) {
    state.sortBy = value;
    document.getElementById('selected-sort-display').textContent = text;
    toggleSortDropdown();
    renderList();
}

function renderList() {
    dom.itemsContainer.innerHTML = '';

    // Filter items based on search term
    let filteredItems = state.items;
    if (state.searchTerm) {
        const term = state.searchTerm.toLowerCase();
        filteredItems = state.items.filter(item => 
            item.name.toLowerCase().includes(term) || 
            item.category.toLowerCase().includes(term)
        );
    }

    if (filteredItems.length === 0) {
        if (state.searchTerm) {
            dom.itemsContainer.innerHTML = `
                <div class="text-center py-12 opacity-50">
                    <i data-lucide="search-x" class="mx-auto mb-3 w-12 h-12"></i>
                    <p>Nenhum item encontrado para "${state.searchTerm}".</p>
                </div>`;
        } else {
            dom.itemsContainer.innerHTML = `
                <div class="text-center py-12 opacity-50">
                    <i data-lucide="shopping-cart" class="mx-auto mb-3 w-12 h-12"></i>
                    <p>Sua lista está vazia.</p>
                </div>`;
        }
        return;
    }

    // Sorting
    let itemsToSort = [...filteredItems];
    const sortType = state.sortBy || 'default';

    if (sortType === 'price-desc') {
        itemsToSort.sort((a, b) => b.price - a.price);
    } else if (sortType === 'price-asc') {
        itemsToSort.sort((a, b) => a.price - b.price);
    } else if (sortType === 'name-asc') {
        itemsToSort.sort((a, b) => a.name.localeCompare(b.name));
    }

    // Agrupar
    const groups = {};
    // Ensure groups follow state.categories order
    state.categories.forEach(cat => {
        groups[cat] = [];
    });
    
    // Fill groups
    itemsToSort.forEach(item => {
        if (!groups[item.category]) {
            // Fallback for items with categories not in the list (shouldn't happen but safe)
            if(!groups['Outros']) groups['Outros'] = [];
            groups['Outros'].push(item);
        } else {
            groups[item.category].push(item);
        }
    });

    // Gerar HTML
    // Iterate over state.categories to maintain order
    const categoriesToRender = [...state.categories];
    if(groups['Outros'] && groups['Outros'].length > 0) categoriesToRender.push('Outros');

    categoriesToRender.forEach((category, index) => {
        const items = groups[category] || [];
        
        // Skip empty categories logic
        // If searching, only show categories with matches
        if (state.searchTerm && items.length === 0) return;

        // Default skip logic
        if (!state.searchTerm && state.categories.length > 1 && items.length === 0) return;
        
        // If shop mode and empty, definitely skip
        if (state.shopMode && items.length === 0) return;

        const groupDiv = document.createElement('div');
        const isShopMode = state.shopMode;
        const isDark = state.theme === 'dark';
        
        // Estilos base do container do grupo
        const containerClass = isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-slate-100';
        
        const headerClass = isDark
            ? 'bg-gray-700 text-gray-300'
            : 'bg-slate-50 text-slate-500';

        groupDiv.className = `${containerClass} rounded-xl shadow-sm border overflow-hidden transition-colors duration-500 mb-6`;

        let itemsHtml = '';
        items.forEach(item => {
            const checkedClass = item.checked 
                ? (isDark ? 'opacity-30 bg-gray-800' : 'opacity-40 bg-slate-50')
                : '';
            
            const textClass = item.checked ? 'line-through' : '';
            const textColor = isDark ? 'text-white' : 'text-slate-800';
            const hoverClass = isDark ? 'hover:bg-gray-700' : 'hover:bg-slate-50';
            const borderClass = isDark ? 'border-gray-700' : 'border-slate-50';

            // Check circle style
            let circleStyle = '';
            if (item.checked) {
                circleStyle = 'bg-green-500 border-green-500 scale-110';
            } else {
                circleStyle = isDark ? 'border-gray-500' : 'border-slate-300 group-hover:border-indigo-400';
            }

            // Calculate total for this item line
            const qty = item.quantity || 1;
            const unit = item.unit || 'un';
            const totalItemPrice = (item.price || 0) * qty;

            // Display Quantity Logic
            let qtyDisplay = '';
            if (unit === 'un') {
                if (qty > 1) qtyDisplay = `<span class="text-indigo-500 font-bold mr-1">${qty}x</span>`;
            } else {
                qtyDisplay = `<span class="text-indigo-500 font-bold mr-1">${qty}${unit}</span>`;
            }

            // Delete button logic (Hide in shop mode unless necessary, here hiding for simplicity)
            const deleteBtn = isShopMode 
                ? (totalItemPrice > 0 ? `<span class="text-gray-400 font-mono">R$${formatCurrency(totalItemPrice)}</span>` : '')
                : `<div class="flex items-center gap-2">
                    <div class="text-right mr-2">
                        <span class="text-slate-600 font-medium text-sm block">${totalItemPrice > 0 ? 'R$ ' + formatCurrency(totalItemPrice) : ''}</span>
                        ${qty > 1 ? `<span class="text-xs text-slate-400 block">${qty}${unit} R$ ${formatCurrency(item.price)}</span>` : ''}
                    </div>
                    <button onclick="event.stopPropagation(); openEditModal('${item.id}')" class="text-slate-300 hover:text-indigo-500 p-2 transition-colors" title="Editar">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button onclick="handleDelete('${item.id}', event)" class="text-slate-300 hover:text-red-500 p-2 transition-colors" title="Excluir">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                   </div>`;

            itemsHtml += `
                <div onclick="handleToggle('${item.id}')" class="group flex items-center justify-between p-4 cursor-pointer transition-all border-b last:border-0 ${borderClass} ${hoverClass} ${checkedClass}">
                    <div class="flex items-center gap-4 min-w-0 flex-1">
                        <div class="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${circleStyle}">
                            ${item.checked ? '<i data-lucide="check" class="text-white w-3 h-3"></i>' : ''}
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="font-medium transition-all truncate ${textClass} ${textColor} ${isShopMode ? 'text-lg' : ''}" title="${item.name}">
                                ${qtyDisplay}
                                ${item.name}
                            </p>
                            ${!isShopMode && item.price > 0 ? `<p class="text-xs text-slate-400 mt-0.5">Est: R$ ${formatCurrency(totalItemPrice)}</p>` : ''}
                        </div>
                    </div>
                    <div class="flex-shrink-0 ml-2">
                        ${deleteBtn}
                    </div>
                </div>
            `;
        });

        // Category Header with Reordering
        let reorderControls = '';
        if (!isShopMode && category !== 'Outros') {
            const isFirst = index === 0;
            const isLast = index === state.categories.length - 1;
            
            reorderControls = `
                <div class="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    ${!isFirst ? `<button onclick="moveCategory('${category}', -1)" class="p-1 hover:bg-black/10 rounded text-current" title="Mover para cima"><i data-lucide="arrow-up" class="w-3 h-3"></i></button>` : ''}
                    ${!isLast ? `<button onclick="moveCategory('${category}', 1)" class="p-1 hover:bg-black/10 rounded text-current" title="Mover para baixo"><i data-lucide="arrow-down" class="w-3 h-3"></i></button>` : ''}
                </div>
            `;
        }

        groupDiv.innerHTML = `
            <div class="px-4 py-2 text-xs font-bold uppercase tracking-wider flex justify-between items-center ${headerClass} group">
                <div class="flex items-center">
                    <span>${category}</span>
                    ${reorderControls}
                </div>
                <span class="opacity-60">${items.length} itens</span>
            </div>
            <div>${itemsHtml}</div>
        `;

        dom.itemsContainer.appendChild(groupDiv);
    });
}

function updateTheme() {
    const isShop = state.shopMode;
    const isDark = state.theme === 'dark';

    // Body
    dom.body.className = isDark 
        ? 'bg-gray-900 text-white min-h-screen transition-colors duration-500' 
        : 'bg-slate-50 text-slate-800 min-h-screen transition-colors duration-500';

    // Header
    dom.header.className = isDark
        ? 'px-6 py-4 flex justify-between items-center border-b border-gray-800 bg-gray-900 transition-colors duration-500'
        : 'px-6 py-4 flex justify-between items-center border-b bg-white border-slate-200 shadow-sm sticky top-0 z-10 transition-colors duration-500';

    // Back to Hub Button
    if (dom.backToHubBtn) {
        dom.backToHubBtn.className = isDark
            ? 'hidden p-2 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors mr-2' + (state.view === 'dashboard' ? ' block' : '')
            : 'hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors mr-2' + (state.view === 'dashboard' ? ' block' : '');
        
        if (state.view === 'dashboard') dom.backToHubBtn.classList.remove('hidden');
        else dom.backToHubBtn.classList.add('hidden');
    }

    // Logo Icon Bg
    if (isShop) {
        dom.logoIconBg.className = 'p-2 rounded-lg bg-shop-500 text-white transition-colors duration-500';
    } else {
        dom.logoIconBg.className = isDark 
            ? 'p-2 rounded-lg bg-indigo-600 text-white transition-colors duration-500'
            : 'p-2 rounded-lg bg-indigo-100 text-indigo-700 transition-colors duration-500';
    }

    // Logo Icon
    dom.logoIcon.setAttribute('data-lucide', isShop ? 'shopping-cart' : 'layout-dashboard');

    // Header Texts
    dom.modeText.textContent = isShop ? 'Modo Supermercado Ativo' : 'Dashboard de Planeamento';
    if (isShop) {
        dom.modeText.className = 'text-xs font-bold text-shop-500 uppercase tracking-wide';
    } else {
        dom.modeText.className = isDark ? 'text-xs text-gray-400' : 'text-xs text-slate-500';
    }

    // Theme Button Icon
    dom.themeBtn.innerHTML = `<i data-lucide="${state.theme === 'dark' ? 'sun' : 'moon'}" class="w-5 h-5"></i>`;
    
    dom.themeBtn.className = isDark
        ? 'p-2 rounded-full text-gray-400 hover:bg-gray-800 transition-colors'
        : 'p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors';

    // Toggle Button
    if (state.view === 'hub') {
        dom.toggleBtn.classList.add('hidden');
    } else {
        dom.toggleBtn.classList.remove('hidden');
        dom.toggleBtn.className = isShop 
            ? 'flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all shadow-md bg-red-500 hover:bg-red-600 text-white'
            : 'flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all shadow-md bg-indigo-600 hover:bg-indigo-700 text-white';
        dom.toggleBtn.innerHTML = isShop 
            ? '<span>Sair do Modo Loja</span>' 
            : '<i data-lucide="shopping-cart" class="w-4 h-4"></i><span>Ir às Compras</span>';
    }

    // Sort Dropdown Button Theme (Green Border in Shop Mode)
    const sortBtn = document.getElementById('sort-dropdown-btn');
    if (sortBtn) {
        if (isShop) {
            sortBtn.className = isDark
                ? 'w-full h-10 bg-gray-700 border-2 border-transparent hover:border-shop-400 focus:border-shop-400 focus:bg-gray-600 focus:outline-none rounded-lg px-4 text-sm text-gray-300 flex items-center justify-between transition-all'
                : 'w-full h-10 bg-slate-50 border-2 border-transparent hover:border-shop-400 focus:border-shop-400 focus:bg-white focus:outline-none rounded-lg px-4 text-sm text-slate-600 flex items-center justify-between transition-all';
        } else {
            sortBtn.className = isDark
                ? 'w-full h-10 bg-gray-700 border-2 border-transparent hover:border-indigo-500 focus:border-indigo-500 focus:bg-gray-600 focus:outline-none rounded-lg px-4 text-sm text-gray-300 flex items-center justify-between transition-all'
                : 'w-full h-10 bg-slate-50 border-2 border-transparent hover:border-indigo-300 focus:border-indigo-300 focus:bg-white focus:outline-none rounded-lg px-4 text-sm text-slate-600 flex items-center justify-between transition-all';
        }
    }

    // HUB THEME
    if (state.view === 'hub') {
        dom.hubTitle.className = isDark ? 'text-2xl font-bold text-white transition-colors' : 'text-2xl font-bold text-slate-800 transition-colors';
        dom.hubSubtitle.className = isDark ? 'text-gray-400 text-sm transition-colors' : 'text-slate-500 text-sm transition-colors';
        
        // Re-render hub to apply card themes
        renderHub();
    }

    // Sidebar Visibility
    if (isShop) {
        dom.sidebar.classList.add('hidden');
        dom.mainSection.classList.remove('lg:col-span-8');
        dom.mainSection.classList.add('lg:col-span-12', 'max-w-2xl', 'mx-auto', 'w-full');
        
        // Hide Action Bar in Shop Mode
        const actionBar = document.getElementById('action-bar');
        if(actionBar) actionBar.classList.add('hidden');

        dom.shopFooter.classList.remove('hidden', 'translate-y-full');
        
        // Shop Footer Theme
        dom.shopFooter.className = isDark
            ? 'fixed bottom-0 left-0 w-full bg-gray-900 border-t border-gray-800 p-4 shadow-lg z-20 transition-transform duration-300'
            : 'fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shadow-lg z-20 transition-transform duration-300';
        
        // Update Footer Total Color
        if(dom.footerTotal) dom.footerTotal.className = 'text-2xl font-bold font-mono text-shop-400';
        
        // Update Finish Button Color
        if(dom.finishShopBtn) dom.finishShopBtn.className = 'bg-shop-600 hover:bg-shop-700 text-white px-6 py-3 rounded-full font-bold shadow-lg transition-colors flex items-center gap-2';

    } else {
        dom.sidebar.classList.remove('hidden');
        dom.mainSection.classList.add('lg:col-span-8');
        dom.mainSection.classList.remove('lg:col-span-12', 'max-w-2xl', 'mx-auto', 'w-full');
        
        // Show Action Bar
        const actionBar = document.getElementById('action-bar');
        if(actionBar) actionBar.classList.remove('hidden');

        dom.shopFooter.classList.add('hidden', 'translate-y-full');
    }

    // Update Budget Card Theme
    if (dom.budgetCard) {
        dom.budgetCard.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-700 transition-colors duration-500'
            : 'bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-colors duration-500';
        
        const budgetTitle = dom.budgetCard.querySelector('h2');
        if(budgetTitle) budgetTitle.className = isDark ? 'text-sm font-semibold text-gray-500 uppercase tracking-wider' : 'text-sm font-semibold text-slate-400 uppercase tracking-wider';
        
        const budgetValue = document.getElementById('budget-display');
        if(budgetValue) budgetValue.className = isDark ? 'text-3xl font-bold text-white mt-1 transition-colors duration-500' : 'text-3xl font-bold text-slate-800 mt-1 transition-colors duration-500';
    
        // Progress Bar Container Theme
        if (dom.progressBarContainer) {
            dom.progressBarContainer.className = isDark
                ? 'w-full bg-gray-700 rounded-full h-3 mb-2 overflow-hidden transition-colors duration-500'
                : 'w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden transition-colors duration-500';
        }
    }

    // Update Add Item Modal Theme
    if (dom.addItemModalContent) {
        dom.addItemModalContent.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-700 transition-colors duration-500'
            : 'bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 transition-colors duration-500';
        
        dom.addItemModalTitle.className = isDark ? 'text-lg font-bold text-white mb-4 transition-colors' : 'text-lg font-bold text-slate-800 mb-4 transition-colors';
        
        let inputClass = '';
        if (isShop) {
            inputClass = isDark
                ? 'w-full h-10 bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-shop-500 rounded-lg text-sm transition-all text-white placeholder-gray-400 font-medium'
                : 'w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-shop-400 rounded-lg text-sm transition-all font-medium';
        } else {
            inputClass = isDark
                ? 'w-full h-10 bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg text-sm transition-all text-white placeholder-gray-400 font-medium'
                : 'w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg text-sm transition-all font-medium';
        }
        
        dom.inputName.className = `${inputClass} pl-9`;
        
        // Update Search Icon in Modal
        const searchIcon = dom.inputName.parentElement.querySelector('i');
        if (searchIcon) {
            if (isShop) {
                searchIcon.className = 'h-4 w-4 text-slate-400 group-focus-within:text-shop-500 transition-colors';
            } else {
                searchIcon.className = 'h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors';
            }
        }

        dom.inputQuantity.className = `${inputClass} px-3`;
        dom.inputPrice.className = `${inputClass} pl-8`;
        
        // Unit Dropdown Theme
        if (dom.unitDropdownBtn) {
            if (isShop) {
                dom.unitDropdownBtn.className = isDark
                    ? 'w-full h-10 bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-shop-500 rounded-lg px-2 text-sm text-gray-300 flex items-center justify-between transition-all font-medium'
                    : 'w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-shop-400 rounded-lg px-2 text-sm text-slate-600 flex items-center justify-between transition-all font-medium';
            } else {
                dom.unitDropdownBtn.className = isDark
                    ? 'w-full h-10 bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-2 text-sm text-gray-300 flex items-center justify-between transition-all font-medium'
                    : 'w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg px-2 text-sm text-slate-600 flex items-center justify-between transition-all font-medium';
            }
            
            dom.unitDropdownMenu.className = isDark
                ? 'hidden absolute top-full right-0 w-24 mt-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-20 max-h-60 overflow-y-auto'
                : 'hidden absolute top-full right-0 w-24 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 max-h-60 overflow-y-auto';
        }

        const labels = dom.addItemModalContent.querySelectorAll('label');
        labels.forEach(label => {
            label.className = isDark ? 'block text-xs font-medium text-gray-400 mb-1' : 'block text-xs font-medium text-slate-500 mb-1';
        });

        if (isShop) {
            dom.addBtn.className = 'px-4 py-2 rounded-lg bg-shop-600 hover:bg-shop-700 text-white font-medium transition-colors flex items-center gap-2';
        } else {
            dom.addBtn.className = 'px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors flex items-center gap-2';
        }

        dom.cancelAddBtn.className = isDark
            ? 'px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors'
            : 'px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors';
        
        // Custom Dropdown Theme inside Modal
        if (dom.categoryDropdownBtn) {
            if (isShop) {
                dom.categoryDropdownBtn.className = isDark
                    ? 'w-full h-10 bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-shop-500 rounded-lg px-3 text-sm text-gray-300 flex items-center justify-between transition-all font-medium'
                    : 'w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-shop-400 rounded-lg px-3 text-sm text-slate-600 flex items-center justify-between transition-all font-medium';
            } else {
                dom.categoryDropdownBtn.className = isDark
                    ? 'w-full h-10 bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 text-sm text-gray-300 flex items-center justify-between transition-all font-medium'
                    : 'w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg px-3 text-sm text-slate-600 flex items-center justify-between transition-all font-medium';
            }
            
            dom.categoryDropdownMenu.className = isDark
                ? 'hidden absolute top-full left-0 w-full mt-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-20 max-h-60 overflow-y-auto'
                : 'hidden absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 max-h-60 overflow-y-auto';
        }
    }

    // Update Search Bar Theme
    if (dom.searchInput) {
        dom.searchInput.className = isDark
            ? 'w-full h-12 pl-10 bg-gray-800 border border-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-900 rounded-xl text-sm transition-all font-medium shadow-sm text-white placeholder-gray-500'
            : 'w-full h-12 pl-10 bg-white border border-slate-100 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 rounded-xl text-sm transition-all font-medium shadow-sm';
        
        if (dom.openAddModalBtn) {
            if (isShop) {
                dom.openAddModalBtn.className = 'h-10 px-4 bg-shop-600 hover:bg-shop-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:scale-105 active:scale-95';
            } else {
                dom.openAddModalBtn.className = isDark
                    ? 'h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-900/50 hover:scale-105 active:scale-95'
                    : 'h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 active:scale-95';
            }
        }
    }

    // Update Modal Theme
    if (dom.deleteModalContent) {
        dom.deleteModalContent.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-700 transition-colors duration-500'
            : 'bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 transition-colors duration-500';
        
        dom.deleteModalTitle.className = isDark ? 'text-lg font-bold text-white mb-2 transition-colors' : 'text-lg font-bold text-slate-800 mb-2 transition-colors';
        dom.deleteModalText.className = isDark ? 'text-gray-400 mb-6 transition-colors' : 'text-slate-500 mb-6 transition-colors';
        
        dom.cancelDeleteBtn.className = isDark
            ? 'px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors'
            : 'px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors';
    }

    // Update Edit Modal Theme
    if (dom.editModalContent) {
        dom.editModalContent.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-700 transition-colors duration-500'
            : 'bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 transition-colors duration-500';
        
        dom.editModalTitle.className = isDark ? 'text-lg font-bold text-white mb-4 transition-colors' : 'text-lg font-bold text-slate-800 mb-4 transition-colors';
        
        const inputClass = isDark
            ? 'w-full bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm transition-all text-white placeholder-gray-400'
            : 'w-full bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg px-4 py-2 text-sm transition-all';
        
        dom.editNameInput.className = inputClass;
        dom.editPriceInput.className = inputClass;
        dom.editQuantityInput.className = inputClass;

        // Edit Category Dropdown Theme
        if (dom.editCategoryDropdownBtn) {
            dom.editCategoryDropdownBtn.className = isDark
                ? 'w-full h-10 bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-3 text-sm text-gray-300 flex items-center justify-between transition-all font-medium'
                : 'w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg px-3 text-sm text-slate-600 flex items-center justify-between transition-all font-medium';
            
            dom.editCategoryDropdownMenu.className = isDark
                ? 'hidden absolute top-full left-0 w-full mt-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-20 max-h-60 overflow-y-auto'
                : 'hidden absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 max-h-60 overflow-y-auto';
        }

        // Edit Unit Dropdown Theme
        if (dom.editUnitDropdownBtn) {
            dom.editUnitDropdownBtn.className = isDark
                ? 'w-full h-10 bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-2 text-sm text-gray-300 flex items-center justify-between transition-all font-medium'
                : 'w-full h-10 bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg px-2 text-sm text-slate-600 flex items-center justify-between transition-all font-medium';
            
            dom.editUnitDropdownMenu.className = isDark
                ? 'hidden absolute top-full right-0 w-24 mt-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-20 max-h-60 overflow-y-auto'
                : 'hidden absolute top-full right-0 w-24 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 max-h-60 overflow-y-auto';
        }

        const labels = dom.editModalContent.querySelectorAll('label');
        labels.forEach(label => {
            label.className = isDark ? 'block text-xs font-medium text-gray-400 mb-1' : 'block text-xs font-medium text-slate-500 mb-1';
        });

        dom.cancelEditBtn.className = isDark
            ? 'px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors'
            : 'px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors';
    }

    // Update Category Modal Theme
    if (dom.addCategoryModalContent) {
        dom.addCategoryModalContent.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-700 transition-colors duration-500'
            : 'bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 transition-colors duration-500';
        
        dom.addCategoryModalTitle.className = isDark ? 'text-lg font-bold text-white mb-4 transition-colors' : 'text-lg font-bold text-slate-800 mb-4 transition-colors';
        
        dom.newCategoryInput.className = isDark
            ? 'w-full bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm mb-6 transition-all text-white placeholder-gray-400'
            : 'w-full bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg px-4 py-2 text-sm mb-6 transition-all';

        dom.cancelCategoryBtn.className = isDark
            ? 'px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors'
            : 'px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors';
    }

    // Update Finish Modal Theme
    if (dom.finishModalContent) {
        dom.finishModalContent.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-700 transition-colors duration-500'
            : 'bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 transition-colors duration-500';
        
        dom.finishModalTitle.className = isDark ? 'text-lg font-bold text-white mb-2 transition-colors' : 'text-lg font-bold text-slate-800 mb-2 transition-colors';
        dom.finishModalText.className = isDark ? 'text-gray-400 mb-6 transition-colors' : 'text-slate-500 mb-6 transition-colors';
        
        dom.cancelFinishBtn.className = isDark
            ? 'px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors'
            : 'px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors';
    }

    // Update Delete Suggestion Modal Theme
    if (dom.deleteSuggestionModalContent) {
        dom.deleteSuggestionModalContent.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-700 transition-colors duration-500'
            : 'bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 transition-colors duration-500';
        
        dom.deleteSuggestionModalTitle.className = isDark ? 'text-lg font-bold text-white mb-2 transition-colors' : 'text-lg font-bold text-slate-800 mb-2 transition-colors';
        dom.deleteSuggestionModalText.className = isDark ? 'text-gray-400 mb-6 transition-colors' : 'text-slate-500 mb-6 transition-colors';
        
        dom.cancelDeleteSuggestionBtn.className = isDark
            ? 'px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors'
            : 'px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors';
    }

    // Update Settings Modal Theme
    if (dom.settingsModalContent) {
        dom.settingsModalContent.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-700 transition-colors duration-500'
            : 'bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 transition-colors duration-500';
        
        dom.settingsModalTitle.className = isDark ? 'text-lg font-bold text-white mb-4 transition-colors' : 'text-lg font-bold text-slate-800 mb-4 transition-colors';
        
        const inputClass = isDark
            ? 'w-full bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm transition-all text-white placeholder-gray-400'
            : 'w-full bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg px-4 py-2 text-sm transition-all';
        
        // dom.settingsAppName removed

        // dom.labelAppName removed
        dom.settingsRoundLabel.className = isDark ? 'text-sm font-medium text-gray-300 transition-colors' : 'text-sm font-medium text-slate-600 transition-colors';
        dom.settingsSuggestionsLabel.className = isDark ? 'text-sm font-medium text-gray-300 transition-colors' : 'text-sm font-medium text-slate-600 transition-colors';

        // Confirmations Theme
        if (dom.settingsConfirmationsTitle) dom.settingsConfirmationsTitle.className = isDark ? 'text-xs font-bold text-gray-500 uppercase mb-3' : 'text-xs font-bold text-slate-400 uppercase mb-3';
        if (dom.settingsConfirmBudgetLabel) dom.settingsConfirmBudgetLabel.className = isDark ? 'text-sm font-medium text-gray-300 transition-colors' : 'text-sm font-medium text-slate-600 transition-colors';
        if (dom.settingsConfirmItemLabel) dom.settingsConfirmItemLabel.className = isDark ? 'text-sm font-medium text-gray-300 transition-colors' : 'text-sm font-medium text-slate-600 transition-colors';
        if (dom.settingsConfirmSuggestionLabel) dom.settingsConfirmSuggestionLabel.className = isDark ? 'text-sm font-medium text-gray-300 transition-colors' : 'text-sm font-medium text-slate-600 transition-colors';
        if (dom.settingsConfirmFinishLabel) dom.settingsConfirmFinishLabel.className = isDark ? 'text-sm font-medium text-gray-300 transition-colors' : 'text-sm font-medium text-slate-600 transition-colors';
        
        const divider = document.getElementById('settings-confirmations-divider');
        if(divider) divider.className = isDark ? 'pt-4 border-t border-gray-700' : 'pt-4 border-t border-slate-100';

        // Update toggle theme
        try {
            updateSettingsToggleUI(state.roundValues);
            updateSuggestionsToggleUI(state.enableSuggestions);
            updateConfirmToggleUI('budget', state.confirmDeleteBudget);
            updateConfirmToggleUI('item', state.confirmDeleteItem);
            updateConfirmToggleUI('suggestion', state.confirmDeleteSuggestion);
            updateConfirmToggleUI('finish', state.confirmFinishShop);
        } catch(e) { console.error(e); }

        dom.cancelSettingsBtn.className = isDark
            ? 'px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors'
            : 'px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors';
    }

    // Update Budget Settings Modal Theme
    const budgetModalContent = document.getElementById('budget-settings-content');
    if (budgetModalContent) {
        const title = budgetModalContent.querySelector('h3');
        const labels = budgetModalContent.querySelectorAll('label');
        const inputs = budgetModalContent.querySelectorAll('input');
        const cancelBtn = document.getElementById('cancel-budget-settings');
        const closeBtn = document.getElementById('close-budget-settings-modal');
        const currencySpan = budgetModalContent.querySelector('.relative span');

        budgetModalContent.className = isDark
            ? 'bg-gray-800 rounded-2xl p-6 w-full max-w-md transform scale-95 transition-transform duration-300 shadow-2xl border border-gray-700'
            : 'bg-white rounded-2xl p-6 w-full max-w-md transform scale-95 transition-transform duration-300 shadow-2xl';
        
        if(title) title.className = isDark ? 'text-xl font-bold text-white' : 'text-xl font-bold text-slate-800';
        
        if(closeBtn) closeBtn.className = isDark 
            ? 'text-gray-400 hover:text-white transition-colors'
            : 'text-slate-400 hover:text-slate-600 transition-colors';

        if(currencySpan) currencySpan.className = isDark
            ? 'absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'
            : 'absolute left-4 top-1/2 -translate-y-1/2 text-slate-400';

        labels.forEach(l => l.className = isDark 
            ? 'block text-sm font-medium text-gray-300 mb-1'
            : 'block text-sm font-medium text-slate-600 mb-1');

        inputs.forEach(i => i.className = isDark
            ? 'w-full px-4 h-10 rounded-xl border border-gray-600 bg-gray-700 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-900 outline-none transition-all' + (i.id === 'budget-limit-input' ? ' pl-10' : '')
            : 'w-full px-4 h-10 rounded-xl border border-slate-200 bg-white text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all' + (i.id === 'budget-limit-input' ? ' pl-10' : ''));

        if(cancelBtn) cancelBtn.className = isDark
            ? 'flex-1 px-4 py-2 rounded-xl border border-gray-600 text-gray-300 font-medium hover:bg-gray-700 transition-colors'
            : 'flex-1 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors';
    }

    // Update Tutorial Modal Theme
    if (dom.tutorialModalContent) {
        dom.tutorialModalContent.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-gray-700 transition-colors duration-500 max-h-[80vh] overflow-y-auto'
            : 'bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-slate-100 transition-colors duration-500 max-h-[80vh] overflow-y-auto';
        
        dom.tutorialModalTitle.className = isDark ? 'text-xl font-bold text-white transition-colors' : 'text-xl font-bold text-slate-800 transition-colors';
        dom.tutorialModalText.className = isDark ? 'space-y-4 text-gray-300 text-sm transition-colors' : 'space-y-4 text-slate-600 text-sm transition-colors';
        
        dom.closeTutorialBtn.className = isDark
            ? 'p-1 rounded-lg hover:bg-gray-700 text-gray-400 transition-colors'
            : 'p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors';

        const headings = dom.tutorialModalText.querySelectorAll('.tutorial-heading');
        headings.forEach(h => {
            h.className = isDark ? 'font-bold text-white mb-1 tutorial-heading' : 'font-bold text-slate-800 mb-1 tutorial-heading';
        });
    }

    // Update New Budget Modal Theme
    if (dom.newBudgetModalContent) {
        dom.newBudgetModalContent.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-700 transition-colors duration-500'
            : 'bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 transition-colors duration-500';
        
        dom.newBudgetModalTitle.className = isDark ? 'text-lg font-bold text-white mb-4 transition-colors' : 'text-lg font-bold text-slate-800 mb-4 transition-colors';
        
        const inputClass = isDark
            ? 'w-full bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm transition-all text-white placeholder-gray-400'
            : 'w-full bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg px-4 py-2 text-sm transition-all';
        
        dom.newBudgetName.className = inputClass;
        dom.newBudgetLimit.className = inputClass;

        const labelClass = isDark ? 'block text-xs font-bold text-gray-500 uppercase mb-1' : 'block text-xs font-bold text-slate-400 uppercase mb-1';
        document.getElementById('new-budget-name-label').className = labelClass;
        document.getElementById('new-budget-limit-label').className = labelClass;

        dom.cancelNewBudgetBtn.className = isDark
            ? 'px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors'
            : 'px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors';
    }

    // Update Edit Hub Budget Modal Theme
    if (dom.editHubBudgetModalContent) {
        dom.editHubBudgetModalContent.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-700 transition-colors duration-500'
            : 'bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 transition-colors duration-500';
        
        dom.editHubBudgetModalTitle.className = isDark ? 'text-lg font-bold text-white mb-4 transition-colors' : 'text-lg font-bold text-slate-800 mb-4 transition-colors';
        
        const inputClass = isDark
            ? 'w-full bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-4 py-2 text-sm transition-all text-white placeholder-gray-400'
            : 'w-full bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg px-4 py-2 text-sm transition-all';
        
        dom.editHubBudgetName.className = inputClass;
        dom.editHubBudgetLimit.className = inputClass;

        const labelClass = isDark ? 'block text-xs font-bold text-gray-500 uppercase mb-1' : 'block text-xs font-bold text-slate-400 uppercase mb-1';
        document.getElementById('edit-hub-budget-name-label').className = labelClass;
        document.getElementById('edit-hub-budget-limit-label').className = labelClass;

        dom.cancelEditHubBudgetBtn.className = isDark
            ? 'px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors'
            : 'px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors';
    }

    // Update Delete Budget Modal Theme
    if (dom.deleteBudgetModalContent) {
        dom.deleteBudgetModalContent.className = isDark
            ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-700 transition-colors duration-500'
            : 'bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-slate-100 transition-colors duration-500';
        
        dom.deleteBudgetModalTitle.className = isDark ? 'text-lg font-bold text-white mb-2 transition-colors' : 'text-lg font-bold text-slate-800 mb-2 transition-colors';
        dom.deleteBudgetModalText.className = isDark ? 'text-gray-400 mb-6 transition-colors' : 'text-slate-500 mb-6 transition-colors';
        
        dom.cancelDeleteBudgetBtn.className = isDark
            ? 'px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700 font-medium transition-colors'
            : 'px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium transition-colors';
    }

    // Update Sort Dropdown Theme
    const sortMenu = document.getElementById('sort-dropdown-menu');

    if (sortMenu) {
        sortMenu.className = isDark
            ? 'hidden absolute top-full right-0 w-full mt-1 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-20'
            : 'hidden absolute top-full right-0 w-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20';
        
        const options = sortMenu.querySelectorAll('div');
        options.forEach(opt => {
            opt.className = isDark
                ? 'px-4 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-300 transition-colors'
                : 'px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-600 transition-colors';
        });
    }
}

// --- HANDLERS ---

let deleteType = null; // 'item' | 'category'
let deleteTarget = null; // id (for item) | categoryName (for category)

function openDeleteModal(id) {
    deleteType = 'item';
    deleteTarget = id;
    
    if (!state.confirmDeleteItem) {
        confirmDelete();
        return;
    }

    dom.deleteModalTitle.textContent = 'Remover Item?';
    dom.deleteModalText.textContent = 'Tem certeza que deseja remover este item da lista?';
    dom.deleteModal.classList.remove('hidden');
}

function openDeleteCategoryModal(categoryName) {
    deleteType = 'category';
    deleteTarget = categoryName;
    
    if (!state.confirmDeleteItem) {
        confirmDelete();
        return;
    }

    const itemsInCategory = state.items.filter(i => i.category === categoryName);
    const count = itemsInCategory.length;

    dom.deleteModalTitle.textContent = 'Excluir Categoria?';
    
    if (count > 0) {
        dom.deleteModalText.innerHTML = `Esta categoria possui <strong class="text-red-500">${count} item(ns)</strong>.<br>Ao excluir, ela e todos os seus itens serão removidos.`;
    } else {
        dom.deleteModalText.textContent = `Tem certeza que deseja excluir a categoria "${categoryName}"?`;
    }
    
    dom.deleteModal.classList.remove('hidden');
}

function openEditModal(id) {
    const item = state.items.find(i => i.id === id);
    if (!item) return;

    state.editingItemId = id;
    dom.editNameInput.value = item.name;
    dom.editPriceInput.value = item.price || '';
    dom.editQuantityInput.value = item.quantity || 1;
    
    // Set initial values for hidden inputs
    dom.editCategorySelect.value = item.category || 'Geral';
    dom.editUnitInput.value = item.unit || 'un';

    // Render dropdowns
    renderEditCategories();
    renderEditUnitDropdown();

    dom.editModal.classList.remove('hidden');
}

function closeEditModal() {
    state.editingItemId = null;
    dom.editModal.classList.add('hidden');
}

async function saveEdit() {
    if (!state.editingItemId) return;

    let name = dom.editNameInput.value.trim();
    if (name.length > 0) {
        name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    
    const price = parseFloat(dom.editPriceInput.value) || 0;
    const quantity = parseInt(dom.editQuantityInput.value) || 1;
    const unit = dom.editUnitInput.value || 'un';
    const category = dom.editCategorySelect.value;

    if (!name) return;

    const itemIndex = state.items.findIndex(i => i.id === state.editingItemId);
    if (itemIndex !== -1) {
        const idToUpdate = state.editingItemId; // Capture ID before closing modal
        const updatedItem = { ...state.items[itemIndex], name, price, quantity, unit, category };
        
        // Optimistic update
        state.items[itemIndex] = updatedItem;
        syncLocalState();
        renderAll();
        closeEditModal();

        // API update
        await apiService.updateItem(idToUpdate, updatedItem);
    }
}

let suggestionToDeleteId = null;

function openDeleteSuggestionModal(id) {
    suggestionToDeleteId = id;
    
    if (!state.confirmDeleteSuggestion) {
        confirmDeleteSuggestion();
        return;
    }

    dom.deleteSuggestionModal.classList.remove('hidden');
}

function closeDeleteSuggestionModal() {
    suggestionToDeleteId = null;
    dom.deleteSuggestionModal.classList.add('hidden');
}

async function confirmDeleteSuggestion() {
    if (suggestionToDeleteId) {
        const id = suggestionToDeleteId;
        closeDeleteSuggestionModal();
        await performDeleteSuggestion(id);
    }
}

async function performDeleteSuggestion(id) {
    if (!id) return;

    // Optimistic update
    state.products = state.products.filter(p => p._id !== id);
    
    // Re-render suggestions if input still has value
    const val = dom.inputName.value;
    if (val.length > 0) {
        const matches = state.products.filter(p => p.name.toLowerCase().startsWith(val.toLowerCase()));
        showSuggestions(matches);
    } else {
        hideSuggestions();
    }

    await apiService.deleteProduct(id);
}

function closeDeleteModal() {
    deleteType = null;
    deleteTarget = null;
    dom.deleteModal.classList.add('hidden');
}

function openAddCategoryModal() {
    dom.newCategoryInput.value = '';
    dom.addCategoryModal.classList.remove('hidden');
    dom.newCategoryInput.focus();
}

function closeAddCategoryModal() {
    dom.addCategoryModal.classList.add('hidden');
    // Reset select to Geral if cancelled
    if (dom.inputCategory.value === '__new__') {
        dom.inputCategory.value = 'Geral';
    }
}

function confirmAddCategory() {
    const newCat = dom.newCategoryInput.value.trim();
    if (newCat) {
        dom.addCategoryModal.classList.add('hidden'); // Close manually to avoid reset logic
        if (!state.categories.includes(newCat)) {
            state.categories.push(newCat);
            saveActiveBudgetMetadata();
        }
        renderCategories();
        selectCategory(newCat, false);
    } else {
        closeAddCategoryModal();
    }
}

function openFinishModal() {
    if (!state.confirmFinishShop) {
        confirmFinishShopping();
        return;
    }
    dom.finishModal.classList.remove('hidden');
}

function closeFinishModal() {
    dom.finishModal.classList.add('hidden');
}

function openTutorialModal() {
    dom.tutorialModal.classList.remove('hidden');
}

function closeTutorialModal() {
    dom.tutorialModal.classList.add('hidden');
}

function warnTutorialRequired() {
    const btn = dom.okTutorialBtn;
    // Visual feedback animation
    btn.classList.add('ring-4', 'ring-indigo-400', 'scale-110', 'transition-all', 'duration-200');
    setTimeout(() => {
        btn.classList.remove('ring-4', 'ring-indigo-400', 'scale-110');
    }, 200);
    setTimeout(() => {
        btn.classList.add('ring-4', 'ring-indigo-400', 'scale-110');
    }, 400);
    setTimeout(() => {
        btn.classList.remove('ring-4', 'ring-indigo-400', 'scale-110', 'transition-all', 'duration-200');
    }, 600);
}

function handleTutorialOk() {
    closeTutorialModal();
    openSettingsModal();
}

function openSettingsModal() {
    // dom.settingsAppName.value = state.appName; // Removed
    
    // Safely update toggles
    try {
        updateSettingsToggleUI(state.roundValues);
        updateSuggestionsToggleUI(state.enableSuggestions);
        updateTutorialToggleUI(state.showTutorialOnStart);
        updateConfirmToggleUI('budget', state.confirmDeleteBudget);
        updateConfirmToggleUI('item', state.confirmDeleteItem);
        updateConfirmToggleUI('suggestion', state.confirmDeleteSuggestion);
        updateConfirmToggleUI('finish', state.confirmFinishShop);
    } catch (e) {
        console.error('Error updating settings UI:', e);
    }
    
    dom.settingsModal.classList.remove('hidden');
}

function closeSettingsModal() {
    dom.settingsModal.classList.add('hidden');
}

function toggleSettingsRound() {
    state.roundValues = !state.roundValues;
    updateSettingsToggleUI(state.roundValues);
}

function toggleSettingsTutorial() {
    state.showTutorialOnStart = !state.showTutorialOnStart;
    updateTutorialToggleUI(state.showTutorialOnStart);
}

function updateTutorialToggleUI(isChecked) {
    const isDark = state.theme === 'dark';
    const uncheckedBg = isDark ? 'bg-gray-600' : 'bg-slate-200';

    if (isChecked) {
        dom.settingsTutorialToggle.classList.remove('bg-slate-200', 'bg-gray-600');
        dom.settingsTutorialToggle.classList.add('bg-indigo-600');
        dom.settingsTutorialKnob.classList.add('translate-x-6');
    } else {
        dom.settingsTutorialToggle.classList.remove('bg-indigo-600', 'bg-slate-200', 'bg-gray-600');
        dom.settingsTutorialToggle.classList.add(uncheckedBg);
        dom.settingsTutorialKnob.classList.remove('translate-x-6');
    }
}

function toggleConfirm(key) {
    if (key === 'budget') state.confirmDeleteBudget = !state.confirmDeleteBudget;
    if (key === 'item') state.confirmDeleteItem = !state.confirmDeleteItem;
    if (key === 'suggestion') state.confirmDeleteSuggestion = !state.confirmDeleteSuggestion;
    if (key === 'finish') state.confirmFinishShop = !state.confirmFinishShop;
    
    const val = key === 'budget' ? state.confirmDeleteBudget :
               key === 'item' ? state.confirmDeleteItem :
               key === 'suggestion' ? state.confirmDeleteSuggestion :
               state.confirmFinishShop;
               
    updateConfirmToggleUI(key, val);
}

function updateConfirmToggleUI(key, isChecked) {
    const isDark = state.theme === 'dark';
    const uncheckedBg = isDark ? 'bg-gray-600' : 'bg-slate-200';
    
    let toggle, knob;
    // Re-fetch elements to be safe
    if (key === 'budget') { 
        toggle = document.getElementById('settings-confirm-budget-toggle'); 
        knob = document.getElementById('settings-confirm-budget-knob'); 
    }
    if (key === 'item') { 
        toggle = document.getElementById('settings-confirm-item-toggle'); 
        knob = document.getElementById('settings-confirm-item-knob'); 
    }
    if (key === 'suggestion') { 
        toggle = document.getElementById('settings-confirm-suggestion-toggle'); 
        knob = document.getElementById('settings-confirm-suggestion-knob'); 
    }
    if (key === 'finish') { 
        toggle = document.getElementById('settings-confirm-finish-toggle'); 
        knob = document.getElementById('settings-confirm-finish-knob'); 
    }

    if (toggle && knob) {
        if (isChecked) {
            toggle.classList.remove('bg-slate-200', 'bg-gray-600');
            toggle.classList.add('bg-indigo-600');
            knob.classList.add('translate-x-6');
        } else {
            toggle.classList.remove('bg-indigo-600', 'bg-slate-200', 'bg-gray-600');
            toggle.classList.add(uncheckedBg);
            knob.classList.remove('translate-x-6');
        }
    }
}

function updateSettingsToggleUI(isChecked) {
    const isDark = state.theme === 'dark';
    const uncheckedBg = isDark ? 'bg-gray-600' : 'bg-slate-200';

    if (isChecked) {
        dom.settingsRoundToggle.classList.remove('bg-slate-200', 'bg-gray-600');
        dom.settingsRoundToggle.classList.add('bg-indigo-600');
        dom.settingsRoundKnob.classList.add('translate-x-6');
    } else {
        dom.settingsRoundToggle.classList.remove('bg-indigo-600', 'bg-slate-200', 'bg-gray-600');
        dom.settingsRoundToggle.classList.add(uncheckedBg);
        dom.settingsRoundKnob.classList.remove('translate-x-6');
    }
}

function toggleSettingsSuggestions() {
    state.enableSuggestions = !state.enableSuggestions;
    updateSuggestionsToggleUI(state.enableSuggestions);
}

function updateSuggestionsToggleUI(isChecked) {
    const isDark = state.theme === 'dark';
    const uncheckedBg = isDark ? 'bg-gray-600' : 'bg-slate-200';

    if (isChecked) {
        dom.settingsSuggestionsToggle.classList.remove('bg-slate-200', 'bg-gray-600');
        dom.settingsSuggestionsToggle.classList.add('bg-indigo-600');
        dom.settingsSuggestionsKnob.classList.add('translate-x-6');
    } else {
        dom.settingsSuggestionsToggle.classList.remove('bg-indigo-600', 'bg-slate-200', 'bg-gray-600');
        dom.settingsSuggestionsToggle.classList.add(uncheckedBg);
        dom.settingsSuggestionsKnob.classList.remove('translate-x-6');
    }
}

function showSuggestions(matches) {
    const dropdown = dom.suggestionsDropdown;
    if (!matches.length) {
        dropdown.classList.add('hidden');
        return;
    }

    const isDark = state.theme === 'dark';
    dropdown.className = isDark 
        ? 'absolute top-full left-0 w-full mt-2 bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden z-30 max-h-60 overflow-y-auto'
        : 'absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-30 max-h-60 overflow-y-auto';

    dropdown.innerHTML = '';
    
    matches.forEach(p => {
        const div = document.createElement('div');
        div.className = isDark
            ? 'px-4 py-3 hover:bg-gray-700 cursor-pointer flex justify-between items-center border-b border-gray-700 last:border-0 transition-colors group'
            : 'px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 transition-colors group';
        
        div.innerHTML = `
            <div class="flex items-center gap-2 flex-1 min-w-0">
                <span class="${isDark ? 'text-gray-200' : 'text-slate-700'} font-medium truncate">${p.name}</span>
            </div>
            <div class="flex items-center gap-3">
                <span class="${isDark ? 'text-indigo-400' : 'text-indigo-600'} text-sm font-bold whitespace-nowrap">R$ ${p.price.toFixed(2)}</span>
                <button class="delete-suggestion-btn p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100" title="Remover sugestão">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        
        const deleteBtn = div.querySelector('.delete-suggestion-btn');
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            openDeleteSuggestionModal(p._id);
        };

        div.onclick = () => selectSuggestion(p);
        dropdown.appendChild(div);
    });

    lucide.createIcons();
    dropdown.classList.remove('hidden');
}



function hideSuggestions() {
    dom.suggestionsDropdown.classList.add('hidden');
}

function selectSuggestion(product) {
    dom.inputName.value = product.name;
    dom.inputPrice.value = product.price.toFixed(2);
    hideSuggestions();
    dom.inputQuantity.focus();
}

function saveSettings() {
    closeSettingsModal();
    // state.appName = dom.settingsAppName.value.trim() || 'LionsDash'; // Removed
    state.roundValues = dom.settingsRoundToggle.classList.contains('bg-indigo-600');
    state.showTutorialOnStart = dom.settingsTutorialToggle.classList.contains('bg-indigo-600');
    
    // Save tutorial preference
    localStorage.setItem('lions_show_tutorial', state.showTutorialOnStart);

    renderAll();
}

async function confirmFinishShopping() {
    closeFinishModal();
    const itemsToDelete = state.items.filter(i => i.checked);
    
    // Optimistic update
    state.items = state.items.filter(i => !i.checked);
    
    // Turn off Shop Mode automatically
    state.shopMode = false;

    syncLocalState();
    renderAll();

    // Sync with API
    for (const item of itemsToDelete) {
        await apiService.deleteItem(item.id);
    }
}

async function confirmDelete() {
    if (deleteType === 'item' && deleteTarget) {
        const id = deleteTarget;
        closeDeleteModal();
        state.items = state.items.filter(i => i.id !== id);
        syncLocalState();
        renderAll();
        await apiService.deleteItem(id);
    } else if (deleteType === 'category' && deleteTarget) {
        const categoryName = deleteTarget;
        closeDeleteModal();
        
        // Identify items to delete
        const itemsToDelete = state.items.filter(i => i.category === categoryName);

        // Remove items locally
        state.items = state.items.filter(i => i.category !== categoryName);

        // Remove category locally
        state.categories = state.categories.filter(c => c !== categoryName);
        
        // Reset input if selected
        if (dom.inputCategory.value === categoryName) {
            selectCategory('Geral', false);
        }

        syncLocalState();
        saveActiveBudgetMetadata(); // Updates categories on API
        renderCategories(); 
        renderAll();

        // Delete category on API (which also deletes items)
        await apiService.deleteCategory(state.activeBudgetId, categoryName);
    }
}

async function handleAdd(e) {
    if(e) e.preventDefault();
    
    // Proteção contra múltiplos cliques
    if (dom.addBtn.disabled) return;

    const originalBtnContent = dom.addBtn.innerHTML;
    dom.addBtn.disabled = true;
    dom.addBtn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>';

    try {
        let name = dom.inputName.value.trim();
        if (name.length > 0) {
            name = name.charAt(0).toUpperCase() + name.slice(1);
        }

        const price = parseFloat(dom.inputPrice.value) || 0;
        const quantity = parseInt(dom.inputQuantity.value) || 1;
        const unit = document.getElementById('input-unit').value || 'un';
        const category = dom.inputCategory.value;

        if (!name) {
            dom.addBtn.disabled = false;
            dom.addBtn.innerHTML = originalBtnContent;
            return;
        }

        const tempItem = {
            name,
            price,
            quantity,
            unit,
            category,
            checked: false
        };

        // Adiciona localmente para feedback instantâneo (Optimistic UI)
        // state.items.push({...tempItem, id: Date.now()}); 
        // renderAll();

        // Ou espera API
        const newItem = await apiService.addItem(tempItem);
        state.items.push(newItem);
        syncLocalState();

        // Save product for future suggestions
        if (!state.products.some(p => p.name.toLowerCase() === name.toLowerCase())) {
            const newProd = { name, price };
            const res = await apiService.createProduct(newProd);
            if (res && res.product) {
                state.products.push(res.product);
            }
        }
        
        // Limpar form e fechar modal
        dom.inputName.value = '';
        dom.inputPrice.value = '';
        dom.inputQuantity.value = '';
        closeAddModal();
        
        renderAll();
    } catch (error) {
        console.error("Erro ao adicionar item:", error);
    } finally {
        dom.addBtn.disabled = false;
        dom.addBtn.innerHTML = originalBtnContent;
    }
}

function openAddModal() {
    dom.addItemModal.classList.remove('hidden');
    renderCategories();
    renderUnitDropdown();
    dom.inputName.focus();
}

function closeAddModal() {
    dom.addItemModal.classList.add('hidden');
}

async function handleToggle(id) {
    const item = state.items.find(i => i.id === id);
    if (item) {
        item.checked = !item.checked;
        syncLocalState();
        renderAll(); // Atualiza UI instantaneamente
        await apiService.toggleItem(id, item.checked); // Sincroniza fundo
    }
}

async function handleDelete(id, e) {
    if (e) e.stopPropagation();
    openDeleteModal(id);
}

function toggleShopMode() {
    state.shopMode = !state.shopMode;
    
    // Toggle Share Button
    const shareBtn = document.getElementById('share-btn');
    if (shareBtn) {
        if (state.shopMode) {
            shareBtn.classList.add('hidden');
        } else {
            shareBtn.classList.remove('hidden');
        }
    }

    renderAll();
}

function shareList() {
    const itemsToBuy = state.items.filter(i => !i.checked);
    if (itemsToBuy.length === 0) {
        alert('Sua lista de compras está vazia ou tudo já foi marcado!');
        return;
    }

    let text = `*Lista de Compras - ${state.budgetTitle}*\n\n`;
    
    // Group by category for nicer output
    const groups = {};
    itemsToBuy.forEach(item => {
        if (!groups[item.category]) groups[item.category] = [];
        groups[item.category].push(item);
    });

    for (const [cat, items] of Object.entries(groups)) {
        text += `*${cat}*\n`;
        items.forEach(item => {
            const unit = item.unit && item.unit !== 'un' ? item.unit : '';
            const qty = item.quantity || 1;
            text += `- [ ] ${qty}${unit} ${item.name}\n`;
        });
        text += '\n';
    }

    text += `_Gerado por LionsDash_`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function moveCategory(category, direction) {
    const index = state.categories.indexOf(category);
    if (index === -1) return;

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= state.categories.length) return;

    // Swap
    const temp = state.categories[index];
    state.categories[index] = state.categories[newIndex];
    state.categories[newIndex] = temp;

    saveActiveBudgetMetadata();
    renderAll();
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    renderAll();
}

// --- EVENT LISTENERS ---

dom.inputCategory.addEventListener('change', (e) => {
    // Legacy listener removed
});

// Dropdown Listeners
dom.categoryDropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCategoryDropdown();
});

if (dom.unitDropdownBtn) {
    dom.unitDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleUnitDropdown();
    });
}

// Edit Modal Dropdown Listeners
if (dom.editCategoryDropdownBtn) {
    dom.editCategoryDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleEditCategoryDropdown();
    });
}

if (dom.editUnitDropdownBtn) {
    dom.editUnitDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleEditUnitDropdown();
    });
}

document.addEventListener('click', (e) => {
    // Category Dropdown
    if (!dom.categoryDropdownBtn.contains(e.target) && !dom.categoryDropdownMenu.contains(e.target)) {
        if (!dom.categoryDropdownMenu.classList.contains('hidden')) {
            toggleCategoryDropdown();
        }
    }

    // Unit Dropdown
    if (dom.unitDropdownBtn && dom.unitDropdownMenu && !dom.unitDropdownBtn.contains(e.target) && !dom.unitDropdownMenu.contains(e.target)) {
        if (!dom.unitDropdownMenu.classList.contains('hidden')) {
            toggleUnitDropdown();
        }
    }

    // Edit Category Dropdown
    if (dom.editCategoryDropdownBtn && dom.editCategoryDropdownMenu && !dom.editCategoryDropdownBtn.contains(e.target) && !dom.editCategoryDropdownMenu.contains(e.target)) {
        if (!dom.editCategoryDropdownMenu.classList.contains('hidden')) {
            toggleEditCategoryDropdown();
        }
    }

    // Edit Unit Dropdown
    if (dom.editUnitDropdownBtn && dom.editUnitDropdownMenu && !dom.editUnitDropdownBtn.contains(e.target) && !dom.editUnitDropdownMenu.contains(e.target)) {
        if (!dom.editUnitDropdownMenu.classList.contains('hidden')) {
            toggleEditUnitDropdown();
        }
    }
    
    // Sort Dropdown
    const sortBtn = document.getElementById('sort-dropdown-btn');
    const sortMenu = document.getElementById('sort-dropdown-menu');
    if (sortBtn && sortMenu && !sortBtn.contains(e.target) && !sortMenu.contains(e.target)) {
        if (!sortMenu.classList.contains('hidden')) {
            toggleSortDropdown();
        }
    }
});

// Add Modal Listeners
dom.openAddModalBtn.addEventListener('click', openAddModal);
dom.cancelAddBtn.addEventListener('click', closeAddModal);
dom.addItemModal.addEventListener('click', (e) => {
    if (e.target === dom.addItemModal) closeAddModal();
});

// Search Listener
dom.searchInput.addEventListener('input', (e) => {
    state.searchTerm = e.target.value;
    renderList();
});

dom.addBtn.addEventListener('click', handleAdd);

dom.inputName.addEventListener('input', (e) => {
    const val = e.target.value;
    
    if (state.enableSuggestions && val.length > 0) {
        const matches = state.products.filter(p => p.name.toLowerCase().startsWith(val.toLowerCase()));
        showSuggestions(matches);
    } else {
        hideSuggestions();
    }

    const product = state.products.find(p => p.name.toLowerCase() === val.toLowerCase());
    if (product) {
        dom.inputPrice.value = product.price;
    }
});

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (dom.suggestionsDropdown && !dom.suggestionsDropdown.contains(e.target) && e.target !== dom.inputName) {
        hideSuggestions();
    }
});

dom.inputName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAdd(e);
});

dom.inputPrice.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAdd(e);
});

dom.inputQuantity.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAdd(e);
});

// Share Button Listener
const shareBtn = document.getElementById('share-btn');
if (shareBtn) shareBtn.addEventListener('click', shareList);

dom.toggleBtn.addEventListener('click', toggleShopMode);
dom.themeBtn.addEventListener('click', toggleTheme);

dom.cancelDeleteBtn.addEventListener('click', closeDeleteModal);
dom.confirmDeleteBtn.addEventListener('click', confirmDelete);
dom.deleteModal.addEventListener('click', (e) => {
    if (e.target === dom.deleteModal) closeDeleteModal();
});

dom.cancelEditBtn.addEventListener('click', closeEditModal);
dom.saveEditBtn.addEventListener('click', saveEdit);
dom.editModal.addEventListener('click', (e) => {
    if (e.target === dom.editModal) closeEditModal();
});
// Edit Modal Enter Keys
dom.editNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEdit();
});
dom.editPriceInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEdit();
});
dom.editCategorySelect.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveEdit();
});

dom.cancelCategoryBtn.addEventListener('click', closeAddCategoryModal);
dom.confirmCategoryBtn.addEventListener('click', confirmAddCategory);
dom.newCategoryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') confirmAddCategory();
});
dom.addCategoryModal.addEventListener('click', (e) => {
    if (e.target === dom.addCategoryModal) closeAddCategoryModal();
});

dom.finishShopBtn.addEventListener('click', openFinishModal);
dom.cancelFinishBtn.addEventListener('click', closeFinishModal);
dom.confirmFinishBtn.addEventListener('click', confirmFinishShopping);
dom.finishModal.addEventListener('click', (e) => {
    if (e.target === dom.finishModal) closeFinishModal();
});

dom.settingsBtn.addEventListener('click', openSettingsModal);
dom.cancelSettingsBtn.addEventListener('click', closeSettingsModal);
dom.saveSettingsBtn.addEventListener('click', saveSettings);
dom.settingsTutorialContainer.addEventListener('click', toggleSettingsTutorial);
dom.settingsRoundContainer.addEventListener('click', toggleSettingsRound);
dom.settingsSuggestionsContainer.addEventListener('click', toggleSettingsSuggestions);
dom.settingsConfirmBudgetContainer.addEventListener('click', () => toggleConfirm('budget'));
dom.settingsConfirmItemContainer.addEventListener('click', () => toggleConfirm('item'));
dom.settingsConfirmSuggestionContainer.addEventListener('click', () => toggleConfirm('suggestion'));
dom.settingsConfirmFinishContainer.addEventListener('click', () => toggleConfirm('finish'));
dom.settingsModal.addEventListener('click', (e) => {
    if (e.target === dom.settingsModal) closeSettingsModal();
});

// Tutorial Listeners
dom.tutorialBtn.addEventListener('click', openTutorialModal);
dom.closeTutorialBtn.addEventListener('click', warnTutorialRequired);
dom.okTutorialBtn.addEventListener('click', handleTutorialOk);
dom.tutorialModal.addEventListener('click', (e) => {
    if (e.target === dom.tutorialModal) warnTutorialRequired();
});

// Recipes Listeners
if (dom.recipesBtn) dom.recipesBtn.addEventListener('click', openRecipesModal);
if (dom.closeRecipesModalBtn) dom.closeRecipesModalBtn.addEventListener('click', closeRecipesModal);
if (dom.recipesModal) dom.recipesModal.addEventListener('click', (e) => {
    if (e.target === dom.recipesModal) closeRecipesModal();
});
if (dom.openNewRecipeModalBtn) dom.openNewRecipeModalBtn.addEventListener('click', openNewRecipeModal);

if (dom.cancelRecipeBtn) dom.cancelRecipeBtn.addEventListener('click', closeNewRecipeModal);
if (dom.saveRecipeBtn) dom.saveRecipeBtn.addEventListener('click', saveRecipe);
if (dom.addIngredientBtn) dom.addIngredientBtn.addEventListener('click', addRecipeIngredientRow);
if (dom.newRecipeModal) dom.newRecipeModal.addEventListener('click', (e) => {
    if (e.target === dom.newRecipeModal) closeNewRecipeModal();
});

// Settings Modal Enter Key
// dom.settingsAppName.addEventListener('keypress', (e) => {
//    if (e.key === 'Enter') saveSettings();
// });

// Delete Suggestion Listeners
dom.cancelDeleteSuggestionBtn.addEventListener('click', closeDeleteSuggestionModal);
dom.confirmDeleteSuggestionBtn.addEventListener('click', confirmDeleteSuggestion);
dom.deleteSuggestionModal.addEventListener('click', (e) => {
    if (e.target === dom.deleteSuggestionModal) closeDeleteSuggestionModal();
});

// --- BUDGET SETTINGS LISTENERS ---
const budgetSettingsModal = document.getElementById('budget-settings-modal');
const budgetSettingsBtn = document.getElementById('budget-settings-btn');
const closeBudgetSettingsBtn = document.getElementById('close-budget-settings-modal');
const cancelBudgetSettingsBtn = document.getElementById('cancel-budget-settings');
const saveBudgetSettingsBtn = document.getElementById('save-budget-settings');
const budgetTitleInput = document.getElementById('budget-title-input');
const budgetLimitInput = document.getElementById('budget-limit-input');

function openBudgetSettings() {
    budgetTitleInput.value = state.budgetTitle;
    budgetLimitInput.value = state.budgetLimit;
    budgetSettingsModal.classList.remove('hidden');
    setTimeout(() => budgetSettingsModal.classList.remove('opacity-0'), 10);
}

function closeBudgetSettings() {
    budgetSettingsModal.classList.add('opacity-0');
    setTimeout(() => budgetSettingsModal.classList.add('hidden'), 300);
}

function saveBudgetSettings() {
    closeBudgetSettings();
    const newTitle = budgetTitleInput.value.trim() || 'Orçamento Semanal';
    const newLimit = parseFloat(budgetLimitInput.value) || 500;
    
    state.budgetTitle = newTitle;
    state.budgetLimit = newLimit;
    saveActiveBudgetMetadata();
    
    renderStats();
}

if (budgetSettingsBtn) budgetSettingsBtn.addEventListener('click', openBudgetSettings);
if (closeBudgetSettingsBtn) closeBudgetSettingsBtn.addEventListener('click', closeBudgetSettings);
if (cancelBudgetSettingsBtn) cancelBudgetSettingsBtn.addEventListener('click', closeBudgetSettings);
if (saveBudgetSettingsBtn) saveBudgetSettingsBtn.addEventListener('click', saveBudgetSettings);
if (budgetSettingsModal) {
    budgetSettingsModal.addEventListener('click', (e) => {
        if (e.target === budgetSettingsModal) closeBudgetSettings();
    });
}
// Budget Settings Enter Keys
if (budgetTitleInput) {
    budgetTitleInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveBudgetSettings();
    });
}
if (budgetLimitInput) {
    budgetLimitInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveBudgetSettings();
    });
}

// --- HUB LISTENERS ---
if (dom.backToHubBtn) dom.backToHubBtn.addEventListener('click', openHub);
if (dom.openNewBudgetModalBtn) dom.openNewBudgetModalBtn.addEventListener('click', openNewBudgetModal);
if (dom.cancelNewBudgetBtn) dom.cancelNewBudgetBtn.addEventListener('click', closeNewBudgetModal);
if (dom.createBudgetBtn) dom.createBudgetBtn.addEventListener('click', handleCreateBudget);
if (dom.newBudgetModal) {
    dom.newBudgetModal.addEventListener('click', (e) => {
        if (e.target === dom.newBudgetModal) closeNewBudgetModal();
    });
}
if (dom.newBudgetName) {
    dom.newBudgetName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCreateBudget();
    });
}
if (dom.newBudgetLimit) {
    dom.newBudgetLimit.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCreateBudget();
    });
}

// Edit Hub Budget Listeners
if (dom.cancelEditHubBudgetBtn) dom.cancelEditHubBudgetBtn.addEventListener('click', closeEditHubBudgetModal);
if (dom.saveEditHubBudgetBtn) dom.saveEditHubBudgetBtn.addEventListener('click', handleSaveEditHubBudget);
if (dom.editHubBudgetModal) {
    dom.editHubBudgetModal.addEventListener('click', (e) => {
        if (e.target === dom.editHubBudgetModal) closeEditHubBudgetModal();
    });
}
if (dom.editHubBudgetName) {
    dom.editHubBudgetName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSaveEditHubBudget();
    });
}
if (dom.editHubBudgetLimit) {
    dom.editHubBudgetLimit.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSaveEditHubBudget();
    });
}

// Delete Budget Listeners
if (dom.cancelDeleteBudgetBtn) dom.cancelDeleteBudgetBtn.addEventListener('click', closeDeleteBudgetModal);
if (dom.confirmDeleteBudgetBtn) dom.confirmDeleteBudgetBtn.addEventListener('click', confirmDeleteBudget);
if (dom.deleteBudgetModal) {
    dom.deleteBudgetModal.addEventListener('click', (e) => {
        if (e.target === dom.deleteBudgetModal) closeDeleteBudgetModal();
    });
}

// --- RECIPES LOGIC ---
let recipes = [];

function loadRecipes() {
    const saved = localStorage.getItem('lions_recipes');
    if (saved) {
        try {
            recipes = JSON.parse(saved);
        } catch (e) {
            console.error("Erro ao carregar receitas", e);
            recipes = [];
        }
    }
}

function saveRecipes() {
    localStorage.setItem('lions_recipes', JSON.stringify(recipes));
    renderRecipesList();
}

function openRecipesModal() {
    const isDark = state.theme === 'dark';
    
    // Update Modal Theme
    dom.recipesModalContent.className = isDark
        ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-gray-700 transition-colors duration-500 max-h-[80vh] flex flex-col'
        : 'bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-slate-100 transition-colors duration-500 max-h-[80vh] flex flex-col';
    
    dom.recipesModalTitle.className = isDark
        ? 'text-lg font-bold text-white transition-colors'
        : 'text-lg font-bold text-slate-800 transition-colors';

    renderRecipesList();
    dom.recipesModal.classList.remove('hidden');
}

function closeRecipesModal() {
    dom.recipesModal.classList.add('hidden');
}

function renderRecipesList() {
    const list = dom.recipesList;
    if (!list) return;
    list.innerHTML = '';

    if (recipes.length === 0) {
        list.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <i data-lucide="chef-hat" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                <p>Nenhuma receita cadastrada.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    recipes.forEach((recipe, index) => {
        const card = document.createElement('div');
        const isDark = state.theme === 'dark';
        
        card.className = isDark
            ? 'bg-gray-700 p-4 rounded-xl border border-gray-600 flex justify-between items-center group'
            : 'bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center group';
        
        const ingredientsCount = recipe.ingredients ? recipe.ingredients.length : 0;
        
        card.innerHTML = `
            <div>
                <h4 class="font-bold ${isDark ? 'text-white' : 'text-slate-800'}">${recipe.name}</h4>
                <p class="text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}">${ingredientsCount} ingredientes</p>
            </div>
            <div class="flex gap-2">
                <button onclick="addRecipeToBudget(${index})" class="p-2 rounded-lg ${isDark ? 'bg-indigo-900 text-indigo-300 hover:bg-indigo-800' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'} transition-colors" title="Adicionar à Lista">
                    <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                </button>
                <button onclick="deleteRecipe(${index})" class="p-2 rounded-lg text-slate-400 hover:text-red-500 ${isDark ? 'hover:bg-gray-600' : 'hover:bg-slate-100'} transition-colors" title="Excluir">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `;
        list.appendChild(card);
    });
    lucide.createIcons();
}

function openNewRecipeModal() {
    const isDark = state.theme === 'dark';
    
    // Update Modal Theme
    dom.newRecipeModalContent.className = isDark
        ? 'bg-gray-800 p-6 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-gray-700 transition-colors duration-500 max-h-[90vh] overflow-y-auto'
        : 'bg-white p-6 rounded-2xl shadow-xl max-w-md w-full mx-4 border border-slate-100 transition-colors duration-500 max-h-[90vh] overflow-y-auto';
    
    dom.newRecipeModalTitle.className = isDark
        ? 'text-lg font-bold text-white mb-4 transition-colors'
        : 'text-lg font-bold text-slate-800 mb-4 transition-colors';
    
    // Update Input Theme
    dom.recipeNameInput.className = isDark
        ? 'w-full h-10 px-4 bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg text-sm transition-all font-medium text-white placeholder-gray-400'
        : 'w-full h-10 px-4 bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg text-sm transition-all font-medium';

    dom.recipeNameInput.value = '';
    dom.recipeIngredientsList.innerHTML = '';
    addRecipeIngredientRow(); // Add first row
    addRecipeIngredientRow(); // Add second row
    dom.newRecipeModal.classList.remove('hidden');
}

function closeNewRecipeModal() {
    dom.newRecipeModal.classList.add('hidden');
}

function addRecipeIngredientRow() {
    const row = document.createElement('div');
    const isDark = state.theme === 'dark';
    row.className = 'flex gap-2 items-center';
    
    const inputClass = isDark
        ? 'bg-gray-700 border-transparent focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg text-sm transition-all text-white placeholder-gray-400'
        : 'bg-slate-50 border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-lg text-sm transition-all';

    row.innerHTML = `
        <input type="text" placeholder="Ingrediente" class="flex-1 h-9 px-3 ${inputClass} recipe-ing-name">
        <input type="number" placeholder="Qtd" class="w-16 h-9 px-2 ${inputClass} recipe-ing-qty">
        <div class="relative w-20 h-9">
            <select class="w-full h-full px-1 ${inputClass} recipe-ing-unit appearance-none text-center cursor-pointer">
                <option value="un">un</option>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="cx">cx</option>
                <option value="pct">pct</option>
            </select>
            <div class="absolute inset-y-0 right-1 flex items-center pointer-events-none text-slate-400">
                <i data-lucide="chevron-down" class="w-3 h-3"></i>
            </div>
        </div>
        <button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-red-500 p-1"><i data-lucide="x" class="w-4 h-4"></i></button>
    `;
    dom.recipeIngredientsList.appendChild(row);
    lucide.createIcons();
}

function saveRecipe() {
    const name = dom.recipeNameInput.value.trim();
    if (!name) {
        alert('Digite o nome da receita.');
        return;
    }

    const ingredients = [];
    const rows = dom.recipeIngredientsList.querySelectorAll('div');
    rows.forEach(row => {
        const ingName = row.querySelector('.recipe-ing-name').value.trim();
        const ingQty = parseFloat(row.querySelector('.recipe-ing-qty').value) || 1;
        const ingUnit = row.querySelector('.recipe-ing-unit').value;

        if (ingName) {
            ingredients.push({ name: ingName, quantity: ingQty, unit: ingUnit });
        }
    });

    if (ingredients.length === 0) {
        alert('Adicione pelo menos um ingrediente.');
        return;
    }

    recipes.push({ name, ingredients });
    saveRecipes();
    closeNewRecipeModal();
    renderRecipesList();
}

function deleteRecipe(index) {
    if (confirm('Excluir esta receita?')) {
        recipes.splice(index, 1);
        saveRecipes();
    }
}

async function addRecipeToBudget(index) {
    if (!state.activeBudgetId) {
        alert('Abra um orçamento primeiro para adicionar os ingredientes.');
        closeRecipesModal();
        return;
    }

    const recipe = recipes[index];
    if (!recipe) return;

    if (confirm(`Adicionar todos os ingredientes de "${recipe.name}" à lista atual?`)) {
        closeRecipesModal();
        
        // Add items sequentially
        for (const ing of recipe.ingredients) {
            const newItem = {
                name: ing.name,
                category: 'Geral', // Default category
                quantity: ing.quantity,
                unit: ing.unit,
                price: 0,
                checked: false
            };
            
            // Optimistic UI update
            state.items.push(newItem);
            
            // API Call (background)
            apiService.addItem(newItem).then(savedItem => {
                // Update with real ID if needed
            });
        }
        
        renderAll();
        alert(`${recipe.ingredients.length} ingredientes adicionados!`);
    }
}

// --- THEME LOGIC ---
function setTheme(themeName) {
    const root = document.documentElement;
    
    // Remove all theme classes
    root.classList.remove('theme-emerald', 'theme-rose', 'theme-amber');
    
    // Add new theme class if not default (indigo)
    if (themeName !== 'indigo') {
        root.classList.add(`theme-${themeName}`);
    }
    
    // Save preference
    localStorage.setItem('lions_theme_color', themeName);
    
    // Close settings modal
    closeSettingsModal();
}

// Load saved theme on init
const savedThemeColor = localStorage.getItem('lions_theme_color');
if (savedThemeColor) {
    setTheme(savedThemeColor);
}

// --- WHATSAPP SHARE ---
function shareList() {
    let text = `*Lista de Compras: ${state.budgetTitle}*\n\n`;
    const items = state.items;
    const pending = items.filter(i => !i.checked);
    const done = items.filter(i => i.checked);

    if (pending.length > 0) {
        text += "*A Comprar:*\n";
        pending.forEach(item => {
            text += `⬜ ${item.quantity}${item.unit || 'un'} ${item.name}\n`;
        });
        text += "\n";
    }

    if (done.length > 0) {
        text += "*Carrinho:*\n";
        done.forEach(item => {
            text += `✅ ${item.quantity}${item.unit || 'un'} ${item.name}\n`;
        });
    }
    
    const total = state.items.reduce((acc, curr) => acc + (curr.price * (curr.quantity || 1)), 0);
    text += `\nTotal Estimado: R$ ${total.toFixed(2)}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

// --- OFFLINE SUPPORT ---
window.addEventListener('online', async () => {
    console.log("Online");
    const overlay = document.getElementById('loading-overlay');
    if(overlay) overlay.classList.add('hidden');
    
    const offlineWarning = document.getElementById('offline-warning');
    if(offlineWarning) offlineWarning.classList.add('hidden');
    
    // Reload data from API
    try {
        const budgets = await apiService.fetchBudgets();
        state.budgets = budgets;
        state.products = await apiService.fetchProducts();
        renderAll();
    } catch (e) {
        console.error("Erro ao recarregar dados após reconexão:", e);
    }
});

window.addEventListener('offline', () => {
    console.log("Offline");
    const offlineWarning = document.getElementById('offline-warning');
    if(offlineWarning) offlineWarning.classList.remove('hidden');
});

// --- INICIALIZAÇÃO ---
init();

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}