/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Fabric smart contract classes
const { Contract, Context } = require('fabric-contract-api');

// BondNet specifc classes
const CommercialBond = require('./bond.js');
const BondList = require('./bondlist.js');

/**
 * A custom context provides easy access to list of all commercial bonds
 */
class CommercialBondContext extends Context {

    constructor() {
        super();
        // All bonds are held in a list of bonds
        this.bondList = new BondList(this);
    }

}

/**
 * Define commercial bond smart contract by extending Fabric Contract class
 *
 */
class CommercialBondContract extends Contract {

    constructor() {
        // Unique name when multiple contracts per chaincode file
        super('org.bondnet.commercialbond');
    }

    /**
     * Define a custom context for commercial bond
    */
    createContext() {
        return new CommercialBondContext();
    }

    /**
     * Instantiate to perform any setup of the ledger that might be required.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract');
    }
    /**
    * Get commercial bond
    * @param {Context} ctx the transaction context
    * @param {String} issuer commercial bond issuer
    * @param {Integer} bondNumber bond number for this issuer
    */
    async getBond(ctx, issuer, bondNumber) {
        try {
            console.log("getBond for: " + issuer + " " + bondNumber);
            let bondKey = CommercialBond.makeKey([issuer, bondNumber]);
            let bond = await ctx.bondList.getBond(bondKey);
            return bond.toBuffer();
        } catch (e) {
            throw new Error('bond does not exist' + issuer + bondNumber);
        }
    }
    /**
     * Issue commercial bond
     *
     * @param {Context} ctx the transaction context
     * @param {String} issuer commercial bond issuer
     * @param {Integer} bondNumber bond number for this issuer
     * @param {String} issueDateTime bond issue date
     * @param {String} maturityDateTime bond maturity date
     * @param {Integer} faceValue face value of bond
     * @param {Float} couponRate interest rate of bond
    */
    async issue(ctx, issuer, bondNumber, issueDateTime, maturityDateTime, faceValue) {

        // create an instance of the bond
        let bond = CommercialBond.createInstance(issuer, bondNumber, issueDateTime, maturityDateTime, faceValue);

        // Smart contract, rather than bond, moves bond into ISSUED state
        bond.setIssued();

        // Newly issued bond is owned by the issuer
        bond.setOwner(issuer);

        // Add the bond to the list of all similar commercial bonds in the ledger world state
        await ctx.bondList.addBond(bond);

        // Must return a serialized bond to caller of smart contract
        return bond.toBuffer();
    }

    /**
     * Buy commercial bond
     *
     * @param {Context} ctx the transaction context
     * @param {String} issuer commercial bond issuer
     * @param {Integer} bondNumber bond number for this issuer
     * @param {String} currentOwner current owner of bond
     * @param {String} newOwner new owner of bond
     * @param {Integer} price price paid for this bond
     * @param {String} purchaseDateTime time bond was purchased (i.e. traded)
    */
    async buy(ctx, issuer, bondNumber, currentOwner, newOwner, price, purchaseDateTime) {

        // Retrieve the current bond using key fields provided
        let bondKey = CommercialBond.makeKey([issuer, bondNumber]);
        let bond = await ctx.bondList.getBond(bondKey);

        // Validate current owner
        if (bond.getOwner() !== currentOwner) {
            throw new Error('bond ' + issuer + bondNumber + ' is not owned by ' + currentOwner);
        }

        // First buy moves state from ISSUED to TRADING
        if (bond.isIssued()) {
            bond.setTrading();
        }

        // Check bond is not already REDEEMED
        if (bond.isTrading()) {
            bond.setOwner(newOwner);
        } else {
            throw new Error('bond ' + issuer + bondNumber + ' is not trading. Current state = ' +bond.getCurrentState());
        }

        // Update the bond
        await ctx.bondList.updateBond(bond);
        return bond.toBuffer();
    }

    /**
     * Redeem commercial bond
     *
     * @param {Context} ctx the transaction context
     * @param {String} issuer commercial bond issuer
     * @param {Integer} bondNumber bond number for this issuer
     * @param {String} redeemingOwner redeeming owner of bond
     * @param {String} redeemDateTime time bond was redeemed
    */
    async redeem(ctx, issuer, bondNumber, redeemingOwner, redeemDateTime) {

        let bondKey = CommercialBond.makeKey([issuer, bondNumber]);

        let bond = await ctx.bondList.getBond(bondKey);

        // Check bond is not REDEEMED
        if (bond.isRedeemed()) {
            throw new Error('bond ' + issuer + bondNumber + ' already redeemed');
        }

        // Verify that the redeemer owns the commercial bond before redeeming it
        if (bond.getOwner() === redeemingOwner) {
            bond.setOwner(bond.getIssuer());
            bond.setRedeemed();
        } else {
            throw new Error('Redeeming owner does not own bond' + issuer + bondNumber);
        }

        await ctx.bondList.updateBond(bond);
        return bond.toBuffer();
    }

}

module.exports = CommercialBondContract;
