import { Button, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import MakerOrderManagerAbi from "../../abis/MakerOrderManager.json";
import GridAbi from "../../abis/Grid.json";
import IERC20UpgradeableAbi from "../../abis/IERC20Upgradeable.json";
import TickCalculator from "../TickCalculator/TickCalculator";

const ARBETH = () => {
  const { address, isConnected } = useAccount();

  const [makeAmountETH, setMakeAmountETH] = useState<string>("0");
  const [makeAmountARB, setMakeAmountARB] = useState<string>("0");
  const [tick, setTick] = useState<string>("0");
  const [boundaryLower, setBoundaryLower] = useState<number>(0);
  const [currentBoundary, setCurrentBoundary] = useState<number>(0);
  const [balanceETH, setBalanceETH] = useState<number>(0);
  const [balanceARB, setbalanceARB] = useState<number>(0);

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

  const arbContract = useContract({
    address: tokenA,
    abi: IERC20UpgradeableAbi,
    signerOrProvider: signer,
  });

  const updateInfo = async () => {
    if (gridContract === null || arbContract === null || !address) return;

    const slot0 = await gridContract.slot0();
    setCurrentBoundary(getBoundaryLowerAtBoundary(slot0.boundary));
    setBoundaryLower(getBoundaryLowerAtBoundary(slot0.boundary));
    const balanceETH = await provider.getBalance(address.toString());
    const balanceARB = await arbContract.balanceOf(address);
    setbalanceARB(Number(ethers.utils.formatEther(balanceARB)));
    setBalanceETH(Number(ethers.utils.formatEther(balanceETH)));
  };

  const getBoundaryLowerAtBoundary = (boundary: number) => {
    return boundary - (((boundary % resolution) + resolution) % resolution);
  };

  const approveARB = async () => {
    if (arbContract === null) return;
    await arbContract.approve(makerOrderManagerAddress, ethers.constants.MaxUint256);
  };

  const submitMakerOrders = async () => {
    if (makerOrderManagerContract === null || gridContract === null) return;
    const datePlus1Hour: Date = new Date();
    datePlus1Hour.setHours(datePlus1Hour.getHours() + 1);

    let boundaryLowerToSubmit = boundaryLower;
    boundaryLowerToSubmit += Number(tick) * resolution * -1;

    const amountETH = ethers.utils.parseEther(makeAmountETH);
    const ethParams = {
      deadline: datePlus1Hour.getTime(),
      recipient: address,
      tokenA: tokenA,
      tokenB: tokenB,
      resolution,
      zero: true,
      boundaryLower: boundaryLowerToSubmit,
      amount: amountETH,
    };
    makerOrderManagerContract.placeMakerOrder(ethParams, { value: amountETH });

    const amountARB = ethers.utils.parseEther(makeAmountARB);
    const arbParams = {
      deadline: datePlus1Hour.getTime(),
      recipient: address,
      tokenA: tokenA,
      tokenB: tokenB,
      resolution,
      zero: false,
      boundaryLower: boundaryLowerToSubmit,
      amount: amountARB,
    };
    await makerOrderManagerContract.placeMakerOrder(arbParams);
  };

  return (
    <Flex justify="space-around" w="100%">
      <Flex direction="column">
        <Heading>ARB/ETH</Heading>
        <Button mt="0.2rem" colorScheme="blue" onClick={() => approveARB()}>
          Approve ARB
        </Button>
        <Text fontSize="xl">Current Boundary: {currentBoundary}</Text>
        <Button colorScheme="blue" onClick={() => updateInfo()}>
          Update Info
        </Button>
        <Flex justifyContent="space-between">
          <Text as="b" fontSize="xs">
            Amount ETH
          </Text>
          <Text fontSize="xs">
            Balance:<Text>{numberFormat.format(balanceETH)}</Text>
          </Text>
        </Flex>
        <Input
          placeholder={"0"}
          value={makeAmountETH}
          onChange={(e) => {
            setMakeAmountETH(e.target.value);
          }}
        />
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
      <TickCalculator />
    </Flex>
  );
};

export default ARBETH;
