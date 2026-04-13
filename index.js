const TelegramBot = require('node-telegram-bot-api');

const token = 'ТВОЙ_НОВЫЙ_ТОКЕН';

const bot = new TelegramBot(token, { polling: true });

let userState = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  userState[chatId] = 1;

  bot.sendMessage(chatId, 'Ты в диагностике. Отвечай честно.\n\nВопрос 1:\nТы сейчас живешь в правде или играешь роль?');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (msg.text === '/start') return;

  if (!userState[chatId]) {
    bot.sendMessage(chatId, 'Напиши /start');
    return;
  }

  bot.sendMessage(chatId, 'Принял. Дальше будет глубже.');
});
