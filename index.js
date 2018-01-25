#!/usr/bin/env node

const program = require("commander");
const moment = require("moment");
const _ = require("lodash");

const capture = require("./src/capture");
const screenshot = require("./src/screenshot");
const fetch_charts = require("./src/fetch-charts");
const fetch_charts_images = require("./src/fetch-charts-images");
const get_charts_deltas = require("./src/get-charts-deltas");
const redis = require("./src/redis");
const upload = require("./src/upload");

moment.locale("fr");

program
  .version("0.1.0")
  .option("-u, --upload", "Upload to Instagram")
  .option("-d, --date [date]", "Select a date")
  .parse(process.argv);

const create_image_urls = async date => {
  console.log("INFO", "work");

  const previous_date = moment(date, "YYYY-MM-DD")
    .add(-1, "day")
    .format("YYYY-MM-DD");
  const charts = await fetch_charts(date);
  const previous_charts = await fetch_charts(previous_date);
  const charts_with_deltas = await get_charts_deltas(charts, previous_charts);
  const charts_with_images = await fetch_charts_images(charts_with_deltas);

  const image_urls = [];

  for (let i = 0; i < 2; i++) {
    const image_url = await capture(_.drop(charts_with_images, i * 10));
    image_urls.push(image_url);
  }

  return image_urls;
};

const worker = async date => {
  console.log("INFO", "worker");

  const last_date = (await redis.get("last-date")) || "2018-01-13";
  const next_date =
    date ||
    moment(last_date, "YYYY-MM-DD")
      .add(1, "day")
      .format("YYYY-MM-DD");

  try {
    const image_urls = await create_image_urls(next_date);

    if (program.upload) {
      await upload(next_date, image_urls);
      if (!date) await redis.set("last-date", next_date);
    } else {
      console.log("INFO", "no upload");
    }

    console.log("INFO", "success");
  } catch (e) {
    console.log("ERROR", e.message);
    console.log(e);
  }

  redis.quit();
};

worker(program.date);
