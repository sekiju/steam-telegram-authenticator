const config = require('../../config');

class SteamAccountManager {
    constructor(client, community, tradesManager) {
        this.tradesBot = tradesManager;
        this.client = client; // Steam User
        this.community = community;
        this.inventory = [];
    }

    getTradeOfferBot() {
        return this.tradesBot;
    }

    getSteamCommunity() {
        return this.community;
    }

    getClient() {
        return this.client;
    }

    async acceptTradeOffer(offer, maxRetries) {
        return new Promise(async (resolve, reject) => {
            offer.accept((acceptanceErr, status) => {
                if (acceptanceErr) {
                    if (maxRetries <= 0) {
                        this.printMessage('Error in the sendTradeOffer Function');
                        this.printMessage(acceptanceErr);
                        return reject(acceptanceErr)
                    }
                    this.acceptIncomingTradeOffer(offer,maxRetries-1);
                } else {
                    if (status == "pending") {
                        this.acceptConfirmation(offer.id);
                    }

                    this.printMessage('Accepted trade');
                    return resolve(1);
                }
            });
        });
    }


    async declineTradeOffer(offer) {
        return new Promise(async (resolve, reject) => {
            offer.decline((declineErr) => {
                if (declineErr) {
                    this.printMessage('Error in the declineTradeOffer Function');
                    this.printMessage(declineErr);
                    return reject(declineErr);
                } else {
                    this.printMessage('Declined trade');
                    return resolve(1);
                }
            });
        });
    }

    printMessage(message) {
        console.log("[" + config.username + "] " + message);
    }

    async acceptConfirmation(id) {
        return await new Promise(async (resolve, reject) => {
            this.community.acceptConfirmationForObject(config.identity_secret, id, (err) => {
                this.printMessage(err);
                if (err) {
                    this.printMessage('Error in acceptConfirmation');
                    this.printMessage(err);
                    return reject(err);
                } else {
                    this.printMessage('Trade confirmed!');
                    return resolve(1);
                }
            });
        });
    }
}

module.exports = SteamAccountManager;