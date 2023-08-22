import { evaluate } from "@mdx-js/mdx";
import * as fs from "fs/promises";
import * as path from "path";
import { watch } from "fs";
import { renderToString } from "react-dom/server";
import React from "react";
import puppeteer from "puppeteer";
import { htmlToText } from "html-to-text";
import "dotenv/config";

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
  const htmlContent = renderToString(<compiled.default />);
  await fs.writeFile("./dist/resume.html", htmlContent);

  return htmlContent;
};

const watchMode = process.argv.includes("--watch");
const resumePath = path.join(__dirname, "../dist/resume.html");

const makePdf = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("file://" + resumePath, {
    waitUntil: "networkidle0",
  });
  const styleUrl = path.join(__dirname, "../dist/style.css");
  const inlineStyles = `<style>${await fs.readFile(styleUrl)}</style>`;
  const res = await page.pdf({
    format: "letter",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: "<div/>",
    footerTemplate:
      inlineStyles +
      '<div id="page-numbers"><span style="margin-right: 32px"><span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
  });
  await fs.writeFile("./dist/resume.pdf", res);
  await browser.close();
};

if (watchMode) {
  console.log("Watching for changes...");
  await compileMdx();
  Bun.spawn(["open", resumePath]);

  watch(filePath, async () => {
    console.log("Updating...");
    await compileMdx();
  });
} else {
  const htmlContent = await compileMdx();
  await makePdf();
  const text = htmlToText(htmlContent);
  await fs.writeFile("./dist/resume.txt", text);
}
