// IMPORTS
const Voting = artifacts.require("./Voting.sol");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('Vote', accounts => {

    // VARIABLES
    const admin = accounts[0];
    const notadmin = accounts[9];

    const voterA = accounts[1];
    const voterB = accounts[2];
    const voterC = accounts[3];
    const notvoter = accounts[8];

    const propA = "This is Proposal 1";
    const propB = "This is Proposal 2";
    const propC = "This is Proposal 3";
    const emptyprop = "";

    let instance;

    // GLOBAL WORKFLOW
    describe("Validate workflow status changes and rights", () => {

        async function checkStatusChange(_status, _id, _receipt) {
            expect(new BN(_status)).to.be.bignumber.equal(new BN(_id));
            expectEvent(_receipt, "WorkflowStatusChange", { '0': new BN(_id - 1), '1': new BN(_id) });
        };

        beforeEach(async () => {
            instance = await Voting.new({ from: admin });
        });

        // Default status is 0 (RegisteringVoters)
        it('should show a default status set to 0 (RegisteringVoters)', async () => {
            const status = await instance.workflowStatus.call();
            expect(new BN(status)).to.be.bignumber.equal(new BN(0));
        });


        // Admin can switch from status 0 (RegisteringVoters) to 1 (ProposalsRegistrationStarted)
        it('should start the proposals registration and switch to status 1', async () => {
            const receipt = await instance.startProposalsRegistering({ from: admin });
            const status = await instance.workflowStatus.call();
            await checkStatusChange(status, 1, receipt);
        });

        // Admin can switch from status 1 (ProposalsRegistrationStarted) to 2 (ProposalsRegistrationEnded)
        it('should end the proposals registration and switch to status 2', async () => {
            await instance.startProposalsRegistering({ from: admin });
            const receipt = await instance.endProposalsRegistering({ from: admin });
            const status = await instance.workflowStatus.call();
            await checkStatusChange(status, 2, receipt);
        });

        // Admin can switch from status 2 (ProposalsRegistrationEnded) to 3 (VotingSessionStarted)
        it('should start voting session and switch to status 3', async () => {
            await instance.startProposalsRegistering({ from: admin });
            await instance.endProposalsRegistering({ from: admin });
            const receipt = await instance.startVotingSession({ from: admin });
            const status = await instance.workflowStatus.call();
            await checkStatusChange(status, 3, receipt);
        });

        // Admin can switch from status 3 (VotingSessionStarted) to 4 (VotingSessionEnded)
        it('should end voting session and switch to status 4', async () => {
            await instance.startProposalsRegistering({ from: admin });
            await instance.endProposalsRegistering({ from: admin });
            await instance.startVotingSession({ from: admin });
            const receipt = await instance.endVotingSession({ from: admin });
            const status = await instance.workflowStatus.call();
            await checkStatusChange(status, 4, receipt);
        });

        // Admin can switch from status 4 (VotingSessionEnded) to 5 (VotesTallied)
        it('should tallies vote and switch to status 5', async () => {
            await instance.startProposalsRegistering({ from: admin });
            await instance.endProposalsRegistering({ from: admin });
            await instance.startVotingSession({ from: admin });
            await instance.endVotingSession({ from: admin });
            const receipt = await instance.tallyVotes({ from: admin });
            const status = await instance.workflowStatus.call();
            await checkStatusChange(status, 5, receipt);
        });


        // Cannot switch to status 1 (ProposalsRegistrationStarted) if not currently in status 0 (RegisteringVoters)
        it('should not start proposals registration if not currently in RegisteringVoters status', async () => {
            await instance.startProposalsRegistering({ from: admin }); // force not to be in status 0
            await expectRevert(instance.startProposalsRegistering({ from: admin }), "Registering proposals cant be started now");
        });

        // Cannot switch to status 2 (ProposalsRegistrationEnded) if not currently in status 1 (ProposalsRegistrationStarted)
        it('should not end the proposals registration if not currently in ProposalsRegistrationStarted status', async () => {
            await expectRevert(instance.endProposalsRegistering({ from: admin }), "Registering proposals havent started yet");
        });

        // Cannot switch to status 3 (VotingSessionStarted) if not currently in status 2 (ProposalsRegistrationEnded)
        it('should not start voting session if not currently in ProposalsRegistrationEnded status', async () => {
            await expectRevert(instance.startVotingSession({ from: admin }), "Registering proposals phase is not finished");
        });

        // Cannot switch to status 4 (VotingSessionEnded) if not currently in status 3 (VotingSessionStarted)
        it('should not end voting session if not currently in VotingSessionStarted status', async () => {
            await expectRevert(instance.endVotingSession({ from: admin }), "Voting session havent started yet");
        });

        // Cannot switch to status 5 (VotesTallied) if not currently in status 4 (VotingSessionEnded)
        it('should not tally votes if not currently in VotingSessionEnded status', async () => {
            await expectRevert(instance.tallyVotes({ from: admin }), "Current status is not voting session ended");
        });


        // Only admin can start proposals registration
        it('should not start the proposals registration if not admin', async () => {
            await expectRevert(instance.startProposalsRegistering({ from: notadmin }), "Ownable: caller is not the owner");
        });

        // Only admin can end proposals registration
        it('should not end proposals registration if not admin', async () => {
            await expectRevert(instance.endProposalsRegistering({ from: notadmin }), "Ownable: caller is not the owner");
        });

        // Only admin can start voting session
        it('should not start voting session if not admin', async () => {
            await expectRevert(instance.startVotingSession({ from: notadmin }), "Ownable: caller is not the owner");
        });

        // Only admin can end voting session
        it('should not end voting session if not admin', async () => {
            await expectRevert(instance.endVotingSession({ from: notadmin }), "Ownable: caller is not the owner");
        });

        // Only admin can tally votes and get winner
        it('should not be able to tally votes if not admin', async () => {
            await expectRevert(instance.tallyVotes({ from: notadmin }), "Ownable: caller is not the owner");
        });

    });

    // REGISTRATION PHASE
    describe("Validate registration phase", () => {

        before(async () => {
            instance = await Voting.new({ from: admin });
        });

        // Admin can add a new voter during registration phase and can get a voter
        it('should add a new voter', async () => {
            const receipt = await instance.addVoter(voterA, { from: admin });
            const voter = await instance.getVoter(voterA, { from: voterA });
            expect(voter.isRegistered).to.equal(true);
            expectEvent(receipt, "VoterRegistered", { voterAddress: voterA });
        });

        // Only admin can add a new voter
        it('should not add a new voter if not admin', async () => {
            await expectRevert(instance.addVoter(voterB, { from: notadmin }), "Ownable: caller is not the owner");
        });

        // Cannot add a new voter if already registered in the list
        it('should not add a voter if already exists in the list of voters', async () => {
            await expectRevert(instance.addVoter(voterA, { from: admin }), "Already registered");
        });

        // Admin can only add new voters when status is set to RegisteringVoters
        it("should not add a new voter if the workflow status is set to another status", async () => {
            await instance.startProposalsRegistering({ from: admin });
            await expectRevert(instance.addVoter(voterA, { from: admin }), "Voters registration is not open yet");
        });

        // Only voters can get a voter in the list
        it('should not get a voter from the list if not registered as voter', async () => {
            await expectRevert(instance.getVoter(voterA, { from: notvoter }), "You're not a voter");
        });

    });

    // PROPOSALS PHASE
    describe('Validate proposals phase', () => {

        before(async () => {
            instance = await Voting.new({ from: admin });
            await instance.addVoter(voterA, { from: admin });
            await instance.addVoter(voterB, { from: admin });
        });

        // Voters cannot add new proposals when status is different from ProposalsRegistrationStarted
        it("should not add a new proposal if workflow status is not ProposalsRegistrationStarted", async () => {
            await expectRevert(instance.addProposal(propA, { from: voterA }), "Proposals are not allowed yet");
        });

        // Cannot add a proposal if not in the voters' list
        it('should not add a proposal if not a registered voter', async () => {
            await instance.startProposalsRegistering({ from: admin });
            await expectRevert(instance.addProposal(propA, { from: notvoter }), "You're not a voter");
        });

        // Cannot add an empty proposal
        it('should not add an empty proposal', async () => {
            await expectRevert(instance.addProposal(emptyprop, { from: voterA }), "Cannot accept an empty proposal description");
        });

        // A voter in the list can add one proposal
        it('should add a proposal if provided by a registered voter', async () => {
            const receiptA = await instance.addProposal(propA, { from: voterA });
            const proposalA = await instance.getOneProposal(new BN(0), { from: voterA });
            expect(proposalA.description).to.equal(propA);
            expectEvent(receiptA, "ProposalRegistered", { proposalId: new BN(0) });
        });

        // Same voter can add an additional proposal
        it('should add an additional proposal, provided by the same registered voter', async () => {
            const receiptB = await instance.addProposal(propB, { from: voterA });
            const proposalB = await instance.getOneProposal(new BN(1), { from: voterA });
            expect(proposalB.description).to.equal(propB);
            expectEvent(receiptB, "ProposalRegistered", { proposalId: new BN(1) });
        });

        // Another different voter in the list can add a proposal
        it('should add a new proposal from another registered voter', async () => {
            const receiptC = await instance.addProposal(propC, { from: voterB });
            const proposalC = await instance.getOneProposal(new BN(2), { from: voterB });
            expect(proposalC.description).to.equal(propC);
            expectEvent(receiptC, "ProposalRegistered", { proposalId: new BN(2) });
        });

        // Only voters can get a proposal in the list
        it('should not get a proposal from the list if not registered as voter', async () => {
            await expectRevert(instance.getOneProposal(new BN(2), { from: notvoter }), "You're not a voter");
        });

    });

    // VOTING PHASE
    describe('Validate voting phase', () => {

        before(async () => {
            instance = await Voting.new({ from: admin });
            await instance.addVoter(voterA, { from: admin });
            await instance.addVoter(voterB, { from: admin });
            await instance.startProposalsRegistering({ from: admin });
            await instance.addProposal(propA, { from: voterA });
            await instance.addProposal(propB, { from: voterA });
            await instance.addProposal(propC, { from: voterB });
            await instance.endProposalsRegistering({ from: admin });
        });

        // Voters can only vote when status is set to VotingSessionStarted
        it("should not vote if workflow status is not VotingSessionStarted", async () => {
            await expectRevert(instance.setVote(new BN(1), { from: voterA }), "Voting session havent started yet");
        });

        // Cannot vote if not in the voters' list
        it('should not vote if not a registered voter', async () => {
            await instance.startVotingSession({ from: admin });
            await expectRevert(instance.setVote(new BN(1), { from: notvoter }), "You're not a voter");
        });

        // A voter in the list can vote for an existing proposal
        it('should vote for an existing proposal if a registered voter', async () => {
            const receipt = await instance.setVote(new BN(1), { from: voterA });
            const voter = await instance.getVoter(voterA, { from: voterB });
            expect(voter.hasVoted).to.equal(true);
            expect(voter.votedProposalId).to.be.bignumber.equal(new BN(1));
            expectEvent(receipt, "Voted", { voter: voterA, proposalId: new BN(1)});
        });

        // A voter cannot vote twice
        it('should not vote twice', async () => {
            await expectRevert(instance.setVote(new BN(0), { from: voterA }), "You have already voted");
        });

        // A voter cannot vote for a non-existing proposal
        it('should not vote for a non-existing proposal', async () => {
            await expectRevert(instance.setVote(new BN(10), { from: voterB }), "Proposal not found");
        });

    });

    // TALLYING PHASE
    describe('Validate tallying phase', () => {

        beforeEach(async () => {
            instance = await Voting.new({ from: admin });
            await instance.addVoter(voterA, { from: admin });
            await instance.addVoter(voterB, { from: admin });
            await instance.addVoter(voterC, { from: admin });
            await instance.startProposalsRegistering({ from: admin });
            await instance.addProposal(propA, { from: voterA });
            await instance.addProposal(propB, { from: voterA });
            await instance.addProposal(propC, { from: voterB });
            await instance.endProposalsRegistering({ from: admin });
            await instance.startVotingSession({ from: admin });
            await instance.setVote(new BN(1), { from: voterA });
            await instance.setVote(new BN(1), { from: voterB });
            await instance.setVote(new BN(0), { from: voterC });
            await instance.endVotingSession({ from: admin });
            await instance.tallyVotes({ from: admin });
        });

        // Admin can tally votes and everyone in the company can get the winner
        it('should tally votes and return the winning proposal (accessible for everyone)', async () => {
            const winner = await instance.winningProposalID.call();
            expect(winner).to.be.bignumber.equal(new BN(1));
        });

        // The winning proposal should count two votes (only voters can get)
        it('should count two votes for the winning proposal', async () => {
            const propwin = await instance.getOneProposal(new BN(1), { from: voterA });
            expect(propwin.voteCount).to.be.bignumber.equal(new BN(2));
        });

        // The winning proposal should be named "This is Proposal 2" (only voters can get)
        it('should return "This is Proposal 2" as the winning proposal', async () => {
            const propwin = await instance.getOneProposal(new BN(1), { from: voterA });
            expect(propwin.description).to.equal("This is Proposal 2");
        });
        
    });

});
