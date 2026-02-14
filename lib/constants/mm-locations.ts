export const MM_COUNTRIES = ["Myanmar"] as const;

export const MM_STATES_AND_DIVISIONS = [
  "Ayeyarwady Region",
  "Bago Region",
  "Chin State",
  "Kachin State",
  "Kayah State",
  "Kayin State",
  "Magway Region",
  "Mandalay Region",
  "Mon State",
  "Rakhine State",
  "Sagaing Region",
  "Shan State",
  "Tanintharyi Region",
  "Yangon Region",
] as const;

export const YANGON_TOWNSHIPS = [
  "Ahlon",
  "Bahan",
  "Botahtaung",
  "Dagon",
  "Dagon Seikkan",
  "Dawbon",
  "East Dagon",
  "Hlaing",
  "Hlaingthaya (East)",
  "Hlaingthaya (West)",
  "Insein",
  "Kamayut",
  "Kyauktada",
  "Kyimyindaing",
  "Lanmadaw",
  "Latha",
  "Mayangon",
  "Mingala Taungnyunt",
  "Mingaladon",
  "North Dagon",
  "North Okkalapa",
  "Pabedan",
  "Pazundaung",
  "Sanchaung",
  "Seikkan",
  "Seikkyi Kanaungto",
  "Shwepyitha",
  "South Dagon",
  "South Okkalapa",
  "Tamwe",
  "Thaketa",
  "Thingangyun",
  "Yankin",
] as const;

export const PRIORITY_CITIES = ["Mandalay", "Pyinmana", "Nay Pyi Daw", "Other"] as const;

export const CHECKOUT_TOWNSHIP_CITY_OPTIONS = [
  ...YANGON_TOWNSHIPS,
  ...PRIORITY_CITIES,
] as const;
