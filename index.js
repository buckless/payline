const soap = require("soap");
const wsdl = require("soap/lib/wsdl");
const { promisify } = require("util");

const productionWsdl = require("./WebPaymentAPI.v4.60.wsdl");
const homologationWsdl = require("./WebPaymentAPI.v4.60.homologation.wsdl");

module.exports = class Payline {
  constructor(user, pass, environment = "production", customWsdl) {
    const wsdl =
      customWsdl ||
      (environment === "production" ? productionWsdl : homologationWsdl);

    if (!user || !pass) {
      throw new Error("All of user / pass should be defined");
    }

    this.user = user;
    this.pass = pass;
    this.wsdl = wsdl;
  }

  async initialize() {
    if (this.client) {
      return this.client;
    }

    const parsedWsdl = new wsdl.WSDL(wsdl, "https://example.com", {});

    await new Promise((resolve, reject) => {
      parsedWsdl.onReady((err) => {
        if (err) return reject(err);

        resolve();
      });
    });

    this.client = new soap.Client(parsedWsdl);

    this.client.setSecurity(new soap.BasicAuthSecurity(this.user, this.pass));

    return this.client;
  }

  async runAction(action, args) {
    try {
      const client = await this.initialize();

      const call = promisify(client[action].bind(client));

      return call(args);
    } catch (error) {
      if (error.message === "client[action] is not a function") {
        throw new Error(
          "Action not found. See the methods payline.describe()."
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
};
