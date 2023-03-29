import { Button, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { useState } from "react";

const TickCalculator = () => {
  const [currentTick, setCurrentTick] = useState<string>("0");
  const [targetTick, setTargetTick] = useState<string>("0");
  const [numberOfTicks, setNumberOfTicks] = useState<number>(0);

  const calculateNumberOfTicks = () => {
    let lowerTick = currentTick > targetTick ? targetTick : currentTick;
    let higherTick = currentTick > targetTick ? currentTick : targetTick;

    let nbTicks = 0;
    let lowerTickNumber = Number(lowerTick);
    let higherTickNumber = Number(higherTick);
    while (lowerTickNumber < higherTickNumber) {
      lowerTickNumber *= 1.0005;
      nbTicks++;
    }
    setNumberOfTicks(nbTicks);
  };

  return (
    <Flex direction="column">
      <Heading>Tick calculator</Heading>
      <Text as="b" fontSize="xs">
        Current tick
      </Text>
      <Input
        placeholder={"0"}
        value={currentTick}
        onChange={(e) => {
          setCurrentTick(e.target.value);
        }}
      ></Input>
      <Text as="b" fontSize="xs">
        Target tick
      </Text>
      <Input
        placeholder={"0"}
        value={targetTick}
        onChange={(e) => {
          setTargetTick(e.target.value);
        }}
      ></Input>
      <Text as="b" mt="1rem">
        Number of ticks: {numberOfTicks}
      </Text>
      <Button mt="1rem" onClick={() => calculateNumberOfTicks()} colorScheme="blue">
        Calculate
      </Button>
    </Flex>
  );
};

export default TickCalculator;
