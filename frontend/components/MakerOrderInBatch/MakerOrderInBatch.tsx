import { Button, Divider, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { useState } from "react";

const MakerOrderWithWETH = ({
  token,
  balanceWETH,
  balanceToken,
  submitMakerOrders,
}: {
  token: string;
  balanceWETH: number;
  balanceToken: number;
  submitMakerOrders: (makeAmountETH: string, makeAmountARB: string, tickWETH: string, tickARB: string) => Promise<void>;
}) => {
  const [makeAmountETH, setMakeAmountETH] = useState<string>("0");
  const [makeAmountToken, setMakeAmountToken] = useState<string>("0");
  const [tickWETH, setTickWETH] = useState<string>("0");
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
        Ticks up or down from current price <br /> (negative means higher tick)
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
        onClick={() => submitMakerOrders(makeAmountETH, makeAmountToken, tickWETH, tickToken)}
      >
        Submit Maker Orders
      </Button>
    </Flex>
  );
};

export default MakerOrderWithWETH;
