const moment = require("moment");
const ig = require("instagram-private-api").V1;
const webshot = require("webshot");
const redis = require("redis");
const create_xray = require("x-ray");

moment.locale("fr");

const { REDIS_URL, INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD } = process.env;

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

const capture = function(file_name, page) {
  console.log(`capturing: ${file_name}`);
  return new Promise(function(resolve, reject) {
    for (let i = 0; i < 10 * page; i++) {
      custom_css =
        custom_css +
        `
        tr:nth-child(${i + 1}) {
          display: none;
        }
      `;
    }

    webshot(
      "spotifycharts.com/regional/fr/daily/latest",
      `/tmp/${file_name}`,
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

let album_payload;
let latest_charts_timestamp;
let session;

Promise.resolve()

  .then(
    () =>
      new Promise((resolve, reject) => {
        console.log("INFO", "fetching latest charts timestamp");
        const x = create_xray();
        x(
          "https://spotifycharts.com/regional/fr/daily/latest",
          ".chart-filters-list .responsive-select:last-child .responsive-select-value"
        )((err, date) => {
          if (err) return reject(err);
          latest_charts_timestamp = moment(date, "MM/DD/YYYY").toString();
          console.log("INFO", latest_charts_timestamp);
          resolve();
        });
      })
  )

  .then(() =>
    ig.Session.create(
      device,
      storage,
      INSTAGRAM_USERNAME,
      INSTAGRAM_PASSWORD
    ).then(payload => (session = payload))
  )

  .then(() => {
    let promise = Promise.resolve();
    for (let i = 0; i < 5; i++) {
      promise = promise.then(() => capture(`page-${i}.jpeg`, i));
    }
    return promise.then(() => session);
  })

  .then(() => {
    console.log("Uploading album to instagram");

    const medias = [];
    for (let i = 0; i < 5; i++) {
      medias.push({
        type: "photo",
        size: [size.width, size.height],
        data: `/tmp/page-${i}.jpeg`
      });
    }
    return ig.Upload.album(session, medias).then(
      payload => (album_payload = payload)
    );
  })

  .then(() => {
    console.log("Configuring album");

    const date = moment(latest_charts_timestamp).format(
      "MMM Do YYYY #DDMMYYYY"
    );

    return ig.Media.configureAlbum(
      session,
      album_payload,
      `Top 50 Spotify du ${date}`,
      false
    );
  })

  .then(() => {
    console.log("success");
  })

  .catch(err => {
    console.error("error", err.message);
  });
