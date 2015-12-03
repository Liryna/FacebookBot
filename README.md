# FacebookBot
A Facebook bot for Telegram.

[![dependencies](https://img.shields.io/david/Liryna/facebookbot.svg?style=flat-square)](https://david-dm.org/Liryna/facebookbot)[![npm version](http://img.shields.io/npm/v/facebookbot.svg?style=flat-square)](https://www.npmjs.com/package/facebookbot)
>I'm a Facebook bot. I help you to communicate with your old Facebook friends through Telegram ! I will forward every of your FB messages. I will also forward your answers if you select to reply their messages.

## Install
- Create your Telegram bot, follow the instruction [here](https://core.telegram.org/bots#3-how-do-i-create-a-bot).
- Clone this repository and install nodejs package.
```
git clone https://github.com/Liryna/FacebookBot.git
cd FacebookBot
npm install
```
- Create the configuration file `config.json`.
```
{
  "email": "YOUR EMAIL",
  "password": "YOUR PASSWORD"
  "dir": "FacebookBot DIRECTORY"
}
```
##Usage
- This bot require some additional information in the your environment variables.
```
TELEGRAM_USER="your telegram login"
APP_TOKEN="the token of your bot that BotFather gave you"
```
- Run it.
```
TELEGRAM_USER="Mario" APP_TOKEN="TOKEN" node facebookbot.js
```
- The bot cannot establish a conversation to you directly, you need to write him first. Use your Telegram Client to say him "Hello".
- The Available commands to send to your bot:
```
/threadlist - List the latest conversations you had with your friends.
/cancel - Cancel the current command.
```

## Dependencies

This bot use [Schmavery/facebook-chat-api](https://github.com/Schmavery/facebook-chat-api) and [depoio/node-telegram-bot](https://github.com/depoio/node-telegram-bot).
