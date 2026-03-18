export function mapBrand(payload: any) {
  const rawName =
    typeof payload === "string"
      ? payload
      : payload?.name || payload?.brand || payload?.label || null;

  if (!rawName) {
    throw new Error(`Invalid brand payload: ${JSON.stringify(payload)}`);
  }

  const slug = String(rawName)
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    name: rawName,
    slug,
    externalId: slug
  };
}

export function mapModel(payload: any, brandId: number) {
  const rawName =
    typeof payload === "string"
      ? payload.trim()
      : String(payload?.name || payload?.model || payload?.label || "").trim();

  if (!rawName) {
    return null;
  }

  const slug = rawName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return {
    brandId,
    name: rawName,
    slug,
    externalId: String(payload?.id || payload?.slug || slug)
  };
}

export function mapReference(payload: any, brandId: number, modelId: number) {
  const rawReference =
    typeof payload === "string" || typeof payload === "number"
      ? String(payload).trim()
      : String(
          payload?.reference_number ||
          payload?.referenceNumber ||
          payload?.reference ||
          payload?.id ||
          ""
        ).trim();

  if (!rawReference) {
    return null;
  }

  const displayName =
    typeof payload === "object" && payload !== null
      ? payload?.display_name || payload?.name || rawReference
      : rawReference;

  return {
    brandId,
    modelId,
    referenceNumber: rawReference,
    displayName,
    description:
      typeof payload === "object" && payload !== null ? payload?.description || null : null,
    movement:
      typeof payload === "object" && payload !== null ? payload?.movement || null : null,
    caseMaterial:
      typeof payload === "object" && payload !== null ? payload?.case_material || null : null,
    dialColor:
      typeof payload === "object" && payload !== null ? payload?.dial_color || null : null,
    braceletMaterial:
      typeof payload === "object" && payload !== null ? payload?.bracelet_material || null : null,
    caseSizeMm:
      typeof payload === "object" && payload !== null && payload?.case_size_mm
        ? Number(payload.case_size_mm)
        : null,
    waterResistanceM:
      typeof payload === "object" && payload !== null && payload?.water_resistance_m
        ? Number(payload.water_resistance_m)
        : null,
    externalId:
      typeof payload === "object" && payload !== null && payload?.id
        ? String(payload.id)
        : rawReference
  };
}
