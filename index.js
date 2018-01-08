var webshot = require("webshot");

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
      "tmp/" + file_name,
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

capture("1-10.png", 0);
capture("11-20.png", 1);
capture("21-30.png", 2);
capture("31-40.png", 3);
capture("41-50.png", 4);
