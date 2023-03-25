import { Button, Divider, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useState } from "react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import MakerOrderManagerAbi from "../../abis/MakerOrderManager.json";
import GridAbi from "../../abis/Grid.json";
import IERC20UpgradeableAbi from "../../abis/IERC20Upgradeable.json";

const ARBWETH = () => {
  const { address } = useAccount();

  const [makeAmountETH, setMakeAmountETH] = useState<string>("0");
  const [makeAmountARB, setMakeAmountARB] = useState<string>("0");
  const [tickWETH, setTickWETH] = useState<string>("0");
  const [tickARB, setTickARB] = useState<string>("0");
  const [boundaryLower, setBoundaryLower] = useState<number>(0);
  const [currentBoundary, setCurrentBoundary] = useState<number>(0);
  const [balanceWETH, setBalanceWETH] = useState<number>(0);
  const [balanceARB, setbalanceARB] = useState<number>(0);
  const [currentTick, setCurrentTick] = useState<string>("0");
  const [targetTick, setTargetTick] = useState<string>("0");
  const [numberOfTicks, setNumberOfTicks] = useState<number>(0);

  const makerOrderManagerAddress: `0x${string}` = "0x36E56CC52d7A0Af506D1656765510cd930fF1595";
  const gridAddress: `0x${string}` = "0x4f97f9c261d37f645669df94e5511f48d63064e2";
  const tokenA: `0x${string}` = "0x912CE59144191C1204E64559FE8253a0e49E6548"; // $ARB
  const tokenB: `0x${string}` = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"; // $WETH
  const resolution: number = 5;
  const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

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

  const updateInfo = async () => {
    if (gridContract === null || wethContract === null || arbContract === null) return;

    const slot0 = await gridContract.slot0();
    setCurrentBoundary(getBoundaryLowerAtBoundary(slot0.boundary));
    setBoundaryLower(getBoundaryLowerAtBoundary(slot0.boundary));
    const balanceWETH = await wethContract.balanceOf(address);
    const balanceARB = await arbContract.balanceOf(address);
    setbalanceARB(Number(ethers.utils.formatEther(balanceARB)));
    setBalanceWETH(Number(ethers.utils.formatEther(balanceWETH)));
  };

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
    const ticksArrayWETH = tickWETH.split(",");
    const ticksArrayARB = tickARB.split(",");
    if (makeAmountETHArray.length !== ticksArrayWETH.length || makeAmountARBArray.length !== ticksArrayARB.length)
      throw Error("Amount parameters and ticks are not the same length!");
    let boundaryAndAmountParamETH = [];
    let boundaryAndAmountParamARB = [];
    for (let i = 0; i < ticksArrayWETH.length; i++) {
      let boundaryLowerToSubmit = boundaryLower;
      boundaryLowerToSubmit += Number(ticksArrayWETH[i]) * resolution;
      boundaryAndAmountParamETH.push({
        boundaryLower: boundaryLowerToSubmit,
        amount: ethers.utils.parseEther(makeAmountETHArray[i]),
      });
    }
    for (let i = 0; i < ticksArrayARB.length; i++) {
      let boundaryLowerToSubmit = boundaryLower;
      boundaryLowerToSubmit += Number(ticksArrayARB[i]) * resolution;
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

  const calculateNumberOfTicks = () => {
    let lowerTick = currentTick > targetTick ? targetTick : currentTick;
    let higherTick = currentTick > targetTick ? currentTick : targetTick;

    let nbTicks = 0;
    let lowerTickNumber = Number(lowerTick);
    let higherTickNumber = Number(higherTick);
    while (lowerTickNumber < higherTickNumber) {
      lowerTickNumber *= 1.0005;
      nbTicks++;
    }
    setNumberOfTicks(nbTicks);
  };

  return (
    <Flex justify="space-around" w="100%">
      <Flex direction="column">
        <Heading>ARB/WETH</Heading>
        <Button mt="1rem" colorScheme="blue" onClick={() => approveWETH()}>
          Approve WETH
        </Button>
        <Button mt="0.2rem" colorScheme="blue" onClick={() => approveARB()}>
          Approve ARB
        </Button>
        <Text mt="5rem" as="b" fontSize="xs">
          Boundary Lower
        </Text>
        <Input
          placeholder={"0"}
          value={boundaryLower}
          onChange={(e) => {
            setBoundaryLower(Number(e.target.value));
          }}
        />
        <Button colorScheme="blue" onClick={() => updateInfo()}>
          Update Boundary
        </Button>
        <Text fontSize="xl">Current Boundary: {currentBoundary}</Text>
      </Flex>

      <Divider orientation="vertical" />
      <Flex direction="column">
        <Heading>Maker Orders</Heading>
        <Heading mt="1rem" fontSize="xl">
          Buy ARB
        </Heading>
        <Flex justifyContent="space-between">
          <Text as="b" fontSize="xs">
            Amount WETH
          </Text>
          <Text fontSize="xs">
            Balance:<Text>{numberFormat.format(balanceWETH)}</Text>
          </Text>
        </Flex>
        <Input
          placeholder={"0"}
          value={makeAmountETH}
          onChange={(e) => {
            setMakeAmountETH(e.target.value);
          }}
        />
        <Text as="b" fontSize="xs">
          Ticks up or down from current price <br /> (negative means higher tick)
        </Text>
        <Input
          placeholder={"0"}
          value={tickWETH}
          onChange={(e) => {
            setTickWETH(e.target.value);
          }}
        />
        <Divider mt="1rem" />
        <Heading mt="1rem" fontSize="xl">
          Sell ARB
        </Heading>
        <Flex justifyContent="space-between">
          <Text as="b" fontSize="xs">
            Amount ARB
          </Text>
          <Text fontSize="xs">
            Balance:<Text>{numberFormat.format(balanceARB)}</Text>
          </Text>
        </Flex>
        <Input
          placeholder={"0"}
          value={makeAmountARB}
          onChange={(e) => {
            setMakeAmountARB(e.target.value);
          }}
        />

        <Text as="b" fontSize="xs">
          Ticks up or down from current price <br /> (negative means higher tick)
        </Text>
        <Input
          placeholder={"0"}
          value={tickARB}
          onChange={(e) => {
            setTickARB(e.target.value);
          }}
        />
        <Button mt="1rem" colorScheme="blue" onClick={() => submitMakerOrders()}>
          Submit Maker Orders
        </Button>
      </Flex>
      <Divider orientation="vertical" />
      <Flex direction="column">
        <Heading>Tick calculator</Heading>
        <Text as="b" fontSize="xs">
          Current tick
        </Text>
        <Input
          placeholder={"0"}
          value={currentTick}
          onChange={(e) => {
            setCurrentTick(e.target.value);
          }}
        ></Input>
        <Text as="b" fontSize="xs">
          Target tick
        </Text>
        <Input
          placeholder={"0"}
          value={targetTick}
          onChange={(e) => {
            setTargetTick(e.target.value);
          }}
        ></Input>
        <Button mt="1rem" onClick={() => calculateNumberOfTicks()} colorScheme="blue">
          Calculate
        </Button>
        <Text as="b" mt="1rem">
          Number of ticks: {numberOfTicks}
        </Text>
      </Flex>
    </Flex>
  );
};

export default ARBWETH;
