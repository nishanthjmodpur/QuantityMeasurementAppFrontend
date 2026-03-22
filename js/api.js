const BASE_URL = "https://api.measurement.azaken.com";

export async function getUnits(type) {
  const res = await fetch(`${BASE_URL}/units?type=${encodeURIComponent(type.toLowerCase())}`);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return await res.json();
}