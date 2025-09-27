// Firebase configuration and imports
const firebaseConfig = {
  apiKey: "AIzaSyACCpl5f7g34Fs0eMxUguBuGE80SuKZCIA",
  authDomain: "hrms-326ad.firebaseapp.com",
  projectId: "hrms-326ad",
  storageBucket: "hrms-326ad.firebasestorage.app",
  messagingSenderId: "813107687048",
  appId: "1:813107687048:web:2d3c2fff54a65285ba793d",
  measurementId: "G-HXGFCBV64Q"
};

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // Initialize Firebase Auth

// Global state
let employees = [];
let filteredEmployees = [];
let currentEmployee = null;
let isEditMode = false;
let currentPage = 1;
const itemsPerPage = 50;
let sortField = 'fullName';
let sortDirection = 'asc';

// No longer needed with Firebase Auth
// const ADMIN_CREDENTIALS = {
//   username: 'Admin4746',
//   password: 'Admin4746'
// };

// DOM Elements
const loginPage = document.getElementById('loginPage');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

// Navigation elements
const teamViewBtn = document.getElementById('teamViewBtn');
const employeeMgmtBtn = document.getElementById('employeeMgmtBtn');
const logoutBtn = document.getElementById('logoutBtn');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebar = document.querySelector('.sidebar');

// Theme toggle
const themeToggle = document.getElementById('themeToggle');

// Content sections
const teamView = document.getElementById('teamView');
const employeeMgmt = document.getElementById('employeeMgmt');
const pageTitle = document.getElementById('pageTitle');

// Table elements
const employeesTable = document.getElementById('employeesTable');
const employeesTableBody = document.getElementById('employeesTableBody');
const loadingSpinner = document.getElementById('loadingSpinner');
const noEmployees = document.getElementById('noEmployees');

// Search and filters
const globalSearch = document.getElementById('globalSearch');
const statusFilter = document.getElementById('statusFilter');
const designationFilter = document.getElementById('designationFilter');
const exportBtn = document.getElementById('exportBtn');

// Form elements
const employeeForm = document.getElementById('employeeForm');
const employeeDataForm = document.getElementById('employeeDataForm');
const addNewBtn = document.getElementById('addNewBtn');
const closeFormBtn = document.getElementById('closeFormBtn');
const cancelFormBtn = document.getElementById('cancelFormBtn');
const formTitle = document.getElementById('formTitle');
const submitText = document.getElementById('submitText');

// Modal elements
const employeeModal = document.getElementById('employeeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const editEmployeeBtn = document.getElementById('editEmployeeBtn');
const deleteEmployeeBtn = document.getElementById('deleteEmployeeBtn');
const deleteModal = document.getElementById('deleteModal');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');

// Toast container
const toastContainer = document.getElementById('toastContainer');

// Employee cards container
const employeeCards = document.getElementById('employeeCards');

// Form fields
const formFields = {
  empCode: document.getElementById('empCode'),
  fullName: document.getElementById('fullName'),
  fatherName: document.getElementById('fatherName'),
  dob: document.getElementById('dob'),
  doj: document.getElementById('doj'),
  status: document.getElementById('status'),
  dol: document.getElementById('dol'),
  mobile: document.getElementById('mobile'),
  employeeEmail: document.getElementById('employeeEmail'), // Changed from email to employeeEmail
  empPassword: document.getElementById('empPassword'),
  location: document.getElementById('location'),
  designation: document.getElementById('designation')
};

const dolGroup = document.getElementById('dolGroup');

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupEventListeners();
  setupFirestoreListeners();
  
  // Firebase Auth state listener
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      showDashboard();
    } else {
      // User is signed out
      showLogin();
    }
  });
});

// Authentication functions
function checkAuthState() {
  // This function is no longer needed as onAuthStateChanged handles it
}

function showLogin() {
  loginPage.classList.remove('hidden');
  dashboard.classList.add('hidden');
}

function showDashboard() {
  loginPage.classList.add('hidden');
  dashboard.classList.remove('hidden');
  showTeamView();
}

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value.trim(); // Changed from username to email
  const password = document.getElementById('password').value.trim();
  
  if (!email || !password) {
    showError('Please enter both email and password');
    return;
  }
  
  try {
    await signInWithEmailAndPassword(auth, email, password);
    showToast('Login successful!', 'success');
    loginForm.reset();
    hideError();
  } catch (error) {
    console.error('Firebase Login Error:', error.code, error.message);
    let errorMessage = 'Invalid credentials. Please try again.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid email or password.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address format.';
    }
    showError(errorMessage);
  }
}

async function handleLogout() {
  try {
    await signOut(auth);
    showToast('Logged out successfully', 'info');
  } catch (error) {
    console.error('Firebase Logout Error:', error.code, error.message);
    showToast('Error logging out', 'error');
  }
}

function showError(message) {
  loginError.textContent = message;
  loginError.classList.remove('hidden');
}

function hideError() {
  loginError.classList.add('hidden');
}

// Theme functions
function initializeTheme() {
  const savedTheme = localStorage.getItem('hrms_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('hrms_theme', newTheme);
  updateThemeIcon(newTheme);
  showToast(`Switched to ${newTheme} mode`, 'info');
}

function updateThemeIcon(theme) {
  const icon = themeToggle.querySelector('i');
  icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// Navigation functions
function showTeamView() {
  teamView.classList.add('active');
  employeeMgmt.classList.remove('active');
  teamViewBtn.classList.add('active');
  employeeMgmtBtn.classList.remove('active');
  pageTitle.textContent = 'Team View';
  hideEmployeeForm();
}

function showEmployeeMgmt() {
  teamView.classList.remove('active');
  employeeMgmt.classList.add('active');
  teamViewBtn.classList.remove('active');
  employeeMgmtBtn.classList.add('active');
  pageTitle.textContent = 'Employee Management';
  renderEmployeeCards();
}

function toggleSidebar() {
  sidebar.classList.toggle('show');
}

// Firestore functions
function setupFirestoreListeners() {
  const employeesRef = collection(db, 'employees');
  
  onSnapshot(employeesRef, (snapshot) => {
    employees = [];
    snapshot.forEach((doc) => {
      employees.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Sort employees by name by default
    employees.sort((a, b) => a.fullName.localeCompare(b.fullName));
    
    
    applyFilters();
    renderEmployeesTable();
    renderEmployeeCards();
    hideLoading();
  }, (error) => {
    console.error('Error fetching employees:', error);
    showToast('Error loading employees', 'error');
    hideLoading();
  });
}

async function addEmployee(employeeData) {
  try {
    const employeesRef = collection(db, 'employees');
    await addDoc(employeesRef, {
      ...employeeData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    showToast('Employee added successfully', 'success');
    resetForm();
    hideEmployeeForm();
  } catch (error) {
    console.error('Error adding employee:', error);
    showToast('Error adding employee', 'error');
  }
}

async function updateEmployee(id, employeeData) {
  try {
    const employeeRef = doc(db, 'employees', id);
    await updateDoc(employeeRef, {
      ...employeeData,
      updatedAt: serverTimestamp()
    });
    showToast('Employee updated successfully', 'success');
    resetForm();
    hideEmployeeForm();
    closeModal();
  } catch (error) {
    console.error('Error updating employee:', error);
    showToast('Error updating employee', 'error');
  }
}

async function removeEmployee(id) {
  try {
    const employeeRef = doc(db, 'employees', id);
    await deleteDoc(employeeRef);
    showToast('Employee deleted successfully', 'success');
    closeModal();
    closeDeleteModal();
  } catch (error) {
    console.error('Error deleting employee:', error);
    showToast('Error deleting employee', 'error');
  }
}

// UI rendering functions
function renderEmployeesTable() {
  if (filteredEmployees.length === 0) {
    employeesTableBody.innerHTML = '';
    noEmployees.classList.remove('hidden');
    return;
  }
  
  noEmployees.classList.add('hidden');
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);
  
  employeesTableBody.innerHTML = paginatedEmployees.map(employee => `
    <tr onclick="openEmployeeModal('${employee.id}')" data-id="${employee.id}">
      <td>${employee.empCode}</td>
      <td>${employee.fullName}</td>
      <td>${employee.designation}</td>
      <td>
        <span class="status-badge ${employee.status.toLowerCase()}">
          ${employee.status}
        </span>
      </td>
      <td>
        <button class="action-btn" onclick="event.stopPropagation(); editEmployee('${employee.id}')" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="action-btn" onclick="event.stopPropagation(); openDeleteModal('${employee.id}')" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
  
  renderPagination();
}

function renderEmployeeCards() {
  if (!employeeCards) return;
  
  if (filteredEmployees.length === 0) {
    employeeCards.innerHTML = '<div class="no-data"><i class="fas fa-users-slash"></i><p>No employees found</p></div>';
    return;
  }
  
  employeeCards.innerHTML = filteredEmployees.map(employee => `
    <div class="employee-card" onclick="openEmployeeModal('${employee.id}')">
      <div class="employee-card-header">
        <div>
          <h4>${employee.fullName}</h4>
          <div class="emp-code">${employee.empCode}</div>
        </div>
        <span class="status-badge ${employee.status.toLowerCase()}">
          ${employee.status}
        </span>
      </div>
      <div class="designation">${employee.designation}</div>
      <div class="details">
        <div><i class="fas fa-envelope"></i> ${employee.email}</div>
        <div><i class="fas fa-phone"></i> ${employee.mobile}</div>
        <div><i class="fas fa-map-marker-alt"></i> ${employee.location}</div>
        <div><i class="fas fa-calendar"></i> Joined: ${formatDate(employee.doj)}</div>
      </div>
      <div class="employee-card-actions">
        <button class="btn btn--sm btn--primary" onclick="event.stopPropagation(); editEmployee('${employee.id}')">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn--sm btn--outline" onclick="event.stopPropagation(); openDeleteModal('${employee.id}')">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `).join('');
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;
  
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let paginationHTML = '';
  
  // Previous button
  if (currentPage > 1) {
    paginationHTML += `<button class="btn btn--secondary" onclick="changePage(${currentPage - 1})">
      <i class="fas fa-chevron-left"></i>
    </button>`;
  }
  
  // Page numbers
  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    const active = i === currentPage ? 'active' : '';
    paginationHTML += `<button class="btn btn--secondary ${active}" onclick="changePage(${i})">${i}</button>`;
  }
  
  // Next button
  if (currentPage < totalPages) {
    paginationHTML += `<button class="btn btn--secondary" onclick="changePage(${currentPage + 1})">
      <i class="fas fa-chevron-right"></i>
    </button>`;
  }
  
  pagination.innerHTML = paginationHTML;
}

// Search and filter functions
function applyFilters() {
  filteredEmployees = employees.filter(employee => {
    const searchTerm = globalSearch.value.toLowerCase();
    const statusValue = statusFilter.value;
    const designationValue = designationFilter.value;
    
    const matchesSearch = !searchTerm || 
      employee.fullName.toLowerCase().includes(searchTerm) ||
      employee.empCode.toLowerCase().includes(searchTerm);
    
    const matchesStatus = !statusValue || employee.status === statusValue;
    const matchesDesignation = !designationValue || employee.designation === designationValue;
    
    return matchesSearch && matchesStatus && matchesDesignation;
  });
  
  // Apply sorting
  filteredEmployees.sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
  
  currentPage = 1; // Reset to first page
}

function handleSort(field) {
  if (sortField === field) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortField = field;
    sortDirection = 'asc';
  }
  
  // Update sort indicators
  document.querySelectorAll('th').forEach(th => {
    th.classList.remove('sort-asc', 'sort-desc');
  });
  
  const currentTh = document.querySelector(`th[data-sort="${field}"]`);
  if (currentTh) {
    currentTh.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
  }
  
  applyFilters();
  renderEmployeesTable();
}

function changePage(page) {
  currentPage = page;
  renderEmployeesTable();
}

// Form functions
function showEmployeeForm(edit = false) {
  employeeForm.classList.remove('hidden');
  formTitle.textContent = edit ? 'Edit Employee' : 'Add New Employee';
  submitText.textContent = edit ? 'Update Employee' : 'Save Employee';
  isEditMode = edit;
  
  // If not editing, ensure form is completely reset
  if (!edit) {
    resetForm();
  }
}

function hideEmployeeForm() {
  employeeForm.classList.add('hidden');
  resetForm();
}

function resetForm() {
  employeeDataForm.reset();
  currentEmployee = null;
  isEditMode = false;
  dolGroup.style.display = 'none';
  
  // Clear all form fields explicitly
  Object.values(formFields).forEach(field => {
    if (field) {
      field.value = '';
    }
  });
  
  // Reset status to default
  if (formFields.status) {
    formFields.status.value = 'Active';
  }
  
  // Reset designation to default
  if (formFields.designation) {
    formFields.designation.selectedIndex = 0;
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  const formData = new FormData(employeeDataForm);
  const employeeData = {
    empCode: formFields.empCode.value.trim(),
    fullName: formFields.fullName.value.trim(),
    fatherName: formFields.fatherName.value.trim(),
    dob: formFields.dob.value,
    doj: formFields.doj.value,
    status: formFields.status.value,
    dol: formFields.status.value === 'Deactive' ? formFields.dol.value || null : null,
    mobile: formFields.mobile.value.trim(),
    email: formFields.employeeEmail.value.trim().toLowerCase(), // Changed from formFields.email
    password: formFields.empPassword.value,
    location: formFields.location.value.trim(),
    designation: formFields.designation.value
  };
  
  if (isEditMode && currentEmployee) {
    updateEmployee(currentEmployee.id, employeeData);
  } else {
    // Check for duplicate employee code
    const duplicateCode = employees.find(emp => emp.empCode === employeeData.empCode);
    if (duplicateCode) {
      showToast('Employee code already exists', 'error');
      return;
    }
    
    addEmployee(employeeData);
  }
}

function validateForm() {
  const requiredFields = ['empCode', 'fullName', 'fatherName', 'dob', 'doj', 'status', 'mobile', 'employeeEmail', 'empPassword', 'location', 'designation'];
  
  for (const field of requiredFields) {
    if (!formFields[field].value.trim()) {
      showToast(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`, 'error');
      formFields[field].focus();
      return false;
    }
  }
  
  // Validate email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(formFields.employeeEmail.value)) { // Changed from formFields.email
    showToast('Please enter a valid email address', 'error');
    formFields.employeeEmail.focus(); // Changed from formFields.email
    return false;
  }
  
  // Validate mobile number
  const mobilePattern = /^[+]?[0-9]{10,15}$/;
  if (!mobilePattern.test(formFields.mobile.value.replace(/\s/g, ''))) {
    showToast('Please enter a valid mobile number', 'error');
    formFields.mobile.focus();
    return false;
  }
  
  // Validate dates
  const dob = new Date(formFields.dob.value);
  const doj = new Date(formFields.doj.value);
  const today = new Date();
  
  if (dob >= today) {
    showToast('Date of birth must be in the past', 'error');
    formFields.dob.focus();
    return false;
  }
  
  if (doj > today) {
    showToast('Date of joining cannot be in the future', 'error');
    formFields.doj.focus();
    return false;
  }
  
  if (formFields.status.value === 'Deactive' && formFields.dol.value) {
    const dol = new Date(formFields.dol.value);
    if (dol < doj) {
      showToast('Date of leaving cannot be before date of joining', 'error');
      formFields.dol.focus();
      return false;
    }
  }
  
  return true;
}

function editEmployee(id) {
  const employee = employees.find(emp => emp.id === id);
  if (!employee) return;
  
  currentEmployee = employee;
  
  // First reset form to clear any previous data
  resetForm();
  
  // Then populate form with employee data
  Object.keys(formFields).forEach(key => {
    const field = formFields[key];
    const value = employee[key === 'empPassword' ? 'password' : key];
    if (field && value !== undefined && value !== null) {
      field.value = value;
    }
  });
  
  // Handle status-dependent fields
  handleStatusChange();
  
  showEmployeeForm(true);
  showEmployeeMgmt();
}

function handleStatusChange() {
  if (formFields.status.value === 'Deactive') {
    dolGroup.style.display = 'block';
    formFields.dol.required = true;
  } else {
    dolGroup.style.display = 'none';
    formFields.dol.required = false;
    formFields.dol.value = '';
  }
}

// Modal functions
function openEmployeeModal(id) {
  const employee = employees.find(emp => emp.id === id);
  if (!employee) return;
  
  currentEmployee = employee;
  
  document.getElementById('modalEmployeeName').textContent = employee.fullName;
  
  const detailsHTML = `
    <div class="detail-item">
      <div class="detail-label">Employee Code</div>
      <div class="detail-value">${employee.empCode}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Full Name</div>
      <div class="detail-value">${employee.fullName}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Father's Name</div>
      <div class="detail-value">${employee.fatherName}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Date of Birth</div>
      <div class="detail-value">${formatDate(employee.dob)}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Date of Joining</div>
      <div class="detail-value">${formatDate(employee.doj)}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Status</div>
      <div class="detail-value">
        <span class="status-badge ${employee.status.toLowerCase()}">${employee.status}</span>
      </div>
    </div>
    ${employee.status === 'Deactive' && employee.dol ? `
    <div class="detail-item">
      <div class="detail-label">Date of Leaving</div>
      <div class="detail-value">${formatDate(employee.dol)}</div>
    </div>
    ` : ''}
    <div class="detail-item">
      <div class="detail-label">Mobile Number</div>
      <div class="detail-value">${employee.mobile}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Email</div>
      <div class="detail-value">${employee.email}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Location</div>
      <div class="detail-value">${employee.location}</div>
    </div>
    <div class="detail-item">
      <div class="detail-label">Designation</div>
      <div class="detail-value">${employee.designation}</div>
    </div>
  `;
  
  document.getElementById('employeeDetails').innerHTML = detailsHTML;
  employeeModal.classList.remove('hidden');
}

function closeModal() {
  employeeModal.classList.add('hidden');
  currentEmployee = null;
}

function openDeleteModal(id) {
  const employee = employees.find(emp => emp.id === id);
  if (!employee) return;
  
  currentEmployee = employee;
  document.getElementById('deleteEmployeeName').textContent = employee.fullName;
  deleteModal.classList.remove('hidden');
}

function closeDeleteModal() {
  deleteModal.classList.add('hidden');
  currentEmployee = null;
}

function confirmDelete() {
  if (currentEmployee) {
    removeEmployee(currentEmployee.id);
  }
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'fas fa-check-circle' : 
               type === 'error' ? 'fas fa-exclamation-circle' : 
               'fas fa-info-circle';
  
  toast.innerHTML = `
    <i class="${icon}"></i>
    <span>${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 5000);
}

function hideLoading() {
  loadingSpinner.classList.add('hidden');
}

// CSV Export function
function exportToCSV() {
  if (filteredEmployees.length === 0) {
    showToast('No data to export', 'error');
    return;
  }
  
  const headers = [
    'Employee Code', 'Full Name', "Father's Name", 'Date of Birth',
    'Date of Joining', 'Status', 'Date of Leaving', 'Mobile Number',
    'Email', 'Location', 'Designation'
  ];
  
  const csvContent = [
    headers.join(','),
    ...filteredEmployees.map(emp => [
      emp.empCode,
      `"${emp.fullName}"`,
      `"${emp.fatherName}"`,
      emp.dob,
      emp.doj,
      emp.status,
      emp.dol || '',
      emp.mobile,
      emp.email,
      `"${emp.location}"`,
      emp.designation
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('Employee data exported successfully', 'success');
}

// Event Listeners
function setupEventListeners() {
  // Login form
  loginForm.addEventListener('submit', handleLogin);
  
  // Navigation
  teamViewBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showTeamView();
  });
  
  employeeMgmtBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showEmployeeMgmt();
  });
  
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
  });
  
  sidebarToggle.addEventListener('click', toggleSidebar);
  
  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);
  
  // Search and filters
  globalSearch.addEventListener('input', () => {
    applyFilters();
    renderEmployeesTable();
    renderEmployeeCards();
  });
  
  statusFilter.addEventListener('change', () => {
    applyFilters();
    renderEmployeesTable();
    renderEmployeeCards();
  });
  
  designationFilter.addEventListener('change', () => {
    applyFilters();
    renderEmployeesTable();
    renderEmployeeCards();
  });
  
  // Export
  exportBtn.addEventListener('click', exportToCSV);
  
  // Table sorting
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      handleSort(th.dataset.sort);
    });
  });
  
  // Form events
  addNewBtn.addEventListener('click', () => showEmployeeForm(false));
  closeFormBtn.addEventListener('click', hideEmployeeForm);
  cancelFormBtn.addEventListener('click', hideEmployeeForm);
  employeeDataForm.addEventListener('submit', handleFormSubmit);
  
  // Status change handler
  formFields.status.addEventListener('change', handleStatusChange);
  
  // Modal events
  closeModalBtn.addEventListener('click', closeModal);
  editEmployeeBtn.addEventListener('click', () => {
    if (currentEmployee) {
      editEmployee(currentEmployee.id);
    }
  });
  deleteEmployeeBtn.addEventListener('click', () => {
    if (currentEmployee) {
      openDeleteModal(currentEmployee.id);
    }
  });
  
  // Delete modal events
  closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  confirmDeleteBtn.addEventListener('click', confirmDelete);
  
  // Modal backdrop clicks
  employeeModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      closeModal();
    }
  });
  
  deleteModal.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      closeDeleteModal();
    }
  });
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!employeeModal.classList.contains('hidden')) {
        closeModal();
      } else if (!deleteModal.classList.contains('hidden')) {
        closeDeleteModal();
      } else if (!employeeForm.classList.contains('hidden')) {
        hideEmployeeForm();
      }
    }
  });
}

// Global functions for onclick handlers
window.openEmployeeModal = openEmployeeModal;
window.editEmployee = editEmployee;
window.openDeleteModal = openDeleteModal;
window.changePage = changePage;