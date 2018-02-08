var fs = require('fs');
var Bot = require('node-telegram-bot');
var login = require("facebook-chat-api");

if (!process.env.TELEGRAM_USER || !process.env.APP_TOKEN)
    return console.log("Please define this env variables -- TELEGRAM_USER - APP_TOKEN");

var owner = {username: process.env.TELEGRAM_USER, chat_id: process.env.CHAT_ID || undefined};
var maxThreadNb = 10;

function getUsage() {
    return "I'm a Facebook bot. I help you to communicate with your old Facebook friends through Telegram !\n"
        + " I will forward every of your FB messages. I will also forward your answers if you select to reply their messages.\n\n"
        + "Available commands:\n"
        + "/threadlist - List the latest conversations you had with your friends.\n"
        + "/cancel - Cancel the current command.\n"
        + "\n\nMore Informations: https://github.com/Liryna/FacebookBot";
}

var chat = new Array();
var friends = {};
var threadListTmp;
var currentThreadId;

var config;
config = JSON.parse(fs.readFileSync('config.json', 'utf-8'));


login({email: config.email, password: config.password}, async function (err, api) {
    if (err) return console.error(err);

    await retrieveFriendsFromFacebook(api);

    //listen telegram message
    var bot = new Bot({
        token: process.env.APP_TOKEN
    }).on('message', async function (message) {
        if (message.from.username != owner.username)
            bot.sendMessage({
                chat_id: message.chat.id,
                text: "You are not my owner! Go away ! \n"
                + "- https://github.com/Liryna/FacebookBot"
            });
        else {
            if (owner.chat_id == undefined)
                owner.chat_id = message.chat.id; //save owner chat id - TODO save in config file

            if (!!message.reply_to_message
                && !!chat[message.reply_to_message.message_id]) { //it is a reply message from FB

                api.sendMessage(message.text,
                    chat[message.reply_to_message.message_id], function (err, api) {
                        if (err) return console.error(err);
                    });
            } else {

                if (message.text == "/threadlist") {
                    api.getThreadList(0, maxThreadNb, function callback(err, arr) {

                        var ft = require('./lib/findThread');
                        var fbids = ft.getParticipantsIds(arr);
                        currentThreadId = undefined; //reset current thread

                        api.getUserInfo(fbids, function (err, ret) {
                            if (err) return console.error(err);

                            ft.createThreads(arr, ret, function (conversatioNames, newThreadListTmp) {
                                threadListTmp = newThreadListTmp;
                                bot.sendMessage({
                                    chat_id: message.chat.id,
                                    text: "Who is the recipient ?",
                                    reply_markup: {
                                        keyboard: conversatioNames
                                    }
                                }, function (err, ret) {
                                    if (err) return console.error(err);
                                })
                            });
                        });
                    });
                } else if (message.text == "/cancel") {
                    reset();
                    bot.sendMessage({
                            chat_id: message.chat.id,
                            text: "Command canceled.",
                            reply_markup: {
                                hide_keyboard: true
                            }
                        },
                        function (err, ret) {
                            if (err) return console.error(err);
                        });
                } else if (currentThreadId != undefined) {
                    if (message.photo != undefined) {
                        bot.getFile({
                            file_id: message.photo[message.photo.length - 1].file_id,
                            dir: config.dir
                        }, function callback(err, arr) {
                            api.sendMessage({attachment: fs.createReadStream(arr.destination)}, currentThreadId, function (err, api) {
                                if (err) return console.error(err);
                                fs.unlink(arr.destination, function (err) {
                                    if (err) throw err;
                                });
                            });

                        });
                    } else {
                        api.sendMessage(message.text,
                            currentThreadId, function (err, api) {
                                if (err) return console.error(err);
                            });
                    }
                } else if (threadListTmp != undefined) { //Check if owner have send a good recipient name
                    currentThreadId = undefined;
                    for (var x = 0; x < threadListTmp.length; x++) {
                        if (threadListTmp[x].name == message.text)
                            currentThreadId = threadListTmp[x].threadID;
                    }

                    if (currentThreadId != undefined)
                        bot.sendMessage({
                                chat_id: message.chat.id,
                                text: "What is the message for him ?",
                                reply_markup: {
                                    hide_keyboard: true
                                }
                            },
                            function (err, ret) {
                                if (err) return console.error(err);
                            });
                    else
                        bot.sendMessage({
                                chat_id: message.chat.id,
                                text: "I do not know him, Please give me a correct name or /cancel."
                            },
                            function (err, ret) {
                                if (err) return console.error(err);
                            });
                } else {
                    bot.sendMessage({
                            chat_id: message.chat.id,
                            text: getUsage(),
                            disable_web_page_preview: true
                        },
                        function (err, ret) {
                            if (err) return console.error(err);
                        });
                }
            }
        }
    }).start();


    //listen message from FB and forward to telegram

    if (!owner.chat_id) {
        console.error("No chat id found.");
    } else {
        api.listen(function callback(err, message) {
            if (err) {
                console.error("Errors on facebook listening", err);
            }
            else if (message) {
                // gets the fb user name given his id
                const senderName = friends[message.senderID] || message.senderID;

                if (message.attachments.length > 0) {
                    sendAttachmentsToTelegram(bot, senderName, message);
                } else {
                    sendTextMessageToTelegram(bot, senderName, message, message.body);
                }
            } else {
                console.log("no message from facebook");
            }

        });
    }
});

const retrieveFriendsFromFacebook = async function (api) {

    return await api.getFriendsList(async function callback(err, arr) {
        if (err) {
            return console.error(err);
        }
        for (let i = 0; i < arr.length; i++) {
            friends[arr[i].userID] = arr[i].fullName;
        }
        console.log("Facebook friend list retrieved", arr.length);
        return arr.length;
    });
};

const sendTextMessageToTelegram = function (bot, senderName, message, text) {
    let forwardmsg = senderName + ": " + text;
    if (message.isGroup) {
        forwardmsg = message.threadID + ": " + forwardmsg;
    }

    bot.sendMessage({chat_id: owner.chat_id, text: forwardmsg}, function (err, res) {
        if (err) return console.error(err);

        //save message id send and fb thread id for futur reply
        chat[res.message_id] = message.threadID;
    })
};

const sendAttachmentsToTelegram = function (bot, senderName, message) {
    for (let i = 0; i < message.attachments.length; i++) {
        const attachment = message.attachments[i];
        // To simplify, it sends attachments as urls
        if (!!attachment.url) {
            sendTextMessageToTelegram(bot, senderName, message, attachment.type + " - " + attachment.url);
        } else {
            console.log(attachment.type, JSON.stringify(attachment));
            const text = "attachment type still not managed: " + attachment.type;
            sendTextMessageToTelegram(bot, senderName, message, text);
        }


    }
}

function reset() {
    currentThreadId = undefined;
    threadListTmp = undefined;
}