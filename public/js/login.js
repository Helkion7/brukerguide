document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".login");
  const errorBox = document.getElementById("errorBox");

  form.onsubmit = async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Clear previous error messages
    errorBox.innerHTML = "";
    errorBox.classList.remove("show");

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error);
      } else {
        // Login successful, redirect to dashboard
        window.location.href = "/dashboard";
      }
    } catch (error) {
      console.error("Error:", error);
      showError("An unexpected error occurred. Please try again.");
    }
  };

  function showError(message) {
    errorBox.innerHTML = message;
    errorBox.classList.add("show");
  }
});
