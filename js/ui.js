export function populateDropdown(selectEl, units) {
  if (!selectEl) {
    console.warn("populateDropdown called with null select element");
    return;
  }

  selectEl.innerHTML = "";

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "-- Select Unit --";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  selectEl.appendChild(defaultOption);

  units.forEach((u) => {
    const opt = document.createElement("option");
    opt.value = u.symbol;
    opt.textContent = `${u.label} (${u.symbol})`;
    selectEl.appendChild(opt);
  });
}

export function setActive(parentEl, clickedEl, childSelector) {
  if (!parentEl) {
    return;
  }

  parentEl
    .querySelectorAll(childSelector)
    .forEach((el) => el.classList.remove("active"));

  clickedEl.classList.add("active");
}

export function showResult(value, unitSymbol) {
  const resultValueEl = document.querySelector("#result-value");
  const resultUnitEl = document.querySelector("#result-unit");
  if (!resultValueEl || !resultUnitEl) {
    return;
  }

  resultValueEl.textContent = value === null ? "—" : value;
  resultUnitEl.textContent = unitSymbol || "";

  resultValueEl.classList.add("highlight");
  resultUnitEl.classList.add("highlight");

  setTimeout(() => {
    resultValueEl.classList.remove("highlight");
    resultUnitEl.classList.remove("highlight");
  }, 1500);
}

export function toggleOperators(show) {
  const el = document.querySelector("#operator-selector");
  if (!el) {
    console.warn("operator selector not found");
    return;
  }
  el.style.display = show ? "flex" : "none";
}

export function renderHistory(records) {
  const list = document.querySelector("#history-list");
  if (!list) {
    return;
  }

  const safeRecords = Array.isArray(records) ? records : [];
  list.innerHTML = "";

  if (!safeRecords.length) {
    list.innerHTML = "<li>No history yet.</li>";
    return;
  }

  safeRecords.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = `${r.expression}  =  ${r.result}  (${new Date(r.timestamp).toLocaleString()})`;
    list.appendChild(li);
  });
}