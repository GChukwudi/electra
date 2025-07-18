/**
 * Truffle initial migration
 * Deploys the Migrations contract
 */

const Migrations = artifacts.require("Migrations");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
};