const TelegramBot = require('node-telegram-bot-api');

const token = '8359587585:AAH2yIRu4XC3nBW3iHrrQ03g8YBlU-eNcNA';
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Ты в диагностике. Отвечай честно.\n\nВопрос 1:\nТы сейчас живешь в правде или играешь роль?');
});

bot.on('message', (msg) => {
    if (msg.text !== '/start') {
        bot.sendMessage(msg.chat.id, 'Принял. Дальше будет глубже.');
    }
});
