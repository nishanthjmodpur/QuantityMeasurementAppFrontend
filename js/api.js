const BASE_URL = "https://api.measurement.azaken.com";

export async function getUnits(type) {
  const res = await fetch(`${BASE_URL}/units?type=${encodeURIComponent(type.toLowerCase())}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json();
}

export async function getConversion(from, to) {
  const res = await fetch(
    `${BASE_URL}/conversions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.length) {
    throw new Error("No conversion found");
  }

  return data[0];
}