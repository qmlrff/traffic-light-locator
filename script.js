// This is the main function, defined globally.
function initMap() {
  
  // NOW we fetch the data, *inside* the function that Google calls.
  fetch("traffic-lights.json")
    .then(response => response.json()) // 1. Once the file is fetched...
    .then(trafficLights => {          // 2. ...and parsed, the data is ready.
      
      // 3. NOW we build the map and all features.
      
      // --- 1. CORE MAP & APP INITIALIZATION ---
      
      const mapCenter = { lat: 2.3, lng: 102.3 };

      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 11,
        center: mapCenter,
        mapId: "f49b240c79c381e43a2b689c" // Required for Advanced Markers
      });

      const infoWindow = new google.maps.InfoWindow();

      // --- 2. STATE VARIABLES ---
      // These variables will be used by many different functions.
      
      const allMarkers = [];
      const allListItems = [];
      let searchedLocationMarker = null;
      let userLocationMarker = null;

      // --- 3. DOM ELEMENT SELECTORS ---
      // Get references to all the HTML elements we need to control.
      
      const listElement = document.getElementById("traffic-light-list");
      const filterSearchInput = document.getElementById("search-box");
      const filterCheckboxes = document.querySelectorAll('#filter-controls input[type="checkbox"]');
      const findMeBtn = document.getElementById("find-me-btn");
      const globalSearchInput = document.getElementById("global-search-box");
      const clearSearchBtn = document.getElementById("clear-search-btn");
      const clearFilterBtn = document.getElementById("clear-filter-btn");

      
      // --- 4. HELPER FUNCTION DEFINITIONS ---
      // We define our functions here so they can access the variables above 
      // (like 'map', 'allMarkers', 'infoWindow', etc.)

      /**
       * Filters markers and list items based on all active filters:
       * 1. Search Term
       * 2. Category Checkboxes
       * 3. Intersection Checkboxes
       */
      function applyFilters() {
        // 1. Get the search term
        const searchTerm = filterSearchInput.value.toLowerCase();
        
        // 2. Get selected CATEGORY filters
        const checkedCategoryBoxes = document.querySelectorAll('#filter-options-wrapper input[type="checkbox"]:checked');
        const selectedCategoryFilters = Array.from(checkedCategoryBoxes).map(box => box.value);
        
        // 3. Get selected INTERSECTION filters
        const checkedIntersectionBoxes = document.querySelectorAll('#intersection-options-wrapper input[type="checkbox"]:checked');
        const selectedIntersectionFilters = Array.from(checkedIntersectionBoxes).map(box => box.value);

        // 4. Now, loop through every marker
        allMarkers.forEach((marker, index) => {
          const listItem = allListItems[index]; 
          const itemText = listItem.textContent.toLowerCase();

          // --- Check our THREE conditions ---
          
          // Condition 1: Does it match the category?
          const matchesCategoryFilter = (selectedCategoryFilters.length === 0) || selectedCategoryFilters.includes(marker.category);
          
          // Condition 2: Does it match the intersection type?
          const matchesIntersectionFilter = (selectedIntersectionFilters.length === 0) || selectedIntersectionFilters.includes(marker.intersectionType);
          
          // Condition 3: Does it match the search term?
          const matchesSearch = itemText.includes(searchTerm);

          // --- Final Decision ---
          // It only shows if it matches ALL THREE conditions
          if (matchesCategoryFilter && matchesIntersectionFilter && matchesSearch) {
            marker.map = map;             // Show marker
            listItem.style.display = "";  // Show list item
          } else {
            marker.map = null;            // Hide marker
            listItem.style.display = "none"; // Hide list item
          }
        });
      }

      /**
       * Handles the "Find My Location" button click.
       * Attempts to get user's location, places a marker, and finds the
       * nearest visible traffic light.
       */
      function handleFindMeClick() {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              
              // --- Create a custom marker for the user's location ---
              const userLocationPin = document.createElement("div");
              userLocationPin.style.width = "18px";
              userLocationPin.style.height = "18px";
              userLocationPin.style.borderRadius = "50%";
              userLocationPin.style.backgroundColor = "#4285F4"; // Google Blue
              userLocationPin.style.border = "2px solid white";
              userLocationPin.style.boxShadow = "0 2px 4px rgba(0,0,0,0.4)";
              userLocationPin.style.boxSizing = "border-box";

              // 1. If there's an old user marker, remove it first
              if (userLocationMarker) {
                userLocationMarker.map = null;
              }

              // 2. Create the new marker and save it
              userLocationMarker = new google.maps.marker.AdvancedMarkerElement({
                position: userLocation,
                map: map,
                title: "Your Location",
                content: userLocationPin // Use the custom div
              });

              // 3. Add a click listener to it
              userLocationMarker.addListener("click", () => {
                infoWindow.setContent("<strong>You are here!</strong>");
                infoWindow.open(map, userLocationMarker);
              });
              
              map.panTo(userLocation);
              map.setZoom(16);
              
              // --- Find Nearest Logic ---
              let shortestDistance = Infinity; // Start with an impossibly large distance
              let closestMarker = null;

              allMarkers.forEach(marker => {
                // IMPORTANT: We only check markers that are currently visible on the map
                if (marker.map) { 
                  // Calculate distance
                  const distance = google.maps.geometry.spherical.computeDistanceBetween(
                    userLocation,   // The user's position
                    marker.position // This marker's position
                  );
                  
                  // If this marker is closer than the last one we found...
                  if (distance < shortestDistance) {
                    shortestDistance = distance; // ...save its distance
                    closestMarker = marker;    // ...and save the marker itself
                  }
                }
              });

              // After checking all markers, see if we found one
              if (closestMarker) {
                // Found one!
                const distanceInKm = (shortestDistance / 1000).toFixed(2);
                // (Note: The original code had an empty 'if' block here)
              } else {
                alert("No traffic lights found matching your current filters.");
              }
              // --- End of Find Nearest Logic ---
            },
            () => { 
              // This runs if geolocation fails or is denied
              alert("Error: The Geolocation service failed or you denied permission."); 
            }
          );
        } else { 
          // This runs if the browser doesn't support geolocation
          alert("Error: Your browser's doesn't support geolocation."); 
        }
      }

      /**
       * Initializes the Google Places SearchBox for global map search.
       */
      function setupPlacesSearchBox() {
        const searchBox = new google.maps.places.SearchBox(globalSearchInput, {
          componentRestrictions: { country: "MY" } // Restrict to Malaysia
        });

        // Bias the search results to the map's current view
        map.addListener("bounds_changed", () => {
          searchBox.setBounds(map.getBounds());
        });

        // Listener for when the user selects a place
        searchBox.addListener("places_changed", () => {
          const places = searchBox.getPlaces();

          if (places.length == 0) {
            return; 
          }

          // Clear out the old search marker
          if (searchedLocationMarker) {
            searchedLocationMarker.map = null;
          }

          const place = places[0];
          const location = place.geometry.location;
          const viewport = place.geometry.viewport;

          // Create a red pin for the searched location
          const redPin = new google.maps.marker.PinElement({
              background: "#EA4335", // Google Red
              borderColor: "#A02D24",
              glyphColor: "#FFFFFF",
          });

          // Create the new marker
          searchedLocationMarker = new google.maps.marker.AdvancedMarkerElement({
            map: map,
            title: place.name,
            position: location,
            content: redPin.element // Use the red pin
          });

          // Zoom to the new location
          if (viewport) {
            map.fitBounds(viewport);
          } else {
            map.setCenter(location);
            map.setZoom(28); // (Original code had 28, keeping it)
          }
        });
      }


      // --- 5. DATA PROCESSING & MARKER CREATION ---
      // Loop through the data we fetched and build the map features.
      
      trafficLights.forEach(light => {
        
        // --- Create colored pins for Federal/State ---
        let pinColor;
        if (light.category === "SLIP") {
          pinColor = "#125092ff";
        } else if (light.category === "Alor Gajah") {
          pinColor = "#800080";
        } else if (light.category === "Melaka Tengah"){
          pinColor = "#ffcb10ff";
        } else if (light.category === "Jasin"){
          pinColor = "#659f14ff";
        } else {
          pinColor = "#6c757d";
        }

        const pin = new google.maps.marker.PinElement({
          background: pinColor,
          borderColor: "#333",
          glyphColor: "#ffffff",
        });

        // --- Create the Marker ---
        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: light.position,
          map: map,
          title: light.code,
          content: pin.element 
        });
        
        // Store custom data on the marker object for filtering
        marker.category = light.category;
        marker.intersectionType = light.intersectionType;
        allMarkers.push(marker);
        
        // --- Create the List Item ---
        const listItem = document.createElement("li");
        listItem.innerHTML = `<strong>${light.code}</strong> - ${light.description}`;
        listElement.appendChild(listItem);
        allListItems.push(listItem);
    
        // --- Marker Click Listener ---
        marker.addListener("click", () => {
          
          // 1. Create a main container
          const contentContainer = document.createElement("div");
          contentContainer.style.width = "260px";

          // 2. Add the text info
          const textInfo = document.createElement("div");
          textInfo.innerHTML = 
            `<strong>Code:</strong> ${light.code}<br>` +
            `<strong>Description:</strong> ${light.description}<br><br>`;
          contentContainer.appendChild(textInfo);

          // 3. Add the "Get Directions" link
          const directionsLink = document.createElement("a");
          directionsLink.href = `https://maps.google.com/?q=${light.position.lat},${light.position.lng}`;
          directionsLink.target = "_blank";
          directionsLink.textContent = "Get Directions";
          contentContainer.appendChild(directionsLink);

          // 4. Create the <div> that will HOLD the Street View
          const panoramaContainer = document.createElement("div");
          panoramaContainer.style.width = "250px";
          panoramaContainer.style.height = "150px";
          panoramaContainer.style.marginTop = "10px";
          panoramaContainer.style.borderRadius= "6px";
          panoramaContainer.style.border = "1px solid #d3d3d3ff";
          contentContainer.appendChild(panoramaContainer);
          
          // --- Set content and open the InfoWindow ---
          infoWindow.setContent(contentContainer);
          infoWindow.open(map, marker);

          // --- Create the Street View Panorama ---
          // We do this *after* the InfoWindow is open and the <div> exists
          new google.maps.StreetViewPanorama(
            panoramaContainer, // <-- Tell it which <div> to live in
            {
              position: light.position, // Tell it where to look
              pov: { heading: 34, pitch: 10 }, // Point of View (optional)
              visible: true,
              controls: false, // Hides the navigation controls
              enableCloseButton: false, // Hides the 'x' button
              addressControl: false, // Hides the address
              linksControl: false // Hides the arrows to "move"
            }
          );
          
          // --- Highlight the corresponding list item ---
          allListItems.forEach(item => item.classList.remove("active-list-item"));
          listItem.classList.add("active-list-item");
        });

        // --- List Item Click Listener ---
        listItem.addEventListener("click", () => {
          map.panTo(light.position);
          google.maps.event.trigger(marker, "click"); // Triggers the marker's click event
          
          // Highlight this list item
          allListItems.forEach(item => item.classList.remove("active-list-item"));
          listItem.classList.add("active-list-item");
        });
      }); // --- End of trafficLights.forEach loop ---

      
      // --- 6. ATTACH EVENT LISTENERS ---
      // Now that all functions are defined and markers are created,
      // we hook up all the interactive elements.
      
      // Filter Search Box (Traffic Lights)
      filterSearchInput.addEventListener("keyup", applyFilters);
    
      // Filter Checkboxes
      filterCheckboxes.forEach(checkbox => {
        // We use the "change" event for checkboxes
        checkbox.addEventListener("change", applyFilters);
      });

      // "Find My Location" Button
      findMeBtn.addEventListener("click", handleFindMeClick);

      // Global Places Search Box
      setupPlacesSearchBox(); // Call the setup function

      // Clear Global Search Button
      clearSearchBtn.addEventListener("click", () => {
        globalSearchInput.value = ""; // We use the input directly
        if (searchedLocationMarker) {
          searchedLocationMarker.map = null;
        }
        globalSearchInput.focus(); // Focus the input directly
      });

      // Clear Filter Search Button
      clearFilterBtn.addEventListener("click", () => {
        filterSearchInput.value = ""; 
        
        // We have to manually re-run the filter function
        // to make sure all markers and list items re-appear
        applyFilters(); 
        
        filterSearchInput.focus();
      });

    }) // End of .then()
    .catch(error => {
      // This will catch any errors, like if the traffic-lights.json file is missing OR if JS fails.
      console.error("Error during initMap:", error);
      alert("An error occurred while loading the map. Please check the console.");
    });

} // End of initMap function
