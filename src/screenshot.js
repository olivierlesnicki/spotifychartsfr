const shortid = require("shortid");
const webshot = require("webshot");
const _ = require("lodash");
const numeral = require("numeral");

module.exports = charts => {
  console.log("INFO", "screenshot");

  const id = shortid.generate();
  const path = `tmp/${id}.jpg`;

  const render_trend = track => {
    if (track.is_entry) return "";
    if (track.delta > 0) return '<span class="ion-arrow-up-b"></span>';
    if (track.delta === 0) return '<span class="ion-minus-round"></span>';
    if (track.delta < 0) return '<span class="ion-arrow-down-b"></span>';
  };

  const rendered_charts = _.take(
    charts.map(
      track => `
    <div class="chart">
      <img class="chart-image" src="${track.image_url}" />
      <div class="chart-data">
        <div class="chart-position">${String(track.position)}</div>
        <div class="chart-trend">${render_trend(track)}</div>
        <div class="chart-track">
          <span class="track-name">${track.name}</span>
          <span class="track-artist">de ${track.artist}</span>
        </div>
        <div class="chart-streams">${numeral(track.streams).format("0 0")}</div>
      </div>
    </div>
  `
    ),
    10
  );

  return new Promise((resolve, reject) => {
    webshot(
      `
      <html>
        <head>
          <link rel="stylesheet" type="text/css" href="http://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css" />        
          <style>
            * {
              margin: 0;
              padding: 0;
            }
            @font-face {
              font-family: 'Spotify';
              font-weight: 400;
              src: url('https://spotifycharts.com/fonts/CircularSpotifyTxT-Book.woff2') format('woff2'), /* Super Modern Browsers */
                   url('https://spotifycharts.com/fonts/CircularSpotifyTxT-Book.woff') format('woff'), /* Pretty Modern Browsers */
                   url('https://spotifycharts.com/fonts/CircularSpotifyTxT-Book.ttf')  format('truetype'), /* Safari, Android, iOS */;
            }
            @font-face {
              font-family: 'Spotify';
              font-weight: 600;
              src: url('https://spotifycharts.com/fonts/CircularSpotifyTxT-Bold.woff2') format('woff2'), /* Super Modern Browsers */
                   url('https://spotifycharts.com/fonts/CircularSpotifyTxT-Bold.woff') format('woff'), /* Pretty Modern Browsers */
                   url('https://spotifycharts.com/fonts/CircularSpotifyTxT-Bold.ttf')  format('truetype'), /* Safari, Android, iOS */;
            }            
            body {
              font-family: "Spotify", "Helvetica Neue", Helvetica, sans-serif;
              font-weight: 400;
              background: #171717;
            }
            .header {
              height: 80px;
              background-color: #000;
              position: relative;
            }
            .logo {
              height: 40px;
              display: inline-block;
              position: absolute;
              top: 18px;
              left: 30px;
            }
            .title {
              display: inline-block;
              font-weight: 600;
              color: #fff;
              font-size: 36px;
              position: absolute;
              left: 180px;
              top: 24px;
            }
            .chart {
              height: 72px;
              position: relative;
            }
            .chart-image {
              height: 72px;
              width: 72px;
              display: block;
              position: absolute;
              left: 0;
              background: #ccc;
            }
            .chart-data {
              position: absolute;
              line-height: 72px;
              left: 102px;
              right: 30px;
            }
            .chart-position {
              position: absolute;
              font-size: 22px;
              color: #7a7a7a;
              left: 0;
            }
            .chart-track {
              position: absolute;
              top: 0;
              left: 80px;
              right: 100px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .chart-trend {
              position: absolute;
              font-size: 22px;
              color: #7a7a7a;
              left: 40px;
              top: 24px;
            }
            .ion-arrow-up-b {
              color: #84bd00;
            }
            .ion-arrow-down-b {
              color: #bd3200;
            }
            .chart-streams {
              position: absolute;
              top: 0;
              right: 0;
              font-size: 22px;
              color: #7a7a7a;
            }
            .track-name {
              color: #fff;
              font-size: 24px;
              font-weight: 600;
            }
            .track-artist {
              font-size: 22px;
              color: #7a7a7a;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <img class="logo" src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Spotify_logo_with_text.svg/2000px-Spotify_logo_with_text.svg.png" />
            <div class="title">Charts</div>
          </div>
          <div class="charts">
            ${rendered_charts.join("\n")}
          </div>
        </body>
      </html>
      `,
      path,
      {
        siteType: "html",
        screenSize: {
          width: 800,
          height: 800
        },
        shotSize: {
          width: 800,
          height: 800
        }
      },
      function(err) {
        if (err) return reject(err);
        resolve(path);
      }
    );
  });
};
