const requestpromise = require("request-promise");
const SocksProxyAgent = require("socks-proxy-agent");
const logger = require("./logger.js");

module.exports = {
  downloadUrlUsingTor
};

const default_headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 6.3; Win64; x64; rv:68.0) Gecko/20100101 Firefox/68.0",
  // Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  // "Accept-Encoding": "gzip, deflate, br",
  // Connection: "keep-alive"
  "Upgrade-Insecure-Requests": "1"
};

function downloadUrlUsingTor(
  url,
  headers = default_headers,
  method = "GET",
  post_param = null
) {
  return new Promise(function(resolve, reject) {
    (async () => {
      let proxy = "socks5://192.168.1.154:9050";
      let agent = new SocksProxyAgent(proxy);
      let trials = 0;
      let max_trials = 1000;
      var options = {
        method: method,
        timeout: 15000,
        uri: url,
        headers: headers,
        agent: agent,
        tunnel: true,
        resolveWithFullResponse: true,
        form: post_param
      };
      let download_success = false;
      while (!download_success && trials < max_trials) {
        trials++;
        logger.download_log.info(`---------->Trial= ${trials} | Url= ${url}`);
        await requestpromise(options)
          .then(function(response) {
            download_success = true;
            // logger.download_log.info(`Download SUCCESS${url}`);
            resolve(response);
          })
          .catch(function(err) {
            logger.download_log.error(`---------->Tor download ${err.message}`);
          });
      }
      if (!download_success) {
        logger.download_log.error(
          `---------->Trials exceeded ${max_trials} for ${url}`
        );
        reject(`Download trials exceeded ${max_trials}`);
      }
    })();
  });
}
