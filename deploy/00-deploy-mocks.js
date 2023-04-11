const { network } = require('hardhat');
const {
  DECIMALS,
  INITIAL_PRICE,
  developmentChains,
} = require('../hepler-hardhat-config');
const BASE_FEE = '250000000000000000'; // 0.25
const GAS_PRICE_LINK = 1e9;

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();
  const { log, deploy } = deployments;
  const chainId = network.config.chainId;

  // If we on local development network, we deploying mocks
  if (chainId == 31337) {
    log('Local network detected! Deploying mocks...');
    await deploy('VRFCoordinatorV2Mock', {
      from: deployer,
      args: [BASE_FEE, GAS_PRICE_LINK],
      log: true,
    });
    await deploy('MockV3Aggregator', {
      from: deployer,
      args: [DECIMALS, INITIAL_PRICE],
      log: true,
    });

    log('Mocks successfuly deployed on local network!');
    log('-----------------------------------');
  }
};

module.exports.tags = ['all', 'mocks', 'main'];
