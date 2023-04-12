const { ethers, network, deployments } = require('hardhat');
const { assert, expect } = require('chai');
const { developmentChains } = require('../../hepler-hardhat-config');

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('Contract Random IPFS NFT Unit Test', function () {
      let randomIpfsNft, deployer, vrfCoordinatorV2Mock;

      beforeEach(async () => {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(['mocks', 'randomipfs']);
        randomIpfsNft = await ethers.getContract('RandomIpfsNft');
        vrfCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock');
      });

      describe('Consctructor function', () => {
        it('Sets starting values correctly', async () => {
          const tokenURIs = await randomIpfsNft.getDogTokenURIs(0);
          const initialized = await randomIpfsNft.getInitialized();
          const tokenCounter = await randomIpfsNft.getTokenCounter();
          assert(tokenURIs.includes('ipfs://'));
          assert.equal(initialized, true);
          assert.equal(tokenCounter, 0);
        });
      });

      // Checks for request nft function
      describe('Request Nft function', function () {
        it("fails if payment isn't sent with the request ", async () => {
          await expect(
            randomIpfsNft.requestNft()
          ).to.be.revertedWithCustomError(
            randomIpfsNft,
            'RandomIpfsNft__NeedMoreETHSent'
          );
        });
        it('fails when msg.value exist but less than mint fee', async () => {
          const mintFee = await randomIpfsNft.getMintFee();
          await expect(
            randomIpfsNft.requestNft({
              value: ethers.utils.parseEther('0.001'),
            })
          ).to.be.revertedWithCustomError(
            randomIpfsNft,
            'RandomIpfsNft__NeedMoreETHSent'
          );
        });
      });
    });
