// Rename config.example.js to config.js

module.exports = {
    // Steam Data; google how to get shared & identity secret (you may get it from SDA or Rooted phone with SteamAuth.)
    username: "",
    password: "",
    shared_secret: "",
    identity_secret: "",

    // Telegram Data
    bot_token: "",            // create bot @BotFather
    owner_id: "",              // create bot common command with console.log(ctx.chat.id) and get from his Id

    maxRetries: 4
};