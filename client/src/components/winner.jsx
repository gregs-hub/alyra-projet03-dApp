import React from "react";
import { Container } from "react-bootstrap";

function Winner(props) {
  const winner = props.winner;

  return (
    <React.Fragment>
      <Container>
        <div>
          <br />
          <h4>Winner</h4>
            <span style={{ fontWeight: "bold" }}> {winner[0]}</span>
            <span style={{ fontStyle: "italic" }}> {`, with ${winner[1]} votes`}</span>
        </div>
      </Container>
    </React.Fragment>
  );
}

export default Winner;
