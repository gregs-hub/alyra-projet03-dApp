import React from "react";
import { Container } from "react-bootstrap";

function Footer(props) {
  const { accounts, owner } = props.states;

  return (
    <React.Fragment>
      <Container>
        {accounts == owner ? (
          <footer className="App-footer">{`You are Administrator`}</footer>
        ) : (
          <footer className="App-footer">
            {`You are connected as ${accounts}`}
          </footer>
        )}
      </Container>
    </React.Fragment>
  );
}

export default Footer;
