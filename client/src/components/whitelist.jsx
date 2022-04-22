import React from "react";
import { Container } from "react-bootstrap";

function Whitelist(props) {
  const whitelist = props.whitelist;

  return (
    <React.Fragment>
      <Container>
        <div>
        <br/>
        <h4>Whitelist</h4>
          {
            whitelist.map((address) => (<div>{address}</div>))
            // Object.entries(voters).map(address => <div key={address}>{address}</div>)
          }
        </div>
      </Container>
    </React.Fragment>
  );
}

export default Whitelist;
