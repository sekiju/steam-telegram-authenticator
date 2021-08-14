class TradeOffer {
    constructor(incomingOffer) {
        this.offer = incomingOffer;
    }

    get() {
        return this.offer;
    }

    getMessage() {
        return this.offer.message;
    }

    getItemsToGive() {
        if (this.offer.itemsToGive)
            return this.offer.itemsToGive;
        else
            return null;
    }

    getItemsToReceive() {
        if (this.offer.itemsToReceive)
            return this.offer.itemsToReceive;
        else
            return null;
    }

    isGift() {
        if (this.getItemsToGive().length === 0)
            return true;
        return false;
    }
}

module.exports = TradeOffer;