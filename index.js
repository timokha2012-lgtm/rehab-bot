const TelegramBot = require('node-telegram-bot-api');

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    'Ты в диагностике. Отвечай честно.\n\nВопрос 1:\nТы сейчас живешь в правде или играешь роль?'
  );
});

bot.on('message', (msg) => {
  if (msg.text !== '/start') {
    bot.sendMessage(msg.chat.id, 'Принял. Дальше будет глубже.');
  }
});
