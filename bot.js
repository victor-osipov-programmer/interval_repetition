const cards = require("./db/cards.json");
const { save } = require("./utils");
const TelegramBot = require("node-telegram-bot-api");

const token = "6707557913:AAHEBUvkfZoVOK4MIBzYfZj4l_pXKXX5Lmw";
const bot = new TelegramBot(token, { polling: true });

function setData(msg) {
    msg.answered = true;
    removeFromQueues(msg);
}
function removeFromQueues() {
    
}

bot.onText(/\/start|🖥?Меню/iu, (msg) => {
    setData(msg);
    bot.sendMessage(
        msg.chat.id,
        "🎓Удобное изучение и повторение тем с помощью карточек вместе с нами!",
        {
            reply_markup: {
                keyboard: [["📋Карточки", "⏳Обучение"]],
                resize_keyboard: true,
            },
        }
    );
});

bot.onText(/📋?Карточки/iu, (msg) => {
    setData(msg);
    let cards_str = "";

    cards.forEach((card) => {
        cards_str += `❓${card.question} ➡️ ${card.answer}\n`;
    });

    bot.sendMessage(msg.chat.id, "✍️Карточки:\n\n" + cards_str, {
        reply_markup: {
            keyboard: [["✍️Добавить карточку"], ["🖥Меню"]],
            resize_keyboard: true,
        },
    });
});

const queue_add_cards = [];

bot.onText(/(✍️)?Добавить карточку/iu, async (msg) => {
    setData(msg);
    const user = queue_add_cards.find((user) => user.chat_id == msg.chat.id);

    if (user) {
        user.question = null;
        user.answer = null;
    } else {
        queue_add_cards.push({
            chat_id: msg.chat.id,
            question: null,
            answer: null,
        });
    }

    bot.sendMessage(msg.chat.id, "Введите вопрос", {
        reply_markup: {
            keyboard: [["📋Карточки"]],
            resize_keyboard: true,
        },
    });
});

bot.onText(/⏳?Обучение/iu, (msg) => {
    setData(msg);
    bot.sendMessage(
        msg.chat.id,
        "🎓Удобное изучение и повторение тем с помощью карточек вместе с нами!",
        {
            reply_markup: {
                keyboard: [
                    ["Знаю", "Не знаю"],
                    ["👀Подсмотреть", "📝Редактировать"],
                    ["🖥Меню"],
                ],
                resize_keyboard: true,
            },
        }
    );
});

bot.onText(/.*/s, (msg) => {
    if (msg.answered) return;

    const user = queue_add_cards.find((user) => user.chat_id == msg.chat.id);
    if (user) {
        if (!user.question) {
            user.question = msg.text;

            bot.sendMessage(msg.chat.id, "Введите ответ", {
                reply_markup: {
                    keyboard: [["📋Карточки"]],
                    resize_keyboard: true,
                },
            });
        } else if (!user.answer) {
            user.answer = msg.text;

            cards.push({
                question: user.question,
                answer: user.answer,
            });

            save("./db/cards.json", cards);

            bot.sendMessage(msg.chat.id, "Карточка добавлена", {
                reply_markup: {
                    keyboard: [["📋Карточки"]],
                    resize_keyboard: true,
                },
            });
        }

        return;
    }

    bot.sendMessage(msg.chat.id, "😔Я не понимаю тебя", {
        reply_markup: {
            keyboard: [["🖥Меню"]],
            resize_keyboard: true,
        },
    });
});
