import Checker, { CheckConfig, Stats } from "@fcastrocs/checker-boilerplate";
import { SocksProxyAgent } from "socks-proxy-agent";
import { HttpsProxyAgent } from "https-proxy-agent";
import fetch from "node-fetch";
import fs from "fs";

const checker = new Checker(checkFunction, writeResultFunction, { checkerName: "proxy-checker", disableInterface: false });
checker.addStatsProperties({
    good: 0,
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
        await fetch("https://steamcommunity.com/", { agent, signal: AbortSignal.timeout(this.config.timeout) });
        checker.finishedCheck(checkConfig, "good");
    } catch (error) {
        checker.finishedCheck(checkConfig, "bad");
    }
}

function writeResultFunction(this: Checker, checkConfig: CheckConfig, result: string) {
    this.stats[result as keyof Stats]++;
    if (result === "bad") {
        return;
    }

    fs.appendFileSync(this.getResultsPath() + "/good.txt", `${checkConfig.data.email}:${checkConfig.data.password}\n`);
}
