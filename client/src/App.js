import React, { useEffect, useState } from "react";
import Voting from "./contracts/Voting.json";
import getWeb3 from "./getWeb3";
import Header from "./components/header";
import HorizStepper from "./components/stepper";
import Workflow from "./components/workflow";
import Whitelist from "./components/whitelist";
import FormVoter from "./components/voter";
import FormProp from "./components/proposal";
import FormVoting from "./components/voting";
import Winner from "./components/winner";
import Footer from "./components/footer";
import { Container } from "react-bootstrap";
import "./App.css";

function App() {
  const [states, setState] = useState({
    web3: null,
    accounts: null,
    contract: null,
    owner: null
  });

  const [step, setStatus] = useState("0");
  const [whitelist, setVoters] = useState([]);
  const [voter, setVoter] = useState({});
  const [proposals, setProposals] = useState([]);
  const [winner, setWinner] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = Voting.networks[networkId];
        const instance = new web3.eth.Contract(
          Voting.abi,
          deployedNetwork && deployedNetwork.address
        );
        const owner = await instance.methods.owner().call();
        const status = await instance.methods.workflowStatus().call();
        const voter = await instance.methods.getVoter(accounts[0]).call({ from: owner });
        const allProps = await instance.methods.getAllProposals().call({ from: owner });

        // web3.utils.toHex()

        setState({
          web3,
          accounts,
          contract: instance,
          owner
        });

        setStatus(status);
        setVoters(whitelist => [...whitelist, owner]);
        setVoter(voter);
        setProposals(allProps);

        // EVENTS MANAGEMENT
        await instance.events.WorkflowStatusChange()
          .on("data", event => {
            const newStatus = event.returnValues.newStatus;
            setStatus(newStatus);
            console.log("New workflow status: " + newStatus);
          })
          .on("changed", changed => console.log(changed))
          .on("error", err => console.error(err))

        await instance.events.VoterRegistered()
          .on("data", async event => {
            const newVoter = event.returnValues.voterAddress
            setVoters(whitelist => [...whitelist, newVoter]);
            console.log("New registered voter: " + newVoter);
            const voterData = await instance.methods.getVoter(newVoter).call({ from: accounts[0] });
            setVoter(voterData);
          })
          .on("changed", changed => console.log(changed))
          .on("error", err => console.error(err))

        await instance.events.ProposalRegistered()
          .on("data", async event => {
            const newPropId = event.returnValues.proposalId;
            const propDesc = await instance.methods.getOneProposal(newPropId).call({ from: accounts[0] });
            const allProps = await instance.methods.getAllProposals().call({ from: accounts[0] });
            setProposals(allProps);
            console.log("New proposal added: " + propDesc);
          })
          .on("changed", changed => console.log(changed))
          .on("error", err => console.error(err))

        await instance.events.Voted()
          .on("data", async event => {
            const voterAddr = event.returnValues.voter;
            const proposalId = event.returnValues.proposalId;
            console.log("New vote: " + voterAddr + " for proposal Id: " + proposalId);
          })
          .on("changed", changed => console.log(changed))
          .on("error", err => console.error(err))

      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (parseInt(step) === 5) {
        const winnerId = await states.contract.methods.winningProposalID().call();
        const winDesc = await states.contract.methods.getOneProposal(winnerId).call({ from: states.accounts[0] });
        setWinner(winDesc);
        console.log(winDesc);
      }
    })()
  }, [step]);

  return (
    <div className="App">
      <Header states={states} />
      {states.accounts &&
        <div>
          <div>
            <br />
            <HorizStepper step={step} />
            {states.accounts == states.owner && <Workflow states={states} step={step} />}
          </div>
          <hr />
          <Container className="w-50 p-3">
            {parseInt(step) == 0 && states.accounts == states.owner && <FormVoter states={states} voter={voter} />}
            {parseInt(step) == 0 && states.accounts == states.owner && <Whitelist whitelist={whitelist} />}
            {parseInt(step) > 0 && parseInt(step) < 3 && <FormProp states={states} voter={voter} proposals={proposals} step={step} />}
            {parseInt(step) >= 3 && parseInt(step) < 5 && voter[0] && <FormVoting voter={voter} states={states} proposals={proposals} />}
            {parseInt(step) == 5 && voter[0] && <Winner winner={winner} />}
          </Container>
          <Footer states={states} />
        </div>
      }
    </div>
  );
}

export default App;






