const TelegramBot = require('node-telegram-bot-api');

const token = '8359587585:AAH5OMtbGSEmd2wvCVA5cr3nrDwHjqOB3tk';

const bot = new TelegramBot(token, { polling: true });

let userState = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  userState[chatId] = 1;

  bot.sendMessage(chatId, 'Ты в диагностике. Отвечай честно.\n\nВопрос 1:\nТы сейчас живешь в правде или играешь роль?');
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (!userState[chatId]) return;

  if (msg.text === '/start') return;

  if (userState[chatId] === 1) {
    userState[chatId] = 2;
    bot.sendMessage(chatId, 'Вопрос 2:\nГде ты чаще всего врешь себе?');
    return;
  }

  if (userState[chatId] === 2) {
    userState[chatId] = 3;
    bot.sendMessage(chatId, 'Вопрос 3:\nЧто ты избегаешь менять прямо сейчас?');
    return;
  }

  if (userState[chatId] === 3) {
    userState[chatId] = 0;
    bot.sendMessage(chatId, 'Диагностика закончена.\n\nЕсли было неприятно — значит попало.');
    return;
  }
});
