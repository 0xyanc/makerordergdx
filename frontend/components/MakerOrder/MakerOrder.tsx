import { Button, Divider, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { useState } from "react";

const MakerOrder = ({
  token,
  balanceETH,
  balanceToken,
  submitMakerOrders,
}: {
  token: string;
  balanceETH: number;
  balanceToken: number;
  submitMakerOrders: (
    makeAmountETH: string,
    makeAmountToken: string,
    tickETH: string,
    tickToken: string
  ) => Promise<void>;
}) => {
  const [makeAmountETH, setMakeAmountETH] = useState<string>("0");
  const [makeAmountToken, setMakeAmountToken] = useState<string>("0");
  const [tickETH, setTickETH] = useState<string>("0");
  const [tickToken, setTickToken] = useState<string>("0");
  const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });

  return (
    <Flex direction="column">
      <Heading>Maker Orders</Heading>
      <Heading mt="1rem" fontSize="xl">
        Buy {token}
      </Heading>
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
      <Text as="b" fontSize="xs">
        Ticks up or down from current price <br /> (negative means higher tick)
      </Text>
      <Input
        placeholder={"0"}
        value={tickETH}
        onChange={(e) => {
          setTickETH(e.target.value);
        }}
      />
      <Divider mt="1rem" />
      <Heading mt="1rem" fontSize="xl">
        Sell {token}
      </Heading>
      <Flex justifyContent="space-between">
        <Text as="b" fontSize="xs">
          Amount {token}
        </Text>
        <Text fontSize="xs">
          Balance:<Text>{numberFormat.format(balanceToken)}</Text>
        </Text>
      </Flex>
      <Input
        placeholder={"0"}
        value={makeAmountToken}
        onChange={(e) => {
          setMakeAmountToken(e.target.value);
        }}
      />

      <Text as="b" fontSize="xs">
        Ticks up or down from current price <br /> (positive means higher tick)
      </Text>
      <Input
        placeholder={"0"}
        value={tickToken}
        onChange={(e) => {
          setTickToken(e.target.value);
        }}
      />
      <Button
        mt="1rem"
        colorScheme="blue"
        onClick={() => submitMakerOrders(makeAmountETH, makeAmountToken, tickETH, tickToken)}
      >
        Submit Maker Orders
      </Button>
    </Flex>
  );
};

export default MakerOrder;
