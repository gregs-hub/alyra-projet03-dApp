import React from "react";
import Button from "react-bootstrap/Button";
import { Container } from "react-bootstrap";

function Workflow(props) {
  const states = props.states;
  const step = props.step;

  const handleClick = async () => {
    console.log("Step: ", step);
    if (step === "0") {
      await states.contract.methods
        .startProposalsRegistering()
        .send({ from: states.owner });
    }
    if (step === "1") {
      await states.contract.methods
        .endProposalsRegistering()
        .send({ from: states.owner });
    }
    if (step === "2") {
      await states.contract.methods
        .startVotingSession()
        .send({ from: states.owner });
    }
    if (step === "3") {
      await states.contract.methods
        .endVotingSession()
        .send({ from: states.owner });
    }
    if (step === "4") {
      await states.contract.methods.tallyVotes().send({ from: states.owner });
    }
  };

  return (
    <React.Fragment>
      <Container>
      {step === "5" ? "":
        <Button variant="outline-info" onClick={handleClick} size="sm">
          Next Step
        </Button>
      }
      </Container>
    </React.Fragment>
  );
}

export default Workflow;
