// Handle drag and drop functionality
const dropArea = document.getElementById("dropArea");
const fileInput = document.getElementById("fileInput");
const imageDisplay = document.getElementById("imageDisplay");

// Prevent default behaviors for drag and drop events
["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
  dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

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
dropArea.addEventListener("drop", handleDrop, false);

function handleDrop(e) {
  const dt = e.dataTransfer;
  const file = dt.files[0];
  handleFile(file);
}

// Open file picker when clicking on the drop area
dropArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  handleFile(file);
});

// Function to handle the selected file and display the preview
function handleFile(file) {
  const validImageTypes = ["image/jpeg", "image/png"];
  if (!validImageTypes.includes(file.type)) {
    alert("Please upload a valid image (JPEG or PNG)");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    imageDisplay.src = e.target.result;
    imageDisplay.style.display = "block";
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

// Function to add a new section dynamically
function addSection() {
  const sectionsContainer = document.getElementById("sectionsContainer");

  // Create a new section div
  const section = document.createElement("div");
  section.classList.add("section");

  // Create "Overskrift" input
  const overskriftDiv = document.createElement("div");
  const overskriftLabel = document.createElement("label");
  overskriftLabel.setAttribute("for", "overskrift");
  overskriftLabel.innerText = "Overskrift";
  const overskriftInput = document.createElement("input");
  overskriftInput.type = "text";
  overskriftInput.name = "overskrift";
  overskriftInput.maxLength = 100;
  overskriftInput.required = true;
  overskriftDiv.appendChild(overskriftLabel);
  overskriftDiv.appendChild(overskriftInput);

  // Create "Beskrivelse" textarea
  const beskrivelseDiv = document.createElement("div");
  const beskrivelseLabel = document.createElement("label");
  beskrivelseLabel.setAttribute("for", "beskrivelse");
  beskrivelseLabel.innerText = "Beskrivelse";
  const beskrivelseTextarea = document.createElement("textarea");
  beskrivelseTextarea.name = "beskrivelse";
  beskrivelseTextarea.rows = 4;
  beskrivelseTextarea.maxLength = 2000;
  beskrivelseTextarea.required = true;
  beskrivelseDiv.appendChild(beskrivelseLabel);
  beskrivelseDiv.appendChild(beskrivelseTextarea);

  // Create "Bilde" input and drop area
  const dropAreaDiv = document.createElement("div");
  dropAreaDiv.classList.add("drop-area");
  dropAreaDiv.style.border = "2px dashed #ccc";
  dropAreaDiv.style.padding = "20px";

  const bildeLabel = document.createElement("label");
  bildeLabel.innerText = "Bilde";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.name = "bilde";
  fileInput.accept = "image/png, image/jpeg";
  fileInput.style.display = "none";

  const imageDisplay = document.createElement("img");
  imageDisplay.style.maxWidth = "100%";
  imageDisplay.style.display = "none";

  const dropAreaText = document.createElement("p");
  dropAreaText.innerText =
    "Drag and drop an image here, or click to select a file";

  dropAreaDiv.appendChild(bildeLabel);
  dropAreaDiv.appendChild(fileInput);
  dropAreaDiv.appendChild(imageDisplay);
  dropAreaDiv.appendChild(dropAreaText);

  // Handle click on the drop area to open file picker
  dropAreaDiv.addEventListener("click", () => fileInput.click());

  // Add drag-and-drop functionality (similar to previous logic)
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropAreaDiv.addEventListener(eventName, preventDefaults, false);
  });

  dropAreaDiv.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    const file = dt.files[0];
    handleFile(file, fileInput, imageDisplay);
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    handleFile(file, fileInput, imageDisplay);
  });

  function handleFile(file, input, image) {
    const validImageTypes = ["image/jpeg", "image/png"];
    if (!validImageTypes.includes(file.type)) {
      alert("Please upload a valid image (JPEG or PNG)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      image.src = e.target.result;
      image.style.display = "block";
    };
    reader.readAsDataURL(file);
    input.files = [file];
  }

  // Append all the elements to the section div
  section.appendChild(overskriftDiv);
  section.appendChild(beskrivelseDiv);
  section.appendChild(dropAreaDiv);

  // Add the new section to the container
  sectionsContainer.appendChild(section);
}

// Prevent default drag and drop behavior
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}
