import React, { useState, useRef } from "react";
import { chakra, Box, Image, Flex, useColorModeValue, Button, useToast,
  Modal, ModalOverlay, ModalContent, ModalHeader, 
  ModalBody, ModalCloseButton, useDisclosure,
  FormControl, FormLabel, Input, Divider
} from "@chakra-ui/react";
import { useAuth } from "contexts/AuthContext";
import { ethers } from "ethers";
import nft_marketplace_abi from "abi/nft_marketplace_abi.json"
import { useNavigate } from "react-router-dom";
import BuyDialog from "./BuyDialog";
import { MARKETPLACE_ADDRESS, ETHERSCAN_BASE_URL } from "constants";
import { sortLayer, mergeLayers } from "avatar";
import mergeImages from 'merge-images';
import BoxImageSrc from "assets/mysteryBox.jpg"
import {BiHelpCircle} from 'react-icons/bi';
import ReactTooltip from 'react-tooltip';
import ConfirmationProgress from "../ConfirmationProgress";

const ListedCard = (props) => {

  let navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { tokenId, owner, orderId, price, unboxed, metadata } = props;
  const { currentAccount } = useAuth();
  const bg = useColorModeValue("gray.700", "gray.200")
  const buttonbg = useColorModeValue("white", "gray.900")
  const NFT_marketplace_contract_address = MARKETPLACE_ADDRESS;
  const [ isLoading, setIsLoading ] = useState(false);
  const [ isUpdatingPrice, setIsUpdatingPrice ] = useState(false);
  const [ imageBase64, setImageBase64 ] = useState('');
  const [ hiddenConfirmationProgress, setHiddenConfirmationProgress] = useState(true);
  const [ confirmationProgressData, setConfirmationProgressData ] = useState({value: 5, message: 'Start', step: 1});


  const toast = useToast()
  const priceRef = useRef();

  const strLevel = "LEVEL: <br/>Sum of levels of each traits, <br/>higher means more value.";
  const strExperience = "EXPERIENCE: <br/>Sum of each trait's experience, <br/>higher means more value.";
  const strRarity = "RARITY: <br/>Probability of same NFT<br/> in 1,000,000 NFTs, <br/>lower means more value.";
  const strOwner = "OWNER: <br/>Seller of NFT";

  console.log(props);

  const unlistNFT = async() => {
    setIsLoading(true)
    if(!currentAccount) return;
    try {
      const { ethereum } = window; //injected by metamask
      //connect to an ethereum node
      const provider = new ethers.providers.Web3Provider(ethereum);
      //gets the account
      const signer = provider.getSigner();
      //connects with the contract
      const NFTMarketplaceConnectedContract = new ethers.Contract(NFT_marketplace_contract_address, nft_marketplace_abi, signer);
      try {
        const tx = await NFTMarketplaceConnectedContract.cancelOrder(orderId);
        await tx.wait(2);
        setIsLoading(false);
        toast({
          title: 'Unlisted!',
          description: "This NFT is not onsale!",
          status: 'success',
          duration: 4000,
          isClosable: true,
        })
      } catch(err) {
        if(err.code === 4001) {
          toast({
            title: 'Unlist order',
            description: 'User cancel the transaction',
            status: 'warning',
            duration: 4000,
            isClosable: true,
          });
          setIsLoading(false);
        } else {
          toast({
            title: 'Cancel NFT order error',
            description: `${err.data.message}`,
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
          setIsLoading(false);
        }
      }
    } catch(err) {
      console.log(err);
    }
  }

  const updatePrice = async(e) => {
    e.preventDefault()
    setIsUpdatingPrice(true)
    if(!currentAccount) return;
    try {
      const { ethereum } = window; //injected by metamask
      //connect to an ethereum node
      const provider = new ethers.providers.Web3Provider(ethereum); 
      //gets the account
      const signer = provider.getSigner(); 
      //connects with the contract
      const NFTMarketplaceConnectedContract = new ethers.Contract(NFT_marketplace_contract_address, nft_marketplace_abi, signer);
      setHiddenConfirmationProgress(false);
      setConfirmationProgressData({step: '1/3', value: 33, message: 'Start...'});
      try {
        const tx = await NFTMarketplaceConnectedContract.updatePrice(orderId, ethers.utils.parseEther(''+priceRef.current.value))
        setConfirmationProgressData({step: '2/3', value: 66, message: 'Update price and wait confirmations...'});
        await tx.wait(2);
        setConfirmationProgressData({step: '3/3', value: 100, message: 'You have got 2 confirmations, done!'});

        setTimeout(() => {
          setIsUpdatingPrice(false);
          onClose();
        }, 2000);
      } catch(err) {
        if(err.code === 4001) {
          toast({
            title: 'Update NFT price',
            description: 'User cancel the transaction',
            status: 'warning',
            duration: 4000,
            isClosable: true,
          });
          setHiddenConfirmationProgress(true);
        } else {
          toast({
            title: 'Update NFT price',
            description: `Error ${err.data.message}`,
            status: 'error',
            duration: 4000,
            isClosable: true,
          });
          setHiddenConfirmationProgress(true);
          setIsUpdatingPrice(false);
        }
      }
    } catch(err) {
      console.log(err)
    }
  }

  const parseMetadata = (md) => {
    // Ex. 0x0622000602030a020501
    const sortedLayers = sortLayer(md.toHexString().substr(10, 12));
    const mergedLayers = mergeLayers(sortedLayers);
    if(mergedLayers.images.length === 0) return null;

    // console.log('images', mergedLayers.images);
    let level = 0;
    let experience = 0;
    let rarity = 1;
    for(let i = 0; i < mergedLayers.layers.length; i++) {
      level = level + mergedLayers.layers[i].level;
      experience = experience + mergedLayers.layers[i].experience;
      rarity = rarity * mergedLayers.layers[i].rarity / 1000000;
    }
    console.log(level, experience);
    return {
      metadata: md.toHexString(),
      level,
      experience,
      rarity: (rarity * 1000000).toFixed(4),
      images: mergedLayers.images,
      layers: mergedLayers.layers
    }
  }

  let parsedMetadata;
  if(unboxed) {
    parsedMetadata = parseMetadata(metadata);
    if(parsedMetadata !== null) {
      // console.log("===", tokenId, parsedMetadata.level, parsedMetadata.layers, parsedMetadata.images);
      mergeImages(parsedMetadata.images).then((b64) => {
        setImageBase64(b64);
      });
    }
  }

  const showUrl = (addr) => <a href={ETHERSCAN_BASE_URL + addr} target='_blank' rel="noreferrer">Owner: {addr.substr(0, 5) + "..." + addr.substr(addr.length - 6, 6)}</a>

  return (
  <Flex
      bg={useColorModeValue("white", "gray.800")}
      p={50}
      w="full"
      alignItems="center"
      justifyContent="center"
  >
      <Box
      maxW="xs"
      mx="auto"
      bg={useColorModeValue("white", "gray.200")}
      shadow="lg"
      rounded="lg"
    >
      <Image
        w="full"
        roundedTop="lg"
        fit="cover"
        src={unboxed && parsedMetadata !== null ? (imageBase64 === '' ? './avatar/loading.jpg' : imageBase64) : BoxImageSrc}
        alt="NFT Avatar"
      />
      <Box px={4} py={2}>
        <chakra.h1
          color={useColorModeValue("gray.800","gray.800")}
          fontWeight="bold"
          fontSize="xl"
          textTransform="uppercase"
          textAlign="right"
        >
          ID #{tokenId}
        </chakra.h1>

        <chakra.h1
            color={useColorModeValue("gray.800", "gray.800")}
            fontSize="md"
            // textTransform="uppercase"
          >
          {unboxed && parsedMetadata !== null ? 
          <Flex>
            <BiHelpCircle fontSize="xs" data-tip={strLevel} data-for="level"/>
            &nbsp;Lvl: {parsedMetadata.level} 
          </Flex> : 'This is mystery box'}
        </chakra.h1>
          <chakra.h1
            color={useColorModeValue("gray.800", "gray.800")}
            fontSize="md"
            // textTransform="uppercase"
          >
          {unboxed && parsedMetadata !== null? 
          <Flex>
            <BiHelpCircle fontSize="xs" data-tip={strExperience} data-for="exp"/>
            &nbsp;Exp: {parsedMetadata.experience}
          </Flex> : 'Please unbox it'}
        </chakra.h1>
          <chakra.h1
            color={useColorModeValue("gray.800", "gray.800")}
            fontSize="md"
            // textTransform="uppercase"
          >
          {unboxed && parsedMetadata !== null? 
          <Flex>
            <BiHelpCircle fontSize="xs" data-tip={strRarity} data-for="rat"/>
            &nbsp;Rat: {parsedMetadata.rarity}
          </Flex>  : 'and get NFT'}
        </chakra.h1>
          <chakra.h1
            color={useColorModeValue("gray.800", "gray.800")}
            fontSize="md"
            // textTransform="uppercase"
          >
           {currentAccount.toLowerCase() !== owner.toLowerCase() ? 
           <Flex>
             <BiHelpCircle fontSize="xs" data-tip={strOwner} data-for="owner"/>
             &nbsp; {showUrl(owner)}
           </Flex>: ''}
          </chakra.h1>
        <Divider h={2} mb={1}/>
        <chakra.h1
          color={useColorModeValue("gray.800","gray.800")}
          fontSize="md"
          fontWeight="bold"
        >
          Price: {parseInt(price["_hex"], 16)/Math.pow(10, 18)} CPT
        </chakra.h1>
      </Box>
      <Flex
        alignItems="center"
        justifyContent="space-between"
        px={4}
        py={2}
        roundedBottom="lg"
      >
          {currentAccount.toLowerCase()===owner.toLowerCase() ? 
          <>
          <Button mb={3} size="md" bg={buttonbg} color={bg}
          fontWeight="bold" rounded="lg" textTransform="uppercase"
          _hover={{
              bg: "gray.500",
          }}
          _focus={{
              bg: "gray.600",
          }}
          onClick={onOpen}
          >
              EDIT
          </Button>
          <Button mb={3} size="md" bg={buttonbg} color={bg}
          fontWeight="bold" rounded="lg" textTransform="uppercase"
          _hover={{
              bg: "gray.500",
          }}
          _focus={{
              bg: "gray.600",
          }}
          onClick={unlistNFT}
          isLoading={isLoading}
          >
              UNLIST
          </Button>
          </>
          : 
          <BuyDialog price={price} tokenId={tokenId} orderId={orderId}/>
          }
        </Flex>
      </Box>
      <ReactTooltip id="level" effect="solid" multiline={true} />
      <ReactTooltip id="exp" effect="solid" multiline={true} />
      <ReactTooltip id="rat" effect="solid" multiline={true} />
      <ReactTooltip id="owner" effect="solid" multiline={true} />

      <Modal 
        isOpen={isOpen} 
        // onClose={onClose}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Price</ModalHeader>
          <ModalCloseButton onClick={onClose}/>
          <ModalBody>
            <form onSubmit={updatePrice}>
                <FormControl id="price" isRequired mb="2">
                    <FormLabel>Price</FormLabel>
                    <Input type="number" ref={priceRef} min="0" step="1"/>
                </FormControl>
                <Box h={5}></Box>
                <ConfirmationProgress 
                  hidden={hiddenConfirmationProgress}
                  step={confirmationProgressData.step}
                  value={confirmationProgressData.value}
                  message={confirmationProgressData.message}
                />
                <Button colorScheme="blue" isLoading={isUpdatingPrice} my="2" type="submit" size="md">Update</Button>
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default ListedCard;