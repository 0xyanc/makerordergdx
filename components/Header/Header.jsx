import { Flex, Text } from "@chakra-ui/react";
import { Web3Button } from "@web3modal/react";

const Header = () => {
  return (
    <Flex h="5vh" p="2rem" justifyContent="space-between" alignItems="center">
      <Text as="b">Gridex Maker Order</Text>
      <Web3Button />
    </Flex>
  );
};

export default Header;
