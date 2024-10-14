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

    dropArea.addEventListener("click", () => fileInput.click());
    dropArea.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropArea.style.borderColor = "#45a049";
    });
    dropArea.addEventListener("dragleave", () => {
      dropArea.style.borderColor = "#ccc";
    });
    dropArea.addEventListener("drop", (e) => {
      e.preventDefault();
      dropArea.style.borderColor = "#ccc";
      const file = e.dataTransfer.files[0];
      handleFile(file, imageDisplay, dropText);
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      handleFile(file, imageDisplay, dropText);
    });
  }

  function handleFile(file, imageDisplay, dropText) {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        imageDisplay.src = e.target.result;
        imageDisplay.style.display = "block";
        dropText.style.display = "none";
      };
      reader.readAsDataURL(file);
    }
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
});
