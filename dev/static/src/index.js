window.addEventListener("load", () => {
  const logout = document.getElementById("logout");
  if (logout) {
    logout.onclick = () => {
      document.cookie = "SESSIONID=;";
      window.location.href = "/";
    }
  }
});