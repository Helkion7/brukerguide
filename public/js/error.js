document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector(".register");
  const errorBox = document.getElementById("errorBox");

  form.onsubmit = async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const repeatPassword = document.getElementById("repeatPassword").value;

    // Clear previous error messages
    errorBox.innerHTML = "";
    errorBox.classList.remove("show");

    // Client-side password match check
    if (password !== repeatPassword) {
      showError("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, repeatPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        showError(data.error);
      } else {
        // Registration successful, redirect to login page
        window.location.href = "/login";
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
