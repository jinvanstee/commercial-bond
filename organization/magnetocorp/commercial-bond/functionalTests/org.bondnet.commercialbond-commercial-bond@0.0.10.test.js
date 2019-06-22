/*
* Use this file for functional testing of your smart contract.
* Fill out the arguments and return values for a function and
* use the CodeLens links above the transaction blocks to
* invoke/submit transactions.
* All transactions defined in your smart contract are used here
* to generate tests, including those functions that would
* normally only be used on instantiate and upgrade operations.
* This basic test file can also be used as the basis for building
* further functional tests to run as part of a continuous
* integration pipeline, or for debugging locally deployed smart
* contracts by invoking/submitting individual transactions.
*/
/*
* Generating this test file will also trigger an npm install
* in the smart contract project directory. This installs any
* package dependencies, including fabric-network, which are
* required for this test file to be run locally.
*/

'use strict';

const assert = require('assert');
const fabricNetwork = require('fabric-network');
const SmartContractUtil = require('./js-smart-contract-util');
const os = require('os');
const path = require('path');

describe('org.bondnet.commercialbond-commercial-bond@0.0.10' , () => {

    const homedir = os.homedir();
    const walletPath = path.join(homedir, '.fabric-vscode', 'local_fabric_wallet');
    const gateway = new fabricNetwork.Gateway();
    const wallet = new fabricNetwork.FileSystemWallet(walletPath);
    const identityName = 'admin';
    let connectionProfile;

    before(async () => {
        connectionProfile = await SmartContractUtil.getConnectionProfile();
    });

    beforeEach(async () => {

        const discoveryAsLocalhost = SmartContractUtil.hasLocalhostURLs(connectionProfile);
        const discoveryEnabled = true;

        const options = {
            wallet: wallet,
            identity: identityName,
            discovery: {
                asLocalhost: discoveryAsLocalhost,
                enabled: discoveryEnabled
            }
        };

        await gateway.connect(connectionProfile, options);
    });

    afterEach(async () => {
        gateway.disconnect();
    });

    it('instantiate', async () => {
        // TODO: Update with parameters of transaction
        const args = [];

        const response = await SmartContractUtil.submitTransaction('org.bondnet.commercialbond', 'instantiate', args, gateway); // Returns buffer of transaction return value
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(10000);

    it('getBond', async () => {
        // TODO: Update with parameters of transaction
        const args = ['MagnetoCorp', '00001'];

        const response = await SmartContractUtil.submitTransaction('org.bondnet.commercialbond', 'getBond', args, gateway); // Returns buffer of transaction return value
        console.log('Query response: ', JSON.stringify(response));
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
        console.log('Process getBond transaction response.');
        const CommercialBond = require('../lib/bond.js');
        let bond = CommercialBond.fromBuffer(response);
        console.log(`${bond.issuer} commercial bond : ${bond.bondNumber} successfully retrieved with owner ${bond.owner}`);
        console.log('Transaction complete.');
        
    }).timeout(10000);

    it('issue', async () => {
        // TODO: Update with parameters of transaction
        const args = ['MagnetoCorp', '00001', '2020-05-31', '2020-11-30','5000000','0.05'];

        const response = await SmartContractUtil.submitTransaction('org.bondnet.commercialbond', 'issue', args, gateway); // Returns buffer of transaction return value
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
        console.log('Process issue transaction response.');
        const CommercialBond = require('../lib/bond.js');
        let bond = CommercialBond.fromBuffer(response);
        console.log(`${bond.issuer} commercial bond : ${bond.bondNumber} successfully issued for value ${bond.faceValue}`);
        console.log('Transaction complete.'); 
    }).timeout(10000);

    it('buy', async () => {
        // TODO: Update with parameters of transaction
        const args = [];

        const response = await SmartContractUtil.submitTransaction('org.bondnet.commercialbond', 'buy', args, gateway); // Returns buffer of transaction return value
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(10000);

    it('redeem', async () => {
        // TODO: Update with parameters of transaction
        const args = [];

        const response = await SmartContractUtil.submitTransaction('org.bondnet.commercialbond', 'redeem', args, gateway); // Returns buffer of transaction return value
        // TODO: Update with return value of transaction
        // assert.equal(JSON.parse(response.toString()), undefined);
    }).timeout(10000);

});
