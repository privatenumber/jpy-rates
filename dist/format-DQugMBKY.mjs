import { f as formatTable } from './format-table-CEOACGRX.mjs';

const fmtRate = (style, value, decimals = 2) => value === null ? style.dim("\u2014") : value.toFixed(decimals);
const numberFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 10
});
const smallNumberFormat = new Intl.NumberFormat("en-US", {
  maximumSignificantDigits: 10
});
const formatAmount = (value) => Math.abs(value) < 1 ? smallNumberFormat.format(value) : numberFormat.format(value);
const sourceLine = (source) => `Source: ${Array.isArray(source) ? source.join(", ") : source}`;
const rateColumns = [
  { header: "Code" },
  { header: "Currency" },
  {
    header: "TTS",
    align: "right"
  },
  {
    header: "TTB",
    align: "right"
  },
  {
    header: "TTM",
    align: "right"
  }
];
const unitFootnote = "* per 100 units";
const formatRateTable = (rates, getValues, style) => {
  let hasUnitFootnote = false;
  const rows = Object.entries(rates).map(([code, rate]) => {
    if (rate.unit === 100) {
      hasUnitFootnote = true;
    }
    const values = getValues(rate);
    return [
      style.bold(rate.unit === 100 ? `${code}*` : code),
      rate.name,
      fmtRate(style, values.tts),
      fmtRate(style, values.ttb),
      fmtRate(style, values.ttm)
    ];
  });
  return {
    table: formatTable(rateColumns, rows, style),
    hasUnitFootnote
  };
};
const formatRates = (result, style) => {
  const { table, hasUnitFootnote } = formatRateTable(result.rates, (rate) => rate, style);
  const sections = [
    style.bold(result.date),
    "",
    table
  ];
  if (hasUnitFootnote) {
    sections.push("", style.dim(unitFootnote));
  }
  sections.push("", sourceLine(result.source));
  return sections.join("\n");
};
const formatDaily = (result, style) => {
  const { table, hasUnitFootnote } = formatRateTable(result.rates, (rate) => rate, style);
  const sections = [
    style.bold(result.date),
    "",
    table
  ];
  if (hasUnitFootnote) {
    sections.push("", style.dim(unitFootnote));
  }
  const cashEntries = Object.entries(result.cashRates);
  if (cashEntries.length > 0) {
    const cashColumns = [
      { header: "Code" },
      {
        header: "Selling",
        align: "right"
      },
      {
        header: "Buying",
        align: "right"
      }
    ];
    const cashRows = cashEntries.map(([code, rate]) => [
      style.bold(code),
      rate.selling.toFixed(2),
      rate.buying.toFixed(2)
    ]);
    sections.push("", style.dim("Cash Rates"), formatTable(cashColumns, cashRows, style));
  }
  sections.push("", sourceLine(result.source));
  return sections.join("\n");
};
const formatConversion = (result, style) => {
  const foreignCurrency = result.from === "JPY" ? result.to : result.from;
  const dateLine = result.requestedDate === result.sourceDate ? result.sourceDate : `${result.requestedDate} -> ${result.sourceDate}`;
  return [
    style.bold(
      `${formatAmount(result.amount)} ${result.from} = ${formatAmount(result.convertedAmount)} ${result.to}`
    ),
    `Rate: ${result.rate.toUpperCase()} ${fmtRate(style, result.rateValue)} JPY per ${result.unit} ${foreignCurrency}${result.purpose ? ` (purpose: ${result.purpose})` : ""}`,
    `Date: ${dateLine}`,
    "Bank: MUFG Bank customer rate, published by MURC",
    `Source: ${result.source}`
  ].join("\n");
};
const formatMonthly = (result, style) => {
  const monthString = `${result.year}-${String(result.month).padStart(2, "0")}`;
  const monthEnd = formatRateTable(result.rates, (rate) => rate.monthEnd, style);
  const monthlyAverage = formatRateTable(result.rates, (rate) => rate.monthlyAverage, style);
  const sections = [style.bold(monthString)];
  if (Object.keys(result.rates).length > 0) {
    sections.push(
      "",
      style.dim("Month-End"),
      monthEnd.table,
      "",
      style.dim("Monthly Average"),
      monthlyAverage.table
    );
  }
  if (monthEnd.hasUnitFootnote) {
    sections.push("", style.dim(unitFootnote));
  }
  if (result.localMarketRates === null) {
    sections.push("", style.dim("Local Market Rates: unavailable. MURC's page shows a server error in this section; for the latest month it usually appears later."));
  }
  const localEntries = Object.entries(result.localMarketRates ?? {});
  if (localEntries.length > 0) {
    const localColumns = [
      { header: "Code" },
      {
        header: "Selling",
        align: "right"
      },
      {
        header: "Buying",
        align: "right"
      },
      {
        header: "Rate",
        align: "right"
      },
      { header: "Quote date" },
      { header: "Source" }
    ];
    const localRows = localEntries.map(([code, rate]) => [
      style.bold(code),
      fmtRate(style, rate.selling, 4),
      fmtRate(style, rate.buying, 4),
      fmtRate(style, rate.rate, 4),
      rate.quoteDate ?? style.dim("\u2014"),
      rate.source
    ]);
    sections.push(
      "",
      style.dim("Local Market Rates (per 1 USD, as quoted in each market)"),
      formatTable(localColumns, localRows, style)
    );
  }
  sections.push("", sourceLine(result.source));
  return sections.join("\n");
};
const formatYearly = (result, style) => {
  const yearEnd = formatRateTable(result.rates, (rate) => rate.yearEnd, style);
  const yearlyAverage = formatRateTable(result.rates, (rate) => rate.yearlyAverage, style);
  const sections = [
    style.bold(String(result.year)),
    "",
    style.dim("Year-End"),
    yearEnd.table,
    "",
    style.dim("Yearly Average"),
    yearlyAverage.table
  ];
  if (yearEnd.hasUnitFootnote) {
    sections.push("", style.dim(unitFootnote));
  }
  sections.push("", sourceLine(result.source));
  return sections.join("\n");
};
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const formatReference = (result, style) => {
  const summaryColumns = [
    { header: "Month" },
    {
      header: "High",
      align: "right"
    },
    {
      header: "Low",
      align: "right"
    },
    {
      header: "Average",
      align: "right"
    }
  ];
  const sections = [style.bold(String(result.year))];
  for (const [code, currency] of Object.entries(result.currencies)) {
    if (currency.monthlySummary.length === 0) {
      continue;
    }
    const rows = currency.monthlySummary.map((summary) => [
      monthNames[summary.month - 1],
      fmtRate(style, summary.high, 4),
      fmtRate(style, summary.low, 4),
      fmtRate(style, summary.average, 4)
    ]);
    const basis = currency.rates.perUsd ? "per 1 USD" : `per ${currency.perJpyUnit ?? 1} JPY`;
    sections.push(
      "",
      style.dim(`${code} (${basis}) \u2014 ${currency.sourceJa}`),
      formatTable(summaryColumns, rows, style)
    );
  }
  sections.push("", sourceLine(result.source));
  return sections.join("\n");
};
const regionKeys = ["asia", "africa", "europe", "mideast", "americas"];
const worldColumns = [
  { header: "Country" },
  { header: "Code" },
  { header: "Official" },
  { header: "Market Level" }
];
const formatWorld = (result, style) => {
  const sections = [style.bold(result.date)];
  for (const key of regionKeys) {
    const entries = result[key];
    if (entries.length === 0) {
      continue;
    }
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    const rows = entries.map((entry) => [
      entry.country,
      entry.code,
      entry.quotation || style.dim("\u2014"),
      entry.marketLevel || style.dim("\u2014")
    ]);
    sections.push(
      "",
      style.dim(`${label} (${entries.length})`),
      formatTable(worldColumns, rows, style)
    );
  }
  sections.push(
    "",
    style.dim("Official (quotations by monetary authorities) and market levels are units of each currency per 1 USD unless noted."),
    sourceLine(result.source)
  );
  return sections.join("\n");
};
const formatArchive = (result, style) => {
  const columns = [
    { header: "Code" },
    {
      header: "High",
      align: "right"
    },
    {
      header: "Low",
      align: "right"
    },
    {
      header: "Average",
      align: "right"
    }
  ];
  let hasUnitFootnote = false;
  const rows = Object.entries(result.currencies).map(([code, currency]) => {
    if (currency.unit === 100) {
      hasUnitFootnote = true;
    }
    const { high, low, average } = currency.annual;
    return [
      style.bold(currency.unit === 100 ? `${code}*` : code),
      fmtRate(style, high),
      fmtRate(style, low),
      fmtRate(style, average)
    ];
  });
  const sections = [
    style.bold(String(result.year)),
    "",
    formatTable(columns, rows, style)
  ];
  if (hasUnitFootnote) {
    sections.push("", style.dim(unitFootnote));
  }
  if (result.source) {
    sections.push("", sourceLine(result.source));
  }
  return sections.join("\n");
};

export { formatDaily as a, formatConversion as b, formatMonthly as c, formatYearly as d, formatWorld as e, formatRates as f, formatReference as g, formatArchive as h };
