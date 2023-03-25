import { Button, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import MakerOrderManagerAbi from "../../abis/MakerOrderManager.json";
import GridAbi from "../../abis/Grid.json";
import IERC20UpgradeableAbi from "../../abis/IERC20Upgradeable.json";

const GDXETH = () => {
  const { address, isConnected } = useAccount();

  const [makeAmountETH, setMakeAmountETH] = useState<string>("0");
  const [makeAmountGDX, setMakeAmountGDX] = useState<string>("0");
  const [tick, setTick] = useState<string>("0");
  const [boundaryLower, setBoundaryLower] = useState<number>(0);
  const [currentBoundary, setCurrentBoundary] = useState<number>(0);
  const [balanceETH, setBalanceETH] = useState<number>(0);
  const [balanceGDX, setBalanceGDX] = useState<number>(0);

  const makerOrderManagerAddress: `0x${string}` = "0x36E56CC52d7A0Af506D1656765510cd930fF1595";
  const gridAddress: `0x${string}` = "0x8eb76679f7ed2a2ec0145a87fe35d67ff6e19aa6";
  const gdxTokenA: `0x${string}` = "0x2F27118E3D2332aFb7d165140Cf1bB127eA6975d";
  const wethTokenB: `0x${string}` = "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1";
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

  const gdxContract = useContract({
    address: gdxTokenA,
    abi: IERC20UpgradeableAbi,
    signerOrProvider: signer,
  });

  const updateInfo = async () => {
    if (gridContract === null || gdxContract === null || !address) return;

    const slot0 = await gridContract.slot0();
    setCurrentBoundary(getBoundaryLowerAtBoundary(slot0.boundary));
    setBoundaryLower(getBoundaryLowerAtBoundary(slot0.boundary));
    const balanceETH = await provider.getBalance(address.toString());
    const balanceGDX = await gdxContract.balanceOf(address);
    setBalanceGDX(Number(ethers.utils.formatEther(balanceGDX)));
    setBalanceETH(Number(ethers.utils.formatEther(balanceETH)));
  };

  const getBoundaryLowerAtBoundary = (boundary: number) => {
    return boundary - (((boundary % resolution) + resolution) % resolution);
  };

  const approveGDX = async () => {
    if (gdxContract === null) return;
    await gdxContract.approve(makerOrderManagerAddress, ethers.constants.MaxUint256);
  };

  const submitMakerOrders = async () => {
    if (makerOrderManagerContract === null) return;
    const datePlus1Hour: Date = new Date();
    datePlus1Hour.setHours(datePlus1Hour.getHours() + 1);

    let boundaryLowerToSubmit = boundaryLower;
    console.log(boundaryLowerToSubmit);
    boundaryLowerToSubmit += Number(tick) * resolution;
    console.log(boundaryLowerToSubmit);

    const amountETH = ethers.utils.parseEther(makeAmountETH);
    const ethParams = {
      deadline: datePlus1Hour.getTime(),
      recipient: address,
      tokenA: gdxTokenA,
      tokenB: wethTokenB,
      resolution,
      zero: false,
      boundaryLower: boundaryLowerToSubmit,
      amount: amountETH,
    };
    makerOrderManagerContract.placeMakerOrder(ethParams, { value: amountETH });

    const amountGDX = ethers.utils.parseEther(makeAmountGDX);
    const gdxParams = {
      deadline: datePlus1Hour.getTime(),
      recipient: address,
      tokenA: gdxTokenA,
      tokenB: wethTokenB,
      resolution,
      zero: true,
      boundaryLower: boundaryLowerToSubmit,
      amount: amountGDX,
    };
    await makerOrderManagerContract.placeMakerOrder(gdxParams);
  };

  return (
    <>
      <Flex direction="column">
        <Heading>GDX/ETH</Heading>
        <Button mt="0.2rem" colorScheme="blue" onClick={() => approveGDX()}>
          Approve GDX
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
            console.log(e.target.value);
            setMakeAmountETH(e.target.value);
          }}
        />
        <Flex justifyContent="space-between">
          <Text as="b" fontSize="xs">
            Amount GDX
          </Text>
          <Text fontSize="xs">
            Balance:<Text>{numberFormat.format(balanceGDX)}</Text>
          </Text>
        </Flex>
        <Input
          placeholder={"0"}
          value={makeAmountGDX}
          onChange={(e) => {
            console.log(e.target.value);
            setMakeAmountGDX(e.target.value);
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

export default GDXETH;
