/*
SPDX-License-Identifier: Apache-2.0
*/

'use strict';

// Utility class for collections of ledger states --  a state list
const StateList = require('../ledger-api/statelist.js');

const CommercialBond = require('./bond.js');

class BondList extends StateList {

    constructor(ctx) {
        super(ctx, 'org.bondnet.commercialbondlist');
        this.use(CommercialBond);
    }

    async addBond(bond) {
        return this.addState(bond);
    }

    async getBond(bondKey) {
        return this.getState(bondKey);
    }

    async updateBond(bond) {
        return this.updateState(bond);
    }
}


module.exports = BondList;