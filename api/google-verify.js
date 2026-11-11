"use strict";

// Serves the Google Search Console verification file at its exact .html URL.
// The site uses cleanUrls, which otherwise 308-redirects /<file>.html to /<file>.
const BODY = "google-site-verification: google9ebcd36542cc58f1.html\n";

module.exports = function handler(request, response) {
  response.statusCode = 200;
  response.setHeader("Content-Type", "text/plain; charset=utf-8");
  response.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  response.end(BODY);
};
