// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

error RandomIpfsNft__RangeOutOfBounds();
error RandomIpfsNft__NeedMoreETHSent();
error RandomIpfsNft__TransferFailed();
error RandomIpfsNft__AlreadyInitialized();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
  /* 
        when we mint NFT, we will trigger a Chainlink VRF call to get us a random number
        using that number, we will get a random NFT
        Potential NFT: Pug, Shiba Inu, St. Bernard
        Rarety: 
        Pug - super rare
        Shiba - sort of rare
        St. bernard - common

        Users also have to pay to mint NFT
        Owner of contract can withdraw funds of sold NFT
    */

  // Type decalrations
  enum Breed {
    PUG,
    SHIBA_INU,
    ST_BERNARD
  }

  // Chainlink VRF Variables
  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  uint64 private immutable i_subscriptionId;
  bytes32 private immutable i_gasLane;
  uint32 private immutable i_callbackGasLimit;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint32 private constant NUM_WORDS = 1;

  // VRF Helpers
  mapping(uint256 => address) public s_requestIdToSender;

  // NFT Variables
  uint256 public s_tokenCounter;
  uint256 internal constant MAX_CHANCE_VALUE = 100;
  string[] internal s_dogTokenURIs;
  uint256 internal i_mintFee;
  bool private s_initialized;

  // Events
  event NftRequested(uint256 indexed requestId, address requester);
  event NftMinted(Breed dogBreed, address minter);

  constructor(
    address vrfCoordinatorV2,
    uint64 subscriptionId,
    bytes32 gasLane, // keyHash
    uint256 mintFee,
    uint32 callbackGasLimit,
    string[3] memory dogTokenURIs
  ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NTF", "RIN") {
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_gasLane = gasLane;
    i_subscriptionId = subscriptionId;
    i_mintFee = mintFee;
    i_callbackGasLimit = callbackGasLimit;
    _initializeContract(dogTokenURIs);
    s_tokenCounter = 0;
  }

  function requestNft() public payable returns (uint256 requestId) {
    if (msg.value < i_mintFee) {
      revert RandomIpfsNft__NeedMoreETHSent();
    }
    // require(msg.value < i_mintFee, "Need more eth to request");
    requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane,
      i_subscriptionId,
      REQUEST_CONFIRMATIONS,
      i_callbackGasLimit,
      NUM_WORDS
    );
    s_requestIdToSender[requestId] = msg.sender;
    emit NftRequested(requestId, msg.sender);
  }

  function fulfillRandomWords(
    uint256 requestId,
    uint256[] memory randomWords
  ) internal override {
    address dogOwner = s_requestIdToSender[requestId];
    uint256 newTokenId = s_tokenCounter;

    // What does this token look like?
    uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
    // 0 - 99 range
    // 7 -> PUG
    // 88 -> St. Bernard
    // 12 -> Shiba Inu

    Breed dogBreed = getBreedFromModedRng(moddedRng);
    s_tokenCounter++;
    _safeMint(dogOwner, newTokenId);
    _setTokenURI(newTokenId, s_dogTokenURIs[uint256(dogBreed)]);
    emit NftMinted(dogBreed, dogOwner);
  }

  function withdraw() public onlyOwner {
    uint256 amount = address(this).balance;
    (bool success, ) = payable(msg.sender).call{value: amount}("");
    if (!success) {
      revert RandomIpfsNft__TransferFailed();
    }
  }

  /**
   * Returns Breed depends on chance of breed and randomly generated number
   *
   */
  function getBreedFromModedRng(uint256 moddedRng) public pure returns (Breed) {
    uint256 cumulativeSum = 0;
    uint256[3] memory chanceArray = getChanceArray();
    // moddedRng = 25
    // i = 0
    // cumulativeSum = 0
    for (uint256 i = 0; i < chanceArray.length; i++) {
      if (
        moddedRng >= cumulativeSum &&
        moddedRng <= cumulativeSum + chanceArray[i]
      ) {
        return Breed(i);
      }
      cumulativeSum += chanceArray[i];
    }
    revert RandomIpfsNft__RangeOutOfBounds();
  }

  function _initializeContract(string[3] memory _dogTokenURIs) private {
    if (s_initialized) {
      revert RandomIpfsNft__AlreadyInitialized();
    }
    s_dogTokenURIs = _dogTokenURIs;
    s_initialized = true;
  }

  function getChanceArray() public pure returns (uint256[3] memory) {
    return [10, 30, MAX_CHANCE_VALUE];
  }

  function getMintFee() public view returns (uint256) {
    return i_mintFee;
  }

  function getDogTokenURIs(uint256 index) public view returns (string memory) {
    return s_dogTokenURIs[index];
  }

  function getTokenCounter() public view returns (uint256) {
    return s_tokenCounter;
  }

  function getInitialized() public view returns (bool) {
    return s_initialized;
  }
}
