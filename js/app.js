import { getConversion, getHistory, getUnits, saveHistory } from "./api.js";
import { applyConversion, compareValues, performArithmetic } from "./conversion.js";
import {
  populateDropdown,
  renderHistory,
  setActive,
  showResult,
  toggleOperators
} from "./ui.js";

const state = {
  type: "length",
  action: "Conversion",
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

function getBaseUnit(type) {
  const baseByType = {
    length: "m",
    weight: "kg",
    temperature: "C",
    volume: "L"
  };
  return baseByType[type] || "";
}

async function convertToBase(value, unit, type) {
  const baseUnit = getBaseUnit(type);
  if (!baseUnit) {
    throw new Error("Unknown type");
  }

  if (unit === baseUnit) {
    return value;
  }

  const conv = await getConversion(unit, baseUnit);
  return applyConversion(value, conv);
}

function buildExpression(resultValue) {
  if (state.action === "Conversion") {
    return `${state.fromVal} ${state.fromUnit} -> ${state.toUnit}`;
  }

  if (state.action === "Comparison") {
    return `${state.fromVal} ${state.fromUnit} ? ${state.toVal} ${state.toUnit}`;
  }

  return `${state.fromVal} ${state.fromUnit} ${state.operator} ${state.toVal} ${state.toUnit}`;
}

async function calculate() {
  try {
    if (!Number.isFinite(state.fromVal) || !state.fromUnit || !state.toUnit) {
      return;
    }

    let resultText = "";
    let resultUnit = "";
    let resultValue = null;

    if (state.action === "Conversion") {
      if (state.fromUnit === state.toUnit) {
        resultValue = parseFloat(state.fromVal.toFixed(6));
      } else {
        const conv = await getConversion(state.fromUnit, state.toUnit);
        resultValue = applyConversion(state.fromVal, conv);
      }
      resultText = resultValue;
      resultUnit = state.toUnit;
      showResult(resultText, resultUnit);
    } else if (state.action === "Comparison") {
      if (!Number.isFinite(state.toVal)) {
        return;
      }

      const base1 =
        state.fromUnit === state.toUnit
          ? state.fromVal
          : await convertToBase(state.fromVal, state.fromUnit, state.type);
      const base2 =
        state.fromUnit === state.toUnit
          ? state.toVal
          : await convertToBase(state.toVal, state.toUnit, state.type);

      resultText = compareValues(
        state.fromVal,
        state.fromUnit,
        state.toVal,
        state.toUnit,
        base1,
        base2
      );
      resultValue = resultText;
      showResult(resultText, "");
    } else {
      if (!Number.isFinite(state.toVal)) {
        return;
      }

      const v2normalised =
        state.toUnit === state.fromUnit
          ? state.toVal
          : applyConversion(state.toVal, await getConversion(state.toUnit, state.fromUnit));
      resultValue = performArithmetic(state.fromVal, v2normalised, state.operator);
      resultText = resultValue;
      resultUnit = state.fromUnit;
      showResult(resultText, resultUnit);
    }

    const record = {
      type: state.type,
      action: state.action,
      expression: buildExpression(resultValue),
      result: String(resultValue),
      timestamp: new Date().toISOString()
    };

    await saveHistory(record);
    renderHistory(await getHistory());
  } catch (e) {
    showResult("Error: " + e.message, "");
  }
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
      toggleOperators(state.action === "Arithmetic");
      showResult(0, "");
      calculate();
    });
  });

  fromSelect?.addEventListener("change", (event) => {
    state.fromUnit = event.target.value;
    calculate();
  });

  toSelect?.addEventListener("change", (event) => {
    state.toUnit = event.target.value;
    calculate();
  });

  fromInput?.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.fromVal = Number.isFinite(value) ? value : null;
    calculate();
  });

  toInput?.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.toVal = Number.isFinite(value) ? value : null;
    calculate();
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
  renderHistory(await getHistory());
});