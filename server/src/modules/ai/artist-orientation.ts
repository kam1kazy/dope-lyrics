import type {
  LyricDelivery,
  LyricEnergy,
  LyricMood,
} from '~/modules/lyrics/lyric-facets';

export type ArtistTechnique = {
  id: string;
  label: string;
  instruction: string;
};

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
  techniques: techniques.map(([techniqueId, label]) => {
    const instruction = TECHNIQUE_INSTRUCTIONS[techniqueId];
    if (!instruction) {
      throw new Error(`Нет инструкции приёма ${techniqueId}`);
    }

    return { id: techniqueId, label, instruction };
  }),
});

/** Как применить приём в строке. Подпись остаётся короткой, в редактор идёт инструкция. */
const TECHNIQUE_INSTRUCTIONS: Record<string, string> = {
  'numb-longing':
    'Назови тягу или пустоту коротко, без истории, как к ней пришли. Не геройствуй и не объясняй чувство.',
  'autotune-as-feeling':
    'Сделай строку спетой: растяни гласную или повтори слог, чтобы голос нёс эмоцию. Не пиши, что герой поёт.',
  'short-repeat':
    'Повтори одно короткое слово или обрывок вместо развития сюжета. Не дописывай, что было дальше.',
  'flex-and-void':
    'В одной строке поставь хвастовство рядом с пустотой или потерей. Не оставляй только одну сторону.',
  'paranoid-luxury':
    'Дорогая деталь звучит как угроза или слежка, не как реклама успеха.',
  'sung-line':
    'Сформулируй так, чтобы строку можно было пропеть, с открытой гласной. Не руби её панчем.',
  'love-as-trip':
    'Любовь покажи как сдвиг восприятия: цвет, скорость, тело. Не бытовая ссора и не список признаний.',
  'color-over-everyday':
    'Замени бытовой предмет цветом, светом или тканью. Не объясняй, что этот цвет значит.',
  'night-psychedelia':
    'Ночная сцена теряет прямую логику: предмет ведёт себя странно. Не превращай это в страшилку.',
  'afterparty-melancholy':
    'После подъёма оставь тихий спад. Не ставь мораль, что вечеринка плоха.',
  'atmosphere-over-story':
    'Дай место, свет и гул, не событие. Действие, если есть, не объясняет сцену.',
  'adlib-as-rhythm':
    'Короткий выкрик или слог работает как удар ритма, не как осмысленная фраза. Не переводи его.',
  'luxury-as-nightmare':
    'Дорогая вещь выглядит опасно или больно. Не хвастайся ею в лоб.',
  'dark-carnival':
    'Яркая праздничная картинка с холодной изнанкой в той же строке. Не объясняй контраст.',
  'cinematic-cold':
    'Строка как кадр: кто где стоит, без внутреннего монолога. Эмоция читается из картинки.',
  'whisper-and-scream':
    'В соседних строках тихий голос и срыв. Не держи одну громкость на весь куплет.',
  'plain-alienation':
    'Скажи об отчуждении простыми словами. Не подменяй его метафорой ради метафоры.',
  'inner-war':
    'Два голоса одного человека спорят в соседних строках. Не своди спор к одному выводу.',
  'tight-anger':
    'Злость короткая и сжатая. Не произноси речь, почему герой ненавидит.',
  'simpler-hook':
    'Хук — одна фраза, короче и прямее куплета. Не тащи в него плотность куплета.',
  'rage-as-release':
    'Строка выпускает давление резким глаголом или криком. Не анализируй, почему больно.',
  'shared-pain': 'Боль сказана как «мы», не как исключительность одного героя.',
  'hit-over-rhyme':
    'Выбери удар и согласные, даже если рифма грубая. Не выглаживай строку ради красивой пары.',
  claustrophobia:
    'Тесное место, грязь, нехватка воздуха. Не открывай пространство и не утешай.',
  'cold-horror':
    'Страх через холодную деталь, без крика о помощи и без монстра «вообще».',
  'status-and-shame': 'В одной строке статус и стыд за него. Не оправдывайся.',
  'short-over-argument':
    'Одна короткая фраза вместо объяснения. Не доказывай мысль следующей строкой.',
  vulnerability:
    'Прямое слабое признание, без «но я всё равно» и без извинения.',
  'baroque-guilt': 'Вину или величие дай избыточной картинкой, не лекцией.',
  'self-irony': 'В конце строки сам поддень свой пафос. Не объясняй шутку.',
  'quiet-intimacy':
    'Тихая близость: дыхание, расстояние, шёпот. Не признание на всю комнату.',
  'melody-over-punch':
    'Строка льётся, без остроумной точки в конце. Не ставь панч.',
  'odd-rhythm':
    'Сломай ожидаемый размер лишним слогом или паузой. Не выравнивай в ровный рэп.',
  'late-night-air':
    'Поздняя ночь через воздух, окно, тишину. Не сообщай, который час.',
  'raw-cold':
    'Холод сырой и незакрытый, без красивого эпитета. Не согревай концовку.',
  'dense-internal-rhyme':
    'Созвучия внутри строки, не только в конце. Смысл не подменяй списком рифм.',
  'irony-keeps-anger':
    'Ирония не снимает злость. Не превращай удар в дружескую шутку.',
  'bookish-hit':
    'Одна книжная или историческая отсылка бьёт как панч. Не лекция и не сноска.',
  'complex-still-musical':
    'Сложная фраза всё равно произносится в такт. Если не произносится, упрости звук, не мысль.',
  'dystopia-and-tenderness':
    'Жёсткая картина и тихая нежность стоят рядом. Не объясняй контраст.',
  'cold-short-line':
    'Короткая фраза ровным тоном, без украшения. Одно предложение и точка.',
  'everyday-without-moral':
    'Бытовая деталь без вывода «и поэтому». Не оценивай героя.',
  'half-sung-hook':
    'Хук проще куплета и чуть поётся. Не нагружай его образами куплета.',
  'detached-night':
    'Ночь со стороны, как будто говорящему всё равно. Не исповедь.',
  'few-gestures': 'Одно действие вместо жеста и позы. Второе движение убери.',
  'melodic-slang':
    'Уличный сленг так, чтобы его можно было пропеть. Не заменяй его литературным словом.',
  'flex-and-lonely':
    'Хвастовство и одиночество в соседних словах. Не оставляй только успех.',
  'plain-hook':
    'Хук — короткая разговорная фраза, как сообщение. Без поэтического образа.',
  'night-city': 'Ночной город одной деталью: свет, двор, машина. Не панорама.',
  'empty-afterparty':
    'После тусовки остаётся пустота, не анекдот. Не осуждай вечеринку.',
  'confession-without-pose':
    'Признание прямым языком, без позы «я такой». Не геройствуй.',
  'stretched-vowel':
    'Растяни гласную в ключевом слове, чтобы строка спелась. Не пиши, что голос дрожит.',
  'love-into-numb':
    'Любовь в строке остывает до онемения. Не держи только нежность или только холод.',
  'soft-night': 'Ночь мягкая, без угрозы и без тусовки. Тихий свет, не неон.',
  'liveliness-over-grammar':
    'Живая разговорная форма важнее правильной. Не выправляй строку в литературный русский.',
  'hook-over-verse':
    'Хук прямее и памятнее куплета. Куплет не обязан быть таким же простым.',
  'closer-to-singing':
    'Фраза ближе к пению, чем к скороговорке: открытые гласные, без панча.',
  'love-and-doubt':
    'Любовь и сомнение сказаны прямо, в одной строке или в соседних. Не прячь сомнение в метафору.',
  chamber: 'Камерная сцена: двое, комната, тихий звук. Не клуб и не толпа.',
  'no-party-flex': 'Убери хвастовство тусовкой. Оставь чувство, не статус.',
  'unchewed-metaphor':
    'Метафора сырая. Не добавляй строку, которая её расшифровывает.',
  'anger-without-pretty-sadness':
    'Злость без красивой грусти и без слёзной рифмы.',
  'depression-as-fact':
    'Тяжёлое состояние коротко, как факт. Не драма и не просьба о помощи.',
  'pain-from-life':
    'Конкретная жизненная деталь вместо абстрактной боли. Не обобщай до «мир жесток».',
  'darkness-without-exit':
    'Не ставь в конец свет, урок или выход. Мрак остаётся.',
  'irony-not-confession':
    'Серьёзное сказано с иронией, не как исповедь. Не объясняй, что это шутка.',
  'short-hook': 'Хук — одна короткая фраза. Не вторая строфа.',
  'boredom-and-night':
    'Скука и ночь одним ровным тоном, без надрыва. Не «мне так плохо».',
  'cold-detachment': 'Говорящий в стороне от события. Не пиши «я чувствую».',
  'no-moral': 'Убери нравоучение и вывод. Оставь наблюдение.',
  'bookish-in-street-speech':
    'Книжный образ произнеси уличной фразой. Не держи высокий слог на всю строку.',
  'melancholy-without-tears': 'Грусть без плача, слёз и слова «тоскую». Сухо.',
  'gothic-and-tenderness':
    'Мрачная картинка и тихая нежность в одной строке. Не оставляй только хоррор.',
  'rain-and-fatigue':
    'Дождь и усталость города одной деталью. Не открытка «ночные огни».',
  'insomnia-on-the-road':
    'Бессонница в движении: дорога, окно, не кровать. Не жалоба «не сплю».',
  'fragment-as-style':
    'Оборви фразу или оставь короткий адлиб. Не дописывай мысль до конца.',
  'pretty-unreal-dark':
    'Красивый мрак без быта: не кухня и не расписание. Не объясняй символ.',
  'night-trill':
    'Ночная строка держится на украшении голоса, не на сюжете. Коротко.',
  'quiet-fame-fatigue': 'Усталость от успеха сказана тихо. Без лекции о славе.',
  'bright-sadness':
    'Светлая грусть: красиво и печально, без надрыва и без злости.',
  'adlib-slang-hit':
    'Сленг или короткий адлиб бьёт сильнее объяснения. Не переводи его на нейтральный язык.',
  'wild-punch':
    'Панч может быть нелогичным, если он злой или смешной. Не выглаживай его в правильную мысль.',
  'flex-with-longing':
    'Хвастовство сразу рядом с тоской. Не оставляй только флекс.',
  'dirty-flex': 'Грязное хвастовство без извинения и без морали.',
  'soft-melodic-trap':
    'Рядом с жёсткой строкой дай мягкую, которую можно пропеть. Не держи одну злость.',
  'laid-back-flow': 'Фраза неспешная, с воздухом. Не скороговорка и не крик.',
  'youth-flex-without-anger':
    'Хвастовство молодости без злости на других. Не унижение.',
  'foreign-word-texture':
    'Чужое слово оставь как звук и фактуру. Не переводи и не поясняй.',
  'smoke-and-unhurried': 'Дым и медленный жест. Не ускоряй сюжет.',
  'minimal-hype': 'Короткий хайп одной фразой. Не расписывай успех.',
  'rare-word':
    'Поставь редкое или странное слово вместо обычного. Не объясняй его.',
  'language-fragment': 'Оборви синтаксис: кусок фразы, не полное предложение.',
  'fashion-and-decay':
    'Модная деталь и распад в одном кадре. Не глянец без трещины.',
  'crooked-beauty':
    'Красота нарочно кривая: странное слово или сломанный образ. Не выправляй.',
  'opium-night': 'Ночь мутная и замедленная, без ясного сюжета. Не триллер.',
  'dark-poetry':
    'Сопоставь два образа, которые обычно не стоят рядом. Связь не растолковывай.',
  existential:
    'Вопрос о пустоте, смерти или выборе задай внутри строки. Без философского абзаца.',
  'social-critique':
    'Бей по порядку вещей конкретной сценой, не лозунгом и не статьёй.',
  'mythic-images':
    'Мифологический образ работает как факт сцены, не как справка, откуда он.',
  'high-to-slang':
    'Контраст высокого литературного образа с грубой разговорной или уличной лексикой. Не объяснять контраст, а создавать его внутри строки.',
  'dirty-punch': 'Грязный панч без извинения и без красивого послесловия.',
  'surgical-flow':
    'Плотная точная фраза: каждое слово на месте. Не поток ради потока.',
  'aggression-as-craft': 'Злость собранная, ровным напором. Не истерика.',
  'toxic-pressure': 'Давление: обвинение или презрение без оправдания.',
  'short-hard-hit': 'Одна ультракороткая жёсткая строка. Не развивай её.',
  'scream-not-metaphor':
    'Прямой крик или резкий глагол вместо метафоры. Не «боль как».',
  'noise-as-meaning':
    'Повтор, шум, обрывок важнее сюжета. Не выстраивай историю.',
  'short-rage': 'Ярость в нескольких словах, без предыстории.',
  'industrial-metal':
    'Железо, станок, скрежет как место. Не природа и не романтика.',
  claustrophobic: 'Стены близко. Выхода в строке нет.',
  'melody-near-scream':
    'Мелодия на грани срыва: красиво, но вот-вот закричит. Не ровный припев.',
  'love-and-rage':
    'Любовь и ярость в одном куплете, без перехода «потом я успокоился».',
  'rock-inside-rap':
    'Рваная, почти роковая эмоция внутри рэп-строки. Не ровный каданс.',
  'neon-emotion': 'Чувство названо ярко и сразу. Не полутон и не подводка.',
  'less-scheme': 'Убери схему «тезис, пример, вывод». Оставь вспышку.',
  'feeling-immediately': 'Чувство в первых словах, коротко. Без подводки.',
  'tenderness-and-rage':
    'Нежность и ярость стыкуются без мостика. Переход не сглаживай.',
  'bare-melody': 'Голая певческая фраза почти без образов. Прямые слова.',
  'quiet-sadness': 'Тихая грусть, без крика и без морали.',
  'chaos-fragments': 'Обрывки, не абзац. Мысль можно не закончить.',
  'sung-pain': 'Боль сформулируй так, чтобы её пели. Не отчёт.',
  'addiction-and-love':
    'Зависимость и любовь названы одними и теми же словами. Не поясняй, где что.',
  'confession-hook': 'Хук — одно прямое признание, которое хочется повторить.',
  'teenage-disaster':
    'Ставка максимальная, даже если повод маленький. Не ирония взрослого.',
  'melody-before-text':
    'Если выбор между точной мыслью и поющейся фразой, оставь поющуюся. Не перегружай смыслом.',
  'image-as-story': 'Один образ за две строки рассказывает случай. Не эссе.',
  'tenderness-and-rot':
    'Нежность и гниль в одном кадре. Не оставляй только красивое.',
  'sleep-and-illness':
    'Сон, жар или болезнь как место действия. Не диагноз и не метафора «общество болеет».',
  loneliness: 'Одиночество конкретной сценой. Не словом «одинок» и не жалобой.',
  'rotting-fairytale':
    'Сказочный образ портится внутри строки. Не добрая мораль сказки.',
};

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

const ARTIST_BY_ID = new Map(
  ARTIST_PROFILES.map((artist) => [artist.id, artist])
);

export const artistById = (id: string): ArtistProfile | undefined =>
  ARTIST_BY_ID.get(id);

const ORIENTATION_HEADER = [
  'Ориентир звучания по умолчанию. Свои заметки автора сюда не входят.',
  'Новую строку строй приёмом отсюда, по-русски, в форме склейки. Чужие строки не копируй.',
  'Не смешивай всех в один стиль: на правку хватит одного-двух близких приёмов. Метки частей не ломай.',
  'Если строка уже сильна в одном из этих приёмов, не подменяй её другим артистом.',
  'У артиста не больше пяти качеств. Альбомов и нумерации нет.',
].join('\n');

const artistLine = (artist: ArtistProfile): string =>
  `${artist.name} - ${artist.techniques.map((item) => item.label).join(', ')}`;

/** Короткий список подписей. В живую правку не уходит. */
export const ARTIST_ORIENTATION = [
  ORIENTATION_HEADER,
  '',
  ...ARTIST_PROFILES.map(artistLine),
].join('\n');

export const CANDIDATE_LIMIT = 3;
export const CANDIDATE_FLOOR = 3;
export const TECHNIQUES_PER_CARD = 2;

export type RankedCandidates = {
  artists: readonly ArtistProfile[];
  relaxed: boolean;
};

const overlaps = (left: readonly string[], right: readonly string[]): number =>
  right.reduce(
    (sum, item) => sum + ((left as readonly string[]).includes(item) ? 1 : 0),
    0
  );

const scoreArtist = (
  artist: ArtistProfile,
  facets: {
    moods: readonly string[];
    energies: readonly string[];
    deliveries: readonly string[];
  }
): number =>
  overlaps(artist.moods, facets.moods) * 2 +
  overlaps(artist.energies, facets.energies) +
  overlaps(artist.deliveries, facets.deliveries);

const spreadArtists = (count: number): ArtistProfile[] => {
  const picked: ArtistProfile[] = [];
  const seen = new Set<string>();

  for (const artist of ARTIST_PROFILES) {
    const key = artist.moods[0] ?? artist.id;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    picked.push(artist);
    if (picked.length === count) {
      break;
    }
  }

  return picked;
};

/** Несколько ближайших карточек. Пустые грани не разворачивают весь каталог. */
export const rankArtistCandidates = (facets: {
  moods: readonly string[];
  energies: readonly string[];
  deliveries: readonly string[];
}): RankedCandidates => {
  const ranked = ARTIST_PROFILES.map((artist) => ({
    artist,
    score: scoreArtist(artist, facets),
  })).sort(
    (left, right) =>
      right.score - left.score ||
      left.artist.name.localeCompare(right.artist.name, 'ru')
  );
  const positive = ranked.filter((item) => item.score > 0);

  if (positive.length === 0) {
    return { artists: spreadArtists(CANDIDATE_LIMIT), relaxed: true };
  }

  const count =
    positive.length >= CANDIDATE_FLOOR
      ? Math.min(CANDIDATE_LIMIT, positive.length)
      : CANDIDATE_FLOOR;

  return {
    artists: ranked.slice(0, count).map((item) => item.artist),
    relaxed: positive.length < CANDIDATE_FLOOR,
  };
};

/** Карточки для редактора: id и инструкция, без пересказа. */
export const formatArtistCards = (artists: readonly ArtistProfile[]): string =>
  artists
    .map((artist) =>
      [
        artist.name,
        ...artist.techniques
          .slice(0, TECHNIQUES_PER_CARD)
          .map((item) => `- ${item.id}: ${item.instruction}`),
      ].join('\n')
    )
    .join('\n\n');

export const catalogForSelector = (
  artists: readonly ArtistProfile[] = ARTIST_PROFILES
): string =>
  artists
    .map((artist) => {
      const techniques = artist.techniques
        .map((item) => `${item.id}: ${item.instruction}`)
        .join('; ');

      return [
        `${artist.id} | ${artist.name}`,
        `настроение: ${artist.moods.join(', ')}`,
        `энергия: ${artist.energies.join(', ')}`,
        `подача: ${artist.deliveries.join(', ')}`,
        `приёмы: ${techniques}`,
      ].join('\n');
    })
    .join('\n\n');
