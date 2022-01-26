var TodoList = artifacts.require("./Auction.sol");

module.exports = function(deployer) {
  deployer.deploy(TodoList);
};
