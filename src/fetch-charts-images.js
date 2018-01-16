const _ = require("lodash");
const request = require("request-promise");

const redis = require("./redis");

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;

module.exports = async charts => {
  console.log("INFO", "fetch charts images");

  const basic = new Buffer(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const ids = charts.map(chart => chart.id);

  const { access_token } = await request({
    url: "https://accounts.spotify.com/api/token",
    method: "POST",
    form: {
      grant_type: "client_credentials"
    },
    json: true,
    headers: {
      Authorization: `Basic ${basic}`
    }
  });

  const data = await request({
    url: `https://api.spotify.com/v1/tracks/?ids=${ids.join(",")}`,
    method: "GET",
    json: true,
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  });

  return charts.map(chart => {
    const image_url = _.find(data.tracks, { id: chart.id }).album.images[0].url;
    return {
      ...chart,
      image_url
    };
  });
};
