import { evaluate } from "@mdx-js/mdx";
import * as fs from "fs/promises";
import * as path from "path";
import { watch } from "fs";
import { renderToString } from "react-dom/server";
import React from "react";

const filePath = path.join(__dirname, "./resume.mdx");

const compileMdx = async () => {
  const compiled = await evaluate(await fs.readFile(filePath), {
    Fragment: React.Fragment,
    jsx: React.createElement,
    jsxs: React.createElement,
  });

  if (!(await fs.exists("./dist"))) {
    await fs.mkdir("./dist");
  }
  await fs.writeFile(
    "./dist/resume.html",
    renderToString(<compiled.default />)
  );
};

const watchMode = process.argv.includes("--watch");

if (watchMode) {
  console.log("Watching for changes...");
  watch(filePath, () => {
    console.log("Updating...");
    compileMdx();
  });
} else {
  compileMdx();
}
