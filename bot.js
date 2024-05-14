const cards = require("./db/cards.json");
const { save, randomInteger } = require("./utils");
const TelegramBot = require("node-telegram-bot-api");

const token = "6707557913:AAHEBUvkfZoVOK4MIBzYfZj4l_pXKXX5Lmw";
const bot = new TelegramBot(token, { polling: true });
const queue_add_cards = [];
const editable_cards = [];
const deleted_cards = [];

const second = 1000;
const minute = second * 60;
const hour = minute * 60;
const day = hour * 24;
const intervals = [
    {
        ms: 0,
    },
    {
        ms: minute,
    },
    {
        ms: 20 * minute,
    },
    {
        ms: hour,
    },
    {
        ms: 9 * hour,
    },
    {
        ms: 2 * day,
    },
    {
        ms: 6 * day,
    },
    {
        ms: 14 * day,
    },
    {
        ms: 30 * day,
    },
    {
        ms: 60 * day,
    },
    {
        ms: 180 * day,
    },
];

let cards_on_repeat = [];
let repetition_card = null;

function updateCardsOnRepeat() {
    cards_on_repeat = [];
    cards.forEach((card, index) => {
        if (card.repeat_date <= Date.now()) {
            cards_on_repeat.push({
                ...card,
                index,
            });
        }
    });
}

function setData(msg) {
    msg.answered = true;
    // repetition_card = null;
    removeFromQueues(msg);
}
function removeFromQueues(msg) {
    let index = queue_add_cards.findIndex(
        (user) => user.chat_id == msg.chat.id
    );
    if (index !== -1) queue_add_cards.splice(index, 1);

    index = editable_cards.findIndex((user) => user.chat_id == msg.chat.id);
    if (index !== -1) editable_cards.splice(index, 1);

    index = deleted_cards.findIndex((user) => user.chat_id == msg.chat.id);
    if (index !== -1) deleted_cards.splice(index, 1);
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

    cards.forEach((card, index) => {
        cards_str += `${index + 1}❓${card.question} ➡️ ${card.answer}\n`;
    });

    bot.sendMessage(msg.chat.id, "✍️Карточки:\n\n" + cards_str, {
        reply_markup: {
            keyboard: [
                ["✍️Добавить карточку", "✏️Редактировать карточку"],
                ["🗑Удалить карточку"],
                ["🖥Меню"],
            ],
            resize_keyboard: true,
        },
    });
});

bot.onText(/(✍️)?Добавить карточку/iu, async (msg) => {
    setData(msg);
    const index = queue_add_cards.findIndex(
        (user) => user.chat_id == msg.chat.id
    );
    const user = { chat_id: msg.chat.id };

    if (index !== -1) {
        queue_add_cards[index] = user;
    } else {
        queue_add_cards.push(user);
    }

    bot.sendMessage(msg.chat.id, "Введите вопрос", {
        reply_markup: {
            keyboard: [["📋Карточки"], ["🖥Меню"]],
            resize_keyboard: true,
        },
    });
});

bot.onText(/✏️?Редактировать карточку/iu, async (msg) => {
    setData(msg);
    const index = editable_cards.findIndex(
        (user) => user.chat_id == msg.chat.id
    );
    const user = { chat_id: msg.chat.id };

    if (index !== -1) {
        editable_cards[index] = user;
    } else {
        editable_cards.push(user);
    }

    bot.sendMessage(msg.chat.id, "⌨️Введите номер карточки", {
        reply_markup: {
            keyboard: [["📋Карточки"], ["🖥Меню"]],
            resize_keyboard: true,
        },
    });
});

bot.onText(/🗑?Удалить карточку/iu, async (msg) => {
    setData(msg);
    const index = deleted_cards.findIndex(
        (user) => user.chat_id == msg.chat.id
    );
    const user = { chat_id: msg.chat.id };

    if (index !== -1) {
        deleted_cards[index] = user;
    } else {
        deleted_cards.push(user);
    }

    bot.sendMessage(msg.chat.id, "⌨️Введите номер удаляемой карточки", {
        reply_markup: {
            keyboard: [["📋Карточки"], ["🖥Меню"]],
            resize_keyboard: true,
        },
    });
});

bot.onText(/⏳?Обучение|🔁?Обновить/iu, trainingCallback);

function trainingCallback(msg) {
    setData(msg);
    updateCardsOnRepeat();

    if (cards_on_repeat.length !== 0) {
        bot.sendMessage(
            msg.chat.id,
            `🎓Осталось карточек: ${cards_on_repeat.length}`,
            {
                reply_markup: {
                    keyboard: [
                        ["Знаю", "Не знаю"],
                        ["👀Подсмотреть"],
                        ["🔁Обновить"],
                        ["🖥Меню"],
                    ],
                    resize_keyboard: true,
                },
            }
        );

        repetition_card =
            cards_on_repeat[randomInteger(0, cards_on_repeat.length - 1)];

        bot.sendMessage(msg.chat.id, `❓Вопрос: ${repetition_card.question}`);
    } else {
        const min_date = Math.min(...cards.map((card) => card.repeat_date));

        if (cards.length !== 0) {
            bot.sendMessage(
                msg.chat.id,
                `👍Вы повторили все карточки! Следующие карточки появятся ${new Date(
                    min_date
                )}`,
                {
                    reply_markup: {
                        keyboard: [["🔁Обновить"], ["🖥Меню"]],
                        resize_keyboard: true,
                    },
                }
            );
        } else {
            bot.sendMessage(msg.chat.id, `Кажется карточек нет`, {
                reply_markup: {
                    keyboard: [
                        ["🔁Обновить", "✍️Добавить карточку"],
                        ["🖥Меню"],
                    ],
                    resize_keyboard: true,
                },
            });
        }
    }
}

bot.onText(/^Знаю$/i, async (msg) => {
    setData(msg);

    if (repetition_card) {
        const card = cards[repetition_card.index];

        card.interval += 1;
        card.repeat_date = Date.now() + intervals[card.interval].ms;

        save("./db/cards.json", cards);

        // updateCardsOnRepeat();

        trainingCallback(msg);
    }
});

bot.onText(/Не знаю/i, async (msg) => {
    setData(msg);

    if (repetition_card) {
        const card = cards[repetition_card.index];

        card.interval = 0;
        card.repeat_date = Date.now() + intervals[card.interval].ms;

        save("./db/cards.json", cards);

        await bot.sendMessage(
            msg.chat.id,
            `Ничего страшного, теперь эта карточка будет попадаться чаще`
        );
        trainingCallback(msg);
    }
});

bot.onText(/👀?Подсмотреть/iu, async (msg) => {
    setData(msg);

    if (repetition_card) {
        const card = cards[repetition_card.index];

        await bot.sendMessage(
            msg.chat.id,
            `Ответ: ${card.answer}`,
        );
        bot.sendMessage(
            msg.chat.id,
            `Теперь ответь, знал(a) ли?`,
        );
    }
});

bot.onText(/.*/s, (msg) => {
    if (msg.answered) return;

    const user_add_card = queue_add_cards.find(
        (user) => user.chat_id == msg.chat.id
    );
    if (user_add_card) {
        if (!user_add_card.question) {
            user_add_card.question = msg.text;

            bot.sendMessage(msg.chat.id, "Введите ответ", {
                reply_markup: {
                    keyboard: [["📋Карточки"], ["🖥Меню"]],
                    resize_keyboard: true,
                },
            });
        } else if (!user_add_card.answer) {
            user_add_card.answer = msg.text;
            const interval = 0;

            cards.push({
                question: user_add_card.question,
                answer: user_add_card.answer,
                interval,
                repeat_date: Date.now() + intervals[interval].ms,
            });

            save("./db/cards.json", cards);

            bot.sendMessage(msg.chat.id, "Карточка добавлена", {
                reply_markup: {
                    keyboard: [
                        ["📋Карточки", "✍️Добавить карточку"],
                        ["🖥Меню"],
                    ],
                    resize_keyboard: true,
                },
            });
        }

        return;
    }

    const user_editable_card = editable_cards.find(
        (user) => user.chat_id == msg.chat.id
    );
    if (user_editable_card) {
        if (!user_editable_card.card_number) {
            const card_number = parseInt(msg.text);
            user_editable_card.card_number = card_number;

            bot.sendMessage(msg.chat.id, "Что нужно отредактировать?", {
                reply_markup: {
                    keyboard: [["Вопрос", "Ответ"], ["📋Карточки"], ["🖥Меню"]],
                    resize_keyboard: true,
                },
            });
        } else {
            if (/Вопрос/i.test(msg.text)) {
                user_editable_card.is_question = true;
                bot.sendMessage(msg.chat.id, "Введите вопрос", {
                    reply_markup: {
                        keyboard: [["📋Карточки"], ["🖥Меню"]],
                        resize_keyboard: true,
                    },
                });
            } else if (/Ответ/i.test(msg.text)) {
                user_editable_card.is_answer = true;
                bot.sendMessage(msg.chat.id, "Введите ответ", {
                    reply_markup: {
                        keyboard: [["📋Карточки"], ["🖥Меню"]],
                        resize_keyboard: true,
                    },
                });
            } else {
                if (user_editable_card.is_question) {
                    user_editable_card.is_question = false;
                    cards[user_editable_card.card_number - 1].question =
                        msg.text;
                    save("./db/cards.json", cards);
                    bot.sendMessage(msg.chat.id, "Карточка отредактирована", {
                        reply_markup: {
                            keyboard: [
                                ["📋Карточки", "✏️Редактировать карточку"],
                                ["🖥Меню"],
                            ],
                            resize_keyboard: true,
                        },
                    });
                } else if (user_editable_card.is_answer) {
                    user_editable_card.is_answer = false;
                    cards[user_editable_card.card_number - 1].answer = msg.text;
                    save("./db/cards.json", cards);
                    bot.sendMessage(msg.chat.id, "Карточка отредактирована", {
                        reply_markup: {
                            keyboard: [
                                ["📋Карточки", "✏️Редактировать карточку"],
                                ["🖥Меню"],
                            ],
                            resize_keyboard: true,
                        },
                    });
                }
            }
        }

        return;
    }

    const user_deleted_card = deleted_cards.find(
        (user) => user.chat_id == msg.chat.id
    );
    if (user_deleted_card) {
        if (!user_deleted_card.card_number) {
            const card_number = parseInt(msg.text);
            user_deleted_card.card_number = card_number;

            cards.splice(user_deleted_card.card_number - 1, 1);
            save("./db/cards.json", cards);

            bot.sendMessage(msg.chat.id, "Карточка удалена", {
                reply_markup: {
                    keyboard: [["📋Карточки", "🗑Удалить карточку"], ["🖥Меню"]],
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
