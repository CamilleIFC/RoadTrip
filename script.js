// Initialize the map
const map = L.map('map').setView([48.806955, 2.234810], 10); // Default view (Paris area)

// Add a tile layer (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Your GraphHopper API Key
const graphhopperApiKey = '19712f93-6000-48d6-8695-c460ebe1c60d';

// List of large cities with coordinates (latitude, longitude)
const largeCities = [
    // France
    { name: "Paris", lat: 48.853448, lng: 2.349026 },
    { name: "Marseille", lat: 43.296482, lng: 5.36978 },
    { name: "Lyon", lat: 45.7578, lng: 4.8320 },
    { name: "Toulouse", lat: 43.604652, lng: 1.444209 },
    { name: "Nice", lat: 43.7102, lng: 7.2620 },
    { name: "Nantes", lat: 47.2186, lng: -1.5552 },
    { name: "Strasbourg", lat: 48.5734, lng: 7.7521 },
    { name: "Montpellier", lat: 43.6118, lng: 3.8767 },
    { name: "Bordeaux", lat: 44.8378, lng: -0.5792 },
    { name: "Lille", lat: 50.6292, lng: 3.0573 },

    // Other European Cities
    { name: "London", lat: 51.5074, lng: -0.1278 },
    { name: "Berlin", lat: 52.52, lng: 13.4050 },
    { name: "Rome", lat: 41.9028, lng: 12.4964 },
    { name: "Madrid", lat: 40.4168, lng: -3.7038 },
    { name: "Barcelona", lat: 41.3784, lng: 2.1925 },
    { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
    { name: "Brussels", lat: 50.8503, lng: 4.3517 },
    { name: "Vienna", lat: 48.2082, lng: 16.3738 },
    { name: "Zurich", lat: 47.3769, lng: 8.5417 },
    { name: "Stockholm", lat: 59.3293, lng: 18.0686 },
    { name: "Oslo", lat: 59.9139, lng: 10.7522 },

    // United States Cities
    { name: "New York", lat: 40.7128, lng: -74.0060 },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    { name: "Chicago", lat: 41.8781, lng: -87.6298 },
    { name: "Houston", lat: 29.7604, lng: -95.3698 },
    { name: "Phoenix", lat: 33.4484, lng: -112.0740 },
    { name: "Philadelphia", lat: 39.9526, lng: -75.1652 },
    { name: "San Antonio", lat: 29.4241, lng: -98.4936 },
    { name: "San Diego", lat: 32.7157, lng: -117.1611 },
    { name: "Dallas", lat: 32.7767, lng: -96.7970 },
    { name: "San Jose", lat: 37.3382, lng: -121.8863 },
    { name: "Austin", lat: 30.2672, lng: -97.7431 },
    { name: "Jacksonville", lat: 30.3322, lng: -81.6557 },
    { name: "Fort Worth", lat: 32.7555, lng: -97.3308 },
    { name: "Columbus", lat: 39.9612, lng: -82.9988 },
    { name: "Indianapolis", lat: 39.7684, lng: -86.1580 },
    { name: "Charlotte", lat: 35.2271, lng: -80.8431 },
    { name: "Seattle", lat: 47.6062, lng: -122.3321 },
    { name: "Denver", lat: 39.7392, lng: -104.9903 },
    { name: "Washington D.C.", lat: 38.9072, lng: -77.0369 },
    { name: "Boston", lat: 42.3601, lng: -71.0589 },
    { name: "Miami", lat: 25.7617, lng: -80.1918 },

    // Additional US cities
    { name: "Detroit", lat: 42.3314, lng: -83.0458 },
    { name: "Baltimore", lat: 39.2904, lng: -76.6122 },
    { name: "Nashville", lat: 36.1627, lng: -86.7816 },
    { name: "Oklahoma City", lat: 35.4676, lng: -97.5164 },
    { name: "Las Vegas", lat: 36.1699, lng: -115.1398 }
];


// Function to calculate the distance between two points (in km)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Function to find the closest city and check if it's within 10 km
const isNearLargeCity = (lat, lng) => {
    for (let city of largeCities) {
        const distance = calculateDistance(lat, lng, city.lat, city.lng);
        if (distance <= 12) {
            return true; // The marker is within 10 km of a large city
        }
    }
    return false; // The marker is not near any large city
};

// Function to set up routing between two points and animate the marker
const setupRouting = (start, end) => {
    // Remove any existing route layer and marker
    if (window.routeLayer) {
        map.removeLayer(window.routeLayer);
    }
    if (window.movingMarker) {
        map.removeLayer(window.movingMarker);
    }

    // Fetch route data from GraphHopper API for bike routing
    const url = `https://graphhopper.com/api/1/route?point=${start[0]},${start[1]}&point=${end[0]},${end[1]}&vehicle=bike&locale=en&key=${graphhopperApiKey}&points_encoded=false`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.paths && data.paths.length > 0) {
                // Extract route coordinates
                const routeCoordinates = data.paths[0].points.coordinates.map(coord => ({
                    lat: coord[1],
                    lng: coord[0]
                }));

                // Draw route as polyline
                window.routeLayer = L.polyline(routeCoordinates, {
                    color: 'blue',
                    opacity: 0.7,
                    weight: 5
                }).addTo(map);
                map.fitBounds(window.routeLayer.getBounds()); // Zoom to fit the route

                // Create a moving marker at the start position
                window.movingMarker = L.circleMarker(routeCoordinates[0], {
                    radius: 6,
                    color: 'red',
                    fillColor: '#f03',
                    fillOpacity: 0.9
                }).addTo(map);

                // Animate the marker along the route
                animateMarker(routeCoordinates);
            } else {
                alert('Route not found.');
            }
        })
        .catch(err => console.error('Error fetching route:', err));
};

// Function to generate a random speed between min and max
const getRandomSpeed = (min, max) => Math.random() * (max - min) + min;

// Function to calculate the angle between two segments (in degrees)
const calculateTurnAngle = (start, middle, end) => {
    const dx1 = middle.lng - start.lng;
    const dy1 = middle.lat - start.lat;
    const dx2 = end.lng - middle.lng;
    const dy2 = end.lat - middle.lat;

    const angle1 = Math.atan2(dy1, dx1);
    const angle2 = Math.atan2(dy2, dx2);
    let angle = Math.abs(angle1 - angle2) * (180 / Math.PI); // Convert to degrees

    // Ensure the angle is between 0 and 180 degrees (turning direction doesn't matter)
    if (angle > 180) angle = 360 - angle;

    return angle;
};

// Function to animate the marker along the route
const animateMarker = (coordinates) => {
    let currentIndex = 0;
    let progress = 0;
    let distanceTraveled = 0;
    let lastUpdateTime = Date.now();
    let currentSpeed = 0; // Start at 0 km/h
    let targetSpeed = currentSpeed; // Target speed will oscillate
    let speedOscillation = 0; // Oscillation factor
    let spikeInterval = 20000; // 20 seconds
    let lastSpikeTime = Date.now(); // When the last spike happened
    let isStopped = false; // Flag to track if the car is stopped
    let stopTimeout = null; // To store the timeout for the stop duration

    const moveMarker = () => {
        const now = Date.now();
        const elapsed = now - lastUpdateTime; // Time since last update (ms)

        // Every 20 seconds, introduce a random spike or slowdown
        if (now - lastSpikeTime > spikeInterval) {
            targetSpeed = getRandomSpeed(15, 70); // Random speed spike
            lastSpikeTime = now; // Update the last spike time
        }

        if (currentIndex < coordinates.length - 1) {
            const start = coordinates[currentIndex];
            const end = coordinates[currentIndex + 1];
            const segmentDistance = map.distance(start, end);

            // Check if the marker is near a large city
            const nearLargeCity = isNearLargeCity(start.lat, start.lng);

            // Detect sharp turns (angle > 40 degrees)
            let turnAngle = 0;
            if (currentIndex > 0 && currentIndex < coordinates.length - 1) {
                const previous = coordinates[currentIndex - 1];
                turnAngle = calculateTurnAngle(previous, start, end);
            }

            if (turnAngle > 40) {
                // If a sharp turn is detected, slow down and stop for 2 seconds
                if (!isStopped) {
                    targetSpeed = 0; // Slow down to a stop
                    isStopped = true;
                    clearTimeout(stopTimeout); // Clear any previous stop timeout
                    stopTimeout = setTimeout(() => {
                        isStopped = false; // Reaccelerate after stopping
                    }, 2000); // Wait 2 seconds before reaccelerating
                }
            } else {
                // Adjust speed for regular motion
                if (nearLargeCity) {
                    // In large cities, the car generally drives slower
                    const baseSpeed = 2 + 4 * Math.sin(speedOscillation); // Oscillate between 10 and 25 km/h
                    const randomFactor = Math.random();

                    // Occasionally stop or slow down
                    if (randomFactor < 0.05) {
                        targetSpeed = 0; // Stop occasionally (5% chance)
                    } else if (randomFactor < 0.1) {
                        targetSpeed = Math.max(0, baseSpeed - 5); // Sometimes a bit slower
                    } else {
                        targetSpeed = baseSpeed; // Normal speed with oscillation
                    }

                } else {
                    // In non-city areas, the car drives faster with occasional fluctuations
                    const baseSpeed = 20 + 7 * Math.sin(speedOscillation); // Oscillates between 35 and 55 km/h
                    const randomFactor = Math.random();

                    if (randomFactor < 0.05) {
                        targetSpeed = Math.min(70, baseSpeed + 15); // Occasionally speed up (5% chance)
                    } else if (randomFactor < 0.1) {
                        targetSpeed = Math.max(15, baseSpeed - 10); // Occasionally slow down (5% chance)
                    } else {
                        targetSpeed = baseSpeed; // Normal speed with oscillation
                    }
                }

                // Update the speed oscillation for smoother variation over time
                speedOscillation += 0.05 * Math.PI; // Gradually oscillate over time
            }

            // Smoothly adjust the speed towards the target speed
            currentSpeed += (targetSpeed - currentSpeed) * 0.05; // Gradual acceleration/deceleration
            currentSpeed = Math.max(5, Math.min(currentSpeed, 70)); // Clamp speed between 15 and 70 km/h

            // Calculate the progress of the marker
            if (progress + currentSpeed * (elapsed / 1000) >= segmentDistance) {
                window.movingMarker.setLatLng(end);
                distanceTraveled += segmentDistance; // Add distance for the completed segment
                currentIndex++;
                progress = 0;
            } else {
                progress += currentSpeed * (elapsed / 1000);
                const ratio = progress / segmentDistance;
                const lat = start.lat + ratio * (end.lat - start.lat);
                const lng = start.lng + ratio * (end.lng - start.lng);
                window.movingMarker.setLatLng([lat, lng]);
            }

            // Update the info box with current speed and distance traveled
            updateInfoBox(currentSpeed, distanceTraveled);
        } else {
            clearInterval(movingMarkerInterval); // Stop animation when the route is completed
        }

        lastUpdateTime = now;
    };

    const movingMarkerInterval = setInterval(moveMarker, 100); // Update every 100ms
};





// Function to update the information box
const updateInfoBox = (currentSpeed, distanceTraveled) => {
    document.getElementById('currentSpeed').textContent = `Current Speed: ${Math.round(currentSpeed)} km/h`;
    document.getElementById('distanceTraveled').textContent = `Distance Traveled: ${Math.round(distanceTraveled / 1000)} km`; // In km
};

// Function to get the route based on user input
function getRoute() {
    const startLocation = document.getElementById("start").value;
    const endLocation = document.getElementById("end").value;

    // Geocode the start location
    L.Control.Geocoder.nominatim().geocode(startLocation, function(results) {
        if (results.length > 0) {
            const startCoords = results[0].center;
            // Geocode the end location
            L.Control.Geocoder.nominatim().geocode(endLocation, function(results) {
                if (results.length > 0) {
                    const endCoords = results[0].center;
                    setupRouting([startCoords.lat, startCoords.lng], [endCoords.lat, endCoords.lng]);
                } else {
                    alert("End location not found.");
                }
            });
        } else {
            alert("Start location not found.");
        }
    });
}
