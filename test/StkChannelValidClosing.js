const STKChannel = artifacts.require('./STKChannel.sol')
const STKToken  = artifacts.require('./STKToken.sol')
const sha3 = require('solidity-sha3').default
var ethUtil = require('ethereumjs-util')
const assertJump = require('./helpers/assertJump');

contract("STKChannelClosing", accounts => {
  const userAddress = accounts[0]
  const stackAddress = accounts[1]

  it('Deposit 50 tokens to the stkchannel',async() => {
   	const token = await STKToken .deployed();
  const channel = await STKChannel.deployed();
  await token.approve(channel.address,50);
  const allowance = await token.allowance(accounts[0],channel.address);
  const cost  = await  channel.deposit.estimateGas(50);
  console.log('estimated gas cost of depositing into the channel -- this neglects cost of approving tokens for transfer: ' + cost );
  await channel.deposit(50);

  const balance = await channel.tokenBalance_.call();
  assert.equal(balance.valueOf(),50,'the deposited values are not equal');
  });

  it('user tries to  close the channel with a valid signature but amount is above the deposited amount', async () => {
      const nonce = 1;
      const amount = 10000;
      const address = STKChannel.address;
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[1],hash);
      const channel = await STKChannel.deployed()
      try
      {
      await channel.close(nonce,amount,signature)
      assert.fail('The amount should have caused an exception to be thrown');
      }
      catch(error)
      {
        assertJump(error);
      }
  })
  it('user closes the channel with a valid signature', async () => {
      const nonce = 1;
      const amount = 0;
      const address = STKChannel.address;
      const hash = sha3(address,nonce,amount);
      const signature = web3.eth.sign(web3.eth.accounts[1],hash);
      console.log("before deployed signature is" + signature);
      const channel = await STKChannel.deployed()
      console.log("before closed");
      const cost  = await  channel.close.estimateGas(nonce,amount,signature);
      console.log('estimated gas cost of closing the channel: ' + cost );
      await channel.close(nonce,amount,signature)
      const block = await channel.closedBlock_.call()
      console.log("after closed");
      assert.isAbove(block.valueOf(),0,'The closed block should not be zero or below')
      const addr = await channel.closingAddress_.call()
      assert.equal(addr,userAddress,'the closing address and userAddress should match')
  })
  it('Channel recipient contests the closing of the channel but the amount is above the deposited amount', async ()=>{
    const nonce = 2 ;
    const amount =10000 ;
    const address = STKChannel.address ;
    const channel = await STKChannel.deployed()
    const hash = sha3(address,nonce,amount);
    const signature = web3.eth.sign(web3.eth.accounts[0],hash);
    signatureData = ethUtil.fromRpcSig(signature)
    let v = ethUtil.bufferToHex(signatureData.v)
    let r = ethUtil.bufferToHex(signatureData.r)
    let s = ethUtil.bufferToHex(signatureData.s)
    try
    {
    await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
    assert.fail('This should have thrown due to incorrect amount ');
    }
    catch(error)
    {
      assertJump(error);
    }
  })

  it('Channel recipient contests the closing of the channel ', async ()=>{
    const nonce = 2 ;
    const amount =2 ;
    const address = STKChannel.address ;
    const channel = await STKChannel.deployed()
    const hash = sha3(address,nonce,amount);
    const signature = web3.eth.sign(web3.eth.accounts[0],hash);
    signatureData = ethUtil.fromRpcSig(signature)
    let v = ethUtil.bufferToHex(signatureData.v)
    let r = ethUtil.bufferToHex(signatureData.r)
    let s = ethUtil.bufferToHex(signatureData.s)
    const cost  = await  channel.updateClosedChannel.estimateGas(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
    console.log('estimated gas cost of contesting the channel after closing: ' + cost );
    await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
    const newAmount = await channel.amountOwed_.call();
    assert.equal(amount,newAmount,'Amount should be updated');
    const newNonce = await channel.closedNonce_.call();
    assert.equal(nonce,newNonce,'Nonce should be updated');
  })

  it('Should not be able to close the channel after it has already been closed',async()=>
  {
    const channel = await STKChannel.deployed()

    try{
      await channel.close(0,0,0);
      assert.fail('Closing should have thrown an error');
    }
    catch(error)
    {
      assertJump(error);
    }
  })

  it('Closing Address should not be able to update the channel once closed ', async() =>{
    const nonce = 3 ;
    const amount =3 ;
    const address = STKChannel.address ;
    const channel = await STKChannel.deployed()
    const hash = sha3(address,nonce,amount);
    const signature = web3.eth.sign(web3.eth.accounts[1],hash);
    signatureData = ethUtil.fromRpcSig(signature)
    let v = ethUtil.bufferToHex(signatureData.v)
    let r = ethUtil.bufferToHex(signatureData.r)
    let s = ethUtil.bufferToHex(signatureData.s)
    try {
    await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[0]});
    assert.fail('Updating channel should have thrown');
    }
    catch(error)
    {
      assertJump(error);
    }
  })

  it('Should not be able to update channel with lower nonce value ', async ()=>{
    const nonce = 1 ;
    const amount =3 ;
    const address = STKChannel.address ;
    const channel = await STKChannel.deployed()
    const hash = sha3(address,nonce,amount);
    const signature = web3.eth.sign(web3.eth.accounts[0],hash);
    signatureData = ethUtil.fromRpcSig(signature)
    let v = ethUtil.bufferToHex(signatureData.v)
    let r = ethUtil.bufferToHex(signatureData.r)
    let s = ethUtil.bufferToHex(signatureData.s)
    try
    {
      await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
      assert.fail('The channel should not have updated');
    }
    catch(error)
    {
      assertJump(error);
    }
  })

  it('The non-closing address should be able to update the state of the channel with a higher nonce', async()=>
  {
    const nonce = 3 ;
    const amount =3 ;
    const address = STKChannel.address ;
    const channel = await STKChannel.deployed()
    const hash = sha3(address,nonce,amount);
    const signature = web3.eth.sign(web3.eth.accounts[0],hash);
    signatureData = ethUtil.fromRpcSig(signature)
    let v = ethUtil.bufferToHex(signatureData.v)
    let r = ethUtil.bufferToHex(signatureData.r)
    let s = ethUtil.bufferToHex(signatureData.s)
    await channel.updateClosedChannel(nonce,amount,v,r,s,{from:web3.eth.accounts[1]});
    const newAmount = await channel.amountOwed_.call();
    assert.equal(amount,newAmount,'Amount should be updated');
    const newNonce = await channel.closedNonce_.call();
    assert.equal(nonce,newNonce,'Nonce should be updated');
  })

  it('try to settle the address before the time period is expired',async()=>
  {
      const address = STKChannel.address ;
      const channel = await STKChannel.deployed();
      try
      {
        await channel.settle();
        assert.fail('This should have thrown');
      }
      catch(error)
      {
        assertJump(error);
      }
  })
  it('Wait for block time and then try to settle ', async()=>
  {

    const channel = await STKChannel.deployed();
    const token =  await STKToken .deployed();
    const blocksToWait = await channel.timeout_.call();
    console.log('blocks to wait'+ blocksToWait.valueOf());
    for(i = 0;i< blocksToWait+2;i++)
    {
      var transaction = {from:web3.eth.accounts[0],to:web3.eth.accounts[1],gasPrice:1000000000,value:100};
      web3.eth.sendTransaction(transaction);
    }
      const depositedTokens = await  channel.tokenBalance_.call();
      console.log('Number of deposited tokens'+ depositedTokens);
      const oldUserBalance = await token.balanceOf(userAddress);
      const oldStackBalance = await token.balanceOf(stackAddress);
      const amountToBeTransferred = await channel.amountOwed_.call();
      await channel.settle();
      const newUserBalance = await token.balanceOf(userAddress);
      const newStackBalance = await token.balanceOf(stackAddress);
      assert.equal(parseInt(newStackBalance.valueOf()), parseInt(oldStackBalance.valueOf() + amountToBeTransferred.valueOf()), 'The stack account value should be credited');
      assert.equal(parseInt(newUserBalance.valueOf()),parseInt(oldUserBalance.valueOf()) + parseInt(depositedTokens.valueOf()) - parseInt(amountToBeTransferred.valueOf()),'The User address should get back the unused tokens');
    })
})
