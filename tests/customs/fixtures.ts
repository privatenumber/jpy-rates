// Synthetic PDF with a ToUnicode map. No source document or source values are stored.
const pdf = (start: string, end: string, era = '令和8年10月') => {
	const lines: [number, number, string][] = [
		[60, 700, `適用期間：${era}${start}日から${era}${end}日まで`],
		[75, 600, '101'],
		[110, 600, '架空国'],
		[294, 600, 'ドル'],
		[370, 600, 'USD'],
		[440, 600, '100.00'],
		[75, 580, '102'],
		[110, 580, '別国'],
		[294, 580, 'ウォン'],
		[370, 580, 'KRW'],
		[525, 580, '12.34'],
		[75, 560, '103他'],
		[110, 560, '島国他'],
		[294, 560, '島ドル'],
		[370, 560, 'XCD'],
		[440, 560, '30.00'],
		[75, 540, '104'],
		[110, 540, 'シンガポール'],
		[294, 540, 'ドル'],
		[370, 540, 'SGD'],
		[440, 540, '80.00'],
		[75, 520, '105'],
		[110, 520, 'ブルネイ'],
		[294, 520, 'ドル'],
		[370, 520, 'BND'],
		[400, 520, 'シンガポール・ドルと等価'],
	];
	const characters = [...new Set(lines.flatMap(line => [...line[2]]))];
	const mapping = characters.map((character) => {
		const hex = character.codePointAt(0)!.toString(16).padStart(4, '0');
		return `<${hex}> <${hex}>`;
	}).join('\n');
	const cmap = `/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /Fixture def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <ffff>\nendcodespacerange\n${characters.length} beginbfchar\n${mapping}\nendbfchar\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend`;
	const stream = lines.map(([x, y, text]) => `BT /F1 10 Tf 1 0 0 1 ${x} ${y} Tm <${[...text].map(character => character.codePointAt(0)!.toString(16).padStart(4, '0')).join('')}> Tj ET`).join('\n');
	const objects = [
		'<< /Type /Catalog /Pages 2 0 R >>',
		'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
		'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 7 0 R >>',
		'<< /Type /Font /Subtype /Type0 /BaseFont /Fixture /Encoding /Identity-H /DescendantFonts [5 0 R] /ToUnicode 6 0 R >>',
		'<< /Type /Font /Subtype /CIDFontType2 /BaseFont /Fixture /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /DW 500 >>',
		`<< /Length ${cmap.length} >>\nstream\n${cmap}\nendstream`,
		`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
	];
	let output = '%PDF-1.4\n';
	const offsets = [0];
	for (const [index, object] of objects.entries()) {
		offsets.push(output.length);
		output += `${index + 1} 0 obj\n${object}\nendobj\n`;
	}
	const xref = output.length;
	output += `xref\n0 ${offsets.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
	return new TextEncoder().encode(output);
};

export const customsFixture = (url: string): Response | undefined => {
	if (url === 'https://www.customs.go.jp/tetsuzuki/kawase/index.htm') {
		return new Response('<a href="/tetsuzuki/kawase/kouji-rate20261004-20261010.pdf">week 1</a><a href="/tetsuzuki/kawase/kouji-rate20261011-20261017.pdf">week 2</a><a href="/tetsuzuki/kawase/kouji-rate20191006-191012.pdf">week 3</a>');
	}
	if (url === 'https://www.customs.go.jp/tetsuzuki/kawase/kouji-rate20261004-20261010.pdf') { return new Response(pdf('4', '10')); }
	if (url === 'https://www.customs.go.jp/tetsuzuki/kawase/kouji-rate20261011-20261017.pdf') { return new Response(pdf('11', '17')); }
	if (url === 'https://www.customs.go.jp/tetsuzuki/kawase/kouji-rate20191006-191012.pdf') { return new Response(pdf('6', '12', '令和元年10月')); }
	return undefined;
};
