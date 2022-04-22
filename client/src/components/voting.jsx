import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";

function FormVoting(props) {

  const states = props.states;
  const voter = props.voter;
  const proposals = props.proposals;

  const [inputVote, setinputVote] = useState("");

  function handleChange(event) {
    setinputVote(event.target.value);
  }

  async function handleSubmit() {
    const index = proposals.map((i) => i[0]).indexOf(inputVote);
    await states.contract.methods
      .setVote(index)
      .send({ from: states.accounts[0] });
    console.log("Vote for: " + inputVote);
    console.log("Index: " + index);
    window.location.reload();
  }

  return (
    <React.Fragment>
      {!voter[0] &&
        <div>
          You're not a voter !!
        </div>
      }
      {voter[0] && !voter[1] &&
      <Form>
        {proposals.map((prop) => (
          <div key={prop[0]} className="mb-3" onChange={handleChange}>
            <Form.Check
              type="radio"
              name="group"
              value={prop[0]}
              label={prop[0]}
            />
          </div>
        ))}
        <Button variant="primary" onClick={handleSubmit}>
          Set vote
        </Button>
      </Form>
      }
      {voter[0] && voter[1] &&
        <div>
        Thank you for your vote !!
      </div>
      }
    </React.Fragment>
  );
}

export default FormVoting;
