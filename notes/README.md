# Engineering research notes

Tracked maintainer references for the sources and rules that shape jpy-rates. Notes are not published: `package.json#files` lists only `dist` and `skills`.

## Ownership

The upstream folder owns the MURC FX site's observable behavior and data formats. The jpy-rates folder owns project policy, such as which rates the API selects and why, and links to upstream evidence.

## Index

| Folder | Owns |
| --- | --- |
| [murc-fx-site/](./murc-fx-site/README.md) | Observed behavior of the MURC FX pages, CSVs, and XLS workbooks |
| [jpy-rates/](./jpy-rates/README.md) | Project decisions: rate selection for tax purposes, source choice, and source terms |

## Evidence

Cite sources beside each claim. NTA directives are linked to nta.go.jp pages. Source-site behavior was observed with the commands shown in each note, against the live site on the stated date. Do not paste copied source page text or raw data into notes; `scripts/check-raw-data.mjs` rejects it.

## Maintenance

When the source site or an NTA directive changes, update the note, then check the affected code and tests named in it.
