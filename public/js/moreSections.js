const moreSectionsButton = document.querySelector(
  'button[onclick="moreSections()"]'
);
const moreSectionsContainer = document.getElementById("moreSections");

moreSectionsButton.addEventListener("click", function () {
  const newSection = document.createElement("div");
  newSection.classList.add("newSection"); // Apply the class for animation

  newSection.innerHTML = `
    <div>
      <label for="">Overskrift</label>
      <input type="text" name="overskrift" />
    </div>
    <div>
      <label for="">Beskrivelse</label>
      <textarea name="beskrivelse" rows="4" required style="width: 100%; padding: 10px; border: 1px solid var(--secondaryColorReverse); border-radius: calc(var(--borderRadius) / 2); background-color: var(--primaryColor); color: var(--secondaryColorReverse); transition: all var(--primaryTransitionSpeed);"></textarea>
    </div>
    <div>
      <label for="">Bilde</label>
      <input type="file" name="bilde" accept="image/png image/jpeg image/jpg" />
      <img src="" alt="Selected image" style="max-width: 100%; display: none" />
    </div>
  `;

  moreSectionsContainer.appendChild(newSection);

  // Trigger the transition effect
  requestAnimationFrame(() => {
    newSection.classList.add("visible");
  });
});

// Image input event listener (same as your original code)
const imageInput = document.getElementById("bilde");
const imageDisplay = document.getElementById("imageDisplay");

imageInput.addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();

    reader.onload = function (e) {
      imageDisplay.src = e.target.result;
      imageDisplay.style.display = "flex";
    };
    reader.readAsDataURL(file);
  }
});
