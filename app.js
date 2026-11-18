function showMessage(text) {
  let message = document.querySelector(".message");

  if (!message) {
    message = document.createElement("div");
    message.className = "message";
    document.body.appendChild(message);
  }

  message.textContent = text;
  message.classList.add("show");

  setTimeout(() => {
    message.classList.remove("show");
  }, 2500);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-message]").forEach((button) => {
    button.addEventListener("click", () => {
      showMessage(button.dataset.message);
    });
  });
});
