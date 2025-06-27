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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
const filters_1 = require("telegraf/filters");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const BOT_TOKEN = process.env.BOT_ACCESS_TOKEN;
const ADMIN_IDS = (process.env.ADMIN_IDS || "")
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id));
let currentReplyTarget = null;
if (!BOT_TOKEN) {
    throw new Error('Bot token is required!');
}
if (!ADMIN_IDS || ADMIN_IDS.length === 0) {
    throw new Error('Admin ID is required!');
}
const bot = new telegraf_1.Telegraf(BOT_TOKEN);
bot.on((0, filters_1.message)("text"), (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const fromId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    const chat = (_b = ctx.message) === null || _b === void 0 ? void 0 : _b.chat;
    const chatUsername = chat && chat.type === 'private' ? chat.username : undefined;
    let text;
    if (ctx.message && 'text' in ctx.message) {
        text = ctx.message.text;
    }
    if (!fromId || !text)
        return;
    // If admin is replying to a user
    if (ADMIN_IDS.includes(fromId) && currentReplyTarget) {
        yield ctx.telegram.sendMessage(currentReplyTarget, `👤 NAOBS_ADMIN: ${text}`);
        yield ctx.reply(`✅ Message sent to ${currentReplyTarget}.`);
        currentReplyTarget = null; // Reset after reply
        return;
    }
    // Forward message to admin if it's not from the admin
    if (!ADMIN_IDS.includes(fromId)) {
        const forwardedMsg = `📩 Message from user ${fromId}:\n\n${text}`;
        console.log(`Received message from ${fromId}:`, chatUsername, 'text' in ((_c = ctx.message) !== null && _c !== void 0 ? _c : {}) ? ctx.message.text : undefined);
        yield ctx.telegram.sendMessage(ADMIN_IDS[1], forwardedMsg);
        yield ctx.telegram.sendMessage(ADMIN_IDS[0], forwardedMsg, {
            reply_markup: telegraf_1.Markup.inlineKeyboard([
                [telegraf_1.Markup.button.callback('Reply to this user', `reply:${fromId}`)]
            ]).reply_markup
        });
    }
}));
bot.on('callback_query', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (ctx.callbackQuery &&
        'data' in ctx.callbackQuery &&
        typeof ctx.callbackQuery.data === 'string') {
        const data = ctx.callbackQuery.data;
        // Only allow admins to use this
        if (!ADMIN_IDS.includes((_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : 0)) {
            yield ctx.answerCbQuery('You are not authorized to perform this action.');
            return;
        }
        if (data.startsWith('reply:')) {
            const targetId = parseInt(data.split(':')[1], 10);
            currentReplyTarget = targetId;
            yield ctx.answerCbQuery('Reply mode enabled');
            yield ctx.reply(`✉️ Type your reply — it will be sent to user ${targetId}`);
        }
    }
}));
bot.on((0, filters_1.message)("photo"), (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const fromId = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.id;
    const chat = (_b = ctx.message) === null || _b === void 0 ? void 0 : _b.chat;
    const chatUsername = chat && chat.type === 'private' ? chat.username : undefined;
    if (!fromId)
        return;
    // Admins reply with an image 
    if (ADMIN_IDS.includes(fromId) && currentReplyTarget) {
        // Type guard to ensure ctx.message has 'photo'
        if ('photo' in ((_c = ctx.message) !== null && _c !== void 0 ? _c : {})) {
            const photoArray = ctx.message.photo;
            yield ctx.telegram.sendPhoto(currentReplyTarget, photoArray[0].file_id, {
                caption: `👤 NAOBS_ADMIN replied with a photo:`
            });
            yield ctx.reply(`✅ Photo sent to user ${currentReplyTarget}.`);
            currentReplyTarget = null; // Reset after reply
        }
        else {
            yield ctx.reply('❌ Please send a photo to reply.');
        }
        return;
    }
    // Forward photo to admin
    if (!ADMIN_IDS.includes(fromId)) {
        const forwardedMsg = `📷 Photo from user ${fromId}:`;
        console.log(`Received photo from ${fromId}:`, chatUsername);
        // Type guard to ensure ctx.message has 'photo'
        if ('photo' in ((_d = ctx.message) !== null && _d !== void 0 ? _d : {})) {
            const photoArray = ctx.message.photo;
            yield ctx.telegram.sendPhoto(ADMIN_IDS[1], photoArray[1].file_id, { caption: forwardedMsg });
            yield ctx.telegram.sendPhoto(ADMIN_IDS[0], photoArray[0].file_id, {
                caption: forwardedMsg,
                reply_markup: telegraf_1.Markup.inlineKeyboard([
                    [telegraf_1.Markup.button.callback('Reply to this user', `reply:${fromId}`)]
                ]).reply_markup
            });
        }
    }
}));
bot.launch().then(() => {
    console.log('🚀 Bot is running...');
});
