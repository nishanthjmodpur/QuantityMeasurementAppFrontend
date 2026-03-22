export function applyConversion(value, convObj) {
  if (!Number.isFinite(value)) {
    throw new Error("Invalid number");
  }

  if (convObj?.from === convObj?.to) {
    return parseFloat(value.toFixed(6));
  }

  if (convObj?.factor !== null && convObj?.factor !== undefined) {
    const result = value * convObj.factor;
    return parseFloat(result.toFixed(6));
  }

  try {
    const expr = convObj.formula.replace(/x/g, String(value));
    const result = eval(expr);
    return parseFloat(result.toFixed(6));
  } catch {
    throw new Error("Bad formula");
  }
}

export function compareValues(v1, u1, v2, u2, base1, base2) {
  if (!Number.isFinite(base1) || !Number.isFinite(base2)) {
    return "Invalid values — cannot compare";
  }

  if (base1 > base2) {
    return `${v1} ${u1} is GREATER than ${v2} ${u2}`;
  }

  if (base1 < base2) {
    return `${v1} ${u1} is LESS than ${v2} ${u2}`;
  }

  return `${v1} ${u1} is EQUAL to ${v2} ${u2}`;
}

export function performArithmetic(v1, v2normalised, op) {
  switch (op) {
    case "+":
      return parseFloat((v1 + v2normalised).toFixed(6));
    case "-":
      return parseFloat((v1 - v2normalised).toFixed(6));
    case "*":
      return parseFloat((v1 * v2normalised).toFixed(6));
    case "/":
      if (v2normalised === 0) {
        throw new Error("Divide by zero");
      }
      return parseFloat((v1 / v2normalised).toFixed(6));
    default:
      throw new Error("Unknown operator");
  }
}