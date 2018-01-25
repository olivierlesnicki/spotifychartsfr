const fs = require("fs");
const { createCanvas, registerFont, Image } = require("canvas");
const shortid = require("shortid");
const request = require("request-promise");
const numeral = require("numeral");

numeral.localeData().delimiters.thousands = " ";

const HEADER_HEIGHT = 90;
const IMAGE_SIZE = 960;
const LOGO_HEIGHT = 48;
const MEDIUM_MARGIN = 15;
const LARGE_MARGIN = 30;

const CHART_HEIGHT = (IMAGE_SIZE - HEADER_HEIGHT) / 10;

registerFont("src/fonts/ionicons.ttf", {
  family: "Ionicons"
});

registerFont("src/fonts/CircularStd-Book.ttf", {
  family: "Circular",
  weight: 400
});

registerFont("src/fonts/CircularStd-Medium.ttf", {
  family: "Circular",
  weight: 500
});

registerFont("src/fonts/CircularStd-Bold.ttf", {
  family: "Circular",
  weight: 600
});

registerFont("src/fonts/CircularStd-Black.ttf", {
  family: "Circular",
  weight: 700
});

const fetch_remote_image = async url => {
  const binary = await request({ url, encoding: null });

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve(img);
    };

    img.onerror = function(err) {
      reject(err);
    };

    img.src = new Buffer(binary, "binary");
  });
};

const capture = async charts => {
  const canvas = createCanvas(IMAGE_SIZE, IMAGE_SIZE);
  const ctx = canvas.getContext("2d");

  // Render header
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, IMAGE_SIZE, HEADER_HEIGHT);

  const logo = await fetch_remote_image(
    "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Spotify_logo_with_text.svg/2000px-Spotify_logo_with_text.svg.png"
  );
  ctx.drawImage(
    logo,
    LARGE_MARGIN,
    (HEADER_HEIGHT - LOGO_HEIGHT) / 2,
    logo.width / logo.height * LOGO_HEIGHT,
    LOGO_HEIGHT
  );

  ctx.fillStyle = "#ffffff";
  ctx.font = '700 48px "Circular"';
  ctx.fillText(
    "Charts",
    logo.width / logo.height * LOGO_HEIGHT + MEDIUM_MARGIN + LARGE_MARGIN,
    HEADER_HEIGHT / 2 + 18
  );

  // Render charts
  ctx.fillStyle = "#171717";
  ctx.fillRect(0, HEADER_HEIGHT, IMAGE_SIZE, IMAGE_SIZE - HEADER_HEIGHT);

  for (let i = 0; i < charts.length; i++) {
    const chart = charts[i];

    const image = await fetch_remote_image(chart.image_url);
    ctx.drawImage(
      image,
      0,
      HEADER_HEIGHT + i * CHART_HEIGHT,
      CHART_HEIGHT,
      CHART_HEIGHT
    );

    ctx.fillStyle = "#838383";
    ctx.font = '400 28px "Circular"';
    ctx.fillText(
      chart.position,
      CHART_HEIGHT + LARGE_MARGIN,
      HEADER_HEIGHT + i * CHART_HEIGHT + CHART_HEIGHT / 2 + 12
    );

    let icon;

    if (chart.is_entry) {
      ctx.fillStyle = "#4687d7";
      icon = "•";
    } else {
      if (chart.delta > 0) {
        ctx.fillStyle = "#90BA39";
        icon = "•";
      }
      if (!chart.delta) {
        ctx.fillStyle = "#838383";
        icon = "•";
      }
      if (chart.delta < 0) {
        ctx.fillStyle = "#B03D1B";
        icon = "•";
      }
    }

    ctx.font = '700 28px "Circular"';
    ctx.fillText(
      icon,
      CHART_HEIGHT + 2 * LARGE_MARGIN + MEDIUM_MARGIN,
      HEADER_HEIGHT + i * CHART_HEIGHT + CHART_HEIGHT / 2 + 12
    );

    ctx.fillStyle = "#fff";
    ctx.font = '600 28px "Circular"';
    ctx.fillText(
      chart.name,
      CHART_HEIGHT + LARGE_MARGIN * 3 + MEDIUM_MARGIN,
      HEADER_HEIGHT + i * CHART_HEIGHT + CHART_HEIGHT / 2 + 12
    );

    const name_text = ctx.measureText(chart.name + " ");

    ctx.fillStyle = "#838383";
    ctx.font = '400 28px "Circular"';
    ctx.fillText(
      `de ${chart.artist}`,
      CHART_HEIGHT + LARGE_MARGIN * 3 + MEDIUM_MARGIN + name_text.width,
      HEADER_HEIGHT + i * CHART_HEIGHT + CHART_HEIGHT / 2 + 12
    );

    const formatted_streams = numeral(chart.streams).format("0, 0");
    const streams_text = ctx.measureText(formatted_streams);

    ctx.fillStyle = "#838383";
    ctx.font = '400 28px "Circular"';
    ctx.fillText(
      formatted_streams,
      IMAGE_SIZE - LARGE_MARGIN - streams_text.width,
      HEADER_HEIGHT + i * CHART_HEIGHT + CHART_HEIGHT / 2 + 12
    );
  }

  const id = shortid.generate();
  const path = `tmp/${id}.png`;

  const data = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
  const buffer = new Buffer(data, "base64");

  fs.writeFileSync(path, buffer);

  return path;
};

module.exports = capture;
