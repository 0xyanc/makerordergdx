import { Button, Divider, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useState } from "react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import MakerOrderManagerAbi from "../../abis/MakerOrderManager.json";
import GridAbi from "../../abis/Grid.json";
import IERC20UpgradeableAbi from "../../abis/IERC20Upgradeable.json";
import TickCalculator from "../TickCalculator/TickCalculator";
import Info from "../Info/Info";
import MakerOrderInBatch from "../MakerOrderInBatch/MakerOrderInBatch";
import AmountCalculator from "../AmountCalculator/AmountCalculator";

const ARBWETH = () => {
  const { address } = useAccount();

  const [boundaryLower, setBoundaryLower] = useState<number>(0);
  const [currentBoundary, setCurrentBoundary] = useState<number>(0);
  const [balanceWETH, setBalanceWETH] = useState<number>(0);
  const [balanceARB, setbalanceARB] = useState<number>(0);

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

  const submitMakerOrders = async (makeAmountETH: string, makeAmountARB: string, tickWETH: string, tickARB: string) => {
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
      boundaryLowerToSubmit += Number(ticksArrayWETH[i]) * resolution * -1;
      boundaryAndAmountParamETH.push({
        boundaryLower: boundaryLowerToSubmit,
        amount: ethers.utils.parseEther(makeAmountETHArray[i]),
      });
    }
    for (let i = 0; i < ticksArrayARB.length; i++) {
      let boundaryLowerToSubmit = boundaryLower;
      boundaryLowerToSubmit += Number(ticksArrayARB[i]) * resolution * -1;
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
    <Flex justify="space-around" w="100%">
      <Info
        token={"ARB"}
        isETH={false}
        approveWETH={approveWETH}
        approveToken={approveARB}
        boundaryLower={boundaryLower}
        setBoundaryLower={setBoundaryLower}
        updateInfo={updateInfo}
        currentBoundary={currentBoundary}
      />

      <Divider orientation="vertical" />
      <MakerOrderInBatch
        token={"ARB"}
        balanceWETH={balanceWETH}
        balanceToken={balanceARB}
        submitMakerOrders={submitMakerOrders}
      />
      <Divider orientation="vertical" />
      <Flex direction="column">
        <TickCalculator />
        <Divider mt="1rem" mb="1rem" />
        <AmountCalculator token={"ARB"} />
      </Flex>
    </Flex>
  );
};

export default ARBWETH;
