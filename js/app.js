import { getUnits } from "./api.js";
import { populateDropdown, setActive, showResult, toggleOperators } from "./ui.js";

const state = {
  type: "length",
  action: "conversion",
  fromVal: null,
  fromUnit: "",
  toVal: null,
  toUnit: "",
  operator: "+"
};

function showError(message) {
  let banner = document.getElementById("errorBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "errorBanner";
    banner.style.background = "#ffe5e5";
    banner.style.color = "#a40000";
    banner.style.padding = "10px 14px";
    banner.style.margin = "12px";
    banner.style.borderRadius = "6px";
    banner.style.fontSize = "14px";
    document.body.prepend(banner);
  }
  banner.textContent = message;
}

function clearError() {
  const banner = document.getElementById("errorBanner");
  if (banner) {
    banner.remove();
  }
}

function markSelectedType(typeCards, activeCard) {
  typeCards.forEach((card) => {
    card.classList.toggle("selected", card === activeCard);
  });
}

async function loadUnitsForType(type) {
  const fromSelect = document.getElementById("fromUnit");
  const toSelect = document.getElementById("toUnit");
  if (!fromSelect || !toSelect) {
    return;
  }

  try {
    const units = await getUnits(type);
    populateDropdown(fromSelect, units);
    populateDropdown(toSelect, units);
    state.fromUnit = "";
    state.toUnit = "";
    clearError();
  } catch (error) {
    if (error instanceof TypeError) {
      showError("Server unavailable");
    } else {
      showError("Could not load units");
    }
  }
}

function attachEventListeners() {
  const typeSelector = document.querySelector(".type-row");
  const actionRow = document.querySelector(".action-row");
  const typeCards = Array.from(document.querySelectorAll(".type-card"));
  const actionButtons = Array.from(document.querySelectorAll(".action-btn"));
  const fromInput = document.getElementById("inputValue");
  const toInput = document.getElementById("result");
  const fromSelect = document.getElementById("fromUnit");
  const toSelect = document.getElementById("toUnit");

  typeCards.forEach((card) =>
    card.addEventListener("click", async () => {
      state.type = card.dataset.type || "length";
      setActive(typeSelector, card, ".type-card");
      markSelectedType(typeCards, card);

      if (fromInput) {
        fromInput.value = "";
      }
      if (toInput) {
        toInput.value = "";
      }
      showResult(0, "");

      try {
        const units = await getUnits(state.type);
        populateDropdown(fromSelect, units);
        populateDropdown(toSelect, units);
        state.fromUnit = "";
        state.toUnit = "";
        clearError();
      } catch (error) {
        if (error instanceof TypeError) {
          showError("Server unavailable");
        } else {
          showError("Could not load units");
        }
      }
    })
  );

  actionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.action = btn.dataset.action || "Conversion";  
      setActive(actionRow, btn, ".action-btn");
      state.action = btn.textContent?.trim() || "Conversion";
      toggleOperators(state.action === "Arithmetic");
      showResult(0, "");
    });
  });

  fromSelect?.addEventListener("change", (event) => {
    state.fromUnit = event.target.value;
  });

  toSelect?.addEventListener("change", (event) => {
    state.toUnit = event.target.value;
  });
}

function setDefaultActiveButtons() {
  const typeSelector = document.querySelector(".type-row");
  const actionRow = document.querySelector(".action-row");
  const typeCards = Array.from(document.querySelectorAll(".type-card"));
  const actionButtons = Array.from(document.querySelectorAll(".action-btn"));

  if (typeCards.length > 0) {
    setActive(typeSelector, typeCards[0], ".type-card");
    markSelectedType(typeCards, typeCards[0]);
  }

  if (actionButtons.length > 0) {
    setActive(actionRow, actionButtons[0], ".action-btn");
    state.action = actionButtons[0].dataset.action || state.action;
  }
}

function waitForAppShell() {
  return new Promise((resolve) => {
    const tryFind = () => {
      if (document.getElementById("fromUnit") && document.getElementById("toUnit")) {
        resolve();
        return;
      }
      setTimeout(tryFind, 50);
    };
    tryFind();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await waitForAppShell();
  attachEventListeners();
  await loadUnitsForType("length");
  setDefaultActiveButtons();
  toggleOperators(false);
});