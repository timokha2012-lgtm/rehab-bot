const TelegramBot = require('node-telegram-bot-api');
const https = require('https');

const token = process.env.BOT_TOKEN;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ADMIN_USERNAME = 'SONGOD62';
const ADMIN_CHAT_ID = '702376537';

if (!token) {
  console.error('Ошибка: BOT_TOKEN не найден.');
  process.exit(1);
}

if (!ANTHROPIC_API_KEY) {
  console.error('Ошибка: ANTHROPIC_API_KEY не найден.');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const sessions = {};

const steps = [
  'Ты сейчас живёшь в правде или играешь роль?',
  'Где именно ты сейчас врёшь себе?',
  'Что ты избегаешь менять прямо сейчас?',
  'Что ты защищаешь: себя настоящего или свой образ?',
  'Что в тебе давно уже требует смерти, а ты это кормишь?',
  'Кого ты винишь за то, за что уже давно отвечаешь сам?',
  'Что ты называешь "слабостью", хотя это давно стало привычным выбором?',
  'Где ты просишь помощи, но по факту не хочешь менять сценарий?',
  'Если оставить всё как есть, где ты окажешься через 3 месяца?',
  'Ты правда хочешь выйти из этого — или просто хочешь, чтобы стало не так больно?',
  'Что ты сделаешь в ближайшие 24 часа как доказательство, что ты не просто поговорил?'
];

// Вызов Claude API
function callClaude(messages, systemPrompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: messages
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content[0].text);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Живая реакция на ответ между вопросами
async function getReaction(question, answer, stepIndex) {
  const systemPrompt = `Ты — психолог-практик реабилитационного центра. Ведёшь жёсткую но честную диагностику.

ЗАДАЧА: 1-2 предложения. Не больше. Реагируй на конкретные слова человека.

ОБЯЗАТЕЛЬНО: процитируй или используй конкретное слово из его ответа. Человек должен почувствовать что его услышали — не шаблон, а отклик именно на его слова.

ЗАПРЕЩЕНО:
- "Принято." — пустышка
- "Хорошо." — звучит как оценка учителя
- "Ладно, едем." — ни о чём
- "Это важно." — банально
- Любые общие фразы без связи с его конкретным ответом

ПРИМЕРЫ как надо:
- Ответ "убеждаю себя что всё нормально" → "Убеждаешь. Значит что-то внутри не соглашается."
- Ответ "боюсь ответственности" → "Боязнь ответственности — это не черта характера. Это выбор, который ты повторяешь каждый день."
- Ответ "не знаю" → "Не знаю — так говорят когда знают, но не хотят называть вслух."
- Поверхностный ответ → "Это звучит как ответ для протокола. Что на самом деле?"
- Честный болезненный ответ → "Вот это уже не для галочки."
- Ответ про вину других → "Значит пока они не изменятся — ты стоишь на месте. Удобная позиция."

Тон: спокойный, прямой. Не хвали. Не осуждай. Просто отражай точно.`;

  const userContent = `Вопрос: "${question}"
Ответ человека: "${answer}"

1-2 предложения. Используй его конкретные слова.`;

  return await callClaude([{ role: 'user', content: userContent }], systemPrompt);
}

// Финальный разбор по всем ответам
async function getFinalAnalysis(questionsAndAnswers) {
  const systemPrompt = `Ты — опытный психолог-практик и специалист по зависимостям из реабилитационного центра Ряхаб.
Человек только что прошёл диагностику из 11 вопросов. Ты читаешь его ответы и пишешь живой личный разбор.

Структура разбора:
1. Одна ключевая проблема которую ты видишь — назови её прямо, без обиняков
2. Что человек защищает и от чего прячется — конкретно, со ссылкой на его слова
3. Паттерн который прослеживается в ответах — как он сам себе мешает
4. Одно конкретное действие которое покажет что он готов меняться — не абстрактное, а реальное

Правила:
- Пиши от первого лица обращаясь к человеку напрямую на "ты"
- Используй его конкретные слова из ответов — он должен узнать себя
- Без академического языка, без буллетов, без заголовков — живой текст
- Длина: 150-200 слов. Не больше.
- В конце — одна фраза о том, что следующий шаг это живой разговор`;

  const content = questionsAndAnswers.map((qa, i) =>
    `Вопрос ${i + 1}: ${qa.question}\nОтвет: ${qa.answer}`
  ).join('\n\n');

  return await callClaude(
    [{ role: 'user', content: `Вот ответы человека на диагностику:\n\n${content}\n\nНапиши разбор.` }],
    systemPrompt
  );
}

// Краткий разбор для администратора — что увидел, как начать разговор
async function getAdminBrief(questionsAndAnswers, userName) {
  const systemPrompt = `Ты — супервизор психолога-практика. Твоя задача: дать специалисту короткую выжимку по клиенту который только что прошёл диагностику.

Напиши три блока без заголовков, каждый с новой строки:

1. Ключевое: одна фраза — что реально происходит с этим человеком (не симптом, а суть)
2. Защита: от чего он прячется и чем прикрывается — конкретно, его словами
3. Первая фраза: буквально одно предложение которое специалист может написать этому человеку прямо сейчас чтобы начать живой разговор — цепляющее, личное, без шаблонов

Коротко. Практично. Без воды.`;

  const content = questionsAndAnswers.map((qa, i) =>
    `В: ${qa.question}\nО: ${qa.answer}`
  ).join('\n\n');

  return await callClaude(
    [{ role: 'user', content: `Пользователь: ${userName}\n\nОтветы:\n\n${content}` }],
    systemPrompt
  );
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
    `Это не тест и не викторина.\n\nЗдесь 11 вопросов. Они неудобные. Отвечай честно — или не начинай.\n\nВопрос 1/${steps.length}:\n\n${steps[0]}`
  );
}

async function finishDiagnostic(chatId) {
  const data = sessions[chatId];
  const answers = data.answers;
  const userName = data.userName;

  await bot.sendMessage(chatId, 'Читаю твои ответы...');

  const questionsAndAnswers = steps.map((q, i) => ({
    question: q,
    answer: answers[i] || '—'
  }));

  let analysis = '';
  try {
    analysis = await getFinalAnalysis(questionsAndAnswers);
  } catch (e) {
    console.error('Claude API error:', e);
    analysis = 'Ты прошёл диагностику. Твои ответы — у меня. Напишу лично.';
  }

  await bot.sendMessage(chatId, analysis);

  await bot.sendMessage(
    chatId,
    'Если это попало — значит есть смысл поговорить вживую. Там где разбор, там и выход.',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '💬 Написать Диме', url: `https://t.me/${ADMIN_USERNAME}` }]
        ]
      }
    }
  );

  // Уведомление администратору
  const adminLines = [
    `🔔 Новая диагностика`,
    `👤 ${userName} (id: ${chatId})`,
    `🕐 ${new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}`,
    '',
    '─────────────────'
  ];

  steps.forEach((q, i) => {
    adminLines.push(`\n❓ ${q}`);
    adminLines.push(`💬 ${answers[i] || '—'}`);
  });

  adminLines.push('\n─────────────────');
  const userLink = userName.startsWith('@')
    ? `https://t.me/${userName.slice(1)}`
    : `tg://user?id=${chatId}`;
  adminLines.push(`Ответить: ${userLink}`);

  const adminMessage = adminLines.join('\n');
  const chunks = adminMessage.match(/.{1,4000}/gs) || [];
  for (const chunk of chunks) {
    await bot.sendMessage(ADMIN_CHAT_ID, chunk);
  }

  // Отправляем администратору краткий разбор для первого сообщения
  try {
    const brief = await getAdminBrief(questionsAndAnswers, userName);
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `💡 Разбор для тебя:\n\n${brief}`
    );
  } catch (e) {
    console.error('Admin brief error:', e);
  }

  delete sessions[chatId];
}

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
  bot.sendMessage(chatId, `/start — начать диагностику\n/reset — сбросить сессию\n/help — помощь`);
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

  if (isTooShort(text)) {
    await bot.sendMessage(chatId, 'Это не ответ. Напиши нормально — что реально думаешь.');
    return;
  }

  current.answers.push(text);

  if (stepIndex >= steps.length - 1) {
    await finishDiagnostic(chatId);
    return;
  }

  const nextStep = stepIndex + 1;
  current.step = nextStep;

  let reaction = '';
  try {
    reaction = await getReaction(steps[stepIndex], text, stepIndex);
  } catch (e) {
    console.error('Reaction error:', e);
    reaction = 'Принято.';
  }

  const replyText = [
    reaction,
    '',
    `Вопрос ${nextStep + 1}/${steps.length}:`,
    '',
    steps[nextStep]
  ].join('\n');

  await bot.sendMessage(chatId, replyText);
});

bot.on('polling_error', (error) => {
  console.error('polling_error:', error?.response?.body || error.message || error);
});

console.log('Бот запущен.');
