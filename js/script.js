import { getHistory, getUnits } from "./api.js";
import { calculate, handleActionTabClick, handleTypeCardClick, state } from "./app.js";
import { populateUnitDropdowns, renderHistory, setActive, toggleOperators } from "./ui.js";

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

function sanitizeNumericInput(el) {
  if (!el) {
    return;
  }
  const raw = el.value;
  let next = raw.replace(/[^0-9.]/g, "");
  const parts = next.split(".");
  if (parts.length > 2) {
    next = parts[0] + "." + parts.slice(1).join("");
  }
  if (next !== raw) {
    el.value = next;
  }
}

function readNumeric(el) {
  if (!el || el.value.trim() === "") {
    return null;
  }
  const n = Number(el.value);
  return Number.isFinite(n) ? n : null;
}

function updateModeUI() {
  const toValue = document.getElementById("toValue");
  const fromLabel = document.getElementById("from-label");
  const toLabel = document.getElementById("to-label");
  if (!toValue) {
    return;
  }
  if (state.action === "Conversion") {
    toValue.style.display = "none";
  } else {
    toValue.style.display = "";
  }
  if (fromLabel && toLabel) {
    if (state.action === "Comparison") {
      fromLabel.textContent = "VALUE1";
      toLabel.textContent = "VALUE2";
    } else {
      fromLabel.textContent = "FROM";
      toLabel.textContent = "TO";
    }
  }
}

function getOrchestrationContext() {
  return {
    typeSelector: document.querySelector(".type-row"),
    actionRow: document.querySelector(".action-row"),
    typeCards: Array.from(document.querySelectorAll(".type-card")),
    fromInput: document.getElementById("inputValue"),
    toValueInput: document.getElementById("toValue"),
    resultInput: document.getElementById("result"),
    fromSelect: document.getElementById("fromUnit"),
    toSelect: document.getElementById("toUnit"),
    showError,
    clearError
  };
}

let calcTimer = null;

function scheduleCalculate() {
  clearTimeout(calcTimer);
  calcTimer = setTimeout(() => {
    calculate();
  }, 120);
}

function attachEventListeners() {
  const ctx = getOrchestrationContext();
  const { typeSelector, actionRow, typeCards, fromInput, toValueInput, resultInput, fromSelect, toSelect } =
    ctx;

  typeCards.forEach((card) => {
    card.addEventListener("click", async () => {
      await handleTypeCardClick(card, getOrchestrationContext());
      updateModeUI();
      scheduleCalculate();
    });
  });

  document.querySelectorAll(".action-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      handleActionTabClick(btn, getOrchestrationContext());
      updateModeUI();
      scheduleCalculate();
    });
  });

  const operatorRow = document.getElementById("operator-selector");
  document.querySelectorAll(".op-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (operatorRow) {
        setActive(operatorRow, btn, ".op-btn");
      }
      state.operator = btn.dataset.op || "+";
      scheduleCalculate();
    });
  });

  fromSelect?.addEventListener("change", (event) => {
    state.fromUnit = event.target.value;
    scheduleCalculate();
  });

  toSelect?.addEventListener("change", (event) => {
    state.toUnit = event.target.value;
    scheduleCalculate();
  });

  fromInput?.addEventListener("input", () => {
    sanitizeNumericInput(fromInput);
    state.fromVal = readNumeric(fromInput);
    scheduleCalculate();
  });

  toValueInput?.addEventListener("input", () => {
    sanitizeNumericInput(toValueInput);
    state.toVal = readNumeric(toValueInput);
    scheduleCalculate();
  });
}

async function loadInitialUnits() {
  const fromSelect = document.getElementById("fromUnit");
  const toSelect = document.getElementById("toUnit");
  if (!fromSelect || !toSelect) {
    return;
  }

  try {
    const units = await getUnits(state.type);
    populateUnitDropdowns(fromSelect, toSelect, units);
    state.fromUnit = fromSelect.value;
    state.toUnit = toSelect.value;
    clearError();
  } catch (error) {
    if (error instanceof TypeError) {
      showError("Server unavailable");
    } else {
      showError("Could not load units");
    }
  }
}

function setDefaultActiveButtons() {
  const typeSelector = document.querySelector(".type-row");
  const actionRow = document.querySelector(".action-row");
  const typeCards = Array.from(document.querySelectorAll(".type-card"));
  const actionButtons = Array.from(document.querySelectorAll(".action-btn"));

  if (typeCards.length > 0) {
    setActive(typeSelector, typeCards[0], ".type-card");
    typeCards.forEach((card, i) => {
      card.classList.toggle("selected", i === 0);
    });
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
  await loadInitialUnits();
  setDefaultActiveButtons();
  toggleOperators(state.action === "Arithmetic");
  updateModeUI();
  renderHistory(await getHistory());
});