-- Ещё 23 артиста на полку владельцев: карточки собраны «Заполнить с ИИ» 12.11.2026. Кто уже есть по имени — пропускается.

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'YASMI', ARRAY['BRAVADO']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['HOOK']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('YASMI'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'свой круг', 'Покажи героя среди своей команды через короткую деталь. Не расписывай окружение подробно.', 0),
  ('SOUND'::"TechniqueKind", 'обрывистый повтор', 'Повтори короткий фрагмент, чтобы он цеплял на слух. Не растягивай его в длинную фразу.', 1),
  ('WORDPLAY'::"TechniqueKind", 'смена языков', 'Вставь короткое английское слово в русскую строку. Не переводи каждую мысль дважды.', 2),
  ('TONE'::"TechniqueKind", 'уверенность без объяснений', 'Заяви о своём положении прямо и коротко. Не оправдывайся и не поясняй каждый намёк.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Drake', ARRAY['LONGING', 'BRAVADO', 'TENDERNESS']::TEXT[], ARRAY['QUIET', 'EVEN']::TEXT[], ARRAY['FLOW', 'TUNE']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('Drake'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'успех и нехватка', 'Сопоставь примету достатка с воспоминанием о близости. Не превращай строку в каталог роскоши.', 0),
  ('SOUND'::"TechniqueKind", 'плавный переход в напев', 'Построй строку так, чтобы речитатив мог перейти в мягкий напев. Не руби каждое слово одинаковым ударением.', 1),
  ('WORDPLAY'::"TechniqueKind", 'двойной смысл успеха', 'Обыграй фразу об успехе так, чтобы в ней слышалось и одиночество. Не нагромождай каламбуры.', 2),
  ('TONE'::"TechniqueKind", 'уязвимость под уверенностью', 'Соедини уверенное заявление с личным сомнением. Не прячь чувство за сплошными понтами.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Miyagi & Эндшпиль', ARRAY['LONGING', 'EUPHORIA']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['FLOW', 'TUNE']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('Miyagi & Эндшпиль'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'свет среди окраин', 'Помести светлый образ в сумрачный городской пейзаж. Не превращай строку в открытку.', 0),
  ('SOUND'::"TechniqueKind", 'распевный южный флоу', 'Веди строку плавно, с распевной регги-интонацией. Не дроби каждое слово на отдельный удар.', 1),
  ('WORDPLAY'::"TechniqueKind", 'свет и мрак', 'Столкни слова с противоположной эмоциональной окраской. Не объясняй контраст напрямую.', 2),
  ('TONE'::"TechniqueKind", 'тепло сквозь сумрак', 'Оставь в мрачной картине просвет и движение. Не дави безысходностью в каждой строке.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'The Weeknd', ARRAY['LONGING', 'COLD']::TEXT[], ARRAY['QUIET', 'LOUD']::TEXT[], ARRAY['TUNE', 'HOOK']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('The Weeknd'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'близость и холод', 'Покажи интимный момент через слёзы или прикосновение. Не объясняй чувства целиком.', 0),
  ('SOUND'::"TechniqueKind", 'плавный высокий напев', 'Растяни гласные и сделай фразу мелодичной. Не превращай её в скороговорку.', 1),
  ('WORDPLAY'::"TechniqueKind", 'двойной смысл желания', 'Соедини притяжение и боль в одном коротком обороте. Не строй игру слов на сложном каламбуре.', 2),
  ('TONE'::"TechniqueKind", 'элегантная откровенность', 'Говори о телесном и болезненном мягко и прямо. Не переходи в грубую браваду.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'масло черного тмина', ARRAY['AGGRESSION', 'BRAVADO']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['SPOKEN', 'PUNCH']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('масло черного тмина'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'грубый телесный образ', 'Передай давление через резкое физическое действие. Не смягчай образ отвлечёнными рассуждениями.', 0),
  ('SOUND'::"TechniqueKind", 'повторный заход', 'Начни несколько строк одинаково и меняй продолжение. Не превращай повтор в скороговорку.', 1),
  ('WORDPLAY'::"TechniqueKind", 'столкновение противоположных действий', 'Поставь рядом разрушение и созидание, чтобы усилить контраст. Не разъясняй его в следующей строке.', 2),
  ('TONE'::"TechniqueKind", 'наглое заявление', 'Говори от первого лица уверенно и вызывающе. Не оправдывайся перед слушателем.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'КУОК', ARRAY['COLD']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['FLOW', 'TUNE']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('КУОК'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'электронная атмосфера', 'Создай образ через свет, движение или электронный звук. Не перегружай строку деталями.', 0),
  ('SOUND'::"TechniqueKind", 'звук наравне со смыслом', 'Выстрой фразу так, чтобы она легко ложилась на электронный ритм. Не жертвуй звучанием ради сложного объяснения.', 1),
  ('WORDPLAY'::"TechniqueKind", 'двойной смысл', 'Обыграй слово, которое работает и буквально, и как образ. Не добавляй каламбур только ради рифмы.', 2),
  ('TONE'::"TechniqueKind", 'сдержанный декаданс', 'Передай ощущение упадка через конкретную деталь. Не называй эмоцию напрямую.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'SLAVA MARLOW', ARRAY['ANXIETY', 'LONGING']::TEXT[], ARRAY['EVEN', 'LOUD']::TEXT[], ARRAY['HOOK', 'TUNE']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('SLAVA MARLOW'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'простая бытовая сцена', 'Передай переживание через узнаваемую ситуацию. Не перегружай строку сложными метафорами.', 0),
  ('SOUND'::"TechniqueKind", 'напевный повтор', 'Сделай короткую фразу удобной для напева и повтори её. Не забивай её лишними слогами.', 1),
  ('WORDPLAY'::"TechniqueKind", 'простая рифма', 'Строй рифму на привычных разговорных словах. Не усложняй её ради одной лишь техники.', 2),
  ('TONE'::"TechniqueKind", 'прямое признание', 'Назови чувство простыми словами, как в разговоре. Не прячь его за абстракциями.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'NEWLIGHTCHILD', ARRAY['EUPHORIA']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['HOOK', 'ADLIB']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('NEWLIGHTCHILD'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'краткий зачин', 'Наметь сцену одним штрихом; не разворачивай подробный сюжет.', 0),
  ('SOUND'::"TechniqueKind", 'короткие возгласы', 'Добавь короткие возгласы между повторами; не растягивай их в длинные реплики.', 1),
  ('WORDPLAY'::"TechniqueKind", 'ритмический повтор', 'Обыграй короткое слово или слог повтором; не усложняй строку многоэтажным каламбуром.', 2)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Паша Техник', ARRAY['IRONY', 'BRAVADO']::TEXT[], ARRAY['EVEN', 'LOUD']::TEXT[], ARRAY['FLOW', 'SPOKEN']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('Паша Техник'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'грязная бытовая картинка', 'Добавь приземлённую деталь из повседневности. Не приукрашивай её.', 0),
  ('SOUND'::"TechniqueKind", 'развязная разговорная читка', 'Пусти строку разговорным потоком с небрежными акцентами. Не сглаживай подачу до напева.', 1),
  ('WORDPLAY'::"TechniqueKind", 'абсурдное столкновение слов', 'Сведи несовместимые слова в неожиданную связку. Не разъясняй шутку.', 2),
  ('TONE'::"TechniqueKind", 'провокация без церемоний', 'Добавь дерзкую, нарочито неприличную деталь. Не превращай строку в нравоучение.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Horus', ARRAY['ANXIETY', 'COLD']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['FLOW']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('Horus'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'мрак снаружи и внутри', 'Свяжи тревожную деталь окружающего мира с внутренним состоянием. Не описывай мрак общими словами.', 0),
  ('IMAGE'::"TechniqueKind", 'близость катастрофы', 'Покажи масштабную угрозу через конкретную деталь. Не превращай её в отвлечённый лозунг.', 1),
  ('SOUND'::"TechniqueKind", 'сдержанная ритмичная подача', 'Держи ровный рэп-ритм и выделяй смысловые опоры. Не перегружай строку распевами.', 2),
  ('WORDPLAY'::"TechniqueKind", 'многослойный смысл', 'Соедини в слове или образе два смысла. Не усложняй строку только ради загадочности.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'OBLADAET', ARRAY['BRAVADO', 'AGGRESSION']::TEXT[], ARRAY['LOUD']::TEXT[], ARRAY['FLOW', 'PUNCH']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('OBLADAET'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'спортивное соперничество', 'Покажи преимущество через образ состязания. Не перегружай строку спортивными терминами.', 0),
  ('SOUND'::"TechniqueKind", 'граймовая ритмическая подача', 'Уплотни слоги и расставь резкие акценты. Не сглаживай строку в напев.', 1),
  ('WORDPLAY'::"TechniqueKind", 'двойное значение слова', 'Обыграй слово так, чтобы его можно было понять двояко. Не объясняй игру прямо.', 2),
  ('TONE'::"TechniqueKind", 'баттловое самоутверждение', 'Построй строку как уверенное сравнение с соперником. Не превращай её в длинное оправдание.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'YUNGWAY', ARRAY['BRAVADO', 'IRONY']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['FLOW', 'SPOKEN', 'ADLIB']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('YUNGWAY'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'бытовые детали крупно', 'Покажи сцену через одежду, переписку или случайную мелочь. Не заменяй детали общими описаниями.', 0),
  ('SOUND'::"TechniqueKind", 'короткие боковые вставки', 'Подчеркни строку коротким выкриком или повтором в скобках. Не перегружай вставками каждую строку.', 1),
  ('WORDPLAY'::"TechniqueKind", 'разговорный язык и англицизмы', 'Вплети привычный англицизм в русскую разговорную фразу. Не вставляй английские слова только ради рифмы.', 2),
  ('TONE'::"TechniqueKind", 'самоуверенность с усмешкой', 'Подавай хвастовство легко и с иронией. Не превращай его в пафосную декларацию.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'SODA LUV', ARRAY['TENDERNESS']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['FLOW', 'TUNE']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('SODA LUV'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'музыка как чувство', 'Передай отношение к музыке через личное чувство. Не перегружай строку отвлечёнными метафорами.', 0),
  ('SOUND'::"TechniqueKind", 'рэп и напев', 'Соедини ритмичную строку с напевным окончанием. Не жертвуй ясностью мысли ради мелодии.', 1),
  ('WORDPLAY'::"TechniqueKind", 'двойной смысл слова', 'Обыграй слово так, чтобы оно работало и в музыкальном, и в бытовом смысле. Не усложняй каламбур ради каламбура.', 2)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Playboi Carti', ARRAY['BRAVADO', 'COLD', 'EUPHORIA']::TEXT[], ARRAY['LOUD', 'EVEN']::TEXT[], ARRAY['FLOW', 'HOOK', 'ADLIB']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('Playboi Carti'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'роскошь и стиль', 'Строй образ через одежду и дорогие детали. Не превращай строку в каталог брендов.', 0),
  ('SOUND'::"TechniqueKind", 'голос как ритм', 'Играй высотой голоса и добавляй короткие выкрики между строками. Не произноси всё одинаково ровно.', 1),
  ('WORDPLAY'::"TechniqueKind", 'цепкий словесный повтор', 'Повторяй короткое слово или фразу, меняя их ритмическое положение. Не усложняй строку длинной игрой смыслов.', 2),
  ('TONE'::"TechniqueKind", 'вайб важнее сюжета', 'Передавай состояние отрывистыми фразами и паузами. Не объясняй каждую мысль до конца.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'James Blake', ARRAY['LONGING', 'ANXIETY', 'TENDERNESS']::TEXT[], ARRAY['QUIET', 'EVEN']::TEXT[], ARRAY['TUNE']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('James Blake'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'одиночество в образе', 'Передай одиночество через один простой образ. Не нагромождай детали.', 0),
  ('SOUND'::"TechniqueKind", 'хрупкий высокий голос', 'Оставь место для фальцета и протяжных гласных. Не забивай строку плотной скороговоркой.', 1),
  ('WORDPLAY'::"TechniqueKind", 'вопрос с подвохом', 'Сформулируй тревогу как простой вопрос с двойным смыслом. Не превращай его в цепь сложных каламбуров.', 2),
  ('TONE'::"TechniqueKind", 'сдержанное признание', 'Скажи об уязвимости прямо и негромко. Не прячь чувство за бравадой.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT '6LACK', ARRAY['LONGING', 'COLD']::TEXT[], ARRAY['QUIET', 'EVEN']::TEXT[], ARRAY['TUNE', 'FLOW']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('6LACK'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'дистанция в отношениях', 'Покажи близость через чувство нехватки и отстранённость. Не нагромождай предметные детали.', 0),
  ('SOUND'::"TechniqueKind", 'сдержанный полунапев', 'Веди строку на стыке речитатива и мелодии. Не форсируй голос до крика.', 1),
  ('WORDPLAY'::"TechniqueKind", 'двойной смысл близости', 'Обыграй слово так, чтобы оно относилось и к расстоянию, и к чувствам. Не усложняй игру каламбуром ради каламбура.', 2),
  ('TONE'::"TechniqueKind", 'личное прямое обращение', 'Обратись к человеку прямо, оставив в словах уязвимость. Не превращай признание в пафосную речь.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Big Baby Tape', ARRAY['BRAVADO', 'COLD']::TEXT[], ARRAY['EVEN', 'LOUD']::TEXT[], ARRAY['FLOW', 'ADLIB']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('Big Baby Tape'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'улица и игра', 'Соедини уличную деталь с игровым образом. Не превращай строку в описание игрового сюжета.', 0),
  ('SOUND'::"TechniqueKind", 'трэповая голосовая пластика', 'Читай ритмично, меняя окраску голоса и добавляя короткие вставки. Не своди подачу к ровной декламации.', 1),
  ('WORDPLAY'::"TechniqueKind", 'двуязычный уличный сленг', 'Вплетай английский сленг в русскую строку так, чтобы он держал ритм. Не подменяй им смысл целиком.', 2)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Hugo Loud', ARRAY['COLD', 'ANXIETY']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['FLOW', 'ADLIB']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('Hugo Loud'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'память северного района', 'Соедини воспоминание о северном районе с нынешней городской жизнью. Не превращай его в открытку.', 0),
  ('SOUND'::"TechniqueKind", 'грув с выкриками', 'Веди строки ровным грувом и добавь короткие выкрики между ними. Не забивай ими каждую паузу.', 1),
  ('WORDPLAY'::"TechniqueKind", 'английский внутри фразы', 'Вплети английское слово в русскую строку и подстрой его под ритм. Не строй всю строку на случайном сленге.', 2),
  ('TONE'::"TechniqueKind", 'разговорный уличный рассказ', 'Расскажи о прошлом через бытовые детали и опасные моменты. Не превращай воспоминание в пафосную исповедь.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT '4n Way', ARRAY['LONGING']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['FLOW']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('4n Way'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'личная история', 'Покажи личный эпизод так, чтобы он был понятен и другим; не уходи в отвлечённые рассуждения.', 0),
  ('SOUND'::"TechniqueKind", 'ровная речевая подача', 'Держи естественный ритм строки; не форсируй крик.', 1),
  ('WORDPLAY'::"TechniqueKind", 'простые созвучия', 'Связывай строки ясными созвучиями; не перегружай их сложными каламбурами.', 2)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Bumble Beezy', ARRAY['BRAVADO', 'AGGRESSION']::TEXT[], ARRAY['LOUD']::TEXT[], ARRAY['FLOW', 'TONGUE_TWISTER', 'PUNCH']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('Bumble Beezy'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'бит как противник', 'Представь бит соперником, которого нужно одолеть. Не перегружай образ лишними деталями.', 0),
  ('SOUND'::"TechniqueKind", 'плотная скоростная читка', 'Уплотни слоги и веди строку быстрым флоу. Не жертвуй разборчивостью ради скорости.', 1),
  ('WORDPLAY'::"TechniqueKind", 'цепкие внутренние рифмы', 'Свяжи слова внутри строки созвучиями и рифмами. Не подбирай их в ущерб смыслу.', 2),
  ('TONE'::"TechniqueKind", 'провокационная уверенность', 'Добавь дерзкую подачу и ощутимое давление. Не заменяй остроту бессмысленной грубостью.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'MACAN', ARRAY['LONGING', 'BRAVADO', 'COLD']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['FLOW', 'TUNE']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('MACAN'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'улица и дорога', 'Помести переживание в городской или автомобильный пейзаж. Не перегружай строку случайными деталями.', 0),
  ('SOUND'::"TechniqueKind", 'читка с напевом', 'Чередуй ровную ритмичную читку с коротким напевом. Не превращай каждую строку в крик.', 1),
  ('WORDPLAY'::"TechniqueKind", 'дорожная метафора отношений', 'Свяжи движение по дороге с дистанцией между людьми. Не нагромождай несколько метафор в одной строке.', 2),
  ('TONE'::"TechniqueKind", 'сдержанная уязвимость', 'Скажи о нехватке или разрыве прямо, сохраняя внешнюю сдержанность. Не уходи в длинные объяснения.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'JEEMBO', ARRAY['COLD', 'AGGRESSION', 'BRAVADO']::TEXT[], ARRAY['EVEN', 'LOUD']::TEXT[], ARRAY['FLOW', 'PUNCH']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('JEEMBO'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'мрачная уличная сцена', 'Соедини уличный эпизод с тёмной оккультной деталью. Не превращай строку в пересказ хоррора.', 0),
  ('SOUND'::"TechniqueKind", 'давление в ритме', 'Веди строку уверенно и ритмично, выделяя ударные слова. Не заменяй напор сплошным криком.', 1),
  ('WORDPLAY'::"TechniqueKind", 'абсурдный панч', 'Построй панч на неожиданном или нелепом сопоставлении. Не объясняй шутку после удара.', 2),
  ('TONE'::"TechniqueKind", 'холодное превосходство', 'Говори с дистанцией и уверенностью, будто контролируешь ситуацию. Не оправдывайся перед слушателем.', 3)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'kizaru', ARRAY['BRAVADO', 'COLD']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['FLOW', 'PUNCH', 'ADLIB']::TEXT[], CURRENT_TIMESTAMP, u."id"
  FROM "Users" u
  WHERE u."role" = 'OWNER'
    AND NOT EXISTS (SELECT 1 FROM "Artist" a WHERE a."userId" = u."id" AND lower(a."name") = lower('kizaru'))
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'город и улица', 'Соедини городской пейзаж с деталью уличной жизни. Не превращай строку в подробное описание местности.', 0),
  ('SOUND'::"TechniqueKind", 'холодный флоу', 'Держи ровный, отстранённый ритм и добавь короткую звуковую вставку. Не забивай вставками каждую строку.', 1),
  ('WORDPLAY'::"TechniqueKind", 'неожиданное сравнение', 'Сравни манеру или состояние с конкретным предметом или веществом. Не объясняй сравнение после панча.', 2),
  ('TONE'::"TechniqueKind", 'спокойное превосходство', 'Говори уверенно и с дистанцией. Не переходи на крик ради убедительности.', 3)
) AS t(kind, label, instruction, position);
