const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

// Хранилище состояний пользователей
const userState = {};

// Вопросы
const questions = [
  "Ты сейчас живешь в правде или играешь роль?",
  "Где ты сейчас врешь себе?",
  "Что ты избегал последние 7 дней?",
  "Если ничего не менять — где ты окажешься через 3 месяца?",
  "Ты хочешь выйти из этого реально или просто уменьшить боль?"
];

// Старт
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  userState[chatId] = 0;

  bot.sendMessage(chatId, "Начинаем. Отвечай честно.\n\nВопрос 1:\n" + questions[0]);
});

// Обработка сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (!userState.hasOwnProperty(chatId)) return;
  if (msg.text === '/start') return;

  let step = userState[chatId];

  step++;

  if (step < questions.length) {
    userState[chatId] = step;

    bot.sendMessage(
      chatId,
      "Принял.\n\nВопрос " + (step + 1) + ":\n" + questions[step]
    );
  } else {
    delete userState[chatId];

    bot.sendMessage(
      chatId,
      "Ты дошел до конца.\n\nЕсли ты был честен — ты уже видишь, где проблема.\n\nДальше либо действие, либо откат назад."
    );
  }
});
