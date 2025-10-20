// This is the main function, defined globally.
function initMap() {
  
  // NOW we fetch the data, *inside* the function that Google calls.
  fetch("traffic-lights.json")
    .then(response => response.json()) // 1. Once the file is fetched...
    .then(trafficLights => {          // 2. ...and parsed, the data is ready.
      
      // 3. NOW we build the map and all features.
      
      const mapCenter = { lat: 2.3, lng: 102.3 };

      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 11,
        center: mapCenter,
        mapId: "f49b240c79c381e43a2b689c" // Required for Advanced Markers
      });

      const infoWindow = new google.maps.InfoWindow();
      const listElement = document.getElementById("traffic-light-list");
      const allMarkers = [];
      const allListItems = [];
      let searchedLocationMarker = null;
    let userLocationMarker = null;
      // Loop through each traffic light
      trafficLights.forEach(light => {
        
        // --- Create colored pins for Federal/State ---
        let pinColor;
        if (light.category === "SLIP") {
          pinColor = "#125092ff"; // Blue
        } else if (light.category === "Alor Gajah") {
          pinColor = "#800080"; // Purple
        } else if (light.category === "Melaka Tengah"){
          pinColor = "#e97100ff"; // Grey
        } else if (light.category === "Jasin"){
          pinColor = "#03703dff"; // Grey
        } else {pinColor = "#6c757d"}; // Grey

  const pin = new google.maps.marker.PinElement({
          background: pinColor, // Google Red
          borderColor: "#333",
          glyphColor: "#ffffff",
        });

        const marker = new google.maps.marker.AdvancedMarkerElement({
          position: light.position,
          map: map,
          title: light.code,
          content: pin.element 
        });
        
        marker.category = light.category;
        marker.category = light.category;
        marker.intersectionType = light.intersectionType; // <-- ADD THIS
        allMarkers.push(marker);
        
        const listItem = document.createElement("li");
        listItem.innerHTML = `<strong>${light.code}</strong> - ${light.description}`;
        listElement.appendChild(listItem);
        allListItems.push(listItem);
    
        marker.addListener("click", () => {

          // --- Create the new InfoWindow content dynamically ---
          
          // 1. Create a main container
          const contentContainer = document.createElement("div");
          contentContainer.style.width = "260px"; // Give it a little space

          // 2. Add the text info
          const textInfo = document.createElement("div");
          textInfo.innerHTML = 
            `<strong>Code:</strong> ${light.code}<br>` +
            `<strong>Description:</strong> ${light.description}<br><br>`;
          contentContainer.appendChild(textInfo);

          // 3. Add the "Get Directions" link
          const directionsLink = document.createElement("a");
          directionsLink.href = `https://www.google.com/maps/dir/?api=1&destination=${light.position.lat},${light.position.lng}`;
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

          // --- NOW, create the Street View Panorama ---
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
          // --- End of Street View code ---
          
          // This part stays the same
          allListItems.forEach(item => item.classList.remove("active-list-item"));
          listItem.classList.add("active-list-item");
        });
        listItem.addEventListener("click", () => {
          map.panTo(light.position);
          google.maps.event.trigger(marker, "click");
          
          allListItems.forEach(item => item.classList.remove("active-list-item"));
          listItem.classList.add("active-list-item");
        });
      });

    // --- This is our new, multi-group filter function ---
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
    // --- Filter Search Box (Traffic Lights) Logic ---
      const filterSearchInput = document.getElementById("search-box"); 
      filterSearchInput.addEventListener("keyup", applyFilters); // Just call our new function!
    
// --- Filter Checkbox Logic ---
      // 1. Find all our new checkboxes
      const filterCheckboxes = document.querySelectorAll('#filter-controls input[type="checkbox"]');

      // 2. Add a listener to *each* one
      filterCheckboxes.forEach(checkbox => {
        // We use the "change" event for checkboxes
        checkbox.addEventListener("change", () => {
          // When any box is checked or unchecked, just re-run the main filter function
          applyFilters();
        });
      });
      // --- "Find My Location" Logic ---
      const findMeBtn = document.getElementById("find-me-btn");
      findMeBtn.addEventListener("click", () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              
// --- This is the new custom marker styling ---
              const userLocationPin = document.createElement("div");
              userLocationPin.style.width = "18px";
              userLocationPin.style.height = "18px";
              userLocationPin.style.borderRadius = "50%";
              userLocationPin.style.backgroundColor = "#4285F4"; // Google Blue
              userLocationPin.style.border = "2px solid white";
              userLocationPin.style.boxShadow = "0 2px 4px rgba(0,0,0,0.4)";
              userLocationPin.style.boxSizing = "border-box";

              // --- START OF CHANGES ---
              
              // 1. If there's an old marker, remove it first
              if (userLocationMarker) {
                userLocationMarker.map = null;
              }

              // 2. Create the new marker and save it to our variable
              userLocationMarker = new google.maps.marker.AdvancedMarkerElement({
                position: userLocation,
                map: map,
                title: "Your Location",
                content: userLocationPin // Use the custom div
              });

              // 3. Add a click listener to it!
              userLocationMarker.addListener("click", () => {
                infoWindow.setContent("<strong>You are here!</strong>");
                infoWindow.open(map, userLocationMarker);
              });
              // --- END OF CHANGES ---
              
              map.panTo(userLocation);
              map.setZoom(16);
              // --- Find Nearest Logic ---
              let shortestDistance = Infinity; // Start with an impossibly large distance
              let closestMarker = null;

              allMarkers.forEach(marker => {
                // IMPORTANT: We only check markers that are currently visible on the map
                if (marker.map) { 
                  // This is the magic function!
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
                


                
              } else {
                alert("No traffic lights found matching your current filters.");
              }
              // --- End of Find Nearest Logic ---
            },
            () => { alert("Error: The Geolocation service failed or you denied permission."); }
          );
        } else { alert("Error: Your browser's doesn't support geolocation."); }
      });

      // --- [CORRECTED] Global Places Search Box Logic (using SearchBox) ---
      
      const globalSearchInput = document.getElementById("global-search-box");
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

        searchedLocationMarker = new google.maps.marker.AdvancedMarkerElement({
          map: map,
          title: place.name,
          position: location,
          content: redPin.element // Use the red pin
        });

        if (viewport) {
          map.fitBounds(viewport);
        } else {
          map.setCenter(location);
          map.setZoom(28); 
        }
      });
      // --- END OF CORRECTED BLOCK ---


      // --- [CORRECTED] Clear Global Search Button Logic ---
      const clearSearchBtn = document.getElementById("clear-search-btn");
      clearSearchBtn.addEventListener("click", () => {
        globalSearchInput.value = ""; // We use the input directly
        if (searchedLocationMarker) {
          searchedLocationMarker.map = null;
        }
        globalSearchInput.focus(); // Focus the input directly
      });
      // --- END OF CORRECTED BLOCK ---


// --- Clear Filter Search Button Logic ---
      const clearFilterBtn = document.getElementById("clear-filter-btn");
      clearFilterBtn.addEventListener("click", () => {
        filterSearchInput.value = ""; 
        // We have to manually re-show all list items
        const allListItems = document.querySelectorAll("#traffic-light-list li");
        allListItems.forEach(item => {
          item.style.display = "";
        });
        
        // And we have to manually re-run the *other* filter
        applyFilters(); // This will re-show the markers
        
        filterSearchInput.focus();
      });

    }) // End of .then()
    .catch(error => {
      // This will catch any errors, like if the traffic-lights.json file is missing OR if JS fails.
      console.error("Error during initMap:", error);
      alert("An error occurred while loading the map. Please check the console.");
    });

} // End of initMap function