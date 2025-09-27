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
  employeeEmail: document.getElementById('employeeEmail'), // Unified as employeeEmail to match HTML
  empPassword: document.getElementById('empPassword'), // Unified as empPassword to match HTML
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
      showDashboard();
    } else {
      showLogin();
    }
  });
});

// Authentication functions
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
  
  const email = document.getElementById('email').value.trim();
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
  
  if (currentPage > 1) {
    paginationHTML += `<button class="btn btn--secondary" onclick="changePage(${currentPage - 1})">
      <i class="fas fa-chevron-left"></i>
    </button>`;
  }
  
  for (let i = 1; i <= Math.min(totalPages, 5); i++) {
    const active = i === currentPage ? 'active' : '';
    paginationHTML += `<button class="btn btn--secondary ${active}" onclick="changePage(${i})">${i}</button>`;
  }
  
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
  
  currentPage = 1;
}

function handleSort(field) {
  if (sortField === field) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortField = field;
    sortDirection = 'asc';
  }
  
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
  
  Object.values(formFields).forEach(field => {
    if (field) {
      field.value = '';
    }
  });
  
  if (formFields.status) {
    formFields.status.value = 'Active';
  }
  
  if (formFields.designation) {
    formFields.designation.selectedIndex = 0;
  }
}

function handleFormSubmit(event) {
  event.preventDefault();
  
  if (!validateForm()) {
    return;
  }
  
  const employeeData = {
    empCode: formFields.empCode.value.trim(),
    fullName: formFields.fullName.value.trim(),
    fatherName: formFields.fatherName.value.trim(),
    dob: formFields.dob.value,
    doj: formFields.doj.value,
    status: formFields.status.value,
    dol: formFields.status.value === 'Deactive' ? formFields.dol.value || null : null,
    mobile: formFields.mobile.value.trim(),
    email: formFields.employeeEmail.value.trim().toLowerCase(), // Use employeeEmail from formFields
    password: formFields.empPassword.value, // Use empPassword from formFields
    location: formFields.location.value.trim(),
    designation: formFields.designation.value
  };
  
  if (isEditMode && currentEmployee) {
    // When editing, allow the employee's own code to be unchanged.
    // Check for duplicate employee codes among *other* employees.
    const duplicateCode = employees.find(emp => emp.empCode === employeeData.empCode && emp.id !== currentEmployee.id);
    if (duplicateCode) {
      showToast('Employee code already exists for another employee', 'error');
      return;
    }
    updateEmployee(currentEmployee.id, employeeData);
  } else {
    // Check for duplicate employee code ONLY when adding a new employee
    const duplicateCode = employees.find(emp => emp.empCode === employeeData.empCode);
    if (duplicateCode) {
      showToast('Employee code already exists', 'error');
      return;
    }
    addEmployee(employeeData);
  }
}

function validateForm() {
  const requiredFields = [
    { field: formFields.empCode, name: 'Employee Code' },
    { field: formFields.fullName, name: 'Full Name' },
    { field: formFields.dob, name: 'Date of Birth' },
    { field: formFields.doj, name: 'Date of Joining' },
    { field: formFields.status, name: 'Status' },
    { field: formFields.mobile, name: 'Mobile Number' },
    { field: formFields.employeeEmail, name: 'Email' }, // Use employeeEmail
    { field: formFields.empPassword, name: 'Password' }, // Use empPassword
    { field: formFields.designation, name: 'Designation' }
  ];
  
  for (const { field, name } of requiredFields) {
    if (!field || !field.value.trim()) {
      showToast(`${name} is required`, 'error');
      field.focus();
      return false;
    }
  }
  
  // Email format validation
  const emailPattern = /^[\S+@]+\.[\S+@]+$/;
  if (!emailPattern.test(formFields.employeeEmail.value.trim())) { // Use employeeEmail
    showToast('Please enter a valid email address', 'error');
    formFields.employeeEmail.focus(); // Use employeeEmail
    return false;
  }
  
  // Mobile validation
  const mobilePattern = /^[0-9]{10}$/;
  if (!mobilePattern.test(formFields.mobile.value.trim())) {
    showToast('Please enter a valid 10-digit mobile number', 'error');
    formFields.mobile.focus();
    return false;
  }
  
  // DOL validation for deactive status
  if (formFields.status.value === 'Deactive' && !formFields.dol.value) {
    showToast('Date of Leaving is required for Deactive status', 'error');
    formFields.dol.focus();
    return false;
  }
  
  return true;
}

function editEmployee(id) {
  const employee = employees.find(e => e.id === id);
  if (!employee) return;
  
  currentEmployee = employee;
  
  Object.keys(formFields).forEach(key => {
    const field = formFields[key];
    // Handle special case where 'employeeEmail' in form maps to 'email' in employee object
    if (key === 'employeeEmail') {
      if (field && employee.email !== undefined && employee.email !== null) {
        field.value = employee.email;
      }
    } else if (key === 'empPassword') {
        if (field && employee.password !== undefined && employee.password !== null) {
          field.value = employee.password;
        }
    } else {
      if (field && employee[key] !== undefined && employee[key] !== null) {
        field.value = employee[key];
      }
    }
  });
  
  if (formFields.status.value === 'Deactive') {
    dolGroup.style.display = 'block';
  } else {
    dolGroup.style.display = 'none';
  }
  
  showEmployeeForm(true);
}

function handleStatusChange() {
  if (formFields.status.value === 'Deactive') {
    dolGroup.style.display = 'block';
  } else {
    dolGroup.style.display = 'none';
    formFields.dol.value = '';
  }
}

// Modal functions
function openEmployeeModal(id) {
  const employee = employees.find(e => e.id === id);
  if (!employee) return;
  
  currentEmployee = employee;
  
  const modalContent = employeeModal.querySelector('.modal-body');
  if (!modalContent) return;
  
  modalContent.innerHTML = `
    <div class="employee-details">
      <h3>${employee.fullName} <span class="emp-code">(${employee.empCode})</span></h3>
      <div class="status-badge ${employee.status.toLowerCase()}">${employee.status}</div>
      
      <div class="detail-section">
        <h4>Basic Information</h4>
        <p><strong>Designation:</strong> ${employee.designation}</p>
        <p><strong>Father\'s Name:</strong> ${employee.fatherName || '-'}</p>
        <p><strong>Date of Birth:</strong> ${formatDate(employee.dob)}</p>
        <p><strong>Mobile:</strong> ${employee.mobile}</p>
        <p><strong>Email:</strong> ${employee.email}</p>
      </div>
      
      <div class="detail-section">
        <h4>Employment Details</h4>
        <p><strong>Date of Joining:</strong> ${formatDate(employee.doj)}</p>
        <p><strong>Date of Leaving:</strong> ${formatDate(employee.dol) || '-'}</p>
        <p><strong>Location:</strong> ${employee.location}</p>
      </div>
    </div>
  `;
  
  employeeModal.classList.add('show');
}

function closeModal() {
  employeeModal.classList.remove('show');
  currentEmployee = null;
}

function openDeleteModal(id) {
  currentEmployee = employees.find(e => e.id === id);
  if (!currentEmployee) return;
  
  deleteModal.querySelector('p').textContent = 
    `Are you sure you want to delete ${currentEmployee.fullName} (${currentEmployee.empCode})?`;
  
  deleteModal.classList.add('show');
}

function closeDeleteModal() {
  deleteModal.classList.remove('show');
  currentEmployee = null;
}

// Export function
function exportEmployees() {
  if (filteredEmployees.length === 0) {
    showToast('No employees to export', 'error');
    return;
  }
  
  const csvContent = "data:text/csv;charset=utf-8," 
    + ['Employee Code,Full Name,Designation,Status,Mobile,Email,Date of Joining,Date of Leaving,Location']
    .concat(
      filteredEmployees.map(e => 
        `${e.empCode},${e.fullName},${e.designation},${e.status},${e.mobile},${e.email},${formatDate(e.doj)},${formatDate(e.dol)},${e.location}`
      )
    )
    .join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "employees_export.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showToast('Employees exported successfully', 'success');
}

// Utility functions
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB');
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

function showLoading() {
  if (loadingSpinner) {
    loadingSpinner.classList.remove('hidden');
  }
}

function hideLoading() {
  if (loadingSpinner) {
    loadingSpinner.classList.add('hidden');
  }
}

// Event listeners
function setupEventListeners() {
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  if (teamViewBtn) {
    teamViewBtn.addEventListener('click', showTeamView);
  }
  
  if (employeeMgmtBtn) {
    employeeMgmtBtn.addEventListener('click', showEmployeeMgmt);
  }
  
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', toggleSidebar);
  }
  
  if (employeeDataForm) {
    employeeDataForm.addEventListener('submit', handleFormSubmit);
  }
  
  if (addNewBtn) {
    addNewBtn.addEventListener('click', () => showEmployeeForm(false));
  }
  
  if (closeFormBtn) {
    closeFormBtn.addEventListener('click', hideEmployeeForm);
  }
  
  if (cancelFormBtn) {
    cancelFormBtn.addEventListener('click', hideEmployeeForm);
  }
  
  if (globalSearch) {
    globalSearch.addEventListener('input', () => {
      applyFilters();
      renderEmployeesTable();
      renderEmployeeCards();
    });
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      applyFilters();
      renderEmployeesTable();
      renderEmployeeCards();
    });
  }
  
  if (designationFilter) {
    designationFilter.addEventListener('change', () => {
      applyFilters();
      renderEmployeesTable();
      renderEmployeeCards();
    });
  }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', exportEmployees);
  }
  
  if (formFields.status) {
    formFields.status.addEventListener('change', handleStatusChange);
  }
  
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeModal);
  }
  
  if (editEmployeeBtn) {
    editEmployeeBtn.addEventListener('click', () => {
      if (currentEmployee) {
        editEmployee(currentEmployee.id);
        closeModal();
      }
    });
  }
  
  if (deleteEmployeeBtn) {
    deleteEmployeeBtn.addEventListener('click', () => {
      if (currentEmployee) {
        openDeleteModal(currentEmployee.id);
        closeModal();
      }
    });
  }
  
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', () => {
      if (currentEmployee) {
        removeEmployee(currentEmployee.id);
      }
    });
  }
  
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  }
  
  if (closeDeleteModalBtn) {
    closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
  }
}

// Expose functions for inline onclick handlers
window.openEmployeeModal = openEmployeeModal;
window.editEmployee = editEmployee;
window.openDeleteModal = openDeleteModal;
window.changePage = changePage;
window.handleSort = handleSort;