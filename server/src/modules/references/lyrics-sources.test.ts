import { describe, expect, test } from 'bun:test';

import { htmlLyricsToPlain } from '~/modules/references/genius';
import {
  parseAzlyricsPage,
  parseTxtsongCatalogLinks,
} from '~/modules/references/lyrics-extra-sites';
import { htmlFragmentToPlain } from '~/modules/references/lyrics-regional';
import {
  parseRapRussiaPage,
  parseTextLyricsPage,
} from '~/modules/references/lyrics-ru-catalogs';
import { lrcToPlain } from '~/modules/references/lyrics-sources';

describe('lrcToPlain', () => {
  test('снимает таймкоды', () => {
    const out = lrcToPlain('[00:12.34]Первая\n[00:15.00]Вторая');
    expect(out).toBe('Первая\nВторая');
  });
});

describe('htmlLyricsToPlain', () => {
  test('вытаскивает текст из data-lyrics-container', () => {
    const html = '<div data-lyrics-container="true">Привет<br/>Мир</div>';
    expect(htmlLyricsToPlain(html)).toBe('Привет\nМир');
  });
});

describe('htmlFragmentToPlain', () => {
  test('конвертирует br в переносы', () => {
    expect(htmlFragmentToPlain('Одна<br>Две')).toBe('Одна\nДве');
  });
});

describe('parseTxtsongCatalogLinks', () => {
  test('собирает ссылки каталога артиста', () => {
    const html =
      '<a href="https://txtsong.ru/sted-d/sted-d-myortvye-rozy/">Мёртвые розы</a>' +
      '<a href="/sted-d/sted-d-sebya/">СЕБЯ</a>';
    const links = parseTxtsongCatalogLinks(html, 'sted-d');
    expect(links).toHaveLength(2);
    expect(links[0]?.url).toContain('myortvye-rozy');
  });
});

describe('parseTextLyricsPage', () => {
  test('достаёт entry_content', () => {
    const html = `<div id="entry_content">[Текст]<br />${'Строка текста песни. '.repeat(6)}</div><div id="spec1"></div>`;
    expect(parseTextLyricsPage(html)).toContain('Строка текста песни');
  });
});

describe('parseRapRussiaPage', () => {
  test('достаёт lyrics-body', () => {
    const html =
      '<div class="lyrics-body"><p>Pink Floyd!</p><p>Ещё строка текста песни здесь.</p></div><aside class="rr-ad-slot"></aside>';
    expect(parseRapRussiaPage(html)).toContain('Pink Floyd');
  });
});

describe('parseAzlyricsPage', () => {
  test('достаёт div после служебного комментария', () => {
    const html = `<!-- Usage of azlyrics.com content by any third-party lyrics provider is prohibited by our licensing agreement. Sorry about that. --><div>${'Строка текста песни. '.repeat(8)}<br>Вторая</div><!-- MxM master song listing -->`;
    expect(parseAzlyricsPage(html)).toContain('Вторая');
  });
});
