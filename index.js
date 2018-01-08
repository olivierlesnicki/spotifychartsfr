const moment = require("moment");
const ig = require("instagram-private-api").V1;
const webshot = require("webshot");
const redis = require("redis");
const create_xray = require("x-ray");
const shortid = require("shortid");

const { REDIS_URL, INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD } = process.env;
const NUMBER_OF_PAGES = 2;
const TRACK_PER_PAGES = 10;

moment.locale("fr");

const client = redis.createClient(REDIS_URL);

const device = new ig.Device(INSTAGRAM_USERNAME);
const storage = new ig.CookieFileStorage("/tmp/cookie-file-storage.json");

var custom_css = `
.header-csv,
.responsive-select-value::before,
.responsive-select[data-type=country],
.responsive-select[data-type=recurrence],
.chart-filters label,
thead,
.chart-page li:nth-child(2),
.wrapper .container .wrapper {
  display: none !important;
}
.responsive-select {
  width: auto !important;
  min-width: auto !important;
}
.responsive-select-value {
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
}
.chart-table-image a img {
  height: 70px !important;
  width: 70px !important;
}
.wrapper, table {
  padding: 0 !important;
  margin: 0 !important;
}
.chart-table-track {
  font-size: 1.35rem !important;
}
.chart-table-position, 
.chart-table-streams {
  font-size: 1.25rem !important;
}
.chart-table td.chart-table-trend svg {
  width: 16px !important;
  height: 16px !important;
}
.chart-table-trend__icon {
  padding-right: 20px !important;
}
`;

var size = {
  width: 800,
  height: 790
};

const capture = function(date, file_name, page) {
  console.log("INFO", `capturing: ${file_name}`);
  return new Promise(function(resolve, reject) {
    for (let i = 0; i < TRACK_PER_PAGES * page; i++) {
      custom_css =
        custom_css +
        `
        tr:nth-child(${i + 1}) {
          display: none;
        }
      `;
    }

    webshot(
      `spotifycharts.com/regional/fr/daily/${date}`,
      file_name,
      {
        screenSize: size,
        shotSize: size,
        customCSS: custom_css,
        userAgent:
          "Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us)" +
          " AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g"
      },
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

const fetch_latest_charts_date = () =>
  new Promise((resolve, reject) => {
    console.log("INFO", "fetching latest charts timestamp");
    const x = create_xray();
    x(
      "https://spotifycharts.com/regional/fr/daily/latest",
      ".chart-filters-list .responsive-select:last-child .responsive-select-value"
    )((err, date) => {
      if (err) return reject(err);
      resolve(moment(date, "MM/DD/YYYY").format("YYYY-MM-DD"));
    });
  });

const fetch_session = async () => {
  console.log("INFO", "fetch session");
  return ig.Session.create(
    device,
    storage,
    INSTAGRAM_USERNAME,
    INSTAGRAM_PASSWORD
  );
};

const capture_charts = async (seed, date = "latest") => {
  console.log("INFO", "capture charts");
  for (let i = 0; i < NUMBER_OF_PAGES; i++) {
    await capture(date, `tmp/${seed}-page-${i}.jpeg`, i);
  }
};

const upload_album = async (session, seed, date) => {
  console.log("INFO", "upload album");

  const medias = [];
  for (let i = 0; i < NUMBER_OF_PAGES; i++) {
    medias.push({
      type: "photo",
      size: [size.width, size.height],
      data: `tmp/${seed}-page-${i}.jpeg`
    });
  }

  const payload = await ig.Upload.album(session, medias);

  const date_moment = moment(date, "YYYY-MM-DD");
  const comment = `Top ${NUMBER_OF_PAGES *
    TRACK_PER_PAGES} Spotify du ${date_moment.format("Do MMMM YYYY")}`;

  return ig.Media.configureAlbum(session, payload, comment, false);
};

const redis_get = key =>
  new Promise((resolve, reject) => {
    client.get(key, (err, value) => {
      if (err) return reject(err);
      resolve(value);
    });
  });

const redis_set = (key, value) =>
  new Promise((resolve, reject) => {
    client.set(key, value, err => {
      if (err) return reject(err);
      resolve();
    });
  });

const post = async date => {
  console.log("INFO", "post", date);
  try {
    const seed = shortid.generate();
    const session = await fetch_session();

    await capture_charts(seed, date);
    await upload_album(session, seed, date);

    await redis_set(date, 1);

    console.log("success");
  } catch (e) {
    console.log("error", e.message);
    console.error(e);
  }
};

const worker = async force => {
  const date = await fetch_latest_charts_date();
  const is_posted = await redis_get(date);

  if (!force && !!is_posted) {
    console.log("INFO", "already posted", date);
    console.log("success");
  } else {
    await post(date);
  }

  client.quit();
};

worker();
