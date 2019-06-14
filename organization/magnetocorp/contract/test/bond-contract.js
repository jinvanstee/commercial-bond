/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { ChaincodeStub, ClientIdentity } = require('fabric-shim');
const { BondContract } = require('..');
const winston = require('winston');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.should();
chai.use(chaiAsPromised);
chai.use(sinonChai);

class TestContext {

    constructor() {
        this.stub = sinon.createStubInstance(ChaincodeStub);
        this.clientIdentity = sinon.createStubInstance(ClientIdentity);
        this.logging = {
            getLogger: sinon.stub().returns(sinon.createStubInstance(winston.createLogger().constructor)),
            setLevel: sinon.stub(),
        };
    }

}

describe('BondContract', () => {

    let contract;
    let ctx;

    beforeEach(() => {
        contract = new BondContract();
        ctx = new TestContext();
        ctx.stub.getState.withArgs('1001').resolves(Buffer.from('{"value":"bond 1001 value"}'));
        ctx.stub.getState.withArgs('1002').resolves(Buffer.from('{"value":"bond 1002 value"}'));
    });

    describe('#bondExists', () => {

        it('should return true for a bond', async () => {
            await contract.bondExists(ctx, '1001').should.eventually.be.true;
        });

        it('should return false for a bond that does not exist', async () => {
            await contract.bondExists(ctx, '1003').should.eventually.be.false;
        });

    });

    describe('#createBond', () => {

        it('should create a bond', async () => {
            await contract.createBond(ctx, '1003', 'bond 1003 value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1003', Buffer.from('{"value":"bond 1003 value"}'));
        });

        it('should throw an error for a bond that already exists', async () => {
            await contract.createBond(ctx, '1001', 'myvalue').should.be.rejectedWith(/The bond 1001 already exists/);
        });

    });

    describe('#readBond', () => {

        it('should return a bond', async () => {
            await contract.readBond(ctx, '1001').should.eventually.deep.equal({ value: 'bond 1001 value' });
        });

        it('should throw an error for a bond that does not exist', async () => {
            await contract.readBond(ctx, '1003').should.be.rejectedWith(/The bond 1003 does not exist/);
        });

    });

    describe('#updateBond', () => {

        it('should update a bond', async () => {
            await contract.updateBond(ctx, '1001', 'bond 1001 new value');
            ctx.stub.putState.should.have.been.calledOnceWithExactly('1001', Buffer.from('{"value":"bond 1001 new value"}'));
        });

        it('should throw an error for a bond that does not exist', async () => {
            await contract.updateBond(ctx, '1003', 'bond 1003 new value').should.be.rejectedWith(/The bond 1003 does not exist/);
        });

    });

    describe('#deleteBond', () => {

        it('should delete a bond', async () => {
            await contract.deleteBond(ctx, '1001');
            ctx.stub.deleteState.should.have.been.calledOnceWithExactly('1001');
        });

        it('should throw an error for a bond that does not exist', async () => {
            await contract.deleteBond(ctx, '1003').should.be.rejectedWith(/The bond 1003 does not exist/);
        });

    });

});