import Checker, { CheckConfig, Stats } from "@fcastrocs/checker-boilerplate";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";
import fs from "fs";
import portscanner from "portscanner";

const checker = new Checker(checkFunction, writeResultFunction, {
  checkerName: "proxy-checker",
  disableInterface: false,
});

checker.addStatsProperties({
  steamConnectable: 0,
  smtpConnectable: 0,
  bad: 0,
});

checker.start();

async function checkFunction(this: Checker, checkConfig: CheckConfig) {
  const proxy = `${checkConfig.data.email}:${Number(checkConfig.data.password)}`;
  let agent;

  try {
    if (this.config.proxy.type === "https") {
      agent = new HttpsProxyAgent(`http://${proxy}`);
    } else {
      agent = new SocksProxyAgent(`socks://${proxy}`);
    }
  } catch (error) {
    return checker.finishedCheck(checkConfig, "bad");
  }

  try {
    // console.log(agent.sockets);
    await fetch("https://steamcommunity.com/", { agent, signal: AbortSignal.timeout(this.config.timeout) });
    const socket = agent.sockets["steamcommunity.com:443:"][0];
    socket.destroy();

    portscanner.checkPortStatus(587, checkConfig.data.email, function (error, status) {
      if (error || status === "closed") {
        return checker.finishedCheck(checkConfig, "steamConnectable");
      }
      return checker.finishedCheck(checkConfig, "smtpConnectable");
    });
  } catch (error) {
    checker.finishedCheck(checkConfig, "bad");
  }
}

async function writeResultFunction(this: Checker, checkConfig: CheckConfig, result: string) {
  this.stats[result as keyof Stats]++;
  if (result === "bad") {
    return;
  }

  await fs.promises.appendFile(
    this.getResultsPath() + `/${result}.txt`,
    `${checkConfig.data.email}:${checkConfig.data.password}\n`
  );
}
