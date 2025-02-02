import dayjs from 'dayjs';
import type { CacheType, CommandInteraction, User } from 'discord.js';
import { gpt } from '../../chatgpt.js';
import { prisma } from '../../prisma.js';
import { chunkedSend } from '../messages/chunkedSend.js';

export const askChatGPT = async ({
  interaction,
  user,
  text,
}: {
  interaction?: CommandInteraction<CacheType>;
  user: User;
  text: string;
}) => {
  const memberGuild = await prisma.memberGuild.findFirst({
    where: { memberId: user.id },
  });

  if (!memberGuild) return null;

  const content = [
    `**<@${user.id}> ${user.username}'s Question:**`,
    `\n**_${text}_**\n`,
  ];

  const olderThen30Min = dayjs(memberGuild.gptDate).isBefore(
    dayjs().subtract(30, 'minute')
  );

  let counter = 0;

  const res = await gpt.sendMessage(text as string, {
    parentMessageId: (!olderThen30Min && memberGuild.gptId) || undefined,
    systemMessage: `You are coding.global AI, a large language model trained by coding.global. You answer as concisely as possible for each response If its programming related you add specifc code tag to the snippet. If you have links add <> tags around them. Current date: ${new Date().toISOString()}\n\n`,
    onProgress: async (partialResponse) => {
      counter++;
      const text = [...content, partialResponse.text].join('\n');
      if (counter % 20 === 0 && text.length < 2000 && interaction) {
        await chunkedSend({
          content: text,
          interaction,
        });
      }
    },
  });

  // save gptId
  await prisma.memberGuild.update({
    where: { id: memberGuild.id },
    data: { gptId: res.id, gptDate: new Date() },
  });

  const fullContent = [...content, res.text].join('\n');

  return fullContent;
};
