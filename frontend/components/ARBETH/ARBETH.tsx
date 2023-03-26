import { Button, Divider, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import MakerOrderManagerAbi from "../../abis/MakerOrderManager.json";
import GridAbi from "../../abis/Grid.json";
import IERC20UpgradeableAbi from "../../abis/IERC20Upgradeable.json";
import TickCalculator from "../TickCalculator/TickCalculator";
import Info from "../Info/Info";
import MakerOrder from "../MakerOrder/MakerOrder";

const ARBETH = () => {
  const { address, isConnected } = useAccount();

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

  const submitMakerOrders = async (makeAmountETH: string, makeAmountARB: string, tickETH: string, tickARB: string) => {
    if (makerOrderManagerContract === null || gridContract === null) return;
    const datePlus1Hour: Date = new Date();
    datePlus1Hour.setHours(datePlus1Hour.getHours() + 1);

    let boundaryLowerToSubmitETH = boundaryLower;
    let boundaryLowerToSubmitARB = boundaryLower;
    boundaryLowerToSubmitETH += Number(tickETH) * resolution * -1;
    boundaryLowerToSubmitARB += Number(tickARB) * resolution * -1;

    const amountETH = ethers.utils.parseEther(makeAmountETH);
    const ethParams = {
      deadline: datePlus1Hour.getTime(),
      recipient: address,
      tokenA: tokenA,
      tokenB: tokenB,
      resolution,
      zero: true,
      boundaryLower: boundaryLowerToSubmitETH,
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
      boundaryLower: boundaryLowerToSubmitARB,
      amount: amountARB,
    };
    await makerOrderManagerContract.placeMakerOrder(arbParams);
  };

  return (
    <Flex justify="space-around" w="100%">
      <Info
        token={"ARB"}
        isETH={true}
        approveWETH={async () => {
          return;
        }}
        approveToken={approveARB}
        boundaryLower={boundaryLower}
        setBoundaryLower={setBoundaryLower}
        updateInfo={updateInfo}
        currentBoundary={currentBoundary}
      />
      <Divider orientation="vertical" />
      <MakerOrder
        token={"ARB"}
        balanceETH={balanceETH}
        balanceToken={balanceARB}
        submitMakerOrders={submitMakerOrders}
      />
      <Divider orientation="vertical" />
      <TickCalculator />
    </Flex>
  );
};

export default ARBETH;
