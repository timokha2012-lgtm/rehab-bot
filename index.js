const TelegramBot = require('node-telegram-bot-api');

// Берем токен из Railway Variables
const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('Ошибка: BOT_TOKEN не найден в переменных окружения.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

// Хранилище состояний пользователей в памяти
const sessions = {};

// Полная диагностика
const steps = [
  {
    question: 'Ты сейчас живёшь в правде или играешь роль?',
    reply: 'Хорошо. Не украшай.'
  },
  {
    question: 'Где именно ты сейчас врёшь себе?',
    reply: 'Вот тут уже начинается мясо.'
  },
  {
    question: 'Что ты избегаешь менять прямо сейчас?',
    reply: 'Обычно человек называет не проблему, а оправдание. Идём дальше.'
  },
  {
    question: 'Что ты защищаешь: себя настоящего или свой образ?',
    reply: 'Нормально. Дальше глубже.'
  },
  {
    question: 'Что в тебе давно уже требует смерти, а ты это кормишь?',
    reply: 'Если неприятно — значит попало.'
  },
  {
    question: 'Кого ты винишь за то, за что уже давно отвечаешь сам?',
    reply: 'Вот теперь уже ближе к реальности.'
  },
  {
    question: 'Что ты называешь “слабостью”, хотя это давно стало привычным выбором?',
    reply: 'Не спеши. Ответь честно себе, не мне.'
  },
  {
    question: 'Где ты просишь помощи, но по факту не хочешь менять сценарий?',
    reply: 'Да. Именно это место обычно и гниёт первым.'
  },
  {
    question: 'Если оставить всё как есть, где ты окажешься через 3 месяца?',
    reply: 'Будущее обычно не падает с неба. Оно вырастает из сегодняшней лжи.'
  },
  {
    question: 'Ты правда хочешь выйти из этого или просто хочешь, чтобы стало не так больно?',
    reply: 'Финальный вопрос.'
  },
  {
    question: 'Что ты сделаешь в ближайшие 24 часа как доказательство, что ты не просто поговорил?',
    reply: null
  }
];

function startDiagnostic(chatId) {
  sessions[chatId] = {
    step: 0,
    answers: [],
    startedAt: new Date().toISOString()
  };

  bot.sendMessage(
    chatId,
    `Ты в диагностике. Отвечай честно.\n\nВопрос 1/${steps.length}:\n${steps[0].question}`
  );
}

function finishDiagnostic(chatId) {
  const data = sessions[chatId];
  const answers = data.answers;

  const summary = [
    'Диагностика закончена.',
    '',
    'Что видно по ответам:',
    `1. Точек ответа получено: ${answers.length}`,
    `2. Последний ответ: ${answers[answers.length - 1] || 'нет'}`,
    '',
    'Теперь без романтики:',
    'Если после честного разговора не будет действия — это был не прорыв, а эмоциональная мастурбация.',
    '',
    'Чтобы пройти заново, нажми /start'
  ].join('\n');

  delete sessions[chatId];
  bot.sendMessage(chatId, summary);
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  startDiagnostic(chatId);
});

bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;
  delete sessions[chatId];
  bot.sendMessage(chatId, 'Сессия сброшена. Нажми /start');
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    [
      'Команды:',
      '/start — начать диагностику',
      '/reset — сбросить текущую сессию',
      '/help — помощь'
    ].join('\n')
  );
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  if (!text) return;
  if (text.startsWith('/start')) return;
  if (text.startsWith('/reset')) return;
  if (text.startsWith('/help')) return;

  if (!sessions[chatId]) {
    await bot.sendMessage(chatId, 'Сначала нажми /start');
    return;
  }

  const current = sessions[chatId];
  const stepIndex = current.step;

  current.answers.push(text);

  // Если это был последний вопрос
  if (stepIndex >= steps.length - 1) {
    await finishDiagnostic(chatId);
    return;
  }

  const nextStep = stepIndex + 1;
  current.step = nextStep;

  const replyText = [
    steps[stepIndex].reply,
    '',
    `Вопрос ${nextStep + 1}/${steps.length}:`,
    steps[nextStep].question
  ].join('\n');

  await bot.sendMessage(chatId, replyText);
});

bot.on('polling_error', (error) => {
  console.error('polling_error:', error?.response?.body || error.message || error);
});

bot.on('webhook_error', (error) => {
  console.error('webhook_error:', error?.response?.body || error.message || error);
});

console.log('Бот запущен.');
