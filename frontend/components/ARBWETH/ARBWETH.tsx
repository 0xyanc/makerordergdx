import { Button, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import MakerOrderManagerAbi from "../../abis/MakerOrderManager.json";
import GridAbi from "../../abis/Grid.json";
import IERC20UpgradeableAbi from "../../abis/IERC20Upgradeable.json";

const ARBWETH = () => {
  const { address, isConnected } = useAccount();

  const [makeAmountETH, setMakeAmountETH] = useState<string>("0");
  const [makeAmountARB, setMakeAmountARB] = useState<string>("0");
  const [tick, setTick] = useState<string>("0");
  const [boundaryLower, setBoundaryLower] = useState<number>(0);
  const [currentBoundary, setCurrentBoundary] = useState<number>(0);

  const makerOrderManagerAddress: `0x${string}` = "0x36E56CC52d7A0Af506D1656765510cd930fF1595";
  const gridAddress: `0x${string}` = "0x4f97f9c261d37f645669df94e5511f48d63064e2";
  const tokenA: `0x${string}` = "0x912CE59144191C1204E64559FE8253a0e49E6548"; // $ARB
  const tokenB: `0x${string}` = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"; // $WETH
  const resolution: number = 5;

  let provider = useProvider();
  let { data: signer } = useSigner();

  const makerOrderManagerContract = useContract({
    address: makerOrderManagerAddress,
    abi: MakerOrderManagerAbi,
    signerOrProvider: signer,
  });

  const gridContract = useContract({
    address: gridAddress,
    abi: GridAbi,
    signerOrProvider: provider,
  });

  const wethContract = useContract({
    address: tokenB,
    abi: IERC20UpgradeableAbi,
    signerOrProvider: signer,
  });
  const arbContract = useContract({
    address: tokenA,
    abi: IERC20UpgradeableAbi,
    signerOrProvider: signer,
  });

  const getCurrentBoundaryLower = async () => {
    if (gridContract === null) return;

    const slot0 = await gridContract.slot0();
    setCurrentBoundary(getBoundaryLowerAtBoundary(slot0.boundary));
    setBoundaryLower(getBoundaryLowerAtBoundary(slot0.boundary));
  };

  // const getLastTxBoundary = async () => {
  //   if (gridContract === null) return;
  //   const currentBlockNumber = await provider.getBlockNumber();
  //   const latestSwapEvents = await gridContract.queryFilter("Swap", currentBlockNumber - 100, currentBlockNumber);
  //   for (const swap of latestSwapEvents) {
  //     setCurrentBoundary(getBoundaryLowerAtBoundary(swap.args?.boundary));
  //     setBoundaryLower(getBoundaryLowerAtBoundary(swap.args?.boundary));
  //   }
  // };

  const getBoundaryLowerAtBoundary = (boundary: number) => {
    return boundary - (((boundary % resolution) + resolution) % resolution);
  };

  const approveWETH = async () => {
    if (wethContract === null) return;
    await wethContract.approve(makerOrderManagerAddress, ethers.constants.MaxUint256);
  };

  const approveARB = async () => {
    if (arbContract === null) return;
    await arbContract.approve(makerOrderManagerAddress, ethers.constants.MaxUint256);
  };

  const submitMakerOrders = async () => {
    if (makerOrderManagerContract === null || gridContract === null) return;
    const datePlus1Hour: Date = new Date();
    datePlus1Hour.setHours(datePlus1Hour.getHours() + 1);

    const makeAmountETHArray = makeAmountETH.split(",");
    const makeAmountARBArray = makeAmountARB.split(",");
    const ticksArray = tick.split(",");
    if (makeAmountETHArray.length !== ticksArray.length || makeAmountARBArray.length !== ticksArray.length)
      throw Error("Amount parameters and ticks are not the same length!");
    let boundaryAndAmountParamETH = [];
    let boundaryAndAmountParamARB = [];
    for (let i = 0; i < ticksArray.length; i++) {
      let boundaryLowerToSubmit = boundaryLower;
      boundaryLowerToSubmit += Number(ticksArray[i]) * resolution;
      boundaryAndAmountParamETH.push({
        boundaryLower: boundaryLowerToSubmit,
        amount: ethers.utils.parseEther(makeAmountETHArray[i]),
      });
      boundaryAndAmountParamARB.push({
        boundaryLower: boundaryLowerToSubmit,
        amount: ethers.utils.parseEther(makeAmountARBArray[i]),
      });
    }

    const ethParams = {
      deadline: datePlus1Hour.getTime(),
      recipient: address,
      tokenA: tokenA,
      tokenB: tokenB,
      resolution,
      zero: true,
      orders: boundaryAndAmountParamETH,
    };
    makerOrderManagerContract.placeMakerOrderInBatch(ethParams);

    const arbParams = {
      deadline: datePlus1Hour.getTime(),
      recipient: address,
      tokenA: tokenA,
      tokenB: tokenB,
      resolution,
      zero: false,
      orders: boundaryAndAmountParamARB,
    };
    await makerOrderManagerContract.placeMakerOrderInBatch(arbParams);
  };

  return (
    <>
      <Flex direction="column">
        <Heading>ARB/WETH</Heading>
        <Button mt="1rem" colorScheme="blue" onClick={() => approveWETH()}>
          Approve WETH
        </Button>
        <Button mt="0.2rem" colorScheme="blue" onClick={() => approveARB()}>
          Approve ARB
        </Button>
        <Text fontSize="xl">Current Boundary: {currentBoundary}</Text>
        <Button colorScheme="blue" onClick={() => getCurrentBoundaryLower()}>
          Update Boundary
        </Button>
        <Text as="b" fontSize="xs">
          Make Amount WETH
        </Text>
        <Input
          placeholder={"0"}
          value={makeAmountETH}
          onChange={(e) => {
            setMakeAmountETH(e.target.value);
          }}
        />
        <Text as="b" fontSize="xs">
          Make Amount ARB
        </Text>
        <Input
          placeholder={"0"}
          value={makeAmountARB}
          onChange={(e) => {
            setMakeAmountARB(e.target.value);
          }}
        />
        <Text as="b" fontSize="xs">
          Boundary Lower
        </Text>
        <Input
          placeholder={"0"}
          value={boundaryLower}
          onChange={(e) => {
            setBoundaryLower(Number(e.target.value));
          }}
        />
        <Text as="b" fontSize="xs">
          Ticks up or down from current price
        </Text>
        <Input
          placeholder={"0"}
          value={tick}
          onChange={(e) => {
            setTick(e.target.value);
          }}
        />
        <Button mt="1rem" colorScheme="blue" onClick={() => submitMakerOrders()}>
          Submit Maker Orders
        </Button>
      </Flex>
    </>
  );
};

export default ARBWETH;
