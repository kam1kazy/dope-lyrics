import { describe, expect, test } from 'bun:test';

import { ARTIST_PROFILES } from '~/modules/ai/artists/profiles';
import {
  PICKED_KINDS,
  TECHNIQUES_BY_KIND,
} from '~/modules/ai/artists/techniques';

describe('карточки артистов', () => {
  test('в каталоге все названные артисты', () => {
    const names = [
      'Future',
      'Don Toliver',
      'Travis Scott',
      'Linkin Park',
      'Slipknot',
      'Kanye West',
      'Che Ecru',
      'Oxxxymiron',
      'Скриптонит',
      'OG Buda',
      'MAYOT',
      'Kidd',
      'STED.D',
      'ATL',
      'Markul',
      'Pharaoh',
      'Платина',
      'Rocket',
      'Boulevard Depo',
      'Loqiemean',
      'Сидоджи Дубоshit',
      'Scarlxrd',
      'Trippie Redd',
      'XXXTentacion',
      'Juice WRLD',
      'Мэйти',
    ];
    const catalog = ARTIST_PROFILES.map((artist) => artist.name);

    for (const name of names) {
      expect(catalog).toContain(name);
    }
  });

  test('у артиста от одного до пяти приёмов', () => {
    for (const artist of ARTIST_PROFILES) {
      expect(artist.techniques.length).toBeGreaterThan(0);
      expect(artist.techniques.length).toBeLessThanOrEqual(5);
    }
  });

  test('вид приёма размечен один раз и только у живых приёмов', () => {
    const tagged = PICKED_KINDS.flatMap((kind) => TECHNIQUES_BY_KIND[kind]);
    const used = new Set(
      ARTIST_PROFILES.flatMap((artist) =>
        artist.techniques.map((item) => item.id)
      )
    );

    expect(new Set(tagged).size).toBe(tagged.length);
    for (const id of tagged) {
      expect(used.has(id)).toBe(true);
    }
  });
});
