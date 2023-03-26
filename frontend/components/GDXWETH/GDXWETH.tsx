import { Button, Divider, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { BigNumber, ethers } from "ethers";
import { useEffect, useState } from "react";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import MakerOrderManagerAbi from "../../abis/MakerOrderManager.json";
import GridAbi from "../../abis/Grid.json";
import IERC20UpgradeableAbi from "../../abis/IERC20Upgradeable.json";
import TickCalculator from "../TickCalculator/TickCalculator";
import MakerOrderInBatch from "../MakerOrderInBatch/MakerOrderInBatch";
import Info from "../Info/Info";

const GDXWETH = () => {
  const { address, isConnected } = useAccount();

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

  const submitMakerOrders = async (makeAmountETH: string, makeAmountGDX: string, tickWETH: string, tickGDX: string) => {
    if (makerOrderManagerContract === null) return;
    const datePlus1Hour: Date = new Date();
    datePlus1Hour.setHours(datePlus1Hour.getHours() + 1);

    const makeAmountETHArray = makeAmountETH.split(",");
    const makeAmountGDXArray = makeAmountGDX.split(",");
    const ticksArrayWETH = tickWETH.split(",");
    const ticksArrayGDX = tickGDX.split(",");
    if (makeAmountETHArray.length !== ticksArrayWETH.length || makeAmountGDXArray.length !== ticksArrayGDX.length)
      throw Error("Amount parameters and ticks are not the same length!");
    let boundaryAndAmountParamETH = [];
    let boundaryAndAmountParamGDX = [];
    for (let i = 0; i < ticksArrayWETH.length; i++) {
      let boundaryLowerToSubmit = boundaryLower;
      boundaryLowerToSubmit += Number(ticksArrayWETH[i]) * resolution;
      boundaryAndAmountParamETH.push({
        boundaryLower: boundaryLowerToSubmit,
        amount: ethers.utils.parseEther(makeAmountETHArray[i]),
      });
    }
    for (let i = 0; i < ticksArrayGDX.length; i++) {
      let boundaryLowerToSubmit = boundaryLower;
      boundaryLowerToSubmit += Number(ticksArrayGDX[i]) * resolution;
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
    <Flex justify="space-around" w="100%">
      <Info
        token={"GDX"}
        isETH={false}
        approveWETH={approveWETH}
        approveToken={approveGDX}
        boundaryLower={boundaryLower}
        setBoundaryLower={setBoundaryLower}
        updateInfo={updateInfo}
        currentBoundary={currentBoundary}
      />
      <Divider orientation="vertical" />
      <MakerOrderInBatch
        token={"GDX"}
        balanceWETH={balanceWETH}
        balanceToken={balanceGDX}
        submitMakerOrders={submitMakerOrders}
      />
      <Divider orientation="vertical" />
      <TickCalculator />
    </Flex>
  );
};

export default GDXWETH;
