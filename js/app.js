import { getConversion, getHistory, getUnits, saveHistory } from "./api.js";
import { applyConversion, compareValues, performArithmetic } from "./conversion.js";
import { populateUnitDropdowns, renderHistory, setActive, showResult, toggleOperators } from "./ui.js";

export const state = {
  type: "length",
  action: "Comparison",
  fromVal: null,
  toVal: null,
  fromUnit: "",
  toUnit: "",
  operator: "+"
};

let calcSeq = 0;
let historyTimer = null;

function getBaseUnit(type) {
  const map = {
    length: "m",
    weight: "kg",
    temperature: "C",
    volume: "L"
  };
  return map[type] || "";
}

async function convertToBase(value, unit, type) {
  const base = getBaseUnit(type);
  if (!base) {
    throw new Error("Unknown type");
  }
  if (unit === base) {
    return value;
  }
  const conv = await getConversion(unit, base);
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

function scheduleHistorySave(record) {
  clearTimeout(historyTimer);
  historyTimer = setTimeout(async () => {
    await saveHistory(record);
    renderHistory(await getHistory());
  }, 700);
}

function markSelectedType(typeCards, activeCard) {
  typeCards.forEach((card) => {
    card.classList.toggle("selected", card === activeCard);
  });
}

export async function handleTypeCardClick(card, ctx) {
  const { typeSelector, typeCards, fromInput, toValueInput, resultInput, fromSelect, toSelect } = ctx;

  state.type = card.dataset.type || "length";
  setActive(typeSelector, card, ".type-card");
  markSelectedType(typeCards, card);

  try {
    const units = await getUnits(state.type);
    populateUnitDropdowns(fromSelect, toSelect, units);
    state.fromUnit = fromSelect.value;
    state.toUnit = toSelect.value;
    ctx.clearError?.();
    if (fromInput) {
      fromInput.value = "";
    }
    if (toValueInput) {
      toValueInput.value = "";
    }
    state.fromVal = null;
    state.toVal = null;
    if (resultInput) {
      resultInput.value = "";
    }
  } catch (error) {
    if (error instanceof TypeError) {
      ctx.showError("Server unavailable");
    } else {
      ctx.showError("Could not load units");
    }
  }
}

export function handleActionTabClick(btn, ctx) {
  const { actionRow } = ctx;

  state.action = btn.dataset.action || "Conversion";
  setActive(actionRow, btn, ".action-btn");
  toggleOperators(state.action === "Arithmetic");
  showResult("", "");
  if (ctx.resultInput) {
    ctx.resultInput.value = "";
  }
  if (ctx.toValueInput) {
    ctx.toValueInput.value = "";
  }
  state.toVal = null;
}

export async function calculate() {
  const id = ++calcSeq;

  try {
    if (!state.fromUnit || !state.toUnit) {
      return;
    }

    if (state.action === "Conversion") {
      if (!Number.isFinite(state.fromVal)) {
        return;
      }

      let resultValue;
      if (state.fromUnit === state.toUnit) {
        resultValue = parseFloat(state.fromVal.toFixed(6));
      } else {
        const conv = await getConversion(state.fromUnit, state.toUnit);
        if (id !== calcSeq) {
          return;
        }
        resultValue = applyConversion(state.fromVal, conv);
      }

      if (id !== calcSeq) {
        return;
      }
      showResult(resultValue, state.toUnit);

      const record = {
        type: state.type,
        action: state.action,
        expression: buildExpression(resultValue),
        result: String(resultValue),
        timestamp: new Date().toISOString()
      };
      scheduleHistorySave(record);
      return;
    }

    if (state.action === "Comparison") {
      if (!Number.isFinite(state.fromVal) || !Number.isFinite(state.toVal)) {
        return;
      }

      let base1;
      let base2;
      if (state.fromUnit === state.toUnit) {
        base1 = state.fromVal;
        base2 = state.toVal;
      } else {
        base1 = await convertToBase(state.fromVal, state.fromUnit, state.type);
        if (id !== calcSeq) {
          return;
        }
        base2 = await convertToBase(state.toVal, state.toUnit, state.type);
        if (id !== calcSeq) {
          return;
        }
      }

      const sentence = compareValues(
        state.fromVal,
        state.fromUnit,
        state.toVal,
        state.toUnit,
        base1,
        base2
      );
      showResult(sentence, "");

      const record = {
        type: state.type,
        action: state.action,
        expression: buildExpression(sentence),
        result: String(sentence),
        timestamp: new Date().toISOString()
      };
      scheduleHistorySave(record);
      return;
    }

    if (!Number.isFinite(state.fromVal) || !Number.isFinite(state.toVal)) {
      return;
    }

    const convToFrom =
      state.toUnit === state.fromUnit
        ? null
        : await getConversion(state.toUnit, state.fromUnit);
    if (id !== calcSeq) {
      return;
    }
    const v2normalised =
      state.toUnit === state.fromUnit ? state.toVal : applyConversion(state.toVal, convToFrom);

    if (id !== calcSeq) {
      return;
    }

    const resultValue = performArithmetic(state.fromVal, v2normalised, state.operator);
    showResult(resultValue, state.fromUnit);

    const record = {
      type: state.type,
      action: state.action,
      expression: buildExpression(resultValue),
      result: String(resultValue),
      timestamp: new Date().toISOString()
    };
    scheduleHistorySave(record);
  } catch (e) {
    if (id !== calcSeq) {
      return;
    }
    showResult("Error: " + e.message, "");
  }
}