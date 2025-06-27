"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
require("dotenv/config");
// ✅ Replace with your bot token from @BotFather
const BOT_TOKEN = process.env.BOT_TOKEN || '';
const ADMIN_ID = 123456789; // Replace with your Telegram ID
if (!BOT_TOKEN) {
    throw new Error('Bot token is required!');
}
const bot = new telegraf_1.Telegraf(BOT_TOKEN);
bot.on('message', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const fromId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    console.log('Received message from:', fromId);
    let text;
    if ('text' in ctx.message) {
        text = ctx.message.text;
    }
    if (!fromId || !text)
        return;
    // Admin reply format: reply:<userId>:<message>
    if (fromId === ADMIN_ID && text.startsWith('reply:')) {
        const parts = text.split(':');
        if (parts.length < 3) {
            yield ctx.reply('❌ Invalid format. Use: reply:<userId>:<message>');
            return;
        }
        const targetUserId = parseInt(parts[1], 10);
        const messageToSend = parts.slice(2).join(':').trim();
        try {
            yield ctx.telegram.sendMessage(targetUserId, `👤 Admin: ${messageToSend}`);
            yield ctx.reply('✅ Reply sent.');
        }
        catch (error) {
            yield ctx.reply('❌ Failed to send message to user.');
        }
    }
    else if (fromId !== ADMIN_ID) {
        // Incoming message from user → forward to admin
        const userMessage = `📩 Message from ${fromId}:\n${text}`;
        yield ctx.telegram.sendMessage(ADMIN_ID, userMessage);
        yield ctx.reply('✅ Your message has been sent anonymously.');
    }
}));
bot.launch().then(() => {
    console.log('🚀 Bot is running...');
});
