const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const ADMIN_USERNAME = 'SONGOD62';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '702376537';

if (!token) {
  console.error('Ошибка: BOT_TOKEN не найден.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const sessions = {};

const steps = [
  {
    question: 'Ты сейчас живёшь в правде или играешь роль?',
    replies: [
      'Хорошо. Не украшай.',
      'Принято. Идём дальше.',
      'Запомни что только что сказал.'
    ]
  },
  {
    question: 'Где именно ты сейчас врёшь себе?',
    replies: [
      'Вот тут уже начинается мясо.',
      'Обычно это место человек знает. Просто не смотрит.',
      'Да. Именно туда.'
    ]
  },
  {
    question: 'Что ты избегаешь менять прямо сейчас?',
    replies: [
      'Обычно человек называет не проблему, а оправдание. Идём дальше.',
      'Хорошо. Запомни этот ответ.',
      'Это важно. Двигаемся.'
    ]
  },
  {
    question: 'Что ты защищаешь: себя настоящего или свой образ?',
    replies: [
      'Нормально. Дальше глубже.',
      'Большинство защищают образ и называют это честностью.',
      'Ладно. Едем.'
    ]
  },
  {
    question: 'Что в тебе давно уже требует смерти, а ты это кормишь?',
    replies: [
      'Если неприятно — значит попало.',
      'Да. Именно это.',
      'Хорошо что назвал.'
    ]
  },
  {
    question: 'Кого ты винишь за то, за что уже давно отвечаешь сам?',
    replies: [
      'Вот теперь уже ближе к реальности.',
      'Это не обвинение. Это карта.',
      'Принято.'
    ]
  },
  {
    question: 'Что ты называешь "слабостью", хотя это давно стало привычным выбором?',
    replies: [
      'Не спеши. Ответь честно себе, не мне.',
      'Слабость и выбор — разные вещи.',
      'Хорошо.'
    ]
  },
  {
    question: 'Где ты просишь помощи, но по факту не хочешь менять сценарий?',
    replies: [
      'Да. Именно это место обычно и гниёт первым.',
      'Помощь которую не хочешь принять — это не помощь, это алиби.',
      'Принято. Идём.'
    ]
  },
  {
    question: 'Если оставить всё как есть, где ты окажешься через 3 месяца?',
    replies: [
      'Будущее обычно не падает с неба. Оно вырастает из сегодняшней лжи.',
      'Это не пугалка. Это просто математика.',
      'Запомни этот образ.'
    ]
  },
  {
    question: 'Ты правда хочешь выйти из этого — или просто хочешь, чтобы стало не так больно?',
    replies: [
      'Это разные запросы. С разными дорогами.',
      'Честный ответ на этот вопрос — уже половина работы.',
      'Принято.'
    ]
  },
  {
    question: 'Что ты сделаешь в ближайшие 24 часа как доказательство, что ты не просто поговорил?',
    replies: [null]
  }
];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function startDiagnostic(chatId, userName) {
  sessions[chatId] = {
    step: 0,
    answers: [],
    userName: userName || 'Аноним',
    startedAt: new Date().toISOString()
  };

  bot.sendMessage(
    chatId,
    `Это не тест и не викторина.\n\nЗдесь 11 вопросов. Они неудобные. Отвечай честно — или не начинай.\n\nВопрос 1/${steps.length}:\n\n${steps[0].question}`
  );
}

async function finishDiagnostic(chatId) {
  const data = sessions[chatId];
  const answers = data.answers;
  const userName = data.userName;

  // Сообщение пользователю
  const userMessage = [
    'Диагностика завершена.',
    '',
    'Ты только что сделал то, что большинство избегает — посмотрел на себя без прикрас.',
    '',
    'Я прочитаю твои ответы и напишу тебе лично. Обычно в течение 24 часов.',
    '',
    'Если хочешь поговорить прямо сейчас — вот я:',
    `@${ADMIN_USERNAME}`
  ].join('\n');

  await bot.sendMessage(chatId, userMessage, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '💬 Написать Диме',
            url: `https://t.me/${ADMIN_USERNAME}`
          }
        ]
      ]
    }
  });

  // Уведомление администратору
  if (ADMIN_CHAT_ID) {
    const adminLines = [
      `🔔 Новая диагностика`,
      `👤 Пользователь: ${userName} (id: ${chatId})`,
      `🕐 Время: ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
      '',
      '─────────────────'
    ];

    steps.forEach((step, i) => {
      adminLines.push(`\n❓ ${step.question}`);
      adminLines.push(`💬 ${answers[i] || '—'}`);
    });

    adminLines.push('─────────────────');
    adminLines.push(`\nОтветить: https://t.me/${chatId}`);

    const adminMessage = adminLines.join('\n');

    // Telegram ограничивает сообщения 4096 символами
    if (adminMessage.length <= 4096) {
      await bot.sendMessage(ADMIN_CHAT_ID, adminMessage);
    } else {
      // Если длинное — шлём частями
      const chunks = adminMessage.match(/.{1,4000}/gs) || [];
      for (const chunk of chunks) {
        await bot.sendMessage(ADMIN_CHAT_ID, chunk);
      }
    }
  }

  delete sessions[chatId];
}

// Обработка коротких или пустых ответов
function isTooShort(text) {
  return text.trim().length < 8;
}

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.username
    ? `@${msg.from.username}`
    : `${msg.from.first_name || ''} ${msg.from.last_name || ''}`.trim();
  startDiagnostic(chatId, userName);
});

bot.onText(/\/reset/, (msg) => {
  const chatId = msg.chat.id;
  delete sessions[chatId];
  bot.sendMessage(chatId, 'Сессия сброшена. Нажми /start чтобы начать заново.');
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `/start — начать диагностику\n/reset — сбросить сессию\n/help — помощь`
  );
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || '').trim();

  if (!text) return;
  if (text.startsWith('/')) return;

  if (!sessions[chatId]) {
    await bot.sendMessage(chatId, 'Нажми /start чтобы начать.');
    return;
  }

  const current = sessions[chatId];
  const stepIndex = current.step;

  // Дожим на слишком короткий ответ
  if (isTooShort(text)) {
    await bot.sendMessage(
      chatId,
      'Это не ответ. Напиши нормально — что реально думаешь.'
    );
    return;
  }

  current.answers.push(text);

  if (stepIndex >= steps.length - 1) {
    await finishDiagnostic(chatId);
    return;
  }

  const nextStep = stepIndex + 1;
  current.step = nextStep;

  const reply = getRandom(steps[stepIndex].replies);

  const replyText = [
    reply,
    '',
    `Вопрос ${nextStep + 1}/${steps.length}:`,
    '',
    steps[nextStep].question
  ].filter(Boolean).join('\n');

  await bot.sendMessage(chatId, replyText);
});

bot.on('polling_error', (error) => {
  console.error('polling_error:', error?.response?.body || error.message || error);
});

console.log('Бот запущен.');
