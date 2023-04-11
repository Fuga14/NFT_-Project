const { network, ethers } = require('hardhat');
const { developmentChains } = require('../hepler-hardhat-config');
const { verify } = require('../utils/verify');
const { storeNFTs } = require('../utils/uploadToNftStorage');
const { networkConfig } = require('../hepler-hardhat-config');

// address vrfCoordinatorV2,
// uint64 subscriptionId,
// bytes32 gasLane, // keyHash
// uint256 mintFee,
// uint32 callbackGasLimit,
// string[3] memory dogTokenURIs
let tokenURIs = [];
const imageLocation = './images/randomNFT/';
const metadataTemplate = {
  name: '',
  description: '',
  image: '',
  attributes: [{ trait_type: 'Cuteness', value: 100 }],
};

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  // getting IPFS hashes of our images

  let vrfCoordinatorV2Address, subscriptionId;

  if (process.env.UPLOAD_TO_NFT_STORAGE == 'true') {
    tokenURIs = await handleTokenURIs();
  }
  console.log(tokenURIs);
  if (developmentChains.includes(network.name)) {
    const vrfCoordinatorV2 = await ethers.getContract('VRFCoordinatorV2Mock');
    vrfCoordinatorV2Address = vrfCoordinatorV2.address;
    const tx = await vrfCoordinatorV2.createSubscription();
    const txReceipt = await tx.wait(1);
    subscriptionId = txReceipt.events[0].args.subId;
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
    networkConfig[chainId]['callBackGasLimit'], // callBackGasLimit
    '', // dogTokenURIs
  ];
};

async function handleTokenURIs() {
  const imageUploadResponse = await storeNFTs(imageLocation);
  console.log(imageUploadResponse);
  for (imageUploadResponseIndex in imageUploadResponse) {
    url = imageUploadResponse[imageUploadResponseIndex].url;
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
