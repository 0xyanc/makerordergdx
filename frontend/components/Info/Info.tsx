import { Button, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { Dispatch, SetStateAction } from "react";

const Info = ({
  token,
  approveWETH,
  approveToken,
  boundaryLower,
  setBoundaryLower,
  updateInfo,
  currentBoundary,
}: {
  token: string;
  approveWETH: () => Promise<void>;
  approveToken: () => Promise<void>;
  boundaryLower: number;
  setBoundaryLower: Dispatch<SetStateAction<number>>;
  updateInfo: () => Promise<void>;
  currentBoundary: number;
}) => {
  return (
    <Flex direction="column">
      <Heading>{token}/WETH</Heading>
      <Button mt="1rem" colorScheme="blue" onClick={() => approveWETH()}>
        Approve WETH
      </Button>
      <Button mt="0.2rem" colorScheme="blue" onClick={() => approveToken()}>
        Approve {token}
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
        Update Info
      </Button>
      <Text fontSize="xl">Current Boundary: {currentBoundary}</Text>
    </Flex>
  );
};

export default Info;
