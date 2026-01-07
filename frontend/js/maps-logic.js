// maps-logic.js - Google Maps & Geolocation Logic
import CONFIG from '../config.js';

let map;
let markers = [];
let selectedPoints = [];
let distanceLine = null;

// Initialize Map
window.initializeMap = function(location) {
    const mapElement = document.getElementById('map');
    if (!mapElement || !window.google) {
        console.warn('Google Maps not available');
        return;
    }
    
    // Create map
    map = new google.maps.Map(mapElement, {
        center: location,
        zoom: 14,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }]
            }
        ]
    });
    
    // Add user location marker
    new google.maps.Marker({
        position: location,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 3
        },
        title: 'Your Location'
    });
    
    // Find and display emergency services
    findEmergencyServices(location);
    
    // Add click listener for road selection
    map.addListener('click', handleMapClick);
};

// Handle Map Click for Road Selection
function handleMapClick(event) {
    const latLng = event.latLng;
    
    selectedPoints.push(latLng);
    
    // Add marker
    const marker = new google.maps.Marker({
        position: latLng,
        map: map,
        label: selectedPoints.length.toString()
    });
    
    markers.push(marker);
    
    // If two points selected, calculate distance
    if (selectedPoints.length === 2) {
        calculateAndDisplayDistance();
    }
    
    // Clear after two points
    if (selectedPoints.length > 2) {
        clearSelection();
    }
}

// Calculate and Display Distance
function calculateAndDisplayDistance() {
    const point1 = selectedPoints[0];
    const point2 = selectedPoints[1];
    
    // Calculate distance using Geometry library
    const distance = google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
    const distanceKm = (distance / 1000).toFixed(2);
    
    // Draw line
    if (distanceLine) {
        distanceLine.setMap(null);
    }
    
    distanceLine = new google.maps.Polyline({
        path: [point1, point2],
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 4,
        map: map
    });
    
    // Show info window
    const infoWindow = new google.maps.InfoWindow({
        position: {
            lat: (point1.lat() + point2.lat()) / 2,
            lng: (point1.lng() + point2.lng()) / 2
        },
        content: `
            <div class="p-3">
                <h3 class="font-bold text-lg mb-2">Selected Road Segment</h3>
                <p class="text-gray-700">Distance: <strong>${distanceKm} km</strong></p>
                <button onclick="reportRoadSegment(${distanceKm})" class="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Report for Repair
                </button>
            </div>
        `
    });
    
    infoWindow.open(map);
    
    window.showNotification(`Road segment selected: ${distanceKm} km`, 'info');
}

// Report Road Segment
window.reportRoadSegment = function(distance) {
    const point1 = selectedPoints[0];
    const point2 = selectedPoints[1];
    
    if (window.addReport) {
        window.addReport({
            type: 'Road Segment Repair',
            location: `${point1.lat().toFixed(4)}, ${point1.lng().toFixed(4)} to ${point2.lat().toFixed(4)}, ${point2.lng().toFixed(4)}`,
            severity: 50,
            status: 'Pending',
            date: new Date().toISOString().split('T')[0],
            distance: distance,
            lat: point1.lat(),
            lng: point1.lng()
        });
    }
    
    window.showNotification('Road segment reported for repair!', 'success');
    clearSelection();
};

// Clear Selection
function clearSelection() {
    selectedPoints = [];
    markers.forEach(marker => marker.setMap(null));
    markers = [];
    if (distanceLine) {
        distanceLine.setMap(null);
        distanceLine = null;
    }
}

// Find Emergency Services
function findEmergencyServices(location) {
    if (!window.google || !map) return;
    
    const service = new google.maps.places.PlacesService(map);
    
    const serviceTypes = [
        { type: 'police', icon: '🚓', color: '#3B82F6' },
        { type: 'fire_station', icon: '🚒', color: '#EF4444' },
        { type: 'hospital', icon: '🏥', color: '#10B981' }
    ];
    
    serviceTypes.forEach(serviceType => {
        const request = {
            location: location,
            radius: CONFIG.EMERGENCY_RADIUS,
            type: serviceType.type
        };
        
        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                // Display top 3 results
                results.slice(0, 3).forEach(place => {
                    createEmergencyMarker(place, serviceType);
                });
            }
        });
    });
}

// Create Emergency Service Marker
function createEmergencyMarker(place, serviceType) {
    const marker = new google.maps.Marker({
        position: place.geometry.location,
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: serviceType.color,
            fillOpacity: 0.9,
            strokeColor: '#fff',
            strokeWeight: 2
        },
        title: place.name
    });
    
    // Get place details for phone number
    const service = new google.maps.places.PlacesService(map);
    service.getDetails({ placeId: place.place_id }, (details, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div class="p-3 max-w-xs">
                        <div class="text-2xl mb-2">${serviceType.icon}</div>
                        <h3 class="font-bold text-lg mb-2">${details.name}</h3>
                        <p class="text-gray-600 text-sm mb-2">${details.formatted_address || ''}</p>
                        ${details.formatted_phone_number ? `
                            <a href="tel:${details.formatted_phone_number}" class="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 mt-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                                </svg>
                                ${details.formatted_phone_number}
                            </a>
                        ` : ''}
                        ${details.rating ? `
                            <div class="flex items-center gap-1 mt-2 text-sm text-gray-600">
                                <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                                <span>${details.rating} rating</span>
                            </div>
                        ` : ''}
                    </div>
                `
            });
            
            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });
        }
    });
}

// Get Directions to Emergency Service
window.getDirections = function(lat, lng, name) {
    const userLoc = window.AppState.userLocation;
    if (!userLoc) {
        window.showNotification('Location not available', 'error');
        return;
    }
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
};

// Calculate Distance Between Two Points
window.calculateDistance = function(lat1, lng1, lat2, lng2) {
    if (!window.google) return 0;
    
    const point1 = new google.maps.LatLng(lat1, lng1);
    const point2 = new google.maps.LatLng(lat2, lng2);
    
    return google.maps.geometry.spherical.computeDistanceBetween(point1, point2);
};

// Add Report Location to Map
window.addReportToMap = function(report) {
    if (!map) return;
    
    const marker = new google.maps.Marker({
        position: { lat: report.lat, lng: report.lng },
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: report.severity > 75 ? '#EF4444' : report.severity > 50 ? '#F59E0B' : '#10B981',
            fillOpacity: 0.8,
            strokeColor: '#fff',
            strokeWeight: 2
        },
        title: report.type
    });
    
    const infoWindow = new google.maps.InfoWindow({
        content: `
            <div class="p-3">
                <h3 class="font-bold text-lg mb-2">${report.type}</h3>
                <p class="text-gray-700 mb-2">${report.location}</p>
                <p class="text-sm text-gray-600">Severity: <strong>${report.severity}/100</strong></p>
                <p class="text-sm text-gray-600">Status: <strong>${report.status}</strong></p>
            </div>
        `
    });
    
    marker.addListener('click', () => {
        infoWindow.open(map, marker);
    });
};