import { f as formatTable } from './format-table-CEOACGRX.mjs';

const formatBasic = (result, style, showBasic = true) => {
  const entries = [
    ...showBasic ? [["USD", 1, result.basic, "basic"]] : [],
    ...Object.entries(result.cross).map(([code, rate]) => [code, 1, rate, "cross"]),
    ...Object.entries(result.arbitrated).map(([code, quote]) => [code, quote.unit, quote.rate, "derived"]),
    ...result.reference.filter((row) => row.usd === null).map((row) => [row.code ?? row.nameJa, row.unit, null, "no rate published"]),
    // A currency name this package cannot map to a code has no derived rate, but stays visible
    ...result.reference.filter((row) => row.code === null && row.usd !== null).map((row) => [row.nameJa, row.unit, null, `unmapped name, ${row.usd} USD`])
  ];
  const rows = entries.map(([code, unit, rate, basis]) => [
    unit === 1 ? code : `${code}*`,
    String(unit),
    rate === null ? style.dim("\u2014") : String(rate),
    basis
  ]);
  const sections = [
    style.bold(`BOJ basic and cross rates ${result.month}`),
    `Reference market month: ${result.referenceMonth}`,
    "",
    formatTable([{ header: "Currency" }, {
      header: "Units",
      align: "right"
    }, {
      header: "JPY",
      align: "right"
    }, { header: "Basis" }], rows, style)
  ];
  if (entries.some(([, unit]) => unit !== 1)) {
    sections.push(style.dim("* Rate is per stated units."));
  }
  sections.push(style.dim("Derived rows are USD market rate \xD7 basic rate."), "", `Source: ${result.source}`, result.attribution);
  return sections.join("\n");
};
const formatReporting = (result, style) => {
  const rows = Object.values(result.rates).map(({ code, unit, usd }) => [
    code,
    String(unit),
    usd === null ? style.dim("\u2014 (no rate published)") : String(usd)
  ]);
  return [
    style.bold(`BOJ reporting rates ${result.month}`),
    "",
    formatTable([{ header: "Currency" }, {
      header: "Units",
      align: "right"
    }, {
      header: "USD",
      align: "right"
    }], rows, style),
    style.dim("These rates convert amounts to USD for reports."),
    "",
    `Source: ${result.source}`,
    result.attribution
  ].join("\n");
};
const rateText = (rate, style) => rate === null ? style.dim("\u2014") : String(rate);
const footer = (result) => ["", `Source: ${result.source}`, result.attribution];
const formatDailyMarket = (result, style, title) => [
  style.bold(title),
  "",
  formatTable([
    { header: "Date" },
    ...["9:00", "17:00", "Center", "High", "Low"].map((header) => ({
      header,
      align: "right"
    }))
  ], result.days.map((day) => [
    day.date,
    ...[day.at0900, day.at1700, day.center, day.high, day.low].map((rate) => rateText(rate, style))
  ]), style),
  style.dim("JPY per USD, Tokyo interbank spot market. \u2014 means the BOJ has no value."),
  ...footer(result)
].join("\n");
const formatMonthlyMarket = (result, style) => [
  style.bold(`Tokyo market USD/JPY ${result.month}`),
  "",
  formatTable([{ header: "" }, {
    header: "17:00",
    align: "right"
  }, {
    header: "Center",
    align: "right"
  }], [
    ["Average", rateText(result.average.at1700, style), rateText(result.average.center, style)],
    ["Month end", rateText(result.end.at1700, style), rateText(result.end.center, style)]
  ], style),
  `High: ${rateText(result.high, style)}  Low: ${rateText(result.low, style)}`,
  style.dim("JPY per USD, Tokyo interbank spot market. \u2014 means the BOJ has no value."),
  ...footer(result)
].join("\n");
const formatEffective = (result, style) => [
  style.bold(`Yen effective exchange rate indices ${result.month}`),
  "",
  formatTable([{ header: "Index" }, {
    header: result.base,
    align: "right"
  }], [
    ["Nominal", rateText(result.nominal, style)],
    ["Real", rateText(result.real, style)]
  ], style),
  style.dim("Higher means a stronger yen. \u2014 means the BOJ has not published the index."),
  ...footer(result)
].join("\n");

export { formatReporting as a, formatDailyMarket as b, formatMonthlyMarket as c, formatEffective as d, formatBasic as f };
