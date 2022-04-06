function showMessage(text) {
  const message = document.getElementById("message");
  message.textContent = text;
  message.style.display = "block";
}

window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);

  if (params.has("cb")) {
    switch (params.get("cb")) {
      case "reset": {
        showMessage("Resetting...")
      }
    }
  }
});