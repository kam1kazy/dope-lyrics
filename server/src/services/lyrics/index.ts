export async function getLyrics(limit: number, offset: number, prisma: any) {
    try {
        const lyrics = await prisma.lyrics.findMany({
        take: limit,
        skip: offset,
        orderBy: { date: 'desc' },
        include: {
            message: {
            include: {
                hashtags: true,
                reactions: { include: { emojis: true } },
            },
            },
        },
        });

        return lyrics.map((lyric: any) => ({
        id: lyric.id.toString(),
        lyricId: lyric.lyricId.toString(),
        date: lyric.date.toISOString(),
        editDate: lyric.editDate?.toISOString(),
        isPinned: lyric.isPinned,
        isChannelPost: lyric.isChannelPost,
        replyToMessage: lyric.replyToMessage,
        userId: lyric.userId.toString(),
        createdAt: lyric.date.toISOString(),
        updatedAt: lyric.date.toISOString(),
        message: lyric.message ? {
            id: lyric.message.id.toString(),
            text: lyric.message.text,
            word_count: lyric.message.word_count,
            hashtags: lyric.message.hashtags ? {
            id: lyric.message.hashtags.id.toString(),
            count: lyric.message.hashtags.count,
            tags: lyric.message.hashtags.tags,
            } : null,
            reactions: lyric.message.reactions ? {
            id: lyric.message.reactions.id.toString(),
            totalCount: lyric.message.reactions.totalCount,
            emojis: lyric.message.reactions.emojis.map((emoji: any) => ({
                id: emoji.id.toString(),
                emoji: emoji.emoji,
                count: emoji.count,
                order: emoji.order,
            })),
            } : null,
        } : null,
        }));
    } catch (error) {
        console.error('Ошибка получения текстов:', error);
        throw new Error('Не удалось получить тексты');
    }
}