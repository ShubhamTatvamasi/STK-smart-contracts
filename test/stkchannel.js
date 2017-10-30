var STKChannel = artifacts.require('./STKChannel.sol');
var STKToken  = artifacts.require('./STKToken.sol');
var sha3 = require('solidity-sha3').default;
const assertJump = require('./helpers/assertJump');
var indexes = require('./helpers/ChannelDataIndexes');
contract("STKChannel",(accounts,done)=>
{
  it("STK Channel is deployed ", function()
  {
      return STKChannel.deployed().then(done).catch(done);
  });

  it("STK Channel user acccount is the first account",async() => {
      const channel = await STKChannel.deployed();
      const data  = await channel.channelData_.call();
      const address = data[indexes.USER_ADDRESS];
      assert.equal(address.toString(),accounts[0],'accounts are not equal');
  })

  it('Second account is Recipient account',async() => {
      const channel = await STKChannel.deployed();
      const data  = await channel.channelData_.call();
      const address  = data[indexes.RECIPIENT_ADDRESS];
      assert.equal(address.toString(),accounts[1],'accounts are not equal');
  })

  it('STK Channel expiry time is 10',async() => {
      const channel = await STKChannel.deployed();
      const data  = await channel.channelData_.call();
      const timeout = data[indexes.TIMEOUT];
      assert.equal(timeout.valueOf(),10,'values are not equal');
  });

  it('Deposit 50 tokens to the stkchannel',async() => {
      const token = await STKToken .deployed();
      const channel = await STKChannel.deployed();
      await token.approve(channel.address,50);
      const allowance = await token.allowance(accounts[0],channel.address);
      await channel.deposit(50);
      const data  = await channel.channelData_.call();
      const balance = data[indexes.TOKEN_BALANCE];
      assert.equal(balance.valueOf(),50,'the deposited values are not equal');
  });

  it('Non-userAddress attempts to deposit into account',async() => {
      const token = await STKToken.deployed();
      const channel = await STKChannel.deployed();
      await token.transfer(accounts[2],50);
      const allowance = await token.allowance(accounts[2],channel.address,{from:accounts[2]});
      try
      {
          await channel.deposit(50,{from:accounts[2]});
          assert.fail('The deposit should have thrown an exception');
      }
      catch(error)
      {
          assertJump(error);
      }
  });

  it('Close the channel without a signature',async () => {
      const channel = await STKChannel.deployed();
      await channel.close(0,0,0);
      const data  = await channel.channelData_.call();
      const block = data[indexes.CLOSED_BLOCK];
      assert.isAbove(block.valueOf(),0,'closed block is not greater than zero');
  });

  it('Basic sha3 test',async() => {
      const nonce = 1;
      const amount = 0;
      const address = STKChannel.address;
      const sig = sha3(address,nonce,amount);
      const channel = await STKChannel.deployed();
      assert.equal(sig,sha3(channel.address,nonce,amount),'the sigs are not equal');
  });
});
