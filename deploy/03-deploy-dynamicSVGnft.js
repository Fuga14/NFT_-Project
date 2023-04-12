const { network, ethers } = require('hardhat');
const {
  developmentChains,
  networkConfig,
} = require('../hepler-hardhat-config');
const { verify } = require('../utils/verify');
const fs = require('fs');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { log, deploy } = deployments;
  const deployer = await getNamedAccounts();
  const chainId = network.config.chainId;
  log('-----------------------------------');

  /* Constructor:
    address priceFeedAddress,
    string memory lowSvg,
    string memory highSvg
  */
  let priceFeedAddress;
  if (chainId == 31337) {
    const EthUsdAggregator = await deployments.get('MockV3Aggregator');
    priceFeedAddress = EthUsdAggregator.address;
  } else {
    priceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
  }
  const lowSVG = await fs.readFileSync('./images/dynamicNFT/frown.svg', {
    encoding: 'utf8',
  });
  const highSVG = await fs.readFileSync('./images/dynamicNFT/happy.svg', {
    encoding: 'utf8',
  });

  const args = [priceFeedAddress, lowSVG, highSVG];

  const dynamicSVGnft = await deploy('DynamicSvgNFT', {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log('Verifying on etherscan...');
    await verify(dynamicSVGnft.address, args);
  }
  log('-----------------------------------');
};

module.exports.tags = ['all', 'main', 'dynamicsvg'];
