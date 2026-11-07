const rateSources = [
  {
    id: "murc",
    name: "MURC foreign exchange quotations",
    publisher: "MURC, publishing MUFG Bank's customer rates",
    provides: "Daily TTS/TTB/TTM, cash rates, month-end, year-end, reference, and world rates",
    coverage: "Daily rates from 1990",
    url: "https://www.murc-kawasesouba.jp/fx/index.php",
    terms: {
      summary: "Follow MURC's site-use terms. Fetch on request; do not redistribute the source files.",
      url: "https://www.murc.jp/about/"
    },
    attribution: "Source: MUFG Bank exchange quotations published by MURC (https://www.murc-kawasesouba.jp/fx/)"
  },
  {
    id: "customs",
    name: "Japan Customs exchange rates for customs valuation",
    publisher: "Japan Customs (Ministry of Finance)",
    provides: "Weekly rates for converting customs value, announced by the Director-General of Customs",
    coverage: "Weekly from 2008",
    url: "https://www.customs.go.jp/tetsuzuki/kawase/index.htm",
    terms: {
      summary: "Public Data License 1.0 (CC BY 4.0 compatible). Numeric data is not copyrighted; credit the source.",
      url: "https://www.customs.go.jp/kyotsu/rules.htm"
    },
    attribution: "\u51FA\u5178\uFF1A\u7A0E\u95A2\u30A6\u30A7\u30D6\u30B5\u30A4\u30C8\uFF08https://www.customs.go.jp/tetsuzuki/kawase/index.htm\uFF09\u3001PDL1.0\uFF08https://www.digital.go.jp/resources/open_data/public_data_license_v1.0\uFF09"
  },
  {
    id: "boj",
    name: "Bank of Japan conversion rates for foreign exchange reports",
    publisher: "Bank of Japan, announcing rates set by the Minister of Finance",
    provides: "Monthly basic and cross rates (\u57FA\u6E96\u30FB\u88C1\u5B9A\u5916\u56FD\u70BA\u66FF\u76F8\u5834) and reporting ordinance rates (\u5831\u544A\u7701\u4EE4\u30EC\u30FC\u30C8)",
    coverage: "Monthly",
    url: "https://www.boj.or.jp/about/services/tame/tame_rate/index.htm",
    terms: {
      summary: "Copying is allowed with attribution, except commercial copying, which needs prior consultation with the BOJ.",
      url: "https://www.boj.or.jp/about/copyright.htm"
    },
    attribution: "\u51FA\u5178\uFF1A\u65E5\u672C\u9280\u884C\u30A6\u30A7\u30D6\u30B5\u30A4\u30C8\uFF08https://www.boj.or.jp/about/services/tame/tame_rate/index.htm\uFF09"
  },
  {
    id: "boj-stat",
    name: "Bank of Japan Time-Series Data Search API",
    publisher: "Bank of Japan",
    provides: "Tokyo interbank USD/JPY spot rates (daily and monthly) and the yen's effective exchange rate indices",
    coverage: "Daily from 1998, monthly from 1973, effective indices from 1970",
    url: "https://www.stat-search.boj.or.jp/",
    terms: {
      summary: "No API key. Services must show the BOJ credit text and must not send high-frequency requests.",
      url: "https://www.stat-search.boj.or.jp/ssi/docs/info/api_notice.pdf"
    },
    // Credit text required by the API terms, section 2
    attribution: "\u3053\u306E\u30B5\u30FC\u30D3\u30B9\u306F\u3001\u65E5\u672C\u9280\u884C\u6642\u7CFB\u5217\u7D71\u8A08\u30C7\u30FC\u30BF\u691C\u7D22\u30B5\u30A4\u30C8\u306E API \u6A5F\u80FD\u3092\u4F7F\u7528\u3057\u3066\u3044\u307E\u3059\u3002\u30B5\u30FC\u30D3\u30B9\u306E\u5185\u5BB9\u306F\u65E5\u672C\u9280\u884C\u306B\u3088\u3063\u3066\u4FDD\u8A3C\u3055\u308C\u305F\u3082\u306E\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002"
  }
];

export { rateSources as r };
