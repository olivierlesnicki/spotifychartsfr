const request = require("request-promise");
const papa = require("papaparse");
const _ = require("lodash");
const cheerio = require("cheerio");

module.exports = async date => {
  console.log("INFO", "fetch charts", date);

  try {
    const csv = await request(
      `https://spotifycharts.com/regional/fr/daily/${date}/download`
    );
    const { errors, meta, data } = papa.parse(csv);

    if (errors && errors.length) throw new Error(errors[0].message);

    return _.map(_.take(_.drop(data, 1), 50), line => ({
      id: line[4].replace("https://open.spotify.com/track/", ""),
      position: Number(line[0]),
      name: line[1],
      artist: line[2],
      streams: Number(line[3]),
      url: line[4]
    }));
  } catch (e) {
    const html = await request(
      `https://spotifycharts.com/regional/fr/daily/${date}`
    );
    const $ = cheerio.load(html);

    if (!$(".chart-table tbody tr").length)
      throw new Error(`No charts data for ${date}`);

    return _.take(
      $(".chart-table tbody tr").map((index, el) => ({
        position: Number(
          $(el)
            .find(".chart-table-position")
            .text()
        ),
        id: $(el)
          .find(".chart-table-image a")
          .attr("href")
          .replace("https://open.spotify.com/track/", ""),
        streams: Number(
          $(el)
            .find(".chart-table-streams")
            .text()
            .replace(",", "")
        ),
        name: $(el)
          .find(".chart-table-track strong")
          .text(),
        artist: $(el)
          .find(".chart-table-track span")
          .text()
          .replace("by ", "")
      })),
      50
    );
  }
};
