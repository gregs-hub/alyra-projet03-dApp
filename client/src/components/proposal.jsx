import React, { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";

function FormProp(props) {

  const states = props.states;
  const voter = props.voter;
  const proposals = props.proposals;
  const step = props.step;

  const [inputProposal, setinputProposal] = useState("");

  function handleChange(event) {
    setinputProposal(event.target.value);
  }

  async function handleSubmit() {
      await states.contract.methods.addProposal(inputProposal).send({ from: states.accounts[0] });
;  }

  return (
    <React.Fragment>
      <Container>
      {!voter[0] && 
        <div>
          You're not a voter !!
        </div>
      }
      {voter[0] && parseInt(step) < 2 &&
        <Form>
          <Form.Group className="mb-3" controlId="exampleForm.ControlTextarea1">
            <Form.Label>Proposal</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Enter your proposal"
              value={inputProposal}
              onChange={handleChange}
            />
          </Form.Group>
          <Button variant="primary" onClick={handleSubmit}>
            Add proposal
          </Button>
        </Form>
      }
      {voter[0] &&
      <div>
        <br/>
        <h4>Proposals</h4>
          {
            proposals.map((prop) => (<div>{prop[0]}</div>))
          }
        </div>
      }
      </Container>
    </React.Fragment>
  );
}

export default FormProp;
