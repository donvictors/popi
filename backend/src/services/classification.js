const BUSINESS_AMENITIES = [
  "cafe",
  "restaurant",
  "fast_food",
  "bar",
  "pub",
  "fuel",
  "mall",
  "supermarket",
  "hotel",
  "cinema",
  "theatre",
  "biergarten"
];

const BUSINESS_KEYS = ["shop", "brand", "operator", "office", "tourism", "leisure"];

function hasFee(tags = {}) {
  return (
    tags.fee === "yes" ||
    tags["toilets:fee"] === "yes" ||
    tags.payment === "yes" ||
    tags.payment !== undefined
  );
}

function isAssociatedToBusiness(tags = {}) {
  if (!tags) return false;
  if (tags.toilets && tags.amenity !== "toilets") return true;
  if (tags.inside || tags["is_in"] || tags["part_of"] ) return true;
  if (tags.amenity && BUSINESS_AMENITIES.includes(tags.amenity)) return true;
  return BUSINESS_KEYS.some((key) => Boolean(tags[key]));
}

export function classifyToilet(tags = {}) {
  const fee = hasFee(tags);
  const associated = isAssociatedToBusiness(tags);

  if (fee) {
    return {
      category: "PAGADO",
      secondaryBadges: associated ? ["asociado a local"] : [],
      reasons: associated
        ? ["fee detectado", "indicios de local"]
        : ["fee detectado"],
    };
  }

  if (tags.amenity === "toilets") {
    if (associated) {
      return {
        category: "ASOCIADO_A_LOCAL",
        secondaryBadges: [],
        reasons: ["amenity=toilets", "indicios de local"],
      };
    }
    return {
      category: "PUBLICO",
      secondaryBadges: [],
      reasons: ["amenity=toilets"],
    };
  }

  if (associated) {
    return {
      category: "ASOCIADO_A_LOCAL",
      secondaryBadges: [],
      reasons: ["asociado a local"],
    };
  }

  return {
    category: "DESCONOCIDO",
    secondaryBadges: [],
    reasons: ["sin pistas claras"],
  };
}

export { hasFee, isAssociatedToBusiness };
