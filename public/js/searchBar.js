function searchGuides() {
  // Get the search query
  let input = document.getElementById("myInput");
  let filter = input.value.toLowerCase();

  // Get all the guide cards
  let guideCards = document.querySelectorAll("#guideCards a");

  // Loop through all guide cards, and display those that match the search query
  guideCards.forEach((card) => {
    let title = card.querySelector(".guideTitle").textContent.toLowerCase();
    let tag = card.querySelector(".guideTag").textContent.toLowerCase();

    if (title.includes(filter) || tag.includes(filter)) {
      card.style.display = ""; // Show matching card
    } else {
      card.style.display = "none"; // Hide non-matching card
    }
  });
}
