import { Button, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import MakerOrderManagerAbi from "../../abis/MakerOrderManager.json";
import GridAbi from "../../abis/Grid.json";
import IERC20UpgradeableAbi from "../../abis/IERC20Upgradeable.json";

const GDXWETH = () => {
  const { address, isConnected } = useAccount();

  const [makeAmountETH, setMakeAmountETH] = useState<string>("0");
  const [makeAmountGDX, setMakeAmountGDX] = useState<string>("0");
  const [tick, setTick] = useState<string>("0");
  const [boundaryLower, setBoundaryLower] = useState<number>(0);
  const [currentBoundary, setCurrentBoundary] = useState<number>(0);
  const [balanceWETH, setBalanceWETH] = useState<number>(0);
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

  const wethContract = useContract({
    address: wethTokenB,
    abi: IERC20UpgradeableAbi,
    signerOrProvider: signer,
  });
  const gdxContract = useContract({
    address: gdxTokenA,
    abi: IERC20UpgradeableAbi,
    signerOrProvider: signer,
  });

  const updateInfo = async () => {
    if (gridContract === null || wethContract === null || gdxContract === null) return;

    const slot0 = await gridContract.slot0();
    setCurrentBoundary(getBoundaryLowerAtBoundary(slot0.boundary));
    setBoundaryLower(getBoundaryLowerAtBoundary(slot0.boundary));
    const balanceWETH = await wethContract.balanceOf(address);
    const balanceGDX = await gdxContract.balanceOf(address);
    setBalanceGDX(Number(ethers.utils.formatEther(balanceGDX)));
    setBalanceWETH(Number(ethers.utils.formatEther(balanceWETH)));
  };

  const getBoundaryLowerAtBoundary = (boundary: number) => {
    return boundary - (((boundary % resolution) + resolution) % resolution);
  };

  const approveWETH = async () => {
    if (wethContract === null) return;
    await wethContract.approve(makerOrderManagerAddress, ethers.constants.MaxUint256);
  };

  const approveGDX = async () => {
    if (gdxContract === null) return;
    await gdxContract.approve(makerOrderManagerAddress, ethers.constants.MaxUint256);
  };

  const submitMakerOrders = async () => {
    if (makerOrderManagerContract === null) return;
    const datePlus1Hour: Date = new Date();
    datePlus1Hour.setHours(datePlus1Hour.getHours() + 1);

    const makeAmountETHArray = makeAmountETH.split(",");
    const makeAmountGDXArray = makeAmountGDX.split(",");
    const ticksArray = tick.split(",");
    if (makeAmountETHArray.length !== ticksArray.length || makeAmountGDXArray.length !== ticksArray.length)
      throw Error("Amount parameters and ticks are not the same length!");
    let boundaryAndAmountParamETH = [];
    let boundaryAndAmountParamGDX = [];
    for (let i = 0; i < ticksArray.length; i++) {
      let boundaryLowerToSubmit = boundaryLower;
      boundaryLowerToSubmit += Number(ticksArray[i]) * resolution;
      boundaryAndAmountParamETH.push({
        boundaryLower: boundaryLowerToSubmit,
        amount: ethers.utils.parseEther(makeAmountETHArray[i]),
      });
      boundaryAndAmountParamGDX.push({
        boundaryLower: boundaryLowerToSubmit,
        amount: ethers.utils.parseEther(makeAmountGDXArray[i]),
      });
    }
    const ethParams = {
      deadline: datePlus1Hour.getTime(),
      recipient: address,
      tokenA: gdxTokenA,
      tokenB: wethTokenB,
      resolution,
      zero: false,
      orders: boundaryAndAmountParamETH,
    };
    console.log(ethParams);
    makerOrderManagerContract.placeMakerOrderInBatch(ethParams);

    const gdxParams = {
      deadline: datePlus1Hour.getTime(),
      recipient: address,
      tokenA: gdxTokenA,
      tokenB: wethTokenB,
      resolution,
      zero: true,
      orders: boundaryAndAmountParamGDX,
    };
    console.log(gdxParams);
    await makerOrderManagerContract.placeMakerOrderInBatch(gdxParams);
  };

  return (
    <>
      <Flex direction="column">
        <Heading>GDX/WETH</Heading>
        <Button mt="1rem" colorScheme="blue" onClick={() => approveWETH()}>
          Approve WETH
        </Button>
        <Button mt="0.2rem" colorScheme="blue" onClick={() => approveGDX()}>
          Approve GDX
        </Button>
        <Text fontSize="xl">Current Boundary: {currentBoundary}</Text>
        <Button colorScheme="blue" onClick={() => updateInfo()}>
          Update Boundary
        </Button>
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

export default GDXWETH;
