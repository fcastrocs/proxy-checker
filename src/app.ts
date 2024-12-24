import Checker, { CheckConfig, Stats } from "@fcastrocs/checker-boilerplate";
import fs from "fs";
import SteamClient from "@fcastrocs/steamclient";

const servers = [

];
let index = 0;

const checker = new Checker(checkFunction, writeResultFunction, {
  checkerName: "proxy-checker",
});

checker.addStatsProperties({
  steamConnectable: 0,
  smtpConnectable: 0,
  bad: 0,
});

checker.start();

async function checkFunction(this: Checker, checkConfig: CheckConfig) {
  const steamcm = servers[((index++ % servers.length) + servers.length) % servers.length];
  const split = steamcm.split(":");

  const steamClient = new SteamClient({
    type: "tcp",
    timeout: this.config.timeout,
    proxy: {
      type: "socks",
      host: checkConfig.data.email,
      port: Number(checkConfig.data.password),
      socksType: 5,
    },
    steamCM: { host: split[0], port: Number(split[1]) },
    minimal: true,
  });

  steamClient.once("disconnected", (error) => {
    console.log(error);
  });

  try {
    await steamClient.connect();
    steamClient.disconnect();
  } catch (error) {
    return checker.finishedCheck(checkConfig, {
      res: "bad",
      data: checkConfig.data.email + ":" + checkConfig.data.password + "\n" + error.message,
    });
  }

  return checker.finishedCheck(checkConfig, { res: "steamConnectable" });
}

async function writeResultFunction(this: Checker, checkConfig: CheckConfig, result: any) {
  this.stats[result.res as keyof Stats]++;
  if (result.res === "bad") {
    await fs.promises.appendFile(this.getResultsPath() + `/${result.res}.txt`, `${result.data}\n\n`);
    return;
  }

  // await fs.promises.appendFile(
  //   this.getResultsPath() + `/${result.res}.txt`,
  //   `${checkConfig.data.email}:${checkConfig.data.password}\n`
  // );
}
