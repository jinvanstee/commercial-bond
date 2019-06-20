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
     * Initializing with a few bonds to start with.
     * @param {Context} ctx the transaction context
     */
    async instantiate(ctx) {
        // No implementation required with this example
        // It could be where data migration is performed, if necessary
        console.log('Instantiate the contract');
        // Initializing with a few bonds to start with
        const bonds = [
            {
                issuer: 'MagnetoCorp',
                bondNumber: '00001',
                issueDateTime: '2019-04-17',
                maturityDateTime: '2020-04-17',
                faceValue: '10000',
                interestRate: '0.05',
            },
            {
                issuer: 'Digibank',
                bondNumber: '00001',
                issueDateTime: '2019-05-17',
                maturityDateTime: '2020-05-17',
                faceValue: '50000',
                interestRate: '0.04',
            },
            {
                issuer: 'MagnetoCorp',
                bondNumber: '00002',
                issueDateTime: '2019-06-17',
                maturityDateTime: '2020-06-17',
                faceValue: '10000',
                interestRate: '0.05',
            },
            {
                issuer: 'Digibank',
                bondNumber: '00002',
                issueDateTime: '2019-07-17',
                maturityDateTime: '2020-07-17',
                faceValue: '50000',
                interestRate: '0.04',
            },
        ];

        for (let i = 0; i < bonds.length; i++) {
            let bond = CommercialBond.createInstance(bonds[i].issuer, bonds[i].bondNumber, bonds[i].issueDateTime, bonds[i].maturityDateTime, bonds[i].faceValue, bonds[i].interestRate);

            // Smart contract, rather than bond, moves bond into ISSUED state
            bond.setIssued();
    
            // Newly issued bond is owned by the issuer
            bond.setOwner(bonds[i].issuer);
    
            // Add the bond to the list of all similar commercial bonds in the ledger world state
            await ctx.bondList.addBond(bond);

            console.log('Successfully added ' + bonds[i].issuer + ' ' + bonds[i].bondNumber + ' ' + bonds[i].interestRate + ' to the ledger and world state');
        }
        
        console.log('Successfully instantiated bond contract');
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
            throw new Error('bond does not exist: ' + issuer + ' ' + bondNumber);
        }
    }
    /**
    * Get all the commercial bonds from issuer
    * @param {Context} ctx the transaction context
    * @param {String} bondIssuer the organization that issued the bond
    */
    async getAllBondsFromIssuer(ctx, bondIssuer) {

        //following is required to setup the key in the proper format that getStateByPartialCompositeKey expects
        var bondKey = CommercialBond.makeKey([bondIssuer]);
        var org = CommercialBond.splitKey(bondKey);
        var iterator = await ctx.stub.getStateByPartialCompositeKey("org.bondnet.commercialbondlist", org);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));
                
                const Key = res.value.key;
                let Record;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                allResults.push({ Key, Record });
            }
            if (res.done) {
                console.log('end of data');
                await iterator.close();
                console.info(allResults);
                return JSON.stringify(allResults);
            }
        }
    }
    /**
    * Get commercial bond rate
    * @param {Context} ctx the transaction context
    * @param {String} issuer commercial bond issuer
    * @param {Integer} bondNumber bond number for this issuer
    */
    async getBondRate(ctx, issuer, bondNumber) {
        try {
            console.log("getBondRate for: " + issuer + " " + bondNumber);
            let bondKey = CommercialBond.makeKey([issuer, bondNumber]);
            let bond = await ctx.bondList.getBond(bondKey);
            return bond.interestRate;
        } catch (e) {
            throw new Error('bond does not exist: ' + issuer + ' ' + bondNumber);
        }
    }
    /**
    * Get the commercial bond rate from a bond that has the same month maturityDate as the passed maturityDate
    * @param {Context} ctx the transaction context
    * @param {String} bondIssuer the organization that issued the bond
    * @param {String} compareMaturityDate the maturity date to compare to, i.e. "2019-04-01"
    */
    async getClosestBondRate(ctx, bondIssuer, compareMaturityDate) {
        var parse = require('date-fns/parse');
        var isSameMonth = require('date-fns/is_same_month');

        //following is required to setup the key in the proper format that getStateByPartialCompositeKey expects
        var bondKey = CommercialBond.makeKey([bondIssuer]);
        var org = CommercialBond.splitKey(bondKey);
        var iterator = await ctx.stub.getStateByPartialCompositeKey("org.bondnet.commercialbondlist",org);

        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                console.log(res.value.value.toString('utf8'));

                let Record;
                let md;
                let rate;
                let bn;
                try {
                    Record = JSON.parse(res.value.value.toString('utf8'));
                    md = Record['maturityDateTime'];
                    rate = Record['interestRate'];
                    bn = Record['bondNumber'];
                } catch (err) {
                    console.log(err);
                    Record = res.value.value.toString('utf8');
                }
                let maturityDate = parse(md, 'MM/DD/YYYY', new Date());
                let compareDate = parse(compareMaturityDate, 'MM/DD/YYYY', new Date());
                //return the rate on the first match
                if (isSameMonth(maturityDate, compareDate)) {
                    console.log(compareMaturityDate + " is the same month as bond Number " + bn + " with the interest rate " + rate);
                    await iterator.close();
                    return rate;
                }
            }
            if (res.done) {
                console.log('end of bonds by ' + bondIssuer);
                await iterator.close();
                return "";
            }
        }
    }
    /**
    * Get bond maturity date
    * @param {Context} ctx the transaction context
    * @param {String} issuer commercial bond issuer
    * @param {Integer} bondNumber bond number for this issuer
    */
    async getBondMaturityDate(ctx, issuer, bondNumber) {
        try {
            console.log("getBondMaturityDate for: " + issuer + " " + bondNumber);
            let bondKey = CommercialBond.makeKey([issuer, bondNumber]);
            let bond = await ctx.bondList.getBond(bondKey);
            return bond.maturityDateTime;
        } catch (e) {
            throw new Error('bond does not exist: ' + issuer + ' ' + bondNumber);
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
     * @param {Float} interestRate market interest rate of bond
    */
    async issue(ctx, issuer, bondNumber, issueDateTime, maturityDateTime, faceValue, interestRate) {

        // create an instance of the bond
        let bond = CommercialBond.createInstance(issuer, bondNumber, issueDateTime, maturityDateTime, faceValue, interestRate);

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
