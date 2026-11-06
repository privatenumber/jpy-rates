import * as XLSX from 'xlsx';

const basic = (title: string, referenceMonth: string) => `<main id="contents"><h1>${title}中において適用</h1>
<p>アメリカ合衆国通貨1米ドルにつき本邦通貨 ： 140円</p>
<table>${['カナダ・ドル', '中国元', 'スウェーデン・クローネ', 'スイス・フラン', 'スターリング・ポンド', 'ユーロ'].map((name, index) => `<tr><td>通貨（1${name}につき本邦通貨）</td><td>${100 + index}円</td></tr>`).join('')}</table>
<h4>${referenceMonth}中における市場実勢相場</h4><ul><li>100韓国ウォンにつき0.0800米ドル</li><li>1オーストラリア・ドルにつき0.700米ドル</li><li>1ベネズエラ・ボリーバルにつき0.200米ドル</li><li>1未知通貨につき0.500米ドル</li></ul></main>`;

const workbook = () => {
	const book = XLSX.utils.book_new();
	const rows = [
		['令和8年11月分'],
		[null, 140, '円 (', 140, ' JPY)', null, null, null, 'につき', null, 1],
		[null, 1, 'カナダ・ドル (1 CAD)', null, null, null, null, null, 'につき', null, 0.75],
		[null, 1, 'ユーロ (1 EUR)', null, null, null, null, null, 'につき', null, 1.2],
		[null, 100, '韓国ウォン (100 KRW)', null, null, null, null, null, 'につき', null, 0.08],
	];
	XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), '省令');
	return XLSX.write(book, {
		type: 'buffer',
		bookType: 'xlsx',
	}) as Buffer;
};

export const bojFixture = (url: string): Response | undefined => {
	if (!url.startsWith('https://www.boj.or.jp/')) { return undefined; }
	if (url.endsWith('/kijun/kiju2611.htm')) { return new Response(basic('令和8年11月', '令和8年9月')); }
	if (url.endsWith('/kijun/kiju1809.htm')) { return new Response(basic('平成30年9月', '平成30年7月')); }
	if (url.endsWith('/kijun/kiju1810.htm')) { return new Response(basic('平成30年10月', '平成30年8月').replace('ベネズエラ・ボリーバル', 'ベネズエラ・ボリーバル(注)')); }
	if (url.endsWith('/kijun/kiju1811.htm')) { return new Response(basic('平成30年11月', '平成30年9月')); }
	if (url.endsWith('/kijun/kiju2610.htm')) { return new Response('<main id="contents"><h1>invalid</h1></main>'); }
	if (url.endsWith('/syorei/hou1601.htm')) {
		return new Response('<main id="contents"><h1>平成28年1月分</h1><ul><li>140円 (140 JPY)につき1米ドル</li><li>1通貨 (1 CAD)につき0.75米ドル</li><li>1通貨 (1 EUR)につき1.2米ドル</li><li>100通貨 (100 KRW)につき0.08米ドル</li></ul></main>');
	}
	if (url.endsWith('/syorei/data/hou2611.xlsx')) { return new Response(new Uint8Array(workbook())); }
	return new Response(null, { status: 404 });
};
