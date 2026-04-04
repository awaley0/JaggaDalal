export const formatRs = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Rs 0";
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return `Rs ${value.toLocaleString()}`;
  }

  if (typeof value === "string") {
    // Support legacy values like "$120,000" by removing non-numeric characters.
    const normalized = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(normalized) ? `Rs ${normalized.toLocaleString()}` : "Rs 0";
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `Rs ${numericValue.toLocaleString()}` : "Rs 0";
};
