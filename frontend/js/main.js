// main.js - Main Application Logic & UI Toggles
import CONFIG from '../config.js';

// Application State
const AppState = {
    currentMode: 'citizen',
    currentSection: null,
    userLocation: null,
    reports: [],
    projects: []
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadSampleData();
    getUserLocation();
});

// Initialize App
function initializeApp() {
    console.log('SafeRoads Platform Initialized');
    showPortal('citizen');
}

// Setup Event Listeners
function setupEventListeners() {
    // Mode Toggle Buttons
    document.getElementById('citizenBtn')?.addEventListener('click', () => switchMode('citizen'));
    document.getElementById('authorityBtn')?.addEventListener('click', () => switchMode('authority'));
    
    // Mobile Menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', toggleMobileMenu);
    
    // Mobile Mode Buttons
    document.querySelectorAll('.mobile-mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.dataset.mode;
            switchMode(mode);
            toggleMobileMenu();
        });
    });
    
    // Quick Action Cards
    document.querySelectorAll('.quick-action-card').forEach(card => {
        card.addEventListener('click', (e) => {
            const section = e.currentTarget.dataset.section;
            showSection(section);
        });
    });
    
    // Project Search
    document.getElementById('projectSearch')?.addEventListener('input', filterProjects);
}

// Switch Mode (Citizen/Authority)
function switchMode(mode) {
    AppState.currentMode = mode;
    
    // Update button states
    const citizenBtn = document.getElementById('citizenBtn');
    const authorityBtn = document.getElementById('authorityBtn');
    
    if (mode === 'citizen') {
        citizenBtn?.classList.add('active');
        authorityBtn?.classList.remove('active');
    } else {
        authorityBtn?.classList.add('active');
        citizenBtn?.classList.remove('active');
    }
    
    showPortal(mode);
}

// Show Portal
function showPortal(mode) {
    const citizenPortal = document.getElementById('citizenPortal');
    const authorityPortal = document.getElementById('authorityPortal');
    
    if (mode === 'citizen') {
        citizenPortal?.classList.remove('hidden');
        authorityPortal?.classList.add('hidden');
    } else {
        citizenPortal?.classList.add('hidden');
        authorityPortal?.classList.remove('hidden');
        loadAuthorityDashboard();
    }
}

// Toggle Mobile Menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu?.classList.toggle('hidden');
}

// Show Section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        AppState.currentSection = sectionName;
        
        // Initialize section-specific features
        if (sectionName === 'emergency') {
            initializeEmergencyServices();
        } else if (sectionName === 'tenders') {
            displayProjects();
        }
    }
}

// Get User Location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                AppState.userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                console.log('Location acquired:', AppState.userLocation);
                
                // Initialize weather check
                if (window.checkWeatherConditions) {
                    window.checkWeatherConditions(AppState.userLocation);
                }
            },
            (error) => {
                console.warn('Location access denied:', error.message);
                // Use default location (Kolkata, India)
                AppState.userLocation = { lat: 22.5726, lng: 88.3639 };
            }
        );
    } else {
        console.warn('Geolocation not supported');
        AppState.userLocation = { lat: 22.5726, lng: 88.3639 };
    }
}

// Load Sample Data
function loadSampleData() {
    // Sample Reports
    AppState.reports = [
        {
            id: 1,
            type: 'Pothole',
            location: 'Main Street, Junction 5',
            severity: 85,
            status: 'Priority',
            date: '2026-01-06',
            lat: 22.5726,
            lng: 88.3639
        },
        {
            id: 2,
            type: 'Road Crack',
            location: 'Highway 12, KM 45',
            severity: 68,
            status: 'Pending',
            date: '2026-01-05',
            lat: 22.5800,
            lng: 88.3700
        },
        {
            id: 3,
            type: 'Flooding Area',
            location: 'River Road, Bridge Area',
            severity: 92,
            status: 'Priority',
            date: '2026-01-04',
            lat: 22.5650,
            lng: 88.3580
        },
        {
            id: 4,
            type: 'AI Detected',
            location: 'Park Street Crossing',
            severity: 78,
            status: 'Priority',
            date: '2026-01-06',
            lat: 22.5750,
            lng: 88.3620
        }
    ];
    
    // Sample Projects
    AppState.projects = [
        {
            id: 1,
            name: 'Highway 12 Resurfacing Project',
            budget: 2500000,
            contractor: 'BuildRight Infrastructure Ltd.',
            materials: 1500000,
            labor: 1000000,
            progress: 65,
            completion: '2026-03-15',
            area: 'North District',
            status: 'In Progress'
        },
        {
            id: 2,
            name: 'Main Street Bridge Repair',
            budget: 5000000,
            contractor: 'Elite Construction Co.',
            materials: 3200000,
            labor: 1800000,
            progress: 40,
            completion: '2026-06-30',
            area: 'Central District',
            status: 'In Progress'
        },
        {
            id: 3,
            name: 'Park Avenue Expansion',
            budget: 3800000,
            contractor: 'MetroBuild Solutions',
            materials: 2300000,
            labor: 1500000,
            progress: 25,
            completion: '2026-08-20',
            area: 'South District',
            status: 'In Progress'
        },
        {
            id: 4,
            name: 'River Road Flood Prevention',
            budget: 4200000,
            contractor: 'AquaSafe Engineering',
            materials: 2800000,
            labor: 1400000,
            progress: 80,
            completion: '2026-02-28',
            area: 'West District',
            status: 'Near Completion'
        }
    ];
}

// Display Projects
function displayProjects(filteredProjects = null) {
    const projectsList = document.getElementById('projectsList');
    if (!projectsList) return;
    
    const projects = filteredProjects || AppState.projects;
    
    if (projects.length === 0) {
        projectsList.innerHTML = '<p class="text-gray-500 text-center py-8">No projects found matching your search.</p>';
        return;
    }
    
    projectsList.innerHTML = projects.map(project => `
        <div class="project-card">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <div class="flex-1">
                    <h3 class="text-2xl font-bold mb-2">${project.name}</h3>
                    <p class="text-gray-600 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        ${project.area}
                    </p>
                </div>
                <div class="text-right">
                    <div class="text-3xl font-bold text-purple-600">
                        ₹${formatCurrency(project.budget)}
                    </div>
                    <div class="text-sm text-gray-500">Total Budget</div>
                </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-blue-50 p-4 rounded-xl">
                    <div class="text-sm text-gray-600 mb-1">Materials</div>
                    <div class="font-bold text-lg">₹${formatCurrency(project.materials)}</div>
                </div>
                <div class="bg-green-50 p-4 rounded-xl">
                    <div class="text-sm text-gray-600 mb-1">Labor</div>
                    <div class="font-bold text-lg">₹${formatCurrency(project.labor)}</div>
                </div>
                <div class="bg-purple-50 p-4 rounded-xl">
                    <div class="text-sm text-gray-600 mb-1">Contractor</div>
                    <div class="font-bold text-sm">${project.contractor.split(' ')[0]}</div>
                </div>
                <div class="bg-orange-50 p-4 rounded-xl">
                    <div class="text-sm text-gray-600 mb-1">Target Date</div>
                    <div class="font-bold text-sm">${formatDate(project.completion)}</div>
                </div>
            </div>
            
            <div class="mb-4">
                <div class="flex justify-between text-sm mb-2">
                    <span class="font-semibold text-gray-700">Project Progress</span>
                    <span class="font-bold text-purple-600">${project.progress}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${project.progress}%"></div>
                </div>
            </div>
            
            <div class="flex justify-between items-center">
                <span class="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                    ${project.status}
                </span>
                <button class="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2">
                    View Details
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Filter Projects
function filterProjects(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    const filtered = AppState.projects.filter(project => 
        project.name.toLowerCase().includes(searchTerm) ||
        project.area.toLowerCase().includes(searchTerm) ||
        project.contractor.toLowerCase().includes(searchTerm)
    );
    
    displayProjects(filtered);
}

// Initialize Emergency Services
function initializeEmergencyServices() {
    const emergencyList = document.getElementById('emergencyList');
    if (!emergencyList) return;
    
    // Location-based emergency services
    const services = [
        {
            type: 'Police Station',
            name: 'Central Police Station',
            phone: '100',
            address: '123 Main Street',
            distance: '0.8 km',
            icon: '🚓'
        },
        {
            type: 'Fire Station',
            name: 'City Fire Brigade',
            phone: '101',
            address: '456 Fire Lane',
            distance: '1.2 km',
            icon: '🚒'
        },
        {
            type: 'Hospital',
            name: 'Government General Hospital',
            phone: '108',
            address: '789 Medical Road',
            distance: '1.5 km',
            icon: '🏥'
        },
        {
            type: 'Ambulance Service',
            name: 'Emergency Medical Services',
            phone: '102',
            address: '24/7 Mobile Service',
            distance: '1.0 km',
            icon: '🚑'
        },
        {
            type: 'Highway Patrol',
            name: 'Traffic Control Center',
            phone: '103',
            address: 'Highway Junction 5',
            distance: '2.1 km',
            icon: '🚨'
        },
        {
            type: 'Disaster Management',
            name: 'Emergency Response Team',
            phone: '1078',
            address: 'City Command Center',
            distance: '3.5 km',
            icon: '⚠️'
        }
    ];
    
    emergencyList.innerHTML = services.map(service => `
        <div class="emergency-card">
            <div class="flex items-start gap-4">
                <div class="text-4xl">${service.icon}</div>
                <div class="flex-1">
                    <h4 class="text-xl font-bold mb-1">${service.type}</h4>
                    <p class="text-gray-600 mb-2">${service.name}</p>
                    <p class="text-sm text-gray-500 mb-3">${service.address}</p>
                    <div class="flex flex-wrap gap-3">
                        <a href="tel:${service.phone}" class="btn-danger inline-flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                            </svg>
                            Call ${service.phone}
                        </a>
                        <span class="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-600">
                            ${service.distance} away
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    // Initialize map if available
    if (window.initializeMap && AppState.userLocation) {
        window.initializeMap(AppState.userLocation);
    }
}

// Load Authority Dashboard
function loadAuthorityDashboard() {
    const alertsTableBody = document.getElementById('alertsTableBody');
    if (!alertsTableBody) return;
    
    // Filter priority reports
    const priorityReports = AppState.reports.filter(report => 
        report.status === 'Priority' || report.severity > 75
    );
    
    alertsTableBody.innerHTML = priorityReports.map(report => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="py-4 px-4 font-semibold">#${report.id}</td>
            <td class="py-4 px-4">
                <span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    ${report.type}
                </span>
            </td>
            <td class="py-4 px-4">${report.location}</td>
            <td class="py-4 px-4">
                <div class="flex items-center gap-2">
                    <div class="progress-bar" style="width: 100px;">
                        <div class="progress-fill" style="width: ${report.severity}%; background: ${getSeverityColor(report.severity)}"></div>
                    </div>
                    <span class="font-semibold">${report.severity}/100</span>
                </div>
            </td>
            <td class="py-4 px-4">
                <span class="severity-badge ${getSeverityClass(report.severity)}">
                    ${report.status}
                </span>
            </td>
            <td class="py-4 px-4 text-gray-600">${formatDate(report.date)}</td>
            <td class="py-4 px-4">
                <button class="btn-primary text-sm py-2 px-4">
                    Review
                </button>
            </td>
        </tr>
    `).join('');
}

// Utility Functions
function formatCurrency(amount) {
    if (amount >= 100000) {
        return (amount / 100000).toFixed(1) + 'L';
    }
    return '₹' + amount.toLocaleString('en-IN');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function getSeverityColor(severity) {
    if (severity > 75) return 'linear-gradient(90deg, #EF4444, #DC2626)';
    if (severity > 50) return 'linear-gradient(90deg, #F59E0B, #D97706)';
    return 'linear-gradient(90deg, #10B981, #059669)';
}

function getSeverityClass(severity) {
    if (severity > 75) return 'severity-critical';
    if (severity > 50) return 'severity-moderate';
    return 'severity-minor';
}

// Add report to state
function addReport(report) {
    report.id = AppState.reports.length + 1;
    AppState.reports.unshift(report);
    
    // Show notification
    showNotification('Report submitted successfully!', 'success');
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} fixed top-20 right-4 z-50 shadow-lg max-w-md`;
    notification.style.animation = 'slideIn 0.5s ease';
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="font-semibold">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

// Export functions for use in other modules
window.AppState = AppState;
window.addReport = addReport;
window.showNotification = showNotification;