const { artifacts } = require("hardhat");
const helper = require("./helpers/test_helpers");
const TestLib = require("./helpers/testLib");const Master = artifacts.require("./TellorMaster.sol")
const Tellor = artifacts.require("./TellorTest.sol")
const Stake = artifacts.require("./TellorStake.sol")
const Initializer= artifacts.require("./Initializer.sol")
const ITellor = artifacts.require("./ITellor")
const BN = web3.utils.BN;
contract("Further tests", function(accounts) {
  let master;
  let env;
  const takeFifteen = async () => {
    await helper.advanceTime(60 * 18);
  };

  beforeEach("Setup contract for each test", async function() {
    tellor = await Tellor.new()
    tellorMaster = await Master.new(tellor.address)
    let stake = await Stake.new()
    await tellorMaster.changeTellorStake(stake.address)
    master = await ITellor.at(tellorMaster.address)

    for (var i = 0; i < 5; i++) {
      //print tokens
      await master.theLazyCoon(accounts[i], web3.utils.toWei("7000", "ether"));
      await master.depositStake({from: accounts[i]})
    }

    for (let index = 1; index < 50; index++) {
      await master.addTip(index, index);
    }
    await master.theLazyCoon(tellorMaster.address, web3.utils.toWei("70000", "ether"));

    env = {
      master: master,
      accounts: accounts
    }
  });

  it("Test Changing Dispute Fee", async function() {
    await master.theLazyCoon(accounts[6], web3.utils.toWei("5000", "ether"));
    await master.theLazyCoon(accounts[7], web3.utils.toWei("5000", "ether"));
    var disputeFee1 = await master.getUintVar(
      web3.utils.keccak256("disputeFee")
    );
    // newOracle = await Tellor.new();
    // await master.changeTellorContract(newOracle.address)
    await master.depositStake({ from: accounts[6] });
    await master.depositStake({ from: accounts[7] });
    assert(
      (await master.getUintVar(web3.utils.keccak256("disputeFee"))) <
        disputeFee1,
      "disputeFee should change"
    );
  });

  it("Test token fee burning", async function() {
    await master.theLazyCoon(accounts[1], web3.utils.toWei("2000", "ether"));

    await master.addTip(1, web3.utils.toWei("1000", "ether"));
    vars = await master.getNewCurrentVariables();
    assert(vars[3] >= web3.utils.toWei("1000", "ether"), "tip should be big");
    balances = [];
    for (var i = 0; i < 6; i++) {
      balances[i] = await master.balanceOf(accounts[i]);
    }
    initTotalSupply = await master.totalSupply();
    await takeFifteen();
    await TestLib.mineBlock(env);
    await takeFifteen();
    await TestLib.mineBlock(env);
    new_balances = [];
    for (var i = 0; i < 6; i++) {
      new_balances[i] = await master.balanceOf(accounts[i]);
    }
    changes = [];
    for (var i = 0; i < 6; i++) {
      changes[i] = new_balances[i] - balances[i];
    }
    newTotalSupply = await master.totalSupply();

    assert(changes[0] <= web3.utils.toWei("113.86", "ether"));
    assert(changes[1] <= web3.utils.toWei("109.24", "ether"));
    assert(changes[2] <= web3.utils.toWei("109.24", "ether"));
    assert(changes[3] <= web3.utils.toWei("109.24", "ether"));
    assert(changes[4] <= web3.utils.toWei("109.24", "ether"));

    let diff = initTotalSupply.sub(newTotalSupply);
    console.log(web3.utils.fromWei(diff, "ether"))
    assert(
      diff > web3.utils.toWei("450", "ether"),
      "total supply should drop significantly"
    );
  });

  it("Test add tip on very far out API id (or on a tblock id?)", async function() {
    await helper.expectThrow(master.addTip(web3.utils.toWei("1"), 1));
    await helper.expectThrow(master.addTip(66, 2000));
    let count = await master.getUintVar(web3.utils.keccak256("requestCount"))
    console.log(count.toString());
    assert(
      (await master.getUintVar(web3.utils.keccak256("requestCount"))) == 49
    );
    await master.addTip(50, 2000);
    assert(
      (await master.getUintVar(web3.utils.keccak256("requestCount"))) == 50
    );
    let vars = await master.getNewCurrentVariables();
    await helper.advanceTime(60 * 60 * 16);
    await TestLib.mineBlock(env);

    await helper.advanceTime(60 * 60 * 16);
    await TestLib.mineBlock(env);
    vars = await master.getNewCurrentVariables();
    // vars = await master.getLastNewValue();
    assert(vars[0] > 0);
  });
});
