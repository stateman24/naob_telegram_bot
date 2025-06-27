
import { Telegraf, Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.BOT_ACCESS_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map((id) => parseInt(id.trim(), 10))
  .filter((id) => !isNaN(id));
let currentReplyTarget: number | null = null;

if (!BOT_TOKEN) {
  throw new Error('Bot token is required!');
}
if (!ADMIN_IDS || ADMIN_IDS.length === 0) {
  throw new Error('Admin ID is required!');
}

const bot = new Telegraf(BOT_TOKEN);

bot.on(message("text"), async (ctx: Context) => {
  const fromId = ctx.from?.id;
  const chat = ctx.message?.chat;
  const chatUsername = chat && chat.type === 'private' ? (chat as { username?: string }).username : undefined;
 
  let text: string | undefined;

  if (ctx.message && 'text' in ctx.message) {
    text = (ctx.message as { text: string }).text;
  }

  if (!fromId || !text) return;

  // If admin is replying to a user
  if (ADMIN_IDS.includes(fromId) && currentReplyTarget) {
    await ctx.telegram.sendMessage(currentReplyTarget, `👤 NAOBS_ADMIN: ${text}`);
    await ctx.reply(`✅ Message sent to ${currentReplyTarget}.`);
    currentReplyTarget = null; // Reset after reply
    return;
  }
  // Forward message to admin if it's not from the admin
  if (!ADMIN_IDS.includes(fromId)) {
    const forwardedMsg = `📩 Message from user ${fromId}:\n\n${text}`;
    console.log(
    `Received message from ${fromId}:`,
    chatUsername,
    'text' in (ctx.message ?? {}) ? (ctx.message as { text: string }).text : undefined
  );

    await ctx.telegram.sendMessage(ADMIN_IDS[1], forwardedMsg)
    await ctx.telegram.sendMessage(ADMIN_IDS[0], forwardedMsg, {
      reply_markup: Markup.inlineKeyboard([
        [Markup.button.callback('Reply to this user', `reply:${fromId}`)]
      ]).reply_markup
    });
  }
});

bot.on('callback_query', async (ctx) => {
  if (
    ctx.callbackQuery &&
    'data' in ctx.callbackQuery &&
    typeof ctx.callbackQuery.data === 'string'
  ) {
    const data = ctx.callbackQuery.data;

    // Only allow admins to use this
    if (!ADMIN_IDS.includes(ctx.from?.id ?? 0)) {
      await ctx.answerCbQuery('You are not authorized to perform this action.');
      return;
    }

    if (data.startsWith('reply:')) {
      const targetId = parseInt(data.split(':')[1], 10);
      currentReplyTarget = targetId;

      await ctx.answerCbQuery('Reply mode enabled');
      await ctx.reply(`✉️ Type your reply — it will be sent to user ${targetId}`);
    }
  }
});

bot.on(message("photo"), async (ctx: Context) => {
  const fromId = ctx.from?.id;
  const chat = ctx.message?.chat;
  const chatUsername = chat && chat.type === 'private' ? (chat as { username?: string }).username : undefined;

  if (!fromId) return;

  // Admins reply with an image 
  if( ADMIN_IDS.includes(fromId) && currentReplyTarget) {
    // Type guard to ensure ctx.message has 'photo'
    if ('photo' in (ctx.message ?? {})) {
      const photoArray = (ctx.message as { photo: { file_id: string }[] }).photo;
      await ctx.telegram.sendPhoto(currentReplyTarget, photoArray[0].file_id, {
        caption: `👤 NAOBS_ADMIN replied with a photo:`
      });
      await ctx.reply(`✅ Photo sent to user ${currentReplyTarget}.`);
      currentReplyTarget = null; // Reset after reply
    } else {
      await ctx.reply('❌ Please send a photo to reply.');
    }
    return;
  }

  // Forward photo to admin
  if (!ADMIN_IDS.includes(fromId)) {
    const forwardedMsg = `📷 Photo from user ${fromId}:`;
    console.log(`Received photo from ${fromId}:`, chatUsername);

    // Type guard to ensure ctx.message has 'photo'
    if ('photo' in (ctx.message ?? {})) {
      const photoArray = (ctx.message as { photo: { file_id: string }[] }).photo;
      await ctx.telegram.sendPhoto(ADMIN_IDS[1], photoArray[0].file_id, { caption: forwardedMsg });
      await ctx.telegram.sendPhoto(ADMIN_IDS[0], photoArray[0].file_id, {
        caption: forwardedMsg,
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('Reply to this user', `reply:${fromId}`)]
        ]).reply_markup
      });
    }
  }
});

bot.launch().then(() => {
  console.log('🚀 Bot is running...');
});
