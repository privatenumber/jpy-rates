const incomeTaxDirective = {
  name: "\u6240\u5F97\u7A0E\u57FA\u672C\u901A\u905457\u306E3-2",
  url: "https://www.nta.go.jp/law/tsutatsu/kihon/shotoku/11a/01.htm"
};
const stockDirective = {
  name: "\u63AA\u7F6E\u6CD5\u901A\u905437\u306E10\u30FB37\u306E11\u5171-6",
  url: "https://www.nta.go.jp/law/tsutatsu/kobetsu/shotoku/sochiho/020624/sanrin/1273/37_10-11/01.htm"
};
const valuationDirective = {
  name: "\u8CA1\u7523\u8A55\u4FA1\u57FA\u672C\u901A\u90544-3",
  url: "https://www.nta.go.jp/law/tsutatsu/kihon/sisan/hyoka_new/01/01.htm"
};
const mainBankNote = "MURC publishes MUFG Bank's rates. The rule prefers your main bank's rate, but accepts a reasonable rate used consistently.";
const holdingBankNote = "For a deposit, the rule requires the rate of the bank holding it. MUFG Bank's rate is only correct when that bank is MUFG Bank.";
const guideTopics = [
  {
    id: "general",
    title: "General foreign-currency income and expenses",
    titleJa: "\u5916\u8CA8\u5EFA\u53D6\u5F15\u306E\u5186\u63DB\u7B97\uFF08\u539F\u5247\uFF09",
    source: "murc",
    rate: "TTM",
    date: "Transaction date; if there is no rate that day, the nearest earlier date",
    institution: "Your main bank, or a reasonable rate used consistently",
    rules: [
      {
        ...incomeTaxDirective,
        excerpts: [
          "\u305D\u306E\u53D6\u5F15\u3092\u8A08\u4E0A\u3059\u3079\u304D\u65E5\uFF08\u4EE5\u4E0B\u3053\u306E\u9805\u306B\u304A\u3044\u3066\u300C\u53D6\u5F15\u65E5\u300D\u3068\u3044\u3046\u3002\uFF09\u306B\u304A\u3051\u308B\u5BFE\u9867\u5BA2\u76F4\u7269\u96FB\u4FE1\u58F2\u76F8\u5834\uFF08\u4EE5\u4E0B57\u306E3\uFF0D\uFF16\u307E\u3067\u306B\u304A\u3044\u3066\u300C\u96FB\u4FE1\u58F2\u76F8\u5834\u300D\u3068\u3044\u3046\u3002\uFF09\u3068\u5BFE\u9867\u5BA2\u76F4\u7269\u96FB\u4FE1\u8CB7\u76F8\u5834\uFF08\u4EE5\u4E0B57\u306E3\uFF0D\uFF16\u307E\u3067\u306B\u304A\u3044\u3066\u300C\u96FB\u4FE1\u8CB7\u76F8\u5834\u300D\u3068\u3044\u3046\u3002\uFF09\u306E\u4EF2\u5024\uFF08\u4EE5\u4E0B57\u306E3\uFF0D\uFF16\u307E\u3067\u306B\u304A\u3044\u3066\u300C\u96FB\u4FE1\u58F2\u8CB7\u76F8\u5834\u306E\u4EF2\u5024\u300D\u3068\u3044\u3046\u3002\uFF09\u306B\u3088\u308B\u3002",
          "\u96FB\u4FE1\u58F2\u76F8\u5834\u3001\u96FB\u4FE1\u8CB7\u76F8\u5834\u53CA\u3073\u96FB\u4FE1\u58F2\u8CB7\u76F8\u5834\u306E\u4EF2\u5024\u306B\u3064\u3044\u3066\u306F\u3001\u539F\u5247\u3068\u3057\u3066\u3001\u305D\u306E\u8005\u306E\u4E3B\u305F\u308B\u53D6\u5F15\u91D1\u878D\u6A5F\u95A2\u306E\u3082\u306E\u306B\u3088\u308B\u3053\u3068\u3068\u3059\u308B\u304C\u3001\u5408\u7406\u7684\u306A\u3082\u306E\u3092\u7D99\u7D9A\u3057\u3066\u4F7F\u7528\u3057\u3066\u3044\u308B\u5834\u5408\u306B\u306F\u3001\u3053\u308C\u3092\u8A8D\u3081\u308B\u3002",
          "\u5F53\u8A72\u65E5\u306B\u70BA\u66FF\u76F8\u5834\u304C\u306A\u3044\u5834\u5408\u306B\u306F\u3001\u540C\u65E5\u524D\u306E\u6700\u3082\u8FD1\u3044\u65E5\u306E\u70BA\u66FF\u76F8\u5834\u306B\u3088\u308B\u3002"
        ]
      }
    ],
    notes: [
      mainBankNote,
      "Business, real-estate, and miscellaneous business income may use TTB for income and assets and TTS for expenses and debts, or averages over one month or less, if used consistently (same directive).",
      "Corporate tax follows the same structure (\u6CD5\u4EBA\u7A0E\u57FA\u672C\u901A\u905413\u306E2-1-2)."
    ],
    command: "jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <transaction-date> -p general"
  },
  {
    id: "stock-option",
    title: "Stock option exercise income (salary)",
    titleJa: "\u30B9\u30C8\u30C3\u30AF\u30AA\u30D7\u30B7\u30E7\u30F3\u306E\u6A29\u5229\u884C\u4F7F\u76CA",
    source: "murc",
    rate: "TTM",
    date: "Exercise date",
    institution: "A financial institution's published rate",
    rules: [
      {
        name: "\u56FD\u7A0E\u5E81 \u78BA\u5B9A\u7533\u544A\u66F8\u7B49\u4F5C\u6210\u30B3\u30FC\u30CA\u30FC\uFF08\u5916\u8CA8\u5EFA\u3066\u306E\u30B9\u30C8\u30C3\u30AF\u30AA\u30D7\u30B7\u30E7\u30F3\u306E\u53CE\u5165\u306E\u5165\u529B\u4F8B\uFF09",
        url: "https://www.keisan.nta.go.jp/r7yokuaru/ocat2/ocat21/cid477.html",
        excerpts: ["\u6A29\u5229\u884C\u4F7F\u6642\u306E\u96FB\u4FE1\u58F2\u8CB7\u76F8\u5834\u306E\u4EF2\u5024\uFF08TTM\uFF09\u3067\u65E5\u672C\u5186\u306B\u63DB\u7B97"]
      }
    ],
    notes: [
      mainBankNote,
      "RSU vest income is also salary income; the general TTM rule (\u6240\u5F97\u7A0E\u57FA\u672C\u901A\u905457\u306E3-2) applies on the vest date. Inference from the general rule; the NTA example covers stock options."
    ],
    command: "jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <exercise-date> -p general"
  },
  {
    id: "stock-sale",
    title: "Foreign stock sale proceeds",
    titleJa: "\u5916\u56FD\u682A\u5F0F\u306E\u8B72\u6E21\u5BFE\u4FA1",
    source: "murc",
    rate: "TTB",
    date: "Trade date (\u7D04\u5B9A\u65E5)",
    institution: "The paying broker if it publishes a TTB, otherwise its main bank",
    rules: [
      {
        ...stockDirective,
        excerpts: ["\u7D04\u5B9A\u65E5\u306B\u304A\u3051\u308B\u305D\u306E\u652F\u6255\u3092\u3059\u308B\u8005\u306E\u4E3B\u8981\u53D6\u5F15\u91D1\u878D\u6A5F\u95A2\uFF08\u305D\u306E\u652F\u6255\u3092\u3059\u308B\u8005\u304C\u305D\u306E\u5916\u8CA8\u306B\u4FC2\u308B\u5BFE\u9867\u5BA2\u76F4\u7269\u96FB\u4FE1\u8CB7\u76F8\u5834\u3092\u516C\u8868\u3057\u3066\u3044\u308B\u5834\u5408\u306B\u306F\u3001\u5F53\u8A72\u652F\u6255\u3092\u3059\u308B\u8005\uFF09\u306E\u5F53\u8A72\u5916\u8CA8\u306B\u4FC2\u308B\u5BFE\u9867\u5BA2\u76F4\u7269\u96FB\u4FE1\u8CB7\u76F8\u5834\u306B\u3088\u308A\u90A6\u8CA8\u306B\u63DB\u7B97\u3057\u305F\u91D1\u984D\u306B\u3088\u308B\u3002"]
      }
    ],
    notes: [
      "A Japanese broker's annual trade report (\u5E74\u9593\u53D6\u5F15\u5831\u544A\u66F8) already applies the broker's own rates; use it when you have one.",
      "The directive refers to a Japanese broker's foreign securities account. For foreign brokers, TTB/TTS is common practice but is not stated by the directive."
    ],
    command: "jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <trade-date> -p stock-sale"
  },
  {
    id: "stock-acquisition",
    title: "Foreign stock acquisition cost",
    titleJa: "\u5916\u56FD\u682A\u5F0F\u306E\u53D6\u5F97\u4FA1\u984D",
    source: "murc",
    rate: "TTS",
    date: "Trade date (\u7D04\u5B9A\u65E5)",
    institution: "Same as stock-sale",
    rules: [
      {
        ...stockDirective,
        excerpts: ["\u306A\u304A\u3001\u53D6\u5F97\u306E\u5BFE\u4FA1\u306E\u984D\u306E\u90A6\u8CA8\u63DB\u7B97\u306B\u3064\u3044\u3066\u306F\u3001\u5BFE\u9867\u5BA2\u76F4\u7269\u96FB\u4FE1\u58F2\u76F8\u5834\u306B\u3088\u308A\u3001\u4E0A\u8A18\u306B\u6E96\u3058\u3066\u884C\u3046\u3002"]
      }
    ],
    notes: ["Same scope notes as stock-sale."],
    command: "jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <trade-date> -p stock-acquisition"
  },
  {
    id: "dividend",
    title: "Foreign stock dividends through a domestic paying agent",
    titleJa: "\u56FD\u5916\u682A\u5F0F\u306E\u914D\u5F53\u7B49",
    source: "murc",
    rate: "TTB",
    date: "Payment start date (\u652F\u6255\u958B\u59CB\u65E5) for registered shares",
    institution: "The paying agent if it publishes a TTB, otherwise its main bank",
    rules: [
      {
        name: "\u63AA\u7F6E\u6CD5\u901A\u90549\u306E2-2",
        url: "https://www.nta.go.jp/law/tsutatsu/kobetsu/shotoku/sochiho/880331/gensen/58/09/02.htm",
        excerpts: [
          "\u5F53\u8A72\u5916\u56FD\u901A\u8CA8\u306B\u4FC2\u308B\u6771\u4EAC\u5916\u56FD\u70BA\u66FF\u5E02\u5834\u306E\u5BFE\u9867\u5BA2\u76F4\u7269\u96FB\u4FE1\u8CB7\u76F8\u5834\uFF08\u4EE5\u4E0B9\u306E2\uFF0D3\u307E\u3067\u306B\u304A\u3044\u3066\u300C\u96FB\u4FE1\u8CB7\u76F8\u5834\u300D\u3068\u3044\u3046\u3002\uFF09\u306B\u3088\u308A\u90A6\u8CA8\u306B\u63DB\u7B97\u3057\u305F\u91D1\u984D",
          "\u8A18\u540D\u306E\u56FD\u5916\u682A\u5F0F\u306E\u914D\u5F53\u7B49 \u652F\u6255\u958B\u59CB\u65E5\u3068\u5B9A\u3081\u3089\u308C\u3066\u3044\u308B\u65E5",
          "\u56FD\u5916\u682A\u5F0F\u306E\u914D\u5F53\u7B49\u304B\u3089\u63A7\u9664\u3059\u308B\u5916\u56FD\u6240\u5F97\u7A0E\u306E\u984D\u306E\u90A6\u8CA8\u63DB\u7B97\u306B\u3064\u3044\u3066\u306F\u3001\u5F53\u8A72\u56FD\u5916\u682A\u5F0F\u306E\u914D\u5F53\u7B49\u306B\u4FC2\u308B\u90A6\u8CA8\u63DB\u7B97\u65E5\u306B\u304A\u3051\u308B\u96FB\u4FE1\u8CB7\u76F8\u5834\u306B\u3088\u308B\u3082\u306E\u3068\u3059\u308B\u3002"
        ]
      }
    ],
    notes: ["The directive covers dividends handled by a domestic paying agent (\u652F\u6255\u306E\u53D6\u6271\u8005). For dividends through a foreign broker, the general TTM rule may apply instead."],
    command: "jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <payment-date> -p dividend"
  },
  {
    id: "inheritance-asset",
    title: "Inherited or gifted foreign-currency assets",
    titleJa: "\u76F8\u7D9A\u30FB\u8D08\u4E0E\u8CA1\u7523\uFF08\u5916\u8CA8\u5EFA\u3066\uFF09\u306E\u90A6\u8CA8\u63DB\u7B97",
    source: "murc",
    rate: "TTB (the final quote of the day)",
    date: "Valuation date (date of death or gift); if there is no rate that day, the nearest earlier date",
    institution: "The taxpayer's bank; for a deposit, the bank holding it",
    rules: [
      {
        ...valuationDirective,
        excerpts: ["\u5916\u8CA8\u5EFA\u3066\u306B\u3088\u308B\u8CA1\u7523\u53CA\u3073\u56FD\u5916\u306B\u3042\u308B\u8CA1\u7523\u306E\u90A6\u8CA8\u63DB\u7B97\u306F\u3001\u539F\u5247\u3068\u3057\u3066\u3001\u7D0D\u7A0E\u7FA9\u52D9\u8005\u306E\u53D6\u5F15\u91D1\u878D\u6A5F\u95A2\uFF08\u5916\u8CA8\u9810\u91D1\u7B49\u3001\u53D6\u5F15\u91D1\u878D\u6A5F\u95A2\u304C\u7279\u5B9A\u3055\u308C\u3066\u3044\u308B\u5834\u5408\u306F\u3001\u305D\u306E\u53D6\u5F15\u91D1\u878D\u6A5F\u95A2\uFF09\u304C\u516C\u8868\u3059\u308B\u8AB2\u7A0E\u6642\u671F\u306B\u304A\u3051\u308B\u6700\u7D42\u306E\u70BA\u66FF\u76F8\u5834\uFF08\u90A6\u8CA8\u63DB\u7B97\u3092\u884C\u306A\u3046\u5834\u5408\u306E\u5916\u56FD\u70BA\u66FF\u306E\u58F2\u8CB7\u76F8\u5834\u306E\u3046\u3061\u3001\u3044\u308F\u3086\u308B\u5BFE\u9867\u5BA2\u76F4\u7269\u96FB\u4FE1\u8CB7\u76F8\u5834\u53C8\u306F\u3053\u308C\u306B\u6E96\u305A\u308B\u76F8\u5834\u3092\u3044\u3046\u3002\u307E\u305F\u3001\u8AB2\u7A0E\u6642\u671F\u306B\u5F53\u8A72\u76F8\u5834\u304C\u306A\u3044\u5834\u5408\u306B\u306F\u3001\u8AB2\u7A0E\u6642\u671F\u524D\u306E\u5F53\u8A72\u76F8\u5834\u306E\u3046\u3061\u3001\u8AB2\u7A0E\u6642\u671F\u306B\u6700\u3082\u8FD1\u3044\u65E5\u306E\u5F53\u8A72\u76F8\u5834\u3068\u3059\u308B\u3002\uFF09\u306B\u3088\u308B\u3002"]
      }
    ],
    notes: [holdingBankNote, "Foreign cash is also valued at TTB, not the cash buying rate (\u56FD\u7A0E\u5E81 \u8CEA\u7591\u5FDC\u7B54\u4E8B\u4F8B\u300C\u5916\u8CA8(\u73FE\u91D1)\u306E\u8A55\u4FA1\u300D)."],
    command: "jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <valuation-date> -p inheritance-asset"
  },
  {
    id: "inheritance-debt",
    title: "Inherited foreign-currency debts",
    titleJa: "\u76F8\u7D9A\u50B5\u52D9\uFF08\u5916\u8CA8\u5EFA\u3066\uFF09\u306E\u90A6\u8CA8\u63DB\u7B97",
    source: "murc",
    rate: "TTS (the final quote of the day)",
    date: "Valuation date",
    institution: "Same as inheritance-asset",
    rules: [
      {
        ...valuationDirective,
        excerpts: ["\u5916\u8CA8\u5EFA\u3066\u306B\u3088\u308B\u50B5\u52D9\u3092\u90A6\u8CA8\u63DB\u7B97\u3059\u308B\u5834\u5408\u306B\u306F\u3001\u3053\u306E\u9805\u306E\u300C\u5BFE\u9867\u5BA2\u76F4\u7269\u96FB\u4FE1\u8CB7\u76F8\u5834\u300D\u3092\u300C\u5BFE\u9867\u5BA2\u76F4\u7269\u96FB\u4FE1\u58F2\u76F8\u5834\u300D\u3068\u8AAD\u307F\u66FF\u3048\u3066\u9069\u7528\u3059\u308B\u3053\u3068\u306B\u7559\u610F\u3059\u308B\u3002"]
      }
    ],
    notes: [holdingBankNote],
    command: "jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <valuation-date> -p inheritance-debt"
  },
  {
    id: "foreign-asset-report",
    title: "Statement of foreign assets",
    titleJa: "\u56FD\u5916\u8CA1\u7523\u8ABF\u66F8\u306E\u90A6\u8CA8\u63DB\u7B97",
    source: "murc",
    rate: "TTB (the final quote of the day)",
    date: "December 31; if there is no rate that day, the nearest earlier date",
    institution: "The filer's bank; for a deposit, the bank holding it",
    rules: [
      {
        name: "\u56FD\u5916\u9001\u91D1\u7B49\u8ABF\u66F8\u6CD5\u901A\u90545-14",
        url: "https://www.nta.go.jp/law/tsutatsu/kobetsu/hotei/2207xx/pdf/01.pdf",
        excerpts: [
          "\u56FD\u5916\u8CA1\u7523\u306E\u90A6\u8CA8\u63DB\u7B97\u306F\u3001\u56FD\u5916\u8CA1\u7523\u8ABF\u66F8\u306E\u63D0\u51FA\u7FA9\u52D9\u8005\u306E\u53D6\u5F15\u91D1\u878D\u6A5F\u95A2\uFF08\u305D\u306E\u8CA1\u7523\u304C\u9810\u91D1\u7B49\u3067\u3001\u53D6\u5F15\u91D1\u878D\u6A5F\u95A2\u304C\u7279\u5B9A\u3055\u308C\u3066\u3044\u308B\u5834\u5408\u306F\u3001\u305D\u306E\u53D6\u5F15\u91D1\u878D\u6A5F\u95A2\uFF09\u304C\u516C\u8868\u3059\u308B\u305D\u306E\u5E74\u306E 12 \u6708 31 \u65E5\u306B\u304A\u3051\u308B\u6700\u7D42\u306E\u70BA\u66FF\u76F8\u5834\u306B\u3088\u308B\u3002",
          "\u3044\u308F\u3086\u308B\u5BFE\u9867\u5BA2\u76F4\u7269\u96FB\u4FE1\u8CB7\u76F8\u5834\u53C8\u306F\u3053\u308C\u306B\u6E96\u305A\u308B\u76F8\u5834\u3092\u3044\u3046\u3002"
        ]
      }
    ],
    notes: [holdingBankNote, "The same date and rate decide whether the 50 million yen filing threshold is exceeded."],
    command: "jpy-rates murc convert -a <amount> -f <currency> -t JPY -d <year>-12-31 -p foreign-asset-report"
  },
  {
    id: "import",
    title: "Customs value of imported goods (also the base of import consumption tax)",
    titleJa: "\u8F38\u5165\u8CA8\u7269\u306E\u8AB2\u7A0E\u4FA1\u683C\u306E\u63DB\u7B97",
    source: "customs",
    rate: "Customs weekly rate",
    date: "Import declaration date; the rate published for the week containing it",
    institution: "Japan Customs (not a bank rate)",
    rules: [
      {
        name: "\u95A2\u7A0E\u5B9A\u7387\u6CD5\u7B2C4\u6761\u306E7\u3001\u95A2\u7A0E\u5B9A\u7387\u6CD5\u65BD\u884C\u898F\u5247\u7B2C1\u6761\uFF08\u30AB\u30B9\u30BF\u30E0\u30B9\u30A2\u30F3\u30B5\u30FC1406\uFF09",
        url: "https://www.customs.go.jp/tetsuzuki/c-answer/imtsukan/1406_jr.htm",
        excerpts: ["\u305D\u306E\u5916\u56FD\u70BA\u66FF\u76F8\u5834\u306F\u3001\u8F38\u5165\u7533\u544A\u306E\u65E5\u306E\u5C5E\u3059\u308B\u9031\u306E\u524D\u3005\u9031\u306B\u304A\u3051\u308B\u5B9F\u52E2\u5916\u56FD\u70BA\u66FF\u76F8\u5834\u306E\u5F53\u8A72\u9031\u9593\u306E\u5E73\u5747\u5024\u306B\u57FA\u3065\u304D\u3001\u7A0E\u95A2\u9577\u306B\u3088\u308A\u6BCE\u9031\u516C\u793A\u3055\u308C\u3066\u3044\u307E\u3059\u3002"]
      }
    ],
    notes: ["Bank TTS/TTB rates and payment-date rates are not used for customs valuation."],
    command: "jpy-rates customs <declaration-date> -c <currency>"
  },
  {
    id: "export",
    title: "FOB value on an export declaration",
    titleJa: "\u8F38\u51FA\u7533\u544A\u4FA1\u683C\uFF08\u672C\u8239\u7532\u677F\u6E21\u3057\u4FA1\u683C\uFF09\u306E\u63DB\u7B97",
    source: "customs",
    rate: "Customs weekly rate (the same rate as for imports)",
    date: "Export declaration date; the rate published for the week containing it",
    institution: "Japan Customs (not a bank rate)",
    rules: [
      {
        name: "\u95A2\u7A0E\u6CD5\u65BD\u884C\u4EE4\u7B2C59\u6761\u306E2\u7B2C4\u9805",
        url: "https://laws.e-gov.go.jp/law/329CO0000000150#Mp-At_59_2",
        excerpts: ["\u7B2C\u4E8C\u9805\u306B\u898F\u5B9A\u3059\u308B\u672C\u8239\u7532\u677F\u6E21\u3057\u4FA1\u683C\u3092\u8A08\u7B97\u3059\u308B\u5834\u5408\u306B\u304A\u3044\u3066\u3001\u5916\u56FD\u901A\u8CA8\u306B\u3088\u308A\u8868\u793A\u3055\u308C\u305F\u4FA1\u683C\u306E\u672C\u90A6\u901A\u8CA8\u3078\u306E\u63DB\u7B97\u306F\u3001\u8F38\u5165\u8CA8\u7269\u306B\u3064\u304D\u8AB2\u7A0E\u4FA1\u683C\u3092\u8A08\u7B97\u3059\u308B\u5834\u5408\u306E\u4F8B\u306B\u3088\u308B\u3002"]
      }
    ],
    notes: ["The rate follows the declaration date, not the loading or payment date."],
    command: "jpy-rates customs <declaration-date> -c <currency>"
  },
  {
    id: "foreign-exchange-report",
    title: "Reports under the Foreign Exchange Act (\u5916\u70BA\u6CD5)",
    titleJa: "\u5916\u70BA\u6CD5\u306E\u5831\u544A\u66F8\u306B\u304A\u3051\u308B\u63DB\u7B97",
    source: "boj",
    rate: "Basic or cross rate (\u57FA\u6E96\u30FB\u88C1\u5B9A\u5916\u56FD\u70BA\u66FF\u76F8\u5834); some reports use the reporting ordinance rate (\u5831\u544A\u7701\u4EE4\u30EC\u30FC\u30C8)",
    date: "The month of the transaction or payment",
    institution: "Rates set by the Minister of Finance and announced by the Bank of Japan",
    rules: [
      {
        name: "\u5916\u56FD\u70BA\u66FF\u4EE4\u7B2C21\u6761\uFF08\u65E5\u672C\u9280\u884C\u300C\u5831\u544A\u66F8\u4F5C\u6210\u306E\u969B\u306B\u4F7F\u7528\u3059\u308B\u30EC\u30FC\u30C8\uFF08\u63DB\u7B97\u30EC\u30FC\u30C8\uFF09\u306E\u8AAC\u660E\u300D\uFF09",
        url: "https://www.boj.or.jp/about/services/tame/tame_rate/exhou.htm",
        excerpts: ["\u5F53\u8A72\u898F\u5B9A\u306B\u304A\u3044\u3066\u305D\u306E\u984D\u306B\u3064\u3044\u3066\u5F53\u8A72\u63DB\u7B97\u3092\u3059\u3079\u304D\u53D6\u5F15\u3001\u884C\u70BA\u53C8\u306F\u652F\u6255\u7B49\u304C\u884C\u308F\u308C\u308B\u65E5\u306B\u304A\u3051\u308B\u5916\u70BA\u6CD5\u7B2C7\u6761\u7B2C1\u9805\u306B\u898F\u5B9A\u3059\u308B\u57FA\u6E96\u5916\u56FD\u70BA\u66FF\u76F8\u5834\u53C8\u306F\u88C1\u5B9A\u5916\u56FD\u70BA\u66FF\u76F8\u5834\u3092\u7528\u3044\u3066\u884C\u3046\u3082\u306E\u3068\u3059\u308B\u3002"]
      }
    ],
    notes: [
      "Reports listed under \u5831\u544A\u7701\u4EE4\u7B2C35\u6761\u7B2C2\u53F7 use the reporting ordinance rate (\u5831\u544A\u7701\u4EE4\u30EC\u30FC\u30C8) instead. It converts amounts to US dollars for reports that state amounts in USD: jpy-rates boj reporting <YYYY-MM>.",
      "Currencies without a published cross rate are converted at their USD market rate times the basic rate, as stated in each monthly announcement; jpy-rates shows these as derived rows.",
      "To decide whether a payment must be reported, a payment that involved a currency exchange uses that exchange's rate (\u65E5\u672C\u9280\u884C\u300C\u5916\u70BA\u6CD5\u306E\u5831\u544A\u5236\u5EA6\u306B\u3064\u3044\u3066\u300D)."
    ],
    command: "jpy-rates boj basic <YYYY-MM> -c <currency>"
  }
];
const getGuideTopic = (id) => guideTopics.find((topic) => topic.id === id);

export { guideTopics as a, getGuideTopic as g };
