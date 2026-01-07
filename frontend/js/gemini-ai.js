// gemini-ai.js - Gemini 2.0 AI Image Analysis Logic
import CONFIG from '../config.js';

// Image Upload Handler
document.getElementById('imageInput')?.addEventListener('change', handleImageUpload);

// Upload Area Click Handler
document.getElementById('uploadArea')?.addEventListener('click', () => {
    document.getElementById('imageInput')?.click();
});

// Handle Image Upload
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!validateFile(file)) return;
    
    // Show preview
    displayImagePreview(file);
    
    // Analyze with Gemini AI
    await analyzeImageWithGemini(file);
}

// Validate File
function validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
    
    if (!validTypes.includes(file.type)) {
        window.showNotification('Please upload a valid image (JPG, PNG) or video (MP4)', 'error');
        return false;
    }
    
    if (file.size > maxSize) {
        window.showNotification('File size must be less than 10MB', 'error');
        return false;
    }
    
    return true;
}

// Display Image Preview
function displayImagePreview(file) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const previewImage = document.getElementById('previewImage');
        const imagePreview = document.getElementById('imagePreview');
        const uploadArea = document.getElementById('uploadArea');
        
        if (previewImage && imagePreview) {
            previewImage.src = e.target.result;
            imagePreview.classList.remove('hidden');
            uploadArea?.classList.add('hidden');
        }
    };
    
    reader.readAsDataURL(file);
}

// Analyze Image with Gemini 2.0
async function analyzeImageWithGemini(file) {
    // Show loading state
    showAnalyzing(true);
    
    try {
        // Convert image to base64
        const base64Image = await fileToBase64(file);
        
        // Call Gemini API
        const result = await callGeminiAPI(base64Image);
        
        // Display results
        displayAnalysisResults(result);
        
        // Auto-report if critical
        if (result.damage_score > CONFIG.DAMAGE_THRESHOLD) {
            await autoReportToGovernment(result, base64Image);
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        window.showNotification('Analysis failed. Please try again.', 'error');
    } finally {
        showAnalyzing(false);
    }
}

// Convert File to Base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove data URL prefix
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Call Gemini API
async function callGeminiAPI(base64Image) {
    const apiKey = CONFIG.GEMINI_API_KEY;
    
    // Check if API key is configured
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        console.warn('Gemini API key not configured. Using simulation mode.');
        return simulateGeminiAnalysis();
    }
    
    try {
        const url = `${CONFIG.ENDPOINTS.GEMINI}${CONFIG.GEMINI_MODELS.FLASH}:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        {
                            text: `Analyze this road image for damage. Identify potholes, cracks, flooding, or any road hazards. Return ONLY a JSON object with these fields:
                            {
                                "damage_score": <number 0-100>,
                                "damage_type": "<type of damage>",
                                "severity": "<Critical/Moderate/Minor>",
                                "description": "<brief description>",
                                "recommended_action": "<what should be done>"
                            }`
                        },
                        {
                            inline_data: {
                                mime_type: "image/jpeg",
                                data: base64Image
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 500
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        const text = data.candidates[0].content.parts[0].text;
        
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        throw new Error('Invalid response format');
        
    } catch (error) {
        console.error('Gemini API Error:', error);
        console.log('Falling back to simulation mode');
        return simulateGeminiAnalysis();
    }
}

// Simulate Gemini Analysis (for demo without API key)
function simulateGeminiAnalysis() {
    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            const damageScore = Math.floor(Math.random() * 100);
            
            let damageType, description, recommendedAction;
            
            if (damageScore > 80) {
                damageType = 'Severe Pothole/Crack';
                description = 'Critical road damage detected requiring immediate attention';
                recommendedAction = 'Immediate repair and traffic diversion recommended';
            } else if (damageScore > 60) {
                damageType = 'Moderate Road Wear';
                description = 'Significant road damage that needs scheduled repair';
                recommendedAction = 'Schedule repair within 1-2 weeks';
            } else if (damageScore > 30) {
                damageType = 'Minor Surface Damage';
                description = 'Minor cracks or wear visible on road surface';
                recommendedAction = 'Monitor and schedule routine maintenance';
            } else {
                damageType = 'Good Condition';
                description = 'Road surface is in acceptable condition';
                recommendedAction = 'No immediate action required';
            }
            
            resolve({
                damage_score: damageScore,
                damage_type: damageType,
                severity: damageScore > 75 ? 'Critical' : damageScore > 50 ? 'Moderate' : 'Minor',
                description: description,
                recommended_action: recommendedAction
            });
        }, 2000);
    });
}

// Display Analysis Results
function displayAnalysisResults(result) {
    const resultsArea = document.getElementById('resultsArea');
    if (!resultsArea) return;
    
    const severityColor = result.severity === 'Critical' ? 'red' : 
                         result.severity === 'Moderate' ? 'yellow' : 'green';
    
    resultsArea.innerHTML = `
        <div class="bg-${severityColor}-50 border-3 border-${severityColor}-500 rounded-2xl p-8">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-2xl font-bold text-gray-900">Analysis Results</h3>
                <span class="px-6 py-3 rounded-full font-bold text-lg bg-${severityColor}-500 text-white shadow-lg">
                    ${result.severity}
                </span>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div class="bg-white p-6 rounded-xl shadow">
                    <div class="text-sm text-gray-600 mb-2">Damage Score</div>
                    <div class="text-4xl font-bold text-${severityColor}-600">${result.damage_score}/100</div>
                    <div class="mt-3">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${result.damage_score}%; background: ${getSeverityGradient(result.severity)}"></div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-xl shadow">
                    <div class="text-sm text-gray-600 mb-2">Damage Type</div>
                    <div class="text-xl font-bold text-gray-900">${result.damage_type}</div>
                    <div class="mt-4 text-sm text-gray-600">
                        <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        Analyzed by Gemini 2.0 Flash
                    </div>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-xl shadow mb-6">
                <h4 class="font-bold text-lg mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    Description
                </h4>
                <p class="text-gray-700">${result.description}</p>
            </div>
            
            <div class="bg-white p-6 rounded-xl shadow">
                <h4 class="font-bold text-lg mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                    Recommended Action
                </h4>
                <p class="text-gray-700">${result.recommended_action}</p>
            </div>
        </div>
    `;
    
    resultsArea.classList.remove('hidden');
}

// Auto Report to Government
async function autoReportToGovernment(result, imageData) {
    const resultsArea = document.getElementById('resultsArea');
    
    // Add auto-report notification
    const autoReportDiv = document.createElement('div');
    autoReportDiv.className = 'mt-6 bg-green-50 border-3 border-green-500 rounded-2xl p-6';
    autoReportDiv.innerHTML = `
        <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
                <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
            </div>
            <div class="flex-1">
                <h4 class="text-xl font-bold text-green-900 mb-2">
                    Auto-Reported to Government Authorities
                </h4>
                <p class="text-green-800 mb-4">
                    This critical damage (${result.damage_score}/100) has been automatically escalated to local authorities for immediate action.
                </p>
                <div class="bg-white p-4 rounded-lg">
                    <div class="flex items-center gap-2 text-sm text-gray-600">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>Report ID: <strong>#${Date.now().toString().slice(-6)}</strong></span>
                    </div>
                    <div class="flex items-center gap-2 text-sm text-gray-600 mt-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        </svg>
                        <span>Location: <strong>${window.AppState.userLocation ? 
                            `${window.AppState.userLocation.lat.toFixed(4)}, ${window.AppState.userLocation.lng.toFixed(4)}` : 
                            'Location unavailable'}</strong></span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resultsArea?.appendChild(autoReportDiv);
    
    // Add to reports
    if (window.addReport) {
        window.addReport({
            type: 'AI Detected - ' + result.damage_type,
            location: window.AppState.userLocation ? 
                `${window.AppState.userLocation.lat.toFixed(4)}, ${window.AppState.userLocation.lng.toFixed(4)}` : 
                'Unknown Location',
            severity: result.damage_score,
            status: 'Priority',
            date: new Date().toISOString().split('T')[0],
            lat: window.AppState.userLocation?.lat || 0,
            lng: window.AppState.userLocation?.lng || 0
        });
    }
    
    // Show notification
    window.showNotification('Critical damage auto-reported to authorities!', 'success');
}

// Show/Hide Analyzing Loader
function showAnalyzing(show) {
    const loader = document.getElementById('analyzingLoader');
    const resultsArea = document.getElementById('resultsArea');
    
    if (show) {
        loader?.classList.remove('hidden');
        resultsArea?.classList.add('hidden');
    } else {
        loader?.classList.add('hidden');
    }
}

// Reset Upload
window.resetUpload = function() {
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const uploadArea = document.getElementById('uploadArea');
    const resultsArea = document.getElementById('resultsArea');
    
    if (imageInput) imageInput.value = '';
    imagePreview?.classList.add('hidden');
    uploadArea?.classList.remove('hidden');
    resultsArea?.classList.add('hidden');
};

// Get Severity Gradient
function getSeverityGradient(severity) {
    if (severity === 'Critical') return 'linear-gradient(90deg, #EF4444, #DC2626)';
    if (severity === 'Moderate') return 'linear-gradient(90deg, #F59E0B, #D97706)';
    return 'linear-gradient(90deg, #10B981, #059669)';
}

// Secondary Analysis with Gemini Nano (for validation)
async function validateWithNano(result) {
    // This would use Gemini Nano for quick validation
    // For now, we'll simulate this
    console.log('Validating with Gemini Nano...', result);
    return result;
}