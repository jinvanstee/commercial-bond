/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for ledger state
const State = require('../ledger-api/state.js');

// Enumerate commercial bond state values
const cpState = {
    ISSUED: 1,
    TRADING: 2,
    REDEEMED: 3
};

/**
 * CommercialBond class extends State class
 * Class will be used by application and smart contract to define a bond
 */
class CommercialBond extends State {

    constructor(obj) {
        super(CommercialBond.getClass(), [obj.issuer, obj.bondNumber]);
        Object.assign(this, obj);
    }

    /**
     * Basic getters and setters
    */
    getIssuer() {
        return this.issuer;
    }

    setIssuer(newIssuer) {
        this.issuer = newIssuer;
    }

    getOwner() {
        return this.owner;
    }

    setOwner(newOwner) {
        this.owner = newOwner;
    }

    /**
     * Useful methods to encapsulate commercial bond states
     */
    setIssued() {
        this.currentState = cpState.ISSUED;
    }

    setTrading() {
        this.currentState = cpState.TRADING;
    }

    setRedeemed() {
        this.currentState = cpState.REDEEMED;
    }

    isIssued() {
        return this.currentState === cpState.ISSUED;
    }

    isTrading() {
        return this.currentState === cpState.TRADING;
    }

    isRedeemed() {
        return this.currentState === cpState.REDEEMED;
    }

    static fromBuffer(buffer) {
        return CommercialBond.deserialize(Buffer.from(JSON.parse(buffer)));
    }

    toBuffer() {
        return Buffer.from(JSON.stringify(this));
    }

    /**
     * Deserialize a state data to commercial bond
     * @param {Buffer} data to form back into the object
     */
    static deserialize(data) {
        return State.deserializeClass(data, CommercialBond);
    }

    /**
     * Factory method to create a commercial bond object
     */
    static createInstance(issuer, bondNumber, issueDateTime, maturityDateTime, faceValue, interestRate) {
        return new CommercialBond({ issuer, bondNumber, issueDateTime, maturityDateTime, faceValue, interestRate });
    }

    static getClass() {
        return 'org.bondnet.commercialbond';
    }
}

module.exports = CommercialBond;
