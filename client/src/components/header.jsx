import React from "react";
import logo from "../img/logo_alary.png";
import { Navbar, Container } from "react-bootstrap";

function Header(props) {
  const title = "Proposals for a better company";
  const { owner } = props.states;

  return (
    <React.Fragment>
      <Navbar bg="dark" variant="dark">
        <Container>
          <Navbar.Brand>
            <img
              alt=""
              src={logo}
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{" "}
            {title}
          </Navbar.Brand>
          <Navbar.Collapse className="justify-content-end">
            <Navbar.Text id="Admin">Admin: {owner}</Navbar.Text>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </React.Fragment>
  );
}

export default Header;
