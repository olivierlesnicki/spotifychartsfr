const program = require("commander");
const moment = require("moment");

const screenshot = require("./src/screenshot");
const fetch_charts = require("./src/fetch-charts");
const fetch_charts_images = require("./src/fetch-charts-images");
const get_charts_deltas = require("./src/get-charts-deltas");
const redis = require("./src/redis");
const upload = require("./src/upload");

moment.locale("fr");

const work = async date => {
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
    const image_url = await screenshot(_.drop(charts_with_images, i * 10));
    image_urls.push(image_url);
  }

  return upload(date, image_urls);
};

const worker = async () => {
  console.log("INFO", "worker");

  const last_date = (await redis.get("last-date")) || "2018-01-13";
  const next_date = moment(last_date, "YYYY-MM-DD")
    .add(1, "day")
    .format("YYYY-MM-DD");

  try {
    await work(next_date);
    redis.set("last-date", next_date);

    console.log("INFO", "success");
  } catch (e) {
    console.log("ERROR", e.message);
  }

  redis.quit();
};

worker();
