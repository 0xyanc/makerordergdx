import { Flex, Heading, Input, Table, TableContainer, Tbody, Td, Text, Th, Thead, Tr } from "@chakra-ui/react";
import { useEffect, useState } from "react";

const AmountCalculator = ({ token }: { token: string }) => {
  const [price, setPrice] = useState<string>("0");

  const [inputETH, setInputETH] = useState<string>("0");
  const [inputToken, setInputToken] = useState<string>("0");
  const [outputETH, setOutputETH] = useState<string>("0");
  const [outputToken, setOutputToken] = useState<string>("0");

  useEffect(() => {
    calculateOutputETH(inputToken);
    calculateOutputToken(inputETH);
  }, [price]);

  const calculateOutputETH = (inputToken: string) => {
    const amount = Number(inputToken) * Number(price);

    setOutputETH(new Intl.NumberFormat("en-us", { maximumFractionDigits: 5 }).format(amount));
  };

  const calculateOutputToken = (inputETH: string) => {
    const amount = Number(inputETH) / Number(price);
    setOutputToken(new Intl.NumberFormat("en-us", { maximumFractionDigits: 2 }).format(amount));
  };

  return (
    <Flex direction="column">
      <Heading>Amount calculator</Heading>
      <Text as="b" fontSize="xs">
        Price
      </Text>
      <Input
        placeholder={"0"}
        value={price}
        onChange={(e) => {
          setPrice(e.target.value);
        }}
      />
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>ETH</Th>
              <Th>{token}</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>
                <Input
                  htmlSize={4}
                  width="auto"
                  placeholder={"0"}
                  onChange={(e) => {
                    setInputETH(e.target.value);
                    calculateOutputToken(e.target.value);
                  }}
                />
              </Td>
              <Td>
                <Text as="b">{outputToken}</Text>
              </Td>
            </Tr>
            <Tr>
              <Td>
                <Text as="b">{outputETH}</Text>
              </Td>
              <Td>
                <Input
                  htmlSize={4}
                  width="auto"
                  placeholder={"0"}
                  onChange={(e) => {
                    setInputToken(e.target.value);
                    calculateOutputETH(e.target.value);
                  }}
                />
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>
    </Flex>
  );
};

export default AmountCalculator;
