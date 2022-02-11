const Table = require("cli-table3");
const fs = require("fs-extra");
const http = require("http");
const path = require("path");
const pc = require("picocolors");
const { chromium } = require("playwright");
const prettyBytes = require("pretty-bytes");
const serveHandler = require("serve-handler");
const { build } = require("vite");

const FIXTURES_DIR = path.resolve(__dirname, "fixtures");
const SCENARIOS_DIR = path.resolve(__dirname, "dist");
const TEMPLATE_DIR = path.resolve(__dirname, "template");

const SERVE_PORT = 3000;
const SERVE_URL = `http://localhost:${SERVE_PORT}`;

const log = {
  info: (msg) => console.log(`${pc.blue("[INFO]")} ${msg}`),
  success: (msg) => console.log(`${pc.green("[ OK ]")} ${msg}`),
};

/**
 * @param {[number, number]} hrtime
 * @return {string}
 */
function hrToSeconds(hrtime) {
  const raw = hrtime[0] + hrtime[1] / 1e9;

  return raw.toFixed(2) + "s";
}

//
// ---------
//

/**
 * @param {string} fixtureName
 */
async function prepareFixture(fixtureName) {
  const startTime = process.hrtime();
  const scenarioDir = path.resolve(SCENARIOS_DIR, fixtureName);

  await fs.copy(path.resolve(FIXTURES_DIR, fixtureName), scenarioDir);
  await fs.copy(TEMPLATE_DIR, scenarioDir);

  await build({
    root: scenarioDir,
    base: `/${fixtureName}/`,
    build: {
      outDir: `../artifacts/${fixtureName}`,
    },
    logLevel: "silent",
  });

  log.success(
    `- "${fixtureName}": was prepared & built in ${hrToSeconds(
      process.hrtime(startTime)
    )}`
  );
}

(async () => {
  const programStartTime = process.hrtime();

  await fs.remove(SCENARIOS_DIR);
  log.info('"dist" cleaned');

  const fixtures = await fs.readdir(FIXTURES_DIR);

  if (fixtures.length === 0) {
    console.log(`Failed to find any fixtures in "${FIXTURES_DIR}"`);
    process.exit(1);
  }

  for await (const fixtureName of fixtures) {
    await prepareFixture(fixtureName);
  }

  const server = http.createServer((request, response) => {
    return serveHandler(request, response, {
      public: path.resolve(SCENARIOS_DIR, "artifacts"),
    });
  });

  server.listen(SERVE_PORT, () => {
    log.info(`Server started at ${SERVE_URL}...`);
  });

  const browser = await chromium.launch();
  log.info(`Chrome ${browser.version()} started...`);

  const results = [];

  for await (const fixtureName of fixtures) {
    log.info(`- "${fixtureName}": running in browser...`);

    const startTime = process.hrtime();
    const page = await browser.newPage({ baseURL: SERVE_URL });

    await page.goto(fixtureName);
    await page.locator("#root").waitFor({ state: "attached" });

    const client = await page.context().newCDPSession(page);

    for (let i = 0; i <= 5; i++) {
      await client.send("HeapProfiler.collectGarbage");
    }

    const result = await client.send("Runtime.getHeapUsage");

    results.push({
      fixtureName,
      ...result,
    });

    await page.close();

    log.info(
      `- "${fixtureName}": run complete in ${hrToSeconds(
        process.hrtime(startTime)
      )}`
    );
  }

  await browser.close();
  log.success("Browser closed");

  server.close(() => {
    log.success("Server stopped");

    console.log("");
    console.log("");

    const table = new Table({
      head: ["Fixture", "Used size", "Total size"],
    });
    const sortedResults = [...results].sort((a, b) =>
      a.fixtureName.localeCompare(b.fixtureName)
    );

    sortedResults.forEach((r) => {
      table.push([
        r.fixtureName,
        prettyBytes(r.usedSize),
        prettyBytes(r.totalSize),
      ]);
    });

    console.log(table.toString());

    console.log("");
    console.log("");

    log.success(
      `Completed in ${hrToSeconds(process.hrtime(programStartTime))}`
    );
  });
})();
