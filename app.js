var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const request = require("request");
const cheerio = require("cheerio");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/kalimati_price", async function (req, res, next) {
  const wholesale = [];
  const retail = [];
  const wholesale_url = "https://kalimatimarket.gov.np/home/wpricelist";
  const retail_url = "http://kalimatimarket.gov.np/home/rpricelist";
  const wholesale_data = new Promise(function (resolve, reject) {
    request(wholesale_url, (err, res, body) => {
      if (err) return reject(err);
      let $ = cheerio.load(body, {
        normalizeWhitespace: true,
        xmlMode: true,
      });

      $("tr").each(function (i) {
        let temp = [];
        $(this)
          .find("td")
          .each(function (i) {
            temp.push($(this).text());
          });
        wholesale.push({
          name: temp[0],
          unit: temp[1],
          min: temp[2],
          max: temp[3],
          avg: temp[4],
        });
      });

      resolve(wholesale);
    });
  });
  const retail_data = new Promise(function (resolve, reject) {
    request(retail_url, (err, res, body) => {
      if (err) return reject(err);
      let $ = cheerio.load(body, {
        normalizeWhitespace: true,
        xmlMode: true,
      });

      $("tr").each(function (i) {
        let temp = [];
        $(this)
          .find("td")
          .each(function (i) {
            temp.push($(this).text());
          });
        retail.push({
          name: temp[0],
          unit: temp[1],
          min: temp[2],
          max: temp[3],
          avg: temp[4],
        });
      });

      resolve(retail);
    });
  });
  await wholesale_data;
  await retail_data;
  res.send({ wholesale: wholesale, retail: retail });
});
app.use("/livescore", async function (req, res, next) {
  const adata = [];
  const livescore = "https://www.theguardian.com/football/premierleague/table";
  const parse = new Promise(function (resolve, reject) {
    request(livescore, (err, res, body) => {
      if (err) return reject(err);
      let $ = cheerio.load(body, {
        normalizeWhitespace: true,
        xmlMode: true,
      });
      $("tbody tr").each(function (i) {
        let temp = [];
        $(this)
          .find("td")
          .each(function (i) {
            temp.push($(this).text());
          });
        const form = temp[10].trim().split("   ");
        adata.push({
          rank: temp[0],
          team: temp[1],
          games_played: temp[2],
          win: temp[3],
          draw: temp[4],
          lose: temp[5],
          goals_for: temp[6],
          goals_against: temp[7],
          goals_diff: temp[8],
          goals_points: temp[9],
          form: form,
        });
      });
      resolve(adata);
    });
  });
  await parse;
  res.send({ data: adata });
});
module.exports = app;
