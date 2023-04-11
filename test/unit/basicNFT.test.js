const { assert } = require('chai');
const { developmentChains } = require('../../hepler-hardhat-config');
const { network, deployments, ethers } = require('hardhat');

!developmentChains.includes(network.name)
  ? describe.skip
  : describe('BasicNft Unit Test', function () {
      let basicNFT, deployer;

      beforeEach(async function () {
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(['basicnft']);
        basicNFT = await ethers.getContract('BasicNFT');
      });

      describe('Conctructor function', () => {
        it('Initializes the NFT Correctly', async function () {
          const name = await basicNFT.name();
          const symbol = await basicNFT.symbol();
          const tokenCounter = await basicNFT.getTokenCounter();
          assert.equal(name, 'Dogie');
          assert.equal(symbol, 'DOG');
          assert.equal(tokenCounter, 0);
        });
      });

      describe('Mint NFT', () => {
        beforeEach(async () => {
          // get resopnse from calling function mint and wait for 1 block of confirmations
          txResponse = await basicNFT.mintNft();
          txResponse.wait(1);
        });

        it('Allows users to mint an NFF, and updates appropriately', async function () {
          const tokenURI = await basicNFT.tokenURI(0);
          const tokenCounter = await basicNFT.getTokenCounter();

          assert.equal(tokenCounter.toString(), '1');
          assert.equal(tokenURI, await basicNFT.TOKEN_URI());
        });
        it('Shows the correct balance and owner of an NFT', async function () {
          const deployerAddress = await deployer.address;
          const deployerBalance = await basicNFT.balanceOf(deployerAddress);
          const owner = await basicNFT.ownerOf('0');

          assert.equal(deployerBalance.toString(), '1');
          assert.equal(owner, deployerAddress);
        });
      });
    });
