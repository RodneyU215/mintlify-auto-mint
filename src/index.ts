import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const openApiFilePath = path.join(__dirname, "../example-spec.yaml");

interface NavItem {
  group: string;
  pages: string[];
  version?: string;
}

function runOAFCommand(): NavItem[] {
  try {
    const output = execSync(
      `npx @mintlify/scraping@latest openapi-file ${openApiFilePath} -o api-reference`,
      { encoding: "utf-8" }
    ).trim();
    return JSON.parse(output.split("\n").slice(1).join("\n"));
  } catch (error) {
    console.error("Error running openapi-file scraping command:", error);
    process.exit(1);
  }
}

function updateMintJsonNavigation(newNavItems: NavItem[]) {
  try {
    const fileContents = fs.readFileSync("mint.json", "utf-8");
    const mintConfig = JSON.parse(fileContents);

    newNavItems.forEach((newItem) => {
      let groupFound = false;

      mintConfig.navigation = mintConfig.navigation.map((item: NavItem) => {
        if (item.group === newItem.group) {
          item.pages = newItem.pages;
          groupFound = true;
        }
        return item;
      });

      if (!groupFound) {
        mintConfig.navigation.push(newItem);
      }
    });

    fs.writeFileSync("mint.json", JSON.stringify(mintConfig, null, 2));
  } catch (error) {
    console.error("Error modifying mint.json file:", error);
    process.exit(1);
  }
}

const newNavItems = runOAFCommand();
updateMintJsonNavigation(newNavItems);

// Note: This doesn't account for deprecations of endpoints, or specific versions
