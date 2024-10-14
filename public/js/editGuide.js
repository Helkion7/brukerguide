// editGuide.js

document.addEventListener("DOMContentLoaded", function () {
  const sectionsContainer = document.getElementById("sectionsContainer");
  setupExistingDropAreas();

  function setupExistingDropAreas() {
    const dropAreas = document.querySelectorAll(".dropArea");
    dropAreas.forEach(setupDropArea);
  }

  function setupDropArea(dropArea) {
    const fileInput = dropArea.querySelector(".fileInput");
    const imageDisplay = dropArea.querySelector(".imageDisplay");
    const dropText = dropArea.querySelector(".dropText");

    // Prevent default behaviors for drag and drop events
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight the drop area when dragging over it
    ["dragenter", "dragover"].forEach((eventName) => {
      dropArea.addEventListener(
        eventName,
        () => dropArea.classList.add("highlight"),
        false
      );
    });

    // Remove highlight when dragging leaves the drop area
    ["dragleave", "drop"].forEach((eventName) => {
      dropArea.addEventListener(
        eventName,
        () => dropArea.classList.remove("highlight"),
        false
      );
    });

    // Handle the file drop
    dropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      dropArea.classList.remove("highlight");
      const dt = e.dataTransfer;
      const file = dt.files[0];
      handleFile(file, fileInput, imageDisplay);
    });

    // Open file picker when clicking on the drop area
    dropArea.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      handleFile(file, fileInput, imageDisplay);
    });
  }

  function handleFile(file, fileInput, imageDisplay) {
    const validImageTypes = ["image/jpeg", "image/png"];
    if (!validImageTypes.includes(file.type)) {
      alert("Please upload a valid image (JPEG or PNG)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      imageDisplay.src = e.target.result;
      imageDisplay.style.display = "block";
      const dropText = imageDisplay.nextElementSibling; // Get the drop text element
      dropText.style.display = "none"; // Hide the drop text
    };
    reader.readAsDataURL(file);

    // Set file to input and trigger change event
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    // Trigger file input change event manually
    const event = new Event("change", { bubbles: true });
    fileInput.dispatchEvent(event);
  }

  window.addSection = function () {
    const sectionIndex = sectionsContainer.children.length;
    const newSection = document.createElement("div");
    newSection.className = "sectionItem";
    newSection.innerHTML = `
      <div class="formGroup">
        <label for="overskrift${sectionIndex}" class="formLabel">Section ${
      sectionIndex + 1
    } Title:</label>
        <input type="text" id="overskrift${sectionIndex}" name="overskrift" required class="formInput" maxlength="100" />
      </div>
      <div class="formGroup">
        <label for="beskrivelse${sectionIndex}" class="formLabel">Section ${
      sectionIndex + 1
    } Description:</label>
        <textarea id="beskrivelse${sectionIndex}" name="beskrivelse" required class="formTextarea" maxlength="2000"></textarea>
      </div>
      <div class="dropArea" data-index="${sectionIndex}">
        <label for="bilde${sectionIndex}" class="formLabel">Image:</label>
        <input type="file" id="bilde${sectionIndex}" name="bilde" accept="image/png, image/jpeg" class="fileInput" style="display: none" />
        <img class="imageDisplay" src="" alt="Section image" style="max-width: 100%; display: none;" />
        <p class="dropText">Drag and drop an image here, or click to select a file</p>
      </div>
    `;
    sectionsContainer.appendChild(newSection);
    setupDropArea(newSection.querySelector(".dropArea"));
  };

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
});
