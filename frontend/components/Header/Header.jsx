import { Flex, Text } from "@chakra-ui/react";
import { Web3Button } from "@web3modal/react";
import NextLink from "next/link";
import { Link } from "@chakra-ui/react";

const Header = () => {
  return (
    <Flex h="5vh" p="2rem" justifyContent="space-between" alignItems="center">
      <Text as="b">Gridex Maker Order</Text>
      <Link as={NextLink} href="/">
        GDX/ETH
      </Link>
      <Link as={NextLink} href="/gdx-weth">
        GDX/WETH
      </Link>
      <Link as={NextLink} href="/arb-eth">
        ARB/ETH
      </Link>
      <Link as={NextLink} href="/arb-weth">
        ARB/WETH
      </Link>
      <Web3Button />
    </Flex>
  );
};

export default Header;
