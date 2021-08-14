const SteamTotp = require('steam-totp');
const TradeOfferManager = require('steam-tradeoffer-manager');
const SteamUser = require('steam-user');
const SteamCommunity = require('steamcommunity');

const { Telegraf } = require('telegraf');
const { Keyboard, Key } = require('telegram-keyboard');

const config = require('./config');
const SteamAccountManager = require('./lib/steam/SteamAccountManager');
const TradeOffer = require('./lib/steam/TradeOffer');

const MAX_RETRIES = 4;
let OffersData = [];

///.
// Functions
///.

const clamp = (n, from, to) => Math.min(Math.max(n, from), to);

const getCode = () => SteamTotp.generateAuthCode(config.shared_secret);

const remArray = (offer) => {
    const index = OffersData.indexOf(offer);
    if (index > -1)
        OffersData.splice(index, 1);
}

///.
// Init
///.

const client = new SteamUser();
const community = new SteamCommunity();

let tradesManager = new TradeOfferManager({
    "steam": client,
    "domain": "example.com",
    "language": "en"
});

let SteamBot = new SteamAccountManager(client, community, tradesManager);

try {
    SteamBot.getClient().logOn({
        "accountName": config.username,
        "password": config.password,
        "twoFactorCode": getCode()
    });
} catch {
    console.log('Error in login proc. Check steam guard or username, password... in config file. ');
}

SteamBot.getClient().on('loggedOn', () => {
    SteamBot.printMessage('Logged in!');
});

SteamBot.getClient().on('webSession', async (sessionID, cookies) => {
    SteamBot.getTradeOfferBot().setCookies(cookies);
    await SteamBot.getSteamCommunity().setCookies(cookies);
});

SteamBot.getTradeOfferBot().on("newOffer", async (offerResponse) => {
    let offer = new TradeOffer(offerResponse);
    if (offer.isGift()) {
        SteamBot.printMessage('Received new offer GIFT offer, auto-accept it.');
        await bot.telegram.sendMessage(parseInt(config.owner_id), 'Received new offer GIFT offer, auto-accept it.');

        await SteamBot.acceptTradeOffer(offerResponse, MAX_RETRIES);
    } else {
        OffersData.push(offerResponse);

        await bot.telegram.sendMessage(parseInt(config.owner_id), `Received ${OffersData.length} new offer, add his to list!\nUse /trades command for get trades.`);
    }
})

///.
// Telegram Bot
///.

const bot = new Telegraf(config.bot_token);

const kb = (without = 0) => {
    switch (without) {
        case 0:
            return Keyboard.inline([
                [Key.callback('👈', 'prev'), Key.callback('👉', 'next')],
                [Key.callback('❌', 'decline'), Key.callback('✅', 'accept')]
            ]);

            break;
        case 1:
            return Keyboard.inline([
                [Key.callback('👉', 'next')],
                [Key.callback('❌', 'decline'), Key.callback('✅', 'accept')]
            ]);

            break;
        case 2:
            return Keyboard.inline([
                [Key.callback('👈', 'prev')],
                [Key.callback('❌', 'decline'), Key.callback('✅', 'accept')],
            ]);

            break;
        case 3:
            return Keyboard.inline([
                [Key.callback('❌', 'decline'), Key.callback('✅', 'accept')]
            ]);

            break;
        case -1:
            return Keyboard.make([]).inline();
            break;
    }
}
const message = (offerNumber) => {
    const offer = new TradeOffer(OffersData[offerNumber]);

    const receive = offer.getItemsToReceive(),
        give = offer.getItemsToGive();

    let giveStr = "You give this items:\n", receiveStr = "You receive this items:\n";

    for (let i = 0; i < give.length; i++) {
        const Item = give[i];

        giveStr += `${Item.name}\n`;
    }

    giveStr += `\n`;

    if (receive) {
        for (let i = 0; i < receive.length; i++) {
            const Item = receive[i];

            receiveStr += `${Item.name}\n`;
        }
    }

    return giveStr + receiveStr;
}

bot.command('code', ctx => {
    if (ctx.message.chat.id.toString() === config.owner_id)
        bot.telegram.sendMessage(ctx.chat.id, `Your code: ${getCode()}`)
    else
        bot.telegram.sendMessage(ctx.chat.id, `Кыш отсюда! Your id: ${ctx.chat.id}`)
})

bot.command('trades', ctx => {
    if (ctx.message.chat.id.toString() === config.owner_id) {
        if (OffersData.length > 0)
            bot.telegram.sendMessage(ctx.chat.id, message(currentOffer), kb(1));
        else if (OffersData.length <= 0)
            bot.telegram.sendMessage(ctx.chat.id, "You doesn't have a trades confrms.");
    }
})

let currentOffer = 0;

bot.on('callback_query', async (ctx) => {
    const offer = OffersData[currentOffer];

    switch (ctx.callbackQuery.data) {
        case 'prev':
            currentOffer = clamp(currentOffer - 1, 0, OffersData.length - 1);
            break;
        case 'decline':
            await SteamBot.declineTradeOffer(offer, MAX_RETRIES).then((res) => {
                if (res === 1)
                    bot.telegram.sendMessage(ctx.chat.id, 'Trade declained!');
            });


            remArray(offer);
            currentOffer = 0;
            break;
        case 'accept':
            await SteamBot.acceptTradeOffer(offer, MAX_RETRIES).then((res) => {
                if (res === 1)
                    bot.telegram.sendMessage(ctx.chat.id, 'Trade accepted!');
            });

            remArray(offer);
            currentOffer = 0;
            break;
        case 'next':
            currentOffer = clamp(currentOffer + 1, 0, OffersData.length - 1);
            break;
    }

    if (OffersData.length === 0)
        return ctx.editMessageText('Offers end!', kb(-1));
    else
        return ctx.editMessageText(message(currentOffer), kb(OffersData.length === 1 ? 3 : currentOffer === OffersData.length - 1 ? 2 : currentOffer === 0 ? 1 : 0));
})

bot.launch();