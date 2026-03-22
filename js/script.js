// function convert() {
//   const value = parseFloat(document.getElementById("inputValue").value);
//   const from = document.getElementById("fromUnit").value;
//   const to = document.getElementById("toUnit").value;

//   let result = value;

//   if (from === "kg" && to === "g") {
//     result = value * 1000;
//   } else if (from === "g" && to === "kg") {
//     result = value / 1000;
//   }

//   document.getElementById("result").innerText = "Result: " + result;
// }


const API_URL = "https://api.measurement.azaken.com";

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

function setActive(elements, index) {
  elements.forEach((el, i) => {
    el.classList.toggle("active", i===index);
    el.classList.toggle("selected", i===index);
  });
}

function toggleOperators(show) {
  const row = document.getElementById("operationRow") || document.querySelector(".operator-row");
  if (!row) {
    return;
  }
  row.style.display = show ? "flex" : "none";
}

function populateUnitSelects(units) {
  const fromSelect = document.getElementById("fromUnit");
  const toSelect = document.getElementById("toUnit");
  if (!fromSelect || !toSelect) {
    return;
  }

  fromSelect.innerHTML = "";
  toSelect.innerHTML = "";

  units.forEach((unit) => {
    const fromOption = document.createElement("option");
    fromOption.value = unit.symbol;
    fromOption.textContent = `${unit.label} (${unit.symbol})`;

    const toOption = document.createElement("option");
    toOption.value = unit.symbol;
    toOption.textContent = `${unit.label} (${unit.symbol})`;

    fromSelect.appendChild(fromOption);
    toSelect.appendChild(toOption);
  });


  state.fromUnit = units[0]?.symbol || "";
  state.toUnit = units[1]?.symbol || units[0]?.symbol || "";
  fromSelect.value = state.fromUnit;
  toSelect.value = state.toUnit;
}


async function loadUnits(type) {
  state.type = type;
  try {
    const response = await fetch(`${API_URL}/units`);
    if (!response.ok) {
      throw new Error("Failed to load units");
    }

    const allUnits = await response.json();
    const filteredUnits = allUnits.filter(
      (unit) => unit.type.toLowerCase() == type.toLowerCase()
    );

    populateUnitSelects(filteredUnits);
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
    const response = await fetch(`${API_URL}/history`);
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
  const cards = Array.from(document.querySelectorAll(".type-card"));
  const index = cards.findIndex((card) => {
    const label = card.querySelector(".type-label")?.textContent?.trim();
    return label?.toLowerCase() === typeText.toLowerCase();
  });

  if (index >= 0) {
    setActive(cards, index);
  }

  loadUnits(typeText);
}

function attachEventListeners() {
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
      setActive(actionButtons, i);
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
  const typeCards = Array.from(document.querySelectorAll(".type-card"));
  const actionButtons = Array.from(document.querySelectorAll(".action-btn"));

  if (typeCards.length > 0) {
    setActive(typeCards, 0);
  }

  if (actionButtons.length > 0) {
    setActive(actionButtons, 0);
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