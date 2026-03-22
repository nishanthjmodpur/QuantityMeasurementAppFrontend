import { getUnits } from "./api.js";
import { populateDropdown, setActive, toggleOperators} from "./ui.js";

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
    banner.style.background = "#ffe5ef";
    banner.style.color = "#a40000";
    banner.style.padding = "10px 14px";
    banner.style.borderRadius = "6px";
    banner.style.margin = "12px";
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

function populateUnitSelects(units) {
  const fromSelect = document.getElementById("fromUnit");
  const toSelect = document.getElementById("toUnit");
  if (!fromSelect || !toSelect) {
    return;
  }
  populateDropdown(fromSelect, units);
  populateDropdown(toSelect, units);

  state.fromUnit = units[0]?.symbol || "";
  state.toUnit = units[1]?.symbol || units[0]?.symbol || "";
  if (state.fromUnit) {
    fromSelect.value = state.fromUnit;
  }
  if (state.toUnit) {
    toSelect.value = state.toUnit;
  }
}

async function loadUnits(type) {
  state.type = type;
  try {
     const units = await getUnits(type);
     populateUnitSelects(units);
     clearError();
  } catch (error) {
    if (error instanceof TypeError) {
      showError("Server unavailable");
    } else {
      showError("Could not load units");
    }
  }
}

async function loadHistory() {
  try {
    const response = await fetch("https://api.measurement.azaken.com/history");
    if (!response.ok) {
      throw new Error("Failed to load history");
    }
    await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      showError("Server unavailable");
    }
  }
}

function selectCategory(typeText) {
  const typeRow = document.querySelector(".type-row");
  const cards = Array.from(document.querySelectorAll(".type-card"));
  const index = cards.findIndex((card) => {
    const label = card.querySelector(".type-label")?.textContent?.trim();
    return label?.toLowerCase() === typeText.toLowerCase();
  });

  if (index >= 0) {
    setActive(typeRow, cards[index], ".type-card");
    cards.forEach((card, i) => {
      card.classList.toggle("selected", i === index);
    });
  }

  loadUnits(typeText);
}

function attachEventListeners() {
  const typeRow = document.querySelector(".type-row");
  const actionRow = document.querySelector(".action-row");
  const typeCards = Array.from(document.querySelectorAll(".type-card"));
  const actionButtons = Array.from(document.querySelectorAll(".action-btn"));
  const fromSelect = document.getElementById("fromUnit");
  const toSelect = document.getElementById("toUnit");
  const input = document.getElementById("inputValue");
  const result = document.getElementById("result");

  typeCards.forEach((card) => {
    card.addEventListener("click", () => {
      const label = card.querySelector(".type-label")?.textContent?.trim() || "Length";
      selectCategory(label);
    });
  });

  actionButtons.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      setActive(actionRow, btn, ".action-btn");
      state.action = btn.textContent?.trim() || "Conversion";
      toggleOperators(state.action === "Arithmetic");
    });
  });

  fromSelect?.addEventListener("change", (event) => {
    state.fromUnit = event.target.value;
  });

  toSelect?.addEventListener("change", (event) => {
    state.toUnit = event.target.value;
  });

  input?.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.fromVal = Number.isNaN(value) ? null : value;
  });

  result?.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.toVal = Number.isNaN(value) ? null : value;
  });
}

function setDefaultActiveButtons() {
  const typeRow = document.querySelector(".type-row");
  const actionRow = document.querySelector(".action-row");
  const typeCards = Array.from(document.querySelectorAll(".type-card"));
  const actionButtons = Array.from(document.querySelectorAll(".action-btn"));

  if (typeCards.length > 0) {
    setActive(typeRow, typeCards[0], ".type-card");
    typeCards.forEach((card, i) => {
      card.classList.toggle("selected", i === 0);
    });
  }

  if (actionButtons.length > 0) {
    setActive(actionRow, actionButtons[0], ".action-btn");
    state.action = actionButtons[0].textContent?.trim() || state.action;
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

window.selectCategory = selectCategory;

document.addEventListener("DOMContentLoaded", async () => {
  await waitForAppShell();
  attachEventListeners();
  await loadUnits("Length");
  setDefaultActiveButtons();
  toggleOperators(false);
  await loadHistory();
});