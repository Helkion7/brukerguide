const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const imageDisplay = document.getElementById("imageDisplay");

// Function to handle file selection and display
function handleFile(file) {
  const reader = new FileReader();
  reader.onload = function (event) {
    imageDisplay.src = event.target.result;
    imageDisplay.style.display = "block";
  };
  reader.readAsDataURL(file);
}

// Click to open file input dialog
dropArea.addEventListener("click", () => {
  fileInput.click();
});

// Handle file input change
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    handleFile(file);
  }
});

// Drag over events
dropArea.addEventListener("dragover", (event) => {
  event.preventDefault();
  dropArea.classList.add("dragging");
});

// Drag leave event
dropArea.addEventListener("dragleave", () => {
  dropArea.classList.remove("dragging");
});

// Drop event
dropArea.addEventListener("drop", (event) => {
  event.preventDefault();
  dropArea.classList.remove("dragging");

  const file = event.dataTransfer.files[0];
  if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
    handleFile(file);
  }
});

// Function to dynamically add more sections
function addSection() {
  const container = document.getElementById("sectionsContainer");

  const sectionHTML = `
      <div class="section">
        <div>
          <label for="overskrift">Overskrift</label>
          <input type="text" name="overskrift" required />
        </div>
        <div>
          <label for="beskrivelse">Beskrivelse</label>
          <textarea name="beskrivelse" rows="4" required></textarea>
        </div>
        <div>
          <label for="bilde">Bilde</label>
          <div class="dropArea" style="border: 2px dashed #ccc; padding: 20px;">
            <input
              type="file"
              class="fileInput"
              name="bilde"
              accept="image/png, image/jpeg"
              style="display: none;"
            />
            <img
              class="imageDisplay"
              src=""
              alt="Selected image"
              style="max-width: 100%; display: none;"
            />
            <p>Drag and drop an image here, or click to select a file</p>
          </div>
        </div>
      </div>`;

  container.insertAdjacentHTML("beforeend", sectionHTML);

  // Select the last added section's elements
  const newSection = container.lastElementChild;
  const dropArea = newSection.querySelector(".dropArea");
  const fileInput = newSection.querySelector(".fileInput");
  const imageDisplay = newSection.querySelector(".imageDisplay");

  // Function to handle file selection and display
  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      imageDisplay.src = event.target.result;
      imageDisplay.style.display = "block";
    };
    reader.readAsDataURL(file);
  }

  // Click to open file input dialog
  dropArea.addEventListener("click", () => {
    fileInput.click();
  });

  // Handle file input change
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFile(file);
    }
  });

  // Drag over events
  dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropArea.classList.add("dragging");
  });

  // Drag leave event
  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("dragging");
  });

  // Drop event
  dropArea.addEventListener("drop", (event) => {
    event.preventDefault();
    dropArea.classList.remove("dragging");

    const file = event.dataTransfer.files[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      handleFile(file);
    }
  });
}

document.addEventListener("change", function (event) {
  if (event.target && event.target.name === "bilde") {
    const fileInput = event.target;
    const imageDisplay = fileInput.nextElementSibling;

    if (fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();

      reader.onload = function (e) {
        imageDisplay.src = e.target.result;
        imageDisplay.style.display = "block"; // Show the image
      };

      reader.readAsDataURL(fileInput.files[0]);
    } else {
      imageDisplay.style.display = "none"; // Hide the image if no file is selected
    }
  }
});
