const soap = require('soap');
const path = require('path');
const { promisify } = require('util');

const DEFAULT_WSDL = path.join(__dirname, 'WebPaymentAPI.v4.44.wsdl');

module.exports = class Payline {
  constructor(user, pass, wsdl = DEFAULT_WSDL) {
    if (!user || !pass || !contractNumber) {
      throw new Error('All of user / pass / contractNumber should be defined');
    }

    this.user = user;
    this.pass = pass;
    this.contractNumber = contractNumber;
    this.wsdl = wsdl;
  }

  async initialize() {
    if (this.client) {
      return this.client;
    }

    const createClient = promisify(soap.createClient.bind(soap));

    this.client = await createClient(this.wsdl);

    this.client.setSecurity(new soap.BasicAuthSecurity(this.user, this.pass));

    return this.client;
  }

  async runAction(action, args) {
    try {
      const client = await this.initialize();

      const call = promisify(client[action].bind(client));

      return call(args);
    } catch (error) {
      if (error.message === 'client[action] is not a function') {
        throw new Error(
          'Action not found. See the methods payline.describe().'
        );
      } else {
        throw new Error(error.message);
      }
    }
  }

  async describe() {
    const client = await this.initialize();

    return client.describe();
  }
}
