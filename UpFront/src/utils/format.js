// French number formatting: "10 000", "1 234,5". Intl uses a narrow
// no-break space (U+202F) as thousands separator, which some fonts render
// with no width at all, so it is swapped for a regular no-break space.
const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});

export const formatNumber = (value) =>
  numberFormatter.format(Number(value) || 0).replace(/ /g, " ");

export const formatAmount = (value) => `${formatNumber(value)} MRU`;
