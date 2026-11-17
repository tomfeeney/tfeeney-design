(function () {
      const PASSWORD = "bmw-ftw";
      const STORAGE_KEY = "audi_case_study_unlocked";

      const body = document.body;
      const gate = document.getElementById("pageGate");
      const page = document.getElementById("protectedPage");
      const form = document.getElementById("pageGateForm");
      const input = document.getElementById("pagePassword");
      const error = document.getElementById("pageGateError");

      function unlockPage() {
        sessionStorage.setItem(STORAGE_KEY, "true");
        gate.hidden = true;
        page.hidden = false;
        body.classList.remove("is-locked");
      }

      function showError(message) {
        error.textContent = message;
      }

      if (sessionStorage.getItem(STORAGE_KEY) === "true") {
        unlockPage();
        return;
      }

      form.addEventListener("submit", function (event) {
        event.preventDefault();

        const value = input.value.trim();

        if (value === PASSWORD) {
          showError("");
          unlockPage();
        } else {
          showError("Incorrect password. Please try again.");
        }
      });
    })();