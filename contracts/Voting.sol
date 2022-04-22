// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Voting contract
/// @author Grégory Seiller
/// @notice Voting contract for a small organization
contract Voting is Ownable {

    /// @notice Winning proposal Id
    /// @dev Stores the winning proposal
    uint public winningProposalID;

    /// @dev Defines a voter
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    /// @dev Defines a proposal
    struct Proposal {
        string description;
        uint voteCount;
    }

    /// @dev List of statuses
    enum  WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /// @dev Status stage
    WorkflowStatus public workflowStatus;

    /// @dev Array of proposals
    Proposal[] proposalsArray;

    /// @dev Whitelist of voters
    mapping (address => Voter) voters;

    /// @dev Voter registration event
    /// @param voterAddress Voter's address
    event VoterRegistered(address voterAddress);

    /// @dev Worflow status change event
    /// @param previousStatus Previous status
    /// @param newStatus New status
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);

    /// @dev Proposal registration event
    /// @param proposalId Proposal Id
    event ProposalRegistered(uint proposalId);

    /// @dev New vote event
    /// @param voter Voter's address
    /// @param proposalId Proposal Id
    event Voted(address voter, uint proposalId);

    /// @dev Constructor to add owner as a voter
    constructor() Ownable() {
        addVoter(msg.sender);
    }

    /// @dev Modifier to check if current sender is registered as a voter
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }
    
    /// @notice Get voter's details based on his address
    /// @dev At any time, whitelisted voters can view a voter based on address
    /// @param _addr Voter's address
    /// @return Voter's structure
    function getVoter(address _addr) external onlyVoters view returns (Voter memory) {
        return voters[_addr];
    }

    /// @notice Get a proposal
    /// @dev At any time, whitelisted voters can view a proposal based on its Id
    /// @param _id Proposal's Id
    /// @return Proposal's structure
    function getOneProposal(uint _id) external onlyVoters view returns (Proposal memory) {
        return proposalsArray[_id];
    }

    /// @notice Get all proposals
    /// @dev At any time, whitelisted voters can view the array of all proposals
    /// @return Array of proposals
    function getAllProposals() external onlyVoters view returns (Proposal[] memory) {
        return proposalsArray;
    }

    /// @notice Owner can add a new voter
    /// @dev Owner can add a new voter to the whitelist. Current status must be RegisteringVoters. Emits VoterRegistered
    /// @param _addr Voter's address
    function addVoter(address _addr) public onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
        require(voters[_addr].isRegistered != true, 'Already registered');
        voters[_addr].isRegistered = true;
        emit VoterRegistered(_addr);
    }

    /// @notice Voter can add a new proposal
    /// @dev Whitelisted voters can add a new proposal. Current status must be ProposalsRegistrationStarted. Emits ProposalRegistered
    /// @param _desc Proposal description
    function addProposal(string memory _desc) external onlyVoters {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Proposals are not allowed yet');
        require(keccak256(abi.encode(_desc)) != keccak256(abi.encode("")), 'Cannot accept an empty proposal description');
        require(proposalsArray.length < 100, 'Cannot accept more than 100 proposals');
        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        emit ProposalRegistered(proposalsArray.length-1);
    }

    /// @notice Voter can vote for a proposal
    /// @dev Whitelisted voters can vote for a unique proposal. Current status must be VotingSessionStarted. Emits Voted
    /// @param _id Proposal Id
    function setVote( uint _id) external onlyVoters {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        require(voters[msg.sender].hasVoted != true, 'You have already voted');
        require(_id < proposalsArray.length, 'Proposal not found');
        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;
        emit Voted(msg.sender, _id);
    }

    /// @notice Owner starts the proposal registration phase
    /// @dev Owner starts the proposal registration phase. Current status must be RegisteringVoters. Emits WorkflowStatusChange
    function startProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Registering proposals cant be started now');
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;
        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /// @notice Owner ends the proposal registration phase
    /// @dev Owner ends the proposal registration phase. Current status must be ProposalsRegistrationStarted. Emits WorkflowStatusChange
    function endProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Registering proposals havent started yet');
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /// @notice Owner starts the voting phase
    /// @dev Owner starts the voting phase. Current status must be ProposalsRegistrationEnded. Emits WorkflowStatusChange
    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, 'Registering proposals phase is not finished');
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /// @notice Owner ends the voting phase
    /// @dev Owner ends the voting phase. Current status must be VotingSessionStarted. Emits WorkflowStatusChange
    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }

    /// @notice Owner tallies the final votes
    /// @dev Owner tallies the final votes. Current status must be VotingSessionEnded. Maximum 100 proposals (DoS). Updates winningProposalID. Emits WorkflowStatusChange
    function tallyVotes() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
        uint _winningProposalId;
        for (uint256 p = 0; p < proposalsArray.length; p++) {
            if (proposalsArray[p].voteCount > proposalsArray[_winningProposalId].voteCount) {
                _winningProposalId = p;
            }
        }
        winningProposalID = _winningProposalId;
        workflowStatus = WorkflowStatus.VotesTallied;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }
}