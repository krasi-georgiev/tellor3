require("@nomiclabs/hardhat-truffle5");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

//Run this commands to deploy tellor:
//npx hardhat deploy --oldtelloraddress 0xFe41Cb708CD98C5B20423433309E55b53F79134a --net rinkeby --network rinkeby
//npx hardhat deploy --oldtelloraddress 0x0Ba45A8b5d5575935B8158a88C631E9F9C95a2e5 --net  --network mainnet

task("deploy", "Deploy and verify the contracts")
  .addParam("oldtelloraddress", "The old master contract address")
  .addParam("net", "rinkeby or empty for mainnet")
  .setAction(async taskArgs => {
    console.log("deploy tellor")
    var oldtelloraddress = taskArgs.oldtelloraddress
    var network = taskArgs.net
    await run("compile");
    const Tellor = await ethers.getContractFactory("Tellor");
    const tellor= await Tellor.deploy();
    console.log("Tellor deployed to:", tellor.address);
    await tellor.deployed();
    console.log("Tellor contract deployed to:", "https://" + network + ".etherscan.io/address/" + tellor.address);
    console.log("    transaction hash:", "https://" + network + ".etherscan.io/tx/" + tellor.deployTransaction.hash);

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tx confirmation...');
    await tellor.deployTransaction.wait(3)

    console.log('submitting for etherscan verification...');

    await run("verify:verify", {
      address: tellor.address,
    },
    )

    console.log("deploy tellorMaster")
    const Master = await ethers.getContractFactory("TellorMaster");
    const master= await Master.deploy(tellor.address,oldtelloraddress);
    console.log("Tellor Master deployed to:", master.address);
    await master.deployed();
    console.log("TellorMaster deployed to:", "https://" + network + ".etherscan.io/address/" + master.address);
    console.log("    transaction hash:", "https://" + network + ".etherscan.io/tx/" + master.deployTransaction.hash);

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tx confirmation...');
    await master.deployTransaction.wait(3)

    console.log('submitting master for etherscan verification...');

    await run("verify:verify", {
      address: master.address,
      constructorArguments: [tellor.address, oldtelloraddress],
    },
    )


    const Getters = await ethers.getContractFactory("TellorGetters");
    const getters = await Getters.deploy();
    console.log("Getters deployed to:", getters.address);
    await tellor.deployed();
    console.log("TellorStake deployed to:", "https://" + network + ".etherscan.io/address/" + stake.address);
    console.log("    transaction hash:", "https://" + network + ".etherscan.io/tx/" + stake.deployTransaction.hash);

    // Wait for few confirmed transactions.
    // Otherwise the etherscan api doesn't find the deployed contract.
    console.log('waiting for tx confirmation...');
    await getters.deployTransaction.wait(3)

    console.log('submitting for etherscan verification...');

    await run("verify:verify", {
      address: getters.address,
    },
    )

    await master.changeTellorGetters(getters.address)
    console.log("tellorStake address updated to", getters.address)
  });


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
 solidity: {
    version: "0.7.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 9999
      }
    }
  },

  networks: {
    hardhat: {
      accounts: {
        mnemonic:
          "nick lucian brenda kevin sam fiscal patch fly damp ocean produce wish",
        count: 40,
      }
    },
      rinkeby: {
        url: `${process.env.NODE_URL_RINKEBY}`,
        accounts: [process.env.PRIVATE_KEY]
      },
      mainnet: {
        url: `${process.env.NODE_URL_MAINNET}`,
        accounts: [process.env.PRIVATE_KEY]
      }  
  },
  etherscan: {
      // Your API key for Etherscan
      // Obtain one at https://etherscan.io/
      apiKey: process.env.ETHERSCAN
    },

};
