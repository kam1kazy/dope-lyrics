-- CreateEnum
CREATE TYPE "TechniqueKind" AS ENUM ('IMAGE', 'SOUND', 'WORDPLAY', 'TONE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AiUsageKind" ADD VALUE 'ARTIST_CARD';
ALTER TYPE "AiUsageKind" ADD VALUE 'REFERENCE_TAGS';

-- CreateTable
CREATE TABLE "Artist" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "moods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "energies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deliveries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Artist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtistTechnique" (
    "id" SERIAL NOT NULL,
    "kind" "TechniqueKind" NOT NULL,
    "label" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "artistId" INTEGER NOT NULL,

    CONSTRAINT "ArtistTechnique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceText" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "note" TEXT,
    "mood" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "delivery" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "songRole" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "energy" TEXT,
    "taggedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "artistId" INTEGER NOT NULL,

    CONSTRAINT "ReferenceText_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Artist_userId_name_key" ON "Artist"("userId", "name");

-- CreateIndex
CREATE INDEX "ArtistTechnique_artistId_position_idx" ON "ArtistTechnique"("artistId", "position");

-- CreateIndex
CREATE INDEX "ReferenceText_artistId_createdAt_idx" ON "ReferenceText"("artistId", "createdAt");

-- AddForeignKey
ALTER TABLE "Artist" ADD CONSTRAINT "Artist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtistTechnique" ADD CONSTRAINT "ArtistTechnique_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceText" ADD CONSTRAINT "ReferenceText_artistId_fkey" FOREIGN KEY ("artistId") REFERENCES "Artist"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Стартовые карточки артистов (бывшие ARTIST_PROFILES) — владельцам каталога.

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Future', ARRAY['LONGING', 'COLD']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['TUNE']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('TONE'::"TechniqueKind", 'онемение и токсичная тяга', 'Назови тягу или пустоту коротко, без истории, как к ней пришли. Не геройствуй и не объясняй чувство.', 0),
  ('SOUND'::"TechniqueKind", 'автотюн как чувство', 'Сделай строку спетой: растяни гласную или повтори слог, чтобы голос нёс эмоцию. Не пиши, что герой поёт.', 1),
  ('SOUND'::"TechniqueKind", 'короткий повтор вместо сюжета', 'Повтори одно короткое слово или обрывок вместо развития сюжета. Не дописывай, что было дальше.', 2),
  ('TONE'::"TechniqueKind", 'хвастовство рядом с пустотой', 'В одной строке поставь хвастовство рядом с пустотой или потерей. Не оставляй только одну сторону.', 3),
  ('IMAGE'::"TechniqueKind", 'параноидальная роскошь', 'Дорогая деталь звучит как угроза или слежка, не как реклама успеха.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Don Toliver', ARRAY['TENDERNESS', 'EUPHORIA']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['TUNE']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('SOUND'::"TechniqueKind", 'строка почти поётся', 'Сформулируй так, чтобы строку можно было пропеть, с открытой гласной. Не руби её панчем.', 0),
  ('IMAGE'::"TechniqueKind", 'любовь как трип', 'Любовь покажи как сдвиг восприятия: цвет, скорость, тело. Не бытовая ссора и не список признаний.', 1),
  ('IMAGE'::"TechniqueKind", 'мало быта и много цвета', 'Замени бытовой предмет цветом, светом или тканью. Не объясняй, что этот цвет значит.', 2),
  ('IMAGE'::"TechniqueKind", 'ночная психоделия', 'Ночная сцена теряет прямую логику: предмет ведёт себя странно. Не превращай это в страшилку.', 3),
  ('TONE'::"TechniqueKind", 'меланхолия после вечеринки', 'После подъёма оставь тихий спад. Не ставь мораль, что вечеринка плоха.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Travis Scott', ARRAY['COLD', 'BRAVADO']::TEXT[], ARRAY['LOUD']::TEXT[], ARRAY['ADLIB', 'TUNE']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'атмосфера важнее рассказа', 'Дай место, свет и гул, не событие. Действие, если есть, не объясняет сцену.', 0),
  ('SOUND'::"TechniqueKind", 'адлибы как ритм', 'Короткий выкрик или слог работает как удар ритма, не как осмысленная фраза. Не переводи его.', 1),
  ('IMAGE'::"TechniqueKind", 'роскошь как кошмар', 'Дорогая вещь выглядит опасно или больно. Не хвастайся ею в лоб.', 2),
  ('IMAGE'::"TechniqueKind", 'тёмный карнавал', 'Яркая праздничная картинка с холодной изнанкой в той же строке. Не объясняй контраст.', 3),
  ('IMAGE'::"TechniqueKind", 'кинематографичный холод', 'Строка как кадр: кто где стоит, без внутреннего монолога. Эмоция читается из картинки.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Linkin Park', ARRAY['ANXIETY', 'AGGRESSION']::TEXT[], ARRAY['WHISPER', 'SCREAM']::TEXT[], ARRAY['HOOK', 'SPOKEN']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('SOUND'::"TechniqueKind", 'шёпот и крик в одной песне', 'В соседних строках тихий голос и срыв. Не держи одну громкость на весь куплет.', 0),
  ('TONE'::"TechniqueKind", 'чистое отчуждение', 'Скажи об отчуждении простыми словами. Не подменяй его метафорой ради метафоры.', 1),
  ('TONE'::"TechniqueKind", 'внутренняя война', 'Два голоса одного человека спорят в соседних строках. Не своди спор к одному выводу.', 2),
  ('TONE'::"TechniqueKind", 'тесная злость', 'Злость короткая и сжатая. Не произноси речь, почему герой ненавидит.', 3),
  ('TONE'::"TechniqueKind", 'хук проще куплета', 'Хук — одна фраза, короче и прямее куплета. Не тащи в него плотность куплета.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Slipknot', ARRAY['AGGRESSION']::TEXT[], ARRAY['SCREAM']::TEXT[], ARRAY['PUNCH']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('TONE'::"TechniqueKind", 'ярость как разрядка', 'Строка выпускает давление резким глаголом или криком. Не анализируй, почему больно.', 0),
  ('TONE'::"TechniqueKind", 'общая боль вместо одинокого героя', 'Боль сказана как «мы», не как исключительность одного героя.', 1),
  ('SOUND'::"TechniqueKind", 'удар важнее красивой рифмы', 'Выбери удар и согласные, даже если рифма грубая. Не выглаживай строку ради красивой пары.', 2),
  ('IMAGE'::"TechniqueKind", 'клаустрофобия и грязь', 'Тесное место, грязь, нехватка воздуха. Не открывай пространство и не утешай.', 3),
  ('IMAGE'::"TechniqueKind", 'холодный хоррор', 'Страх через холодную деталь, без крика о помощи и без монстра «вообще».', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Kanye West', ARRAY['BRAVADO', 'IRONY', 'TENDERNESS']::TEXT[], ARRAY['LOUD']::TEXT[], ARRAY['PUNCH']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('TONE'::"TechniqueKind", 'статус и стыд в одной строке', 'В одной строке статус и стыд за него. Не оправдывайся.', 0),
  ('WORDPLAY'::"TechniqueKind", 'короткая фраза сильнее аргумента', 'Одна короткая фраза вместо объяснения. Не доказывай мысль следующей строкой.', 1),
  ('TONE'::"TechniqueKind", 'уязвимость без извинения', 'Прямое слабое признание, без «но я всё равно» и без извинения.', 2),
  ('IMAGE'::"TechniqueKind", 'барокко вины и величия', 'Вину или величие дай избыточной картинкой, не лекцией.', 3),
  ('WORDPLAY'::"TechniqueKind", 'самоирония', 'В конце строки сам поддень свой пафос. Не объясняй шутку.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Che Ecru', ARRAY['TENDERNESS', 'LONGING']::TEXT[], ARRAY['WHISPER']::TEXT[], ARRAY['TUNE']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'тихая интимность', 'Тихая близость: дыхание, расстояние, шёпот. Не признание на всю комнату.', 0),
  ('SOUND'::"TechniqueKind", 'мелодия важнее панча', 'Строка льётся, без остроумной точки в конце. Не ставь панч.', 1),
  ('SOUND'::"TechniqueKind", 'странный ритм', 'Сломай ожидаемый размер лишним слогом или паузой. Не выравнивай в ровный рэп.', 2),
  ('IMAGE'::"TechniqueKind", 'поздняя ночь и воздух', 'Поздняя ночь через воздух, окно, тишину. Не сообщай, который час.', 3),
  ('IMAGE'::"TechniqueKind", 'сырой холод', 'Холод сырой и незакрытый, без красивого эпитета. Не согревай концовку.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Oxxxymiron', ARRAY['IRONY', 'AGGRESSION']::TEXT[], ARRAY['LOUD']::TEXT[], ARRAY['TONGUE_TWISTER', 'FLOW']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('SOUND'::"TechniqueKind", 'плотная внутренняя рифма', 'Созвучия внутри строки, не только в конце. Смысл не подменяй списком рифм.', 0),
  ('WORDPLAY'::"TechniqueKind", 'ирония не отменяет злости', 'Ирония не снимает злость. Не превращай удар в дружескую шутку.', 1),
  ('WORDPLAY'::"TechniqueKind", 'книжная отсылка как удар', 'Одна книжная или историческая отсылка бьёт как панч. Не лекция и не сноска.', 2),
  ('SOUND'::"TechniqueKind", 'сложная строка остаётся музыкальной', 'Сложная фраза всё равно произносится в такт. Если не произносится, упрости звук, не мысль.', 3),
  ('IMAGE'::"TechniqueKind", 'антиутопия рядом с нежностью', 'Жёсткая картина и тихая нежность стоят рядом. Не объясняй контраст.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Скриптонит', ARRAY['COLD']::TEXT[], ARRAY['QUIET']::TEXT[], ARRAY['SPOKEN', 'HOOK']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('TONE'::"TechniqueKind", 'холод и короткая фраза', 'Короткая фраза ровным тоном, без украшения. Одно предложение и точка.', 0),
  ('TONE'::"TechniqueKind", 'быт без морали', 'Бытовая деталь без вывода «и поэтому». Не оценивай героя.', 1),
  ('TONE'::"TechniqueKind", 'полупетый хук', 'Хук проще куплета и чуть поётся. Не нагружай его образами куплета.', 2),
  ('TONE'::"TechniqueKind", 'отстранённая ночь', 'Ночь со стороны, как будто говорящему всё равно. Не исповедь.', 3),
  ('TONE'::"TechniqueKind", 'мало жеста', 'Одно действие вместо жеста и позы. Второе движение убери.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'OG Buda', ARRAY['BRAVADO', 'LONGING']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['TUNE', 'HOOK']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('SOUND'::"TechniqueKind", 'мелодичный сленг', 'Уличный сленг так, чтобы его можно было пропеть. Не заменяй его литературным словом.', 0),
  ('TONE'::"TechniqueKind", 'флекс и одиночество вместе', 'Хвастовство и одиночество в соседних словах. Не оставляй только успех.', 1),
  ('TONE'::"TechniqueKind", 'простой разговорный хук', 'Хук — короткая разговорная фраза, как сообщение. Без поэтического образа.', 2),
  ('IMAGE'::"TechniqueKind", 'ночной город', 'Ночной город одной деталью: свет, двор, машина. Не панорама.', 3),
  ('TONE'::"TechniqueKind", 'пустота после вечеринки', 'После тусовки остаётся пустота, не анекдот. Не осуждай вечеринку.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'MAYOT', ARRAY['TENDERNESS', 'LONGING']::TEXT[], ARRAY['QUIET']::TEXT[], ARRAY['TUNE']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('TONE'::"TechniqueKind", 'признание без позы', 'Признание прямым языком, без позы «я такой». Не геройствуй.', 0),
  ('SOUND'::"TechniqueKind", 'растянутая гласная', 'Растяни гласную в ключевом слове, чтобы строка спелась. Не пиши, что голос дрожит.', 1),
  ('TONE'::"TechniqueKind", 'любовь переходит в онемение', 'Любовь в строке остывает до онемения. Не держи только нежность или только холод.', 2),
  ('IMAGE'::"TechniqueKind", 'мягкая ночь', 'Ночь мягкая, без угрозы и без тусовки. Тихий свет, не неон.', 3),
  ('WORDPLAY'::"TechniqueKind", 'живость важнее грамматики', 'Живая разговорная форма важнее правильной. Не выправляй строку в литературный русский.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Kidd', ARRAY['TENDERNESS', 'LONGING']::TEXT[], ARRAY['QUIET']::TEXT[], ARRAY['HOOK', 'TUNE']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('TONE'::"TechniqueKind", 'хук важнее куплета', 'Хук прямее и памятнее куплета. Куплет не обязан быть таким же простым.', 0),
  ('SOUND'::"TechniqueKind", 'мелодия ближе к пению', 'Фраза ближе к пению, чем к скороговорке: открытые гласные, без панча.', 1),
  ('TONE'::"TechniqueKind", 'любовь и сомнение прямо', 'Любовь и сомнение сказаны прямо, в одной строке или в соседних. Не прячь сомнение в метафору.', 2),
  ('TONE'::"TechniqueKind", 'камерность', 'Камерная сцена: двое, комната, тихий звук. Не клуб и не толпа.', 3),
  ('TONE'::"TechniqueKind", 'без тусовочного понта', 'Убери хвастовство тусовкой. Оставь чувство, не статус.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'STED.D', ARRAY['ANXIETY', 'COLD']::TEXT[], ARRAY['LOUD']::TEXT[], ARRAY['SPOKEN']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'неразжёванная метафора', 'Метафора сырая. Не добавляй строку, которая её расшифровывает.', 0),
  ('TONE'::"TechniqueKind", 'злость без красивой грусти', 'Злость без красивой грусти и без слёзной рифмы.', 1),
  ('TONE'::"TechniqueKind", 'депрессия как факт', 'Тяжёлое состояние коротко, как факт. Не драма и не просьба о помощи.', 2),
  ('IMAGE'::"TechniqueKind", 'боль из жизни', 'Конкретная жизненная деталь вместо абстрактной боли. Не обобщай до «мир жесток».', 3),
  ('TONE'::"TechniqueKind", 'мрак без выхода', 'Не ставь в конец свет, урок или выход. Мрак остаётся.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'ATL', ARRAY['IRONY', 'COLD']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['HOOK']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('WORDPLAY'::"TechniqueKind", 'ирония вместо исповеди', 'Серьёзное сказано с иронией, не как исповедь. Не объясняй, что это шутка.', 0),
  ('TONE'::"TechniqueKind", 'короткий хук', 'Хук — одна короткая фраза. Не вторая строфа.', 1),
  ('TONE'::"TechniqueKind", 'скука и ночь в одной интонации', 'Скука и ночь одним ровным тоном, без надрыва. Не «мне так плохо».', 2),
  ('TONE'::"TechniqueKind", 'холодная отстранённость', 'Говорящий в стороне от события. Не пиши «я чувствую».', 3),
  ('TONE'::"TechniqueKind", 'без нравоучения', 'Убери нравоучение и вывод. Оставь наблюдение.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Markul', ARRAY['LONGING', 'TENDERNESS']::TEXT[], ARRAY['QUIET']::TEXT[], ARRAY['SPOKEN']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('WORDPLAY'::"TechniqueKind", 'книжный образ в уличной речи', 'Книжный образ произнеси уличной фразой. Не держи высокий слог на всю строку.', 0),
  ('TONE'::"TechniqueKind", 'меланхолия без слёз', 'Грусть без плача, слёз и слова «тоскую». Сухо.', 1),
  ('IMAGE'::"TechniqueKind", 'готика рядом с нежностью', 'Мрачная картинка и тихая нежность в одной строке. Не оставляй только хоррор.', 2),
  ('IMAGE'::"TechniqueKind", 'дождь и усталость большого города', 'Дождь и усталость города одной деталью. Не открытка «ночные огни».', 3),
  ('IMAGE'::"TechniqueKind", 'бессонница в дороге', 'Бессонница в движении: дорога, окно, не кровать. Не жалоба «не сплю».', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Pharaoh', ARRAY['COLD', 'BRAVADO']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['ADLIB', 'TUNE']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('SOUND'::"TechniqueKind", 'обрывок и адлиб как стиль', 'Оборви фразу или оставь короткий адлиб. Не дописывай мысль до конца.', 0),
  ('IMAGE'::"TechniqueKind", 'красивый небытовой мрак', 'Красивый мрак без быта: не кухня и не расписание. Не объясняй символ.', 1),
  ('SOUND'::"TechniqueKind", 'ночной трилл', 'Ночная строка держится на украшении голоса, не на сюжете. Коротко.', 2),
  ('TONE'::"TechniqueKind", 'усталость от успеха сказанная тихо', 'Усталость от успеха сказана тихо. Без лекции о славе.', 3),
  ('TONE'::"TechniqueKind", 'светлая грусть', 'Светлая грусть: красиво и печально, без надрыва и без злости.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Платина', ARRAY['BRAVADO', 'LONGING']::TEXT[], ARRAY['LOUD']::TEXT[], ARRAY['ADLIB', 'PUNCH']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('SOUND'::"TechniqueKind", 'адлиб и сленг как удар', 'Сленг или короткий адлиб бьёт сильнее объяснения. Не переводи его на нейтральный язык.', 0),
  ('WORDPLAY'::"TechniqueKind", 'безумный панч важнее логики', 'Панч может быть нелогичным, если он злой или смешной. Не выглаживай его в правильную мысль.', 1),
  ('TONE'::"TechniqueKind", 'хвастовство с тоской', 'Хвастовство сразу рядом с тоской. Не оставляй только флекс.', 2),
  ('TONE'::"TechniqueKind", 'грязный флекс', 'Грязное хвастовство без извинения и без морали.', 3),
  ('SOUND'::"TechniqueKind", 'мягкий мелодичный трэп', 'Рядом с жёсткой строкой дай мягкую, которую можно пропеть. Не держи одну злость.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Rocket', ARRAY['BRAVADO']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['FLOW']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('SOUND'::"TechniqueKind", 'вальяжный флоу', 'Фраза неспешная, с воздухом. Не скороговорка и не крик.', 0),
  ('TONE'::"TechniqueKind", 'флекс молодости без злости', 'Хвастовство молодости без злости на других. Не унижение.', 1),
  ('SOUND'::"TechniqueKind", 'чужое слово как фактура', 'Чужое слово оставь как звук и фактуру. Не переводи и не поясняй.', 2),
  ('IMAGE'::"TechniqueKind", 'дым и неспешность', 'Дым и медленный жест. Не ускоряй сюжет.', 3),
  ('TONE'::"TechniqueKind", 'минималистичный хайп', 'Короткий хайп одной фразой. Не расписывай успех.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Boulevard Depo', ARRAY['COLD', 'IRONY']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['FLOW']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('WORDPLAY'::"TechniqueKind", 'редкое слово', 'Поставь редкое или странное слово вместо обычного. Не объясняй его.', 0),
  ('WORDPLAY'::"TechniqueKind", 'обрывок языка', 'Оборви синтаксис: кусок фразы, не полное предложение.', 1),
  ('IMAGE'::"TechniqueKind", 'мода и распад в одном кадре', 'Модная деталь и распад в одном кадре. Не глянец без трещины.', 2),
  ('WORDPLAY'::"TechniqueKind", 'нарочно кривая красота', 'Красота нарочно кривая: странное слово или сломанный образ. Не выправляй.', 3),
  ('IMAGE'::"TechniqueKind", 'опиумная ночь', 'Ночь мутная и замедленная, без ясного сюжета. Не триллер.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Loqiemean', ARRAY['COLD', 'AGGRESSION']::TEXT[], ARRAY['LOUD']::TEXT[], ARRAY['SPOKEN']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('WORDPLAY'::"TechniqueKind", 'сложная и мрачная поэзия', 'Сопоставь два образа, которые обычно не стоят рядом. Связь не растолковывай.', 0),
  ('TONE'::"TechniqueKind", 'экзистенциальная рефлексия', 'Вопрос о пустоте, смерти или выборе задай внутри строки. Без философского абзаца.', 1),
  ('IMAGE'::"TechniqueKind", 'жесткая социальная критика', 'Бей по порядку вещей конкретной сценой, не лозунгом и не статьёй.', 2),
  ('IMAGE'::"TechniqueKind", 'насыщенные мифологические образы', 'Мифологический образ работает как факт сцены, не как справка, откуда он.', 3),
  ('WORDPLAY'::"TechniqueKind", 'контрастная лексика от высокого слога до сленга', 'Контраст высокого литературного образа с грубой разговорной или уличной лексикой. Не объяснять контраст, а создавать его внутри строки.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Сидоджи Дубоshit', ARRAY['AGGRESSION']::TEXT[], ARRAY['SCREAM']::TEXT[], ARRAY['PUNCH', 'FLOW']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('WORDPLAY'::"TechniqueKind", 'грязный панч', 'Грязный панч без извинения и без красивого послесловия.', 0),
  ('SOUND'::"TechniqueKind", 'хирургический флоу', 'Плотная точная фраза: каждое слово на месте. Не поток ради потока.', 1),
  ('TONE'::"TechniqueKind", 'агрессия как ремесло', 'Злость собранная, ровным напором. Не истерика.', 2),
  ('TONE'::"TechniqueKind", 'токсичный напор', 'Давление: обвинение или презрение без оправдания.', 3),
  ('WORDPLAY'::"TechniqueKind", 'короткий ультражёсткий удар', 'Одна ультракороткая жёсткая строка. Не развивай её.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Scarlxrd', ARRAY['AGGRESSION']::TEXT[], ARRAY['SCREAM']::TEXT[], ARRAY['PUNCH']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('TONE'::"TechniqueKind", 'крик вместо метафоры', 'Прямой крик или резкий глагол вместо метафоры. Не «боль как».', 0),
  ('SOUND'::"TechniqueKind", 'шум как смысл', 'Повтор, шум, обрывок важнее сюжета. Не выстраивай историю.', 1),
  ('TONE'::"TechniqueKind", 'короткая ярость без истории', 'Ярость в нескольких словах, без предыстории.', 2),
  ('IMAGE'::"TechniqueKind", 'индастриал и металл', 'Железо, станок, скрежет как место. Не природа и не романтика.', 3),
  ('IMAGE'::"TechniqueKind", 'клаустрофобия', 'Стены близко. Выхода в строке нет.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Trippie Redd', ARRAY['TENDERNESS', 'AGGRESSION']::TEXT[], ARRAY['LOUD']::TEXT[], ARRAY['TUNE']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('SOUND'::"TechniqueKind", 'мелодия на грани крика', 'Мелодия на грани срыва: красиво, но вот-вот закричит. Не ровный припев.', 0),
  ('TONE'::"TechniqueKind", 'любовь и ярость в одном куплете', 'Любовь и ярость в одном куплете, без перехода «потом я успокоился».', 1),
  ('SOUND'::"TechniqueKind", 'рок внутри рэпа', 'Рваная, почти роковая эмоция внутри рэп-строки. Не ровный каданс.', 2),
  ('TONE'::"TechniqueKind", 'неоновая эмоция', 'Чувство названо ярко и сразу. Не полутон и не подводка.', 3),
  ('TONE'::"TechniqueKind", 'меньше схемы', 'Убери схему «тезис, пример, вывод». Оставь вспышку.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'XXXTentacion', ARRAY['TENDERNESS', 'AGGRESSION']::TEXT[], ARRAY['SCREAM']::TEXT[], ARRAY['TUNE']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('TONE'::"TechniqueKind", 'чувство сразу и коротко', 'Чувство в первых словах, коротко. Без подводки.', 0),
  ('TONE'::"TechniqueKind", 'нежность и ярость без перехода', 'Нежность и ярость стыкуются без мостика. Переход не сглаживай.', 1),
  ('SOUND'::"TechniqueKind", 'голая мелодия', 'Голая певческая фраза почти без образов. Прямые слова.', 2),
  ('TONE'::"TechniqueKind", 'тихая грусть', 'Тихая грусть, без крика и без морали.', 3),
  ('TONE'::"TechniqueKind", 'хаос и обрывки', 'Обрывки, не абзац. Мысль можно не закончить.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Juice WRLD', ARRAY['LONGING', 'ANXIETY']::TEXT[], ARRAY['EVEN']::TEXT[], ARRAY['TUNE', 'HOOK']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('TONE'::"TechniqueKind", 'боль поётся', 'Боль сформулируй так, чтобы её пели. Не отчёт.', 0),
  ('WORDPLAY'::"TechniqueKind", 'зависимость и любовь одними словами', 'Зависимость и любовь названы одними и теми же словами. Не поясняй, где что.', 1),
  ('TONE'::"TechniqueKind", 'хук-исповедь', 'Хук — одно прямое признание, которое хочется повторить.', 2),
  ('TONE'::"TechniqueKind", 'подростковая катастрофа', 'Ставка максимальная, даже если повод маленький. Не ирония взрослого.', 3),
  ('SOUND'::"TechniqueKind", 'мелодия впереди текста', 'Если выбор между точной мыслью и поющейся фразой, оставь поющуюся. Не перегружай смыслом.', 4)
) AS t(kind, label, instruction, position);

WITH artist AS (
  INSERT INTO "Artist" ("name", "moods", "energies", "deliveries", "updatedAt", "userId")
  SELECT 'Мэйти', ARRAY['TENDERNESS', 'LONGING']::TEXT[], ARRAY['QUIET']::TEXT[], ARRAY['SPOKEN']::TEXT[], CURRENT_TIMESTAMP, "id"
  FROM "Users" WHERE "role" = 'OWNER'
  RETURNING "id"
)
INSERT INTO "ArtistTechnique" ("kind", "label", "instruction", "position", "artistId")
SELECT t.kind, t.label, t.instruction, t.position, artist."id"
FROM artist CROSS JOIN (VALUES
  ('IMAGE'::"TechniqueKind", 'образ как короткий рассказ', 'Один образ за две строки рассказывает случай. Не эссе.', 0),
  ('IMAGE'::"TechniqueKind", 'нежность рядом с гнилью', 'Нежность и гниль в одном кадре. Не оставляй только красивое.', 1),
  ('IMAGE'::"TechniqueKind", 'сон и болезнь', 'Сон, жар или болезнь как место действия. Не диагноз и не метафора «общество болеет».', 2),
  ('IMAGE'::"TechniqueKind", 'одиночество', 'Одиночество конкретной сценой. Не словом «одинок» и не жалобой.', 3),
  ('IMAGE'::"TechniqueKind", 'сказка которая гниёт', 'Сказочный образ портится внутри строки. Не добрая мораль сказки.', 4)
) AS t(kind, label, instruction, position);
