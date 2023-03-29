import { Button, Divider, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import MakerOrderManagerAbi from "../../abis/MakerOrderManager.json";
import GridAbi from "../../abis/Grid.json";
import IERC20UpgradeableAbi from "../../abis/IERC20Upgradeable.json";
import TickCalculator from "../TickCalculator/TickCalculator";
import Info from "../Info/Info";
import MakerOrder from "../MakerOrder/MakerOrder";
import AmountCalculator from "../AmountCalculator/AmountCalculator";

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

  const submitMakerOrders = async (makeAmountETH: string, makeAmountGDX: string, tickETH: string, tickGDX: string) => {
    if (makerOrderManagerContract === null) return;
    const datePlus1Hour: Date = new Date();
    datePlus1Hour.setHours(datePlus1Hour.getHours() + 1);

    let boundaryLowerToSubmitETH = boundaryLower;
    let boundaryLowerToSubmitGDX = boundaryLower;
    boundaryLowerToSubmitETH += Number(tickETH) * resolution;
    boundaryLowerToSubmitGDX += Number(tickGDX) * resolution;

    const amountETH = ethers.utils.parseEther(makeAmountETH);
    const ethParams = {
      deadline: datePlus1Hour.getTime(),
      recipient: address,
      tokenA: gdxTokenA,
      tokenB: wethTokenB,
      resolution,
      zero: false,
      boundaryLower: boundaryLowerToSubmitETH,
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
      boundaryLower: boundaryLowerToSubmitGDX,
      amount: amountGDX,
    };
    await makerOrderManagerContract.placeMakerOrder(gdxParams);
  };

  return (
    <Flex justify="space-around" w="100%">
      <Info
        token={"GDX"}
        isETH={true}
        approveWETH={async () => {
          return;
        }}
        approveToken={approveGDX}
        boundaryLower={boundaryLower}
        setBoundaryLower={setBoundaryLower}
        updateInfo={updateInfo}
        currentBoundary={currentBoundary}
      />
      <Divider orientation="vertical" />
      <MakerOrder
        token={"GDX"}
        balanceETH={balanceETH}
        balanceToken={balanceGDX}
        submitMakerOrders={submitMakerOrders}
      />
      <Divider orientation="vertical" />
      <Flex direction="column">
        <TickCalculator />
        <Divider mt="1rem" mb="1rem" />
        <AmountCalculator token={"GDX"} />
      </Flex>
    </Flex>
  );
};

export default GDXETH;
