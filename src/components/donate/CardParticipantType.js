import React, { useState } from "react";
import { Box, Heading, HStack, Text, Button } from "@chakra-ui/react";
import { useDonate } from "contexts/DonateContext";
import { Blur } from '../common/Blur';

const Feature = ({ title, desc, onClick, status, ...rest }) => {
    return (
      <Box
        p={5}
        mb={5}
        shadow="md"
        borderWidth="1px"
        flex="1"
        borderRadius="md"
        {...rest}
      >
        <Heading fontSize="xl">{title}</Heading>
        <Text mt={5} mb={5}>{desc}</Text>
        <Button onClick={onClick} isDisabled={status}>
          GO
        </Button>
      </Box>
    );
  };

  export const CardParticipantType = () => {
    const { setParticipantID, participantID } = useDonate();
    return (
      <Box px={8} py={24} mx="auto">
        <Blur
          position={"absolute"}
          top={-10}
          left={-10}
          style={{ filter: "blur(70px)" }}
        />
        <Feature
          title="Private sale"
          desc="Private sale for ChatPuppy"
          onClick={() => setParticipantID(1)}
          status={true}
        />
        <Feature
          title="Public sale"
          desc="Public sale for ChatPuppy"
          onClick={() => setParticipantID(2)}
          status={false}
        />
        <Feature
          title="Team"
          desc="Team members release vesting tokens"
          onClick={() => setParticipantID(3)}
          status={false}
        />
        <Feature
          title="Advisor"
          desc="Advisors release vesting tokens"
          onClick={() => setParticipantID(4)}
          status={false}
        />
        <Feature
          title="Marketing"
          desc="Marketing release vesting tokens"
          onClick={() => setParticipantID(7)}
          status={false}
        />
      </Box>
    );
  };
