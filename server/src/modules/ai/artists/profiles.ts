import {
  type ArtistTechnique,
  techniqueById,
} from '~/modules/ai/artists/techniques';
import type {
  LyricDelivery,
  LyricEnergy,
  LyricMood,
} from '~/modules/lyrics/lyric-facets';

export type ArtistProfile = {
  id: string;
  name: string;
  moods: readonly LyricMood[];
  energies: readonly LyricEnergy[];
  deliveries: readonly LyricDelivery[];
  techniques: readonly ArtistTechnique[];
};

const profile = (
  id: string,
  name: string,
  moods: readonly LyricMood[],
  energies: readonly LyricEnergy[],
  deliveries: readonly LyricDelivery[],
  techniques: readonly (readonly [string, string])[]
): ArtistProfile => ({
  id,
  name,
  moods,
  energies,
  deliveries,
  techniques: techniques.map(([techniqueId, label]) =>
    techniqueById(techniqueId, label)
  ),
});

/** Замкнутый каталог. Модель выбирает id, не сочиняет новые. */
export const ARTIST_PROFILES: readonly ArtistProfile[] = [
  profile(
    'future',
    'Future',
    ['LONGING', 'COLD'],
    ['EVEN'],
    ['TUNE'],
    [
      ['numb-longing', 'онемение и токсичная тяга'],
      ['autotune-as-feeling', 'автотюн как чувство'],
      ['short-repeat', 'короткий повтор вместо сюжета'],
      ['flex-and-void', 'хвастовство рядом с пустотой'],
      ['paranoid-luxury', 'параноидальная роскошь'],
    ]
  ),
  profile(
    'don-toliver',
    'Don Toliver',
    ['TENDERNESS', 'EUPHORIA'],
    ['EVEN'],
    ['TUNE'],
    [
      ['sung-line', 'строка почти поётся'],
      ['love-as-trip', 'любовь как трип'],
      ['color-over-everyday', 'мало быта и много цвета'],
      ['night-psychedelia', 'ночная психоделия'],
      ['afterparty-melancholy', 'меланхолия после вечеринки'],
    ]
  ),
  profile(
    'travis-scott',
    'Travis Scott',
    ['COLD', 'BRAVADO'],
    ['LOUD'],
    ['ADLIB', 'TUNE'],
    [
      ['atmosphere-over-story', 'атмосфера важнее рассказа'],
      ['adlib-as-rhythm', 'адлибы как ритм'],
      ['luxury-as-nightmare', 'роскошь как кошмар'],
      ['dark-carnival', 'тёмный карнавал'],
      ['cinematic-cold', 'кинематографичный холод'],
    ]
  ),
  profile(
    'linkin-park',
    'Linkin Park',
    ['ANXIETY', 'AGGRESSION'],
    ['WHISPER', 'SCREAM'],
    ['HOOK', 'SPOKEN'],
    [
      ['whisper-and-scream', 'шёпот и крик в одной песне'],
      ['plain-alienation', 'чистое отчуждение'],
      ['inner-war', 'внутренняя война'],
      ['tight-anger', 'тесная злость'],
      ['simpler-hook', 'хук проще куплета'],
    ]
  ),
  profile(
    'slipknot',
    'Slipknot',
    ['AGGRESSION'],
    ['SCREAM'],
    ['PUNCH'],
    [
      ['rage-as-release', 'ярость как разрядка'],
      ['shared-pain', 'общая боль вместо одинокого героя'],
      ['hit-over-rhyme', 'удар важнее красивой рифмы'],
      ['claustrophobia', 'клаустрофобия и грязь'],
      ['cold-horror', 'холодный хоррор'],
    ]
  ),
  profile(
    'kanye-west',
    'Kanye West',
    ['BRAVADO', 'IRONY', 'TENDERNESS'],
    ['LOUD'],
    ['PUNCH'],
    [
      ['status-and-shame', 'статус и стыд в одной строке'],
      ['short-over-argument', 'короткая фраза сильнее аргумента'],
      ['vulnerability', 'уязвимость без извинения'],
      ['baroque-guilt', 'барокко вины и величия'],
      ['self-irony', 'самоирония'],
    ]
  ),
  profile(
    'che-ecru',
    'Che Ecru',
    ['TENDERNESS', 'LONGING'],
    ['WHISPER'],
    ['TUNE'],
    [
      ['quiet-intimacy', 'тихая интимность'],
      ['melody-over-punch', 'мелодия важнее панча'],
      ['odd-rhythm', 'странный ритм'],
      ['late-night-air', 'поздняя ночь и воздух'],
      ['raw-cold', 'сырой холод'],
    ]
  ),
  profile(
    'oxxxymiron',
    'Oxxxymiron',
    ['IRONY', 'AGGRESSION'],
    ['LOUD'],
    ['TONGUE_TWISTER', 'FLOW'],
    [
      ['dense-internal-rhyme', 'плотная внутренняя рифма'],
      ['irony-keeps-anger', 'ирония не отменяет злости'],
      ['bookish-hit', 'книжная отсылка как удар'],
      ['complex-still-musical', 'сложная строка остаётся музыкальной'],
      ['dystopia-and-tenderness', 'антиутопия рядом с нежностью'],
    ]
  ),
  profile(
    'scriptonite',
    'Скриптонит',
    ['COLD'],
    ['QUIET'],
    ['SPOKEN', 'HOOK'],
    [
      ['cold-short-line', 'холод и короткая фраза'],
      ['everyday-without-moral', 'быт без морали'],
      ['half-sung-hook', 'полупетый хук'],
      ['detached-night', 'отстранённая ночь'],
      ['few-gestures', 'мало жеста'],
    ]
  ),
  profile(
    'og-buda',
    'OG Buda',
    ['BRAVADO', 'LONGING'],
    ['EVEN'],
    ['TUNE', 'HOOK'],
    [
      ['melodic-slang', 'мелодичный сленг'],
      ['flex-and-lonely', 'флекс и одиночество вместе'],
      ['plain-hook', 'простой разговорный хук'],
      ['night-city', 'ночной город'],
      ['empty-afterparty', 'пустота после вечеринки'],
    ]
  ),
  profile(
    'mayot',
    'MAYOT',
    ['TENDERNESS', 'LONGING'],
    ['QUIET'],
    ['TUNE'],
    [
      ['confession-without-pose', 'признание без позы'],
      ['stretched-vowel', 'растянутая гласная'],
      ['love-into-numb', 'любовь переходит в онемение'],
      ['soft-night', 'мягкая ночь'],
      ['liveliness-over-grammar', 'живость важнее грамматики'],
    ]
  ),
  profile(
    'kidd',
    'Kidd',
    ['TENDERNESS', 'LONGING'],
    ['QUIET'],
    ['HOOK', 'TUNE'],
    [
      ['hook-over-verse', 'хук важнее куплета'],
      ['closer-to-singing', 'мелодия ближе к пению'],
      ['love-and-doubt', 'любовь и сомнение прямо'],
      ['chamber', 'камерность'],
      ['no-party-flex', 'без тусовочного понта'],
    ]
  ),
  profile(
    'sted-d',
    'STED.D',
    ['ANXIETY', 'COLD'],
    ['LOUD'],
    ['SPOKEN'],
    [
      ['unchewed-metaphor', 'неразжёванная метафора'],
      ['anger-without-pretty-sadness', 'злость без красивой грусти'],
      ['depression-as-fact', 'депрессия как факт'],
      ['pain-from-life', 'боль из жизни'],
      ['darkness-without-exit', 'мрак без выхода'],
    ]
  ),
  profile(
    'atl',
    'ATL',
    ['IRONY', 'COLD'],
    ['EVEN'],
    ['HOOK'],
    [
      ['irony-not-confession', 'ирония вместо исповеди'],
      ['short-hook', 'короткий хук'],
      ['boredom-and-night', 'скука и ночь в одной интонации'],
      ['cold-detachment', 'холодная отстранённость'],
      ['no-moral', 'без нравоучения'],
    ]
  ),
  profile(
    'markul',
    'Markul',
    ['LONGING', 'TENDERNESS'],
    ['QUIET'],
    ['SPOKEN'],
    [
      ['bookish-in-street-speech', 'книжный образ в уличной речи'],
      ['melancholy-without-tears', 'меланхолия без слёз'],
      ['gothic-and-tenderness', 'готика рядом с нежностью'],
      ['rain-and-fatigue', 'дождь и усталость большого города'],
      ['insomnia-on-the-road', 'бессонница в дороге'],
    ]
  ),
  profile(
    'pharaoh',
    'Pharaoh',
    ['COLD', 'BRAVADO'],
    ['EVEN'],
    ['ADLIB', 'TUNE'],
    [
      ['fragment-as-style', 'обрывок и адлиб как стиль'],
      ['pretty-unreal-dark', 'красивый небытовой мрак'],
      ['night-trill', 'ночной трилл'],
      ['quiet-fame-fatigue', 'усталость от успеха сказанная тихо'],
      ['bright-sadness', 'светлая грусть'],
    ]
  ),
  profile(
    'platina',
    'Платина',
    ['BRAVADO', 'LONGING'],
    ['LOUD'],
    ['ADLIB', 'PUNCH'],
    [
      ['adlib-slang-hit', 'адлиб и сленг как удар'],
      ['wild-punch', 'безумный панч важнее логики'],
      ['flex-with-longing', 'хвастовство с тоской'],
      ['dirty-flex', 'грязный флекс'],
      ['soft-melodic-trap', 'мягкий мелодичный трэп'],
    ]
  ),
  profile(
    'rocket',
    'Rocket',
    ['BRAVADO'],
    ['EVEN'],
    ['FLOW'],
    [
      ['laid-back-flow', 'вальяжный флоу'],
      ['youth-flex-without-anger', 'флекс молодости без злости'],
      ['foreign-word-texture', 'чужое слово как фактура'],
      ['smoke-and-unhurried', 'дым и неспешность'],
      ['minimal-hype', 'минималистичный хайп'],
    ]
  ),
  profile(
    'boulevard-depo',
    'Boulevard Depo',
    ['COLD', 'IRONY'],
    ['EVEN'],
    ['FLOW'],
    [
      ['rare-word', 'редкое слово'],
      ['language-fragment', 'обрывок языка'],
      ['fashion-and-decay', 'мода и распад в одном кадре'],
      ['crooked-beauty', 'нарочно кривая красота'],
      ['opium-night', 'опиумная ночь'],
    ]
  ),
  profile(
    'loqiemean',
    'Loqiemean',
    ['COLD', 'AGGRESSION'],
    ['LOUD'],
    ['SPOKEN'],
    [
      ['dark-poetry', 'сложная и мрачная поэзия'],
      ['existential', 'экзистенциальная рефлексия'],
      ['social-critique', 'жесткая социальная критика'],
      ['mythic-images', 'насыщенные мифологические образы'],
      ['high-to-slang', 'контрастная лексика от высокого слога до сленга'],
    ]
  ),
  profile(
    'sidodgi',
    'Сидоджи Дубоshit',
    ['AGGRESSION'],
    ['SCREAM'],
    ['PUNCH', 'FLOW'],
    [
      ['dirty-punch', 'грязный панч'],
      ['surgical-flow', 'хирургический флоу'],
      ['aggression-as-craft', 'агрессия как ремесло'],
      ['toxic-pressure', 'токсичный напор'],
      ['short-hard-hit', 'короткий ультражёсткий удар'],
    ]
  ),
  profile(
    'scarlxrd',
    'Scarlxrd',
    ['AGGRESSION'],
    ['SCREAM'],
    ['PUNCH'],
    [
      ['scream-not-metaphor', 'крик вместо метафоры'],
      ['noise-as-meaning', 'шум как смысл'],
      ['short-rage', 'короткая ярость без истории'],
      ['industrial-metal', 'индастриал и металл'],
      ['claustrophobic', 'клаустрофобия'],
    ]
  ),
  profile(
    'trippie-redd',
    'Trippie Redd',
    ['TENDERNESS', 'AGGRESSION'],
    ['LOUD'],
    ['TUNE'],
    [
      ['melody-near-scream', 'мелодия на грани крика'],
      ['love-and-rage', 'любовь и ярость в одном куплете'],
      ['rock-inside-rap', 'рок внутри рэпа'],
      ['neon-emotion', 'неоновая эмоция'],
      ['less-scheme', 'меньше схемы'],
    ]
  ),
  profile(
    'xxxtentacion',
    'XXXTentacion',
    ['TENDERNESS', 'AGGRESSION'],
    ['SCREAM'],
    ['TUNE'],
    [
      ['feeling-immediately', 'чувство сразу и коротко'],
      ['tenderness-and-rage', 'нежность и ярость без перехода'],
      ['bare-melody', 'голая мелодия'],
      ['quiet-sadness', 'тихая грусть'],
      ['chaos-fragments', 'хаос и обрывки'],
    ]
  ),
  profile(
    'juice-wrld',
    'Juice WRLD',
    ['LONGING', 'ANXIETY'],
    ['EVEN'],
    ['TUNE', 'HOOK'],
    [
      ['sung-pain', 'боль поётся'],
      ['addiction-and-love', 'зависимость и любовь одними словами'],
      ['confession-hook', 'хук-исповедь'],
      ['teenage-disaster', 'подростковая катастрофа'],
      ['melody-before-text', 'мелодия впереди текста'],
    ]
  ),
  profile(
    'meyti',
    'Мэйти',
    ['TENDERNESS', 'LONGING'],
    ['QUIET'],
    ['SPOKEN'],
    [
      ['image-as-story', 'образ как короткий рассказ'],
      ['tenderness-and-rot', 'нежность рядом с гнилью'],
      ['sleep-and-illness', 'сон и болезнь'],
      ['loneliness', 'одиночество'],
      ['rotting-fairytale', 'сказка которая гниёт'],
    ]
  ),
];
