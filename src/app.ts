import Checker, { CheckConfig } from "checker-boilerplate";
import { SocksProxyAgent, SocksProxyAgentOptions } from "socks-proxy-agent";
import fetch from "node-fetch";

import fs from "fs";

async function checkFunction(this: Checker, checkConfig: CheckConfig) {
  const info: SocksProxyAgentOptions = {
    hostname: checkConfig.combo.user,
    port: Number(checkConfig.combo.pass),
  };

  const agent = new SocksProxyAgent(info);

  try {
    await fetch("https://steamcommunity.com/", { agent });
    return checker.finishedCheck(checkConfig, "good-proxy");
  } catch (error) {
    return checker.finishedCheck(checkConfig, "bad-proxy");
  }
}

function writeResultFunction(this: Checker, checkConfig: CheckConfig, result: string) {
  if (result === "bad-proxy") {
    this.stats.badProxy++;
    return;
  }
  this.stats.goodProxy++;
  return fs.appendFileSync(
    checker.folder + "/good-proxies.txt",
    `${checkConfig.combo.user}:${checkConfig.combo.pass}\n`
  );
}

const checker = new Checker(checkFunction, writeResultFunction, "proxy-checker", {
  disableInterface: false,
  skipProxyLoad: true,
});
checker.addStatsProperties({
  goodProxy: 0,
  badProxy: 0,
});
checker.start();
