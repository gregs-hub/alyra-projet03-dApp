import React, { useState } from "react";
import { Form, Button, Container } from "react-bootstrap";

function FormVoter(props) {
  const states = props.states;

  const [inputAddress, setInputAddress] = useState("");

  function handleChange(event) {
    setInputAddress(event.target.value);
  }

  async function handleSubmit() {
    try {
      await states.contract.methods
        .addVoter(inputAddress)
        .send({ from: states.owner });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <React.Fragment>
      <Container>
        <Form>
          <Form.Group className="mb-3">
            <Form.Control
              type="text"
              placeholder="Enter voter address"
              value={inputAddress}
              onChange={handleChange}
            />
          </Form.Group>
          <Button variant="primary" onClick={handleSubmit}>
            Add voter
          </Button>
        </Form>
      </Container>
    </React.Fragment>
  );
}

export default FormVoter;
