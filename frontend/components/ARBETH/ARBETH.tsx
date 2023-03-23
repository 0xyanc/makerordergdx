import { Button, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import MakerOrderManagerAbi from "../../abis/MakerOrderManager.json";
import GridAbi from "../../abis/Grid.json";
import IERC20UpgradeableAbi from "../../abis/IERC20Upgradeable.json";

const ARBETH = () => {
  const { address, isConnected } = useAccount();

  const [makeAmountETH, setMakeAmountETH] = useState<string>("0");
  const [makeAmountARB, setMakeAmountARB] = useState<string>("0");
  const [tick, setTick] = useState<number>(0);
  const [boundaryLower, setBoundaryLower] = useState<number>(0);
  const [currentBoundary, setCurrentBoundary] = useState<number>(0);

  const makerOrderManagerAddress: `0x${string}` = "0x36E56CC52d7A0Af506D1656765510cd930fF1595";
  const gridAddress: `0x${string}` = "0x8eb76679f7ed2a2ec0145a87fe35d67ff6e19aa6";
  const wethTokenA: `0x${string}` = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"; // $WETH
  const arbTokenB: `0x${string}` = "0x912CE59144191C1204E64559FE8253a0e49E6548"; // $ARB
  const resolution: number = 5;

  let provider = useProvider();
  let { data: signer } = useSigner();

  useEffect(() => {
    if (isConnected) getCurrentBoundaryLower();
  }, [address, isConnected]);

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
    address: wethTokenA,
    abi: IERC20UpgradeableAbi,
    signerOrProvider: signer,
  });
  const arbContract = useContract({
    address: arbTokenB,
    abi: IERC20UpgradeableAbi,
    signerOrProvider: signer,
  });

  const getCurrentBoundaryLower = async () => {
    if (gridContract === null) return;

    const slot0 = await gridContract.slot0();
    setCurrentBoundary(getBoundaryLowerAtBoundary(slot0.boundary));
  };

  const getBoundaryLowerAtBoundary = (boundary: number) => {
    return boundary - (((boundary % resolution) + resolution) % resolution);
  };

  const approve = async () => {
    if (wethContract === null || arbContract === null) return;
    await wethContract.approve(makerOrderManagerAddress, ethers.constants.MaxUint256);
    await arbContract.approve(makerOrderManagerAddress, ethers.constants.MaxUint256);
  };

  const submitMakerOrders = async () => {
    if (makerOrderManagerContract === null || gridContract === null) return;
    const datePlus1Hour: Date = new Date();
    datePlus1Hour.setHours(datePlus1Hour.getHours() + 1);
    const deadline = Math.floor(datePlus1Hour.getTime() / 1000);

    let boundaryLowerToSubmit = boundaryLower;
    console.log(boundaryLowerToSubmit);
    boundaryLowerToSubmit += tick * resolution;
    console.log(boundaryLowerToSubmit);

    const amountETH = ethers.utils.parseEther(makeAmountETH);
    const ethParams = {
      deadline,
      recipient: address,
      tokenA: wethTokenA,
      tokenB: arbTokenB,
      resolution,
      zero: false,
      boundaryLowerToSubmit,
      amount: amountETH,
    };
    await makerOrderManagerContract.placeMakerOrder(ethParams, { value: amountETH });

    const amountARB = ethers.utils.parseEther(makeAmountARB);
    const arbParams = {
      deadline,
      recipient: address,
      tokenA: wethTokenA,
      tokenB: arbTokenB,
      resolution,
      zero: true,
      boundaryLowerToSubmit,
      amount: amountARB,
    };
    await makerOrderManagerContract.placeMakerOrder(arbParams);
  };

  return (
    <>
      <Flex direction="column">
        <Heading>ARB/ETH</Heading>
        <Button colorScheme="blue" onClick={() => approve()}>
          Approve
        </Button>
        <Text fontSize="xl">Current Boundary: {currentBoundary}</Text>
        <Text as="b" fontSize="xs">
          Make Amount ETH
        </Text>
        <Input
          placeholder={"0"}
          value={makeAmountETH}
          onChange={(e) => {
            setMakeAmountETH(e.target.value);
          }}
        />
        <Text as="b" fontSize="xs">
          Make Amount $ARB
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
            setTick(Number(e.target.value));
          }}
        />
        <Button colorScheme="blue" onClick={() => submitMakerOrders()}>
          Submit Maker Orders
        </Button>
      </Flex>
    </>
  );
};

export default ARBETH;
