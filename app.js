// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCDMuiwxLNqH2sbDKIwQnjMc_E27rDPnEI",
    authDomain: "anchan4746.firebaseapp.com",
    projectId: "anchan4746",
    storageBucket: "anchan4746.firebasestorage.app",
    messagingSenderId: "358621818152",
    appId: "1:358621818152:web:1ccac6a819cd30d4acb41d",
    measurementId: "G-302NV4RS6Z"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// Permissions configuration
const permissions = [
    { key: "dashboard", name: "Dashboard Access", category: "General" },
    { key: "prospects", name: "Full Prospect Management", category: "CRM" },
    { key: "prospects_view", name: "View Prospects Only", category: "CRM" },
    { key: "prospects_add", name: "Add New Prospects", category: "CRM" },
    { key: "prospects_edit", name: "Edit Prospects", category: "CRM" },
    { key: "prospects_delete", name: "Delete Prospects", category: "CRM" },
    { key: "team_view", name: "View Team", category: "Team" },
    { key: "team_manage", name: "Manage Team", category: "Team" },
    { key: "analytics_view", name: "View Analytics", category: "Reports" },
    { key: "analytics_export", name: "Export Analytics", category: "Reports" },
    { key: "hrms", name: "HRMS Access", category: "Administration" },
    { key: "users_management", name: "User Management", category: "Administration" },
    { key: "settings", name: "System Settings", category: "Administration" },
    { key: "profile", name: "Profile Management", category: "General" }
];

// Global variables
let users = [];
let filteredUsers = [];
let employeeCounter = 1;
let currentUser = null;
let confirmCallback = null;
let isAuthenticated = false;

// DOM Elements
const elements = {
    loadingScreen: null,
    loginPage: null,
    hrmsApp: null,
    loginForm: null,
    logoutBtn: null,
    addUserBtn: null,
    usersTable: null,
    userModal: null,
    userForm: null,
    confirmModal: null,
    toast: null,
    searchUsers: null,
    filterRole: null,
    filterDepartment: null,
    exportBtn: null
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    initializeApp();
    setupEventListeners();
});

// Initialize DOM elements
function initializeElements() {
    elements.loadingScreen = document.getElementById('loading-screen');
    elements.loginPage = document.getElementById('login-page');
    elements.hrmsApp = document.getElementById('hrms-app');
    elements.loginForm = document.getElementById('login-form');
    elements.logoutBtn = document.getElementById('logout-btn');
    elements.addUserBtn = document.getElementById('add-user-btn');
    elements.usersTable = document.getElementById('users-table');
    elements.userModal = document.getElementById('user-modal');
    elements.userForm = document.getElementById('user-form');
    elements.confirmModal = document.getElementById('confirm-modal');
    elements.toast = document.getElementById('toast');
    elements.searchUsers = document.getElementById('search-users');
    elements.filterRole = document.getElementById('filter-role');
    elements.filterDepartment = document.getElementById('filter-department');
    elements.exportBtn = document.getElementById('export-btn');
}

// Application initialization
function initializeApp() {
    try {
        showLoadingScreen();
        
        // For demo purposes, start with login page
        setTimeout(() => {
            showLoginPage();
        }, 1000);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showToast('Error initializing application', 'error');
        showLoginPage();
    }
}

// Event listeners setup
function setupEventListeners() {
    // Login form
    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLogin);
    }
    
    // Logout button
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Add user button
    if (elements.addUserBtn) {
        elements.addUserBtn.addEventListener('click', () => showUserModal());
    }
    
    // User form
    if (elements.userForm) {
        elements.userForm.addEventListener('submit', handleUserFormSubmit);
    }
    
    // Modal close buttons
    const closeUserModalBtn = document.getElementById('close-user-modal');
    const cancelUserBtn = document.getElementById('cancel-user-btn');
    const closeConfirmModalBtn = document.getElementById('close-confirm-modal');
    const cancelConfirmBtn = document.getElementById('cancel-confirm-btn');
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    
    if (closeUserModalBtn) closeUserModalBtn.addEventListener('click', closeUserModal);
    if (cancelUserBtn) cancelUserBtn.addEventListener('click', closeUserModal);
    if (closeConfirmModalBtn) closeConfirmModalBtn.addEventListener('click', closeConfirmModal);
    if (cancelConfirmBtn) cancelConfirmBtn.addEventListener('click', closeConfirmModal);
    if (confirmActionBtn) confirmActionBtn.addEventListener('click', executeConfirmAction);
    
    // Modal backdrop clicks
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeAllModals();
            }
        });
    });
    
    // Search and filters
    if (elements.searchUsers) {
        elements.searchUsers.addEventListener('input', handleSearch);
    }
    if (elements.filterRole) {
        elements.filterRole.addEventListener('change', handleFilters);
    }
    if (elements.filterDepartment) {
        elements.filterDepartment.addEventListener('change', handleFilters);
    }
    
    // Export button
    if (elements.exportBtn) {
        elements.exportBtn.addEventListener('click', exportUsers);
    }
    
    // Toast close button
    const toastCloseBtn = document.querySelector('.toast-close');
    if (toastCloseBtn) {
        toastCloseBtn.addEventListener('click', hideToast);
    }
}

// Authentication functions
async function handleLogin(e) {
    e.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (!usernameInput || !passwordInput) {
        showToast('Login form elements not found', 'error');
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    console.log('Attempting login with:', username, password); // Debug log
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        try {
            showLoadingScreen();
            
            // Simulate authentication process
            currentUser = { username: 'admin', role: 'admin' };
            isAuthenticated = true;
            
            // Load initial data
            await loadUsers();
            
            // Show main app
            showHRMSApp();
            showToast('Login successful! Welcome to HRMS', 'success');
            
            // Clear form
            usernameInput.value = '';
            passwordInput.value = '';
            
        } catch (error) {
            console.error('Login error:', error);
            showToast('Login failed. Please try again.', 'error');
            showLoginPage();
        }
    } else {
        showToast('Invalid credentials. Use admin/admin123', 'error');
    }
}

async function handleLogout() {
    try {
        currentUser = null;
        isAuthenticated = false;
        users = [];
        filteredUsers = [];
        
        // Clear all form data
        if (elements.loginForm) {
            elements.loginForm.reset();
        }
        
        showLoginPage();
        showToast('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showToast('Error logging out', 'error');
    }
}

// Database operations
async function loadUsers() {
    try {
        // Load sample data for demo
        const sampleUsers = [
            {
                id: 'user1',
                employeeId: 'EMP001',
                name: 'John Doe',
                email: 'john@company.com',
                phone: '+1234567890',
                role: 'Manager',
                department: 'Operations',
                permissions: ['dashboard', 'users_management', 'hrms'],
                status: 'active',
                createdAt: new Date('2024-01-15'),
                lastLogin: new Date('2024-01-20')
            },
            {
                id: 'user2',
                employeeId: 'EMP002',
                name: 'Jane Smith',
                email: 'jane@company.com',
                phone: '+1234567891',
                role: 'Team Leader',
                department: 'Sales',
                permissions: ['dashboard', 'prospects', 'team_view'],
                status: 'active',
                createdAt: new Date('2024-01-16'),
                lastLogin: new Date('2024-01-19')
            },
            {
                id: 'user3',
                employeeId: 'EMP003',
                name: 'Mike Johnson',
                email: 'mike@company.com',
                phone: '+1234567892',
                role: 'Member',
                department: 'Marketing',
                permissions: ['dashboard', 'prospects_view'],
                status: 'inactive',
                createdAt: new Date('2024-01-17'),
                lastLogin: new Date('2024-01-18')
            }
        ];
        
        users = [...sampleUsers];
        employeeCounter = 4;
        
        filteredUsers = [...users];
        updateHRMSStats();
        updateUsersTable();
        
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users', 'error');
    }
}

async function saveUser(userData) {
    try {
        if (userData.id) {
            // Update existing user
            const userIndex = users.findIndex(u => u.id === userData.id);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...userData, updatedAt: new Date() };
                showToast('User updated successfully!', 'success');
            }
        } else {
            // Create new user
            const newUser = {
                ...userData,
                id: 'user' + Date.now(),
                employeeId: `EMP${String(employeeCounter).padStart(3, '0')}`,
                status: 'active',
                createdAt: new Date(),
                lastLogin: null,
                passwordChanged: false
            };
            
            users.unshift(newUser);
            employeeCounter++;
            
            showToast('User created successfully!', 'success');
        }
        
        await logActivity('user_saved', `User ${userData.id ? 'updated' : 'created'}: ${userData.name}`);
        
        filteredUsers = [...users];
        updateHRMSStats();
        updateUsersTable();
        closeUserModal();
        
    } catch (error) {
        console.error('Error saving user:', error);
        showToast('Error saving user', 'error');
    }
}

async function deleteUser(userId) {
    try {
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            const deletedUser = users[userIndex];
            users.splice(userIndex, 1);
            
            await logActivity('user_deleted', `User deleted: ${deletedUser.name}`);
            showToast('User deleted successfully!', 'success');
        }
        
        filteredUsers = [...users];
        updateHRMSStats();
        updateUsersTable();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Error deleting user', 'error');
    }
}

async function toggleUserStatus(userId) {
    try {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        user.status = newStatus;
        user.updatedAt = new Date();
        
        const action = newStatus === 'active' ? 'activated' : 'deactivated';
        await logActivity('user_status_changed', `User ${action}: ${user.name}`);
        showToast(`User ${action} successfully!`, 'success');
        
        filteredUsers = [...users];
        updateHRMSStats();
        updateUsersTable();
        
    } catch (error) {
        console.error('Error updating user status:', error);
        showToast('Error updating user status', 'error');
    }
}

// Activity logging
async function logActivity(action, description) {
    try {
        console.log(`Activity logged: ${action} - ${description}`);
        // In a real app, this would save to Firebase
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

// UI update functions
function updateHRMSStats() {
    const totalMembers = users.length;
    const activeMembers = users.filter(u => u.status === 'active').length;
    const inactiveMembers = users.filter(u => u.status === 'inactive').length;
    
    const totalEl = document.getElementById('total-members');
    const activeEl = document.getElementById('active-members');
    const inactiveEl = document.getElementById('inactive-members');
    
    if (totalEl) totalEl.textContent = totalMembers;
    if (activeEl) activeEl.textContent = activeMembers;
    if (inactiveEl) inactiveEl.textContent = inactiveMembers;
}

function updateUsersTable() {
    const container = elements.usersTable;
    if (!container) return;
    
    if (filteredUsers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>No users found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table class="table">
            <thead>
                <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredUsers.map(user => `
                    <tr>
                        <td>${user.employeeId || 'N/A'}</td>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${user.phone}</td>
                        <td>${user.role}</td>
                        <td>${user.department}</td>
                        <td>
                            <span class="status-badge ${user.status}">
                                ${user.status}
                            </span>
                        </td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn edit" onclick="editUser('${user.id}')" title="Edit User">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn toggle" onclick="confirmToggleUserStatus('${user.id}')" title="${user.status === 'active' ? 'Deactivate' : 'Activate'} User">
                                    <i class="fas fa-${user.status === 'active' ? 'user-slash' : 'user-check'}"></i>
                                </button>
                                <button class="action-btn delete" onclick="confirmDeleteUser('${user.id}')" title="Delete User">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Modal functions
function showUserModal(userId = null) {
    const modal = elements.userModal;
    const title = document.getElementById('user-modal-title');
    const form = elements.userForm;
    
    if (!modal || !title || !form) return;
    
    if (userId) {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        
        title.textContent = 'Edit Member';
        document.getElementById('user-id').value = user.id;
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-phone').value = user.phone;
        document.getElementById('user-role').value = user.role;
        document.getElementById('user-department').value = user.department;
        
        updatePermissionsGrid(user.permissions || []);
    } else {
        title.textContent = 'Add New Member';
        form.reset();
        document.getElementById('user-id').value = '';
        updatePermissionsGrid([]);
    }
    
    modal.classList.remove('hidden');
}

function updatePermissionsGrid(userPermissions = []) {
    const container = document.getElementById('permissions-grid');
    if (!container) return;
    
    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, permission) => {
        if (!acc[permission.category]) {
            acc[permission.category] = [];
        }
        acc[permission.category].push(permission);
        return acc;
    }, {});
    
    container.innerHTML = Object.entries(groupedPermissions).map(([category, perms]) => `
        <div class="permission-category" style="grid-column: span 1;">
            <h5 style="margin: 0 0 8px 0; color: var(--color-text); font-size: var(--font-size-sm); font-weight: var(--font-weight-semibold);">${category}</h5>
            ${perms.map(permission => {
                const isChecked = userPermissions.includes('all') || userPermissions.includes(permission.key);
                return `
                    <div class="permission-item">
                        <input type="checkbox" 
                               id="perm-${permission.key}" 
                               class="permission-checkbox" 
                               value="${permission.key}"
                               ${isChecked ? 'checked' : ''}>
                        <label for="perm-${permission.key}" class="permission-label">
                            ${permission.name}
                        </label>
                    </div>
                `;
            }).join('')}
        </div>
    `).join('');
}

function closeUserModal() {
    if (elements.userModal) {
        elements.userModal.classList.add('hidden');
    }
}

function showConfirmModal(title, message, callback) {
    const modal = elements.confirmModal;
    const titleEl = document.getElementById('confirm-title');
    const messageEl = document.getElementById('confirm-message');
    
    if (!modal || !titleEl || !messageEl) return;
    
    titleEl.textContent = title;
    messageEl.textContent = message;
    confirmCallback = callback;
    
    modal.classList.remove('hidden');
}

function closeConfirmModal() {
    if (elements.confirmModal) {
        elements.confirmModal.classList.add('hidden');
    }
    confirmCallback = null;
}

function executeConfirmAction() {
    if (confirmCallback) {
        confirmCallback();
        confirmCallback = null;
    }
    closeConfirmModal();
}

function closeAllModals() {
    closeUserModal();
    closeConfirmModal();
}

// Form handling
async function handleUserFormSubmit(e) {
    e.preventDefault();
    
    const selectedPermissions = Array.from(document.querySelectorAll('.permission-checkbox:checked'))
                                     .map(cb => cb.value);
    
    const userData = {
        id: document.getElementById('user-id').value || null,
        name: document.getElementById('user-name').value.trim(),
        email: document.getElementById('user-email').value.trim(),
        phone: document.getElementById('user-phone').value.trim(),
        role: document.getElementById('user-role').value,
        department: document.getElementById('user-department').value,
        permissions: selectedPermissions
    };
    
    // Validate required fields
    if (!userData.name || !userData.email || !userData.phone || !userData.role || !userData.department) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    await saveUser(userData);
}

// User action functions (global functions for onclick handlers)
window.editUser = function(userId) {
    showUserModal(userId);
};

window.confirmDeleteUser = function(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    showConfirmModal(
        'Delete User',
        `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
        () => deleteUser(userId)
    );
};

window.confirmToggleUserStatus = function(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    showConfirmModal(
        `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
        `Are you sure you want to ${action} ${user.name}?`,
        () => toggleUserStatus(userId)
    );
};

// Search and filter functions
function handleSearch() {
    const searchTerm = elements.searchUsers?.value.toLowerCase() || '';
    applyFilters(searchTerm);
}

function handleFilters() {
    const searchTerm = elements.searchUsers?.value.toLowerCase() || '';
    applyFilters(searchTerm);
}

function applyFilters(searchTerm = '') {
    const roleFilter = elements.filterRole?.value || '';
    const departmentFilter = elements.filterDepartment?.value || '';
    
    filteredUsers = users.filter(user => {
        const matchesSearch = !searchTerm || 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm));
            
        const matchesRole = !roleFilter || user.role === roleFilter;
        const matchesDepartment = !departmentFilter || user.department === departmentFilter;
        
        return matchesSearch && matchesRole && matchesDepartment;
    });
    
    updateUsersTable();
}

// Export functionality
function exportUsers() {
    if (filteredUsers.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }
    
    const csv = convertToCSV(filteredUsers);
    downloadCSV(csv, 'hrms_users.csv');
    showToast('Data exported successfully!', 'success');
}

function convertToCSV(data) {
    const headers = ['Employee ID', 'Name', 'Email', 'Phone', 'Role', 'Department', 'Status', 'Permissions'];
    const rows = data.map(user => [
        user.employeeId || '',
        user.name || '',
        user.email || '',
        user.phone || '',
        user.role || '',
        user.department || '',
        user.status || '',
        (user.permissions || []).join(';')
    ]);
    
    const csvContent = [headers, ...rows].map(row => 
        row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    return csvContent;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Toast notification functions
function showToast(message, type = 'info') {
    const toast = elements.toast;
    const icon = toast?.querySelector('.toast-icon');
    const messageEl = toast?.querySelector('.toast-message');
    
    if (!toast || !icon || !messageEl) return;
    
    // Set toast type
    toast.className = `toast ${type}`;
    
    // Set icon based on type
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    icon.className = `toast-icon ${icons[type] || icons.info}`;
    messageEl.textContent = message;
    
    // Show toast
    toast.classList.remove('hidden');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideToast();
    }, 5000);
}

function hideToast() {
    if (elements.toast) {
        elements.toast.classList.add('hidden');
    }
}

// Screen navigation functions
function showLoadingScreen() {
    if (elements.loadingScreen) elements.loadingScreen.classList.remove('hidden');
    if (elements.loginPage) elements.loginPage.classList.add('hidden');
    if (elements.hrmsApp) elements.hrmsApp.classList.add('hidden');
}

function showLoginPage() {
    if (elements.loadingScreen) elements.loadingScreen.classList.add('hidden');
    if (elements.loginPage) elements.loginPage.classList.remove('hidden');
    if (elements.hrmsApp) elements.hrmsApp.classList.add('hidden');
}

function showHRMSApp() {
    if (elements.loadingScreen) elements.loadingScreen.classList.add('hidden');
    if (elements.loginPage) elements.loginPage.classList.add('hidden');
    if (elements.hrmsApp) elements.hrmsApp.classList.remove('hidden');
}

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showToast('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showToast('An unexpected error occurred', 'error');
});