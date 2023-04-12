const { network, ethers } = require('hardhat');
const {
  developmentChains,
  networkConfig,
} = require('../hepler-hardhat-config');
const { verify } = require('../utils/verify');
const { storeNFTs } = require('../utils/uploadToNftStorage');

// address vrfCoordinatorV2,
// uint64 subscriptionId,
// bytes32 gasLane, // keyHash
// uint256 mintFee,
// uint32 callbackGasLimit,
// string[3] memory dogTokenURIs
const FUND_AMOUNT = '1000000000000000000000';
const imageLocation = './images/randomNFT/';
let tokenURIs = [
  'ipfs://bafyreihrw6j6elshreeazher5ofjum7rpst3wghxspabijmw7qrdbujava/metadata.json',
  'ipfs://bafyreiem3ixo4rw5l6l3rjt2kymblvufeiu3yrc5gbxk734imubwtyjdbq/metadata.json',
  'ipfs://bafyreidiyt4zvc3ysxlfk7gb3s7c457lkuy2cmsuntc54hakpdwdk5icd4/metadata.json',
];
// const metadataTemplate = {
//   name: '',
//   description: '',
//   image: '',
//   attributes: [{ trait_type: 'Cuteness', value: 100 }],
// };

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock;

  if (process.env.UPLOAD_TO_NFT_STORAGE == 'true') {
    tokenURIs = await handleTokenURIs();
    console.log(tokenURIs);
  }

  if (chainId == 31337) {
    //Creating vrfv2 subscription
    vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock');
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
    const tx = await vrfCoordinatorV2Mock.createSubscription();
    const txReceipt = await tx.wait();
    subscriptionId = txReceipt.events[0].args.subId;
    // Fund the subscription
    await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId][vrfCoordinatorV2];
    subscriptionId = networkConfig[chainId][subscriptionId];
  }

  log('---------------------------------');
  const args = [
    vrfCoordinatorV2Address,
    subscriptionId,
    networkConfig[chainId]['gasLane'], // gaseLane
    networkConfig[chainId]['mintFee'], // mintFee
    networkConfig[chainId]['callbackGasLimit'], // callBackGasLimit
    tokenURIs, // dogTokenURIs
  ];

  const randomIpfsNft = await deploy('RandomIpfsNft', {
    from: deployer,
    log: true,
    args: args,
    waitConfirmation: network.config.blockConfirmations || 1,
  });
  log('---------------------------------');
  log('Contract successfuly deployed');

  if (!developmentChains.includes(network.name)) {
    verify(randomIpfsNft.address, args);
  }
};

async function handleTokenURIs() {
  const imageUploadResponse = await storeNFTs(imageLocation);
  console.log(imageUploadResponse);
  for (imageUploadResponseIndex in imageUploadResponse) {
    // const ipnft = `ipfs://${imageUploadResponse[imageUploadResponseIndex].ipnft}`;
    const url = imageUploadResponse[imageUploadResponseIndex].url;
    tokenURIs.push(url);
  }
  // console.log(tokenURIs);
  return tokenURIs;
  // const url = imageUploadResponse[0].url;
  // console.log(url);
  // const response = await fetch(url);
  // const json = await response.json();
  // console.log(json.image);
  // for (imageUploadResponseIndex in imageUploadResponse) {
  //   let tokenUriMetadata = { ...metadataTemplate };
  //   tokenUriMetadata.name = imageUploadResponseIndex.replace('.png', '');
  //   tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
  //   tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
  //   console.log(`Uploading ${tokenUriMetadata.name}...`);
  //   const metadataUploadResponse = await storeTokenUriMetadata(
  //     tokenUriMetadata
  //   );
  //   tokenURIs.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
  // }
  // console.log('Token URIs uploaded! They are:');
  // console.log(tokenURIs);
  // return tokenURIs;
}

module.exports.tags = ['all', 'randomipfs', 'main'];
