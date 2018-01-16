const ig = require("instagram-private-api").V1;
const moment = require("moment");

const { INSTAGRAM_USERNAME, INSTAGRAM_PASSWORD } = process.env;

const device = new ig.Device(INSTAGRAM_USERNAME);
const storage = new ig.CookieFileStorage("/tmp/cookie-file-storage.json");

const fetch_session = async () => {
  console.log("INFO", "fetch session");

  return ig.Session.create(
    device,
    storage,
    INSTAGRAM_USERNAME,
    INSTAGRAM_PASSWORD
  );
};

module.exports = async (date, image_urls) => {
  console.log("INFO", "upload album");

  const session = await fetch_session();

  const medias = image_urls.map(data => ({
    type: "photo",
    size: [960, 960],
    data
  }));

  const payload = await ig.Upload.album(session, medias);

  const date_moment = moment(date, "YYYY-MM-DD");
  const comment = `Top 20 Spotify du ${date_moment.format("Do MMMM YYYY")}`;

  return ig.Media.configureAlbum(session, payload, comment, false);
};
