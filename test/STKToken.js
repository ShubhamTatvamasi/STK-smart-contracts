var STKToken = artifacts.require("./STKToken.sol");

contract('STKToken', accounts => {
  userAccount = accounts[0] ;
  it("We should have 1 billion tokens in first account", async()=> {
      const instance = await STKToken.deployed();
      const balance = await instance.balanceOf(userAccount);
      assert.equal(balance.valueOf(), 1000000000, '1 billion was not in the first account');
  });

  it('The Token symbol should be STK',async()=> {
      const instance = await STKToken.deployed();
      const symbol = await instance.symbol.call();
      assert.equal(symbol,'STK','Symbol is not STK');
    });
});
