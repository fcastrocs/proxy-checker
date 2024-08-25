import Checker, { CheckConfig, Stats } from "@fcastrocs/checker-boilerplate";
import fs from "fs";
import SteamClient from "@fcastrocs/steamclient";

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
  const steamClient = new SteamClient({
    type: "tcp",
    timeout: this.config.timeout,
    proxy: {
      type: "socks",
      host: checkConfig.data.email,
      port: Number(checkConfig.data.password),
      socksType: 4,
    },
    steamCM: { host: "162.254.193.74", port: 27017 },
    minimal: true,
  });

  try {
    await steamClient.connect();
    steamClient.disconnect();
  } catch (error) {
    return checker.finishedCheck(checkConfig, "bad");
  }

  return checker.finishedCheck(checkConfig, "steamConnectable");
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
