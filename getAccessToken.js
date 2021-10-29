"use-strict";

const fetch = require("node-fetch");
const kiteAccessTokenUrl = "https://api.kite.trade/session/token";

exports.getAccessToken = async (cryptoUtils, requestToken) => {
    var encryptedAccessToken = null,
        err = null;
    const { kiteApiKey, kiteApiVersion } = cryptoUtils;
    try {
        const checksum = cryptoUtils.generateChecksum(requestToken);
        const requestHeaders = new fetch.Headers();
        requestHeaders.append(
            "Content-Type",
            "application/x-www-form-urlencoded"
        );
        requestHeaders.append("X-Kite-Version", kiteApiVersion);

        const urlencoded = new URLSearchParams();
        urlencoded.append("request_token", requestToken);
        urlencoded.append("api_key", kiteApiKey);
        urlencoded.append("checksum", checksum);

        var requestOptions = {
            method: "POST",
            headers: requestHeaders,
            body: urlencoded,
            redirect: "follow",
        };

        const accessToken = await fetch(kiteAccessTokenUrl, requestOptions)
            .then((response) => response.json())
            .then(({ data }) => data.access_token)
            .catch((error) => {
                throw error;
            });

        encryptedAccessToken = cryptoUtils.encrypt(accessToken);
    } catch (error) {
        err = error;
    }
    return { encryptedAccessToken, err };
};
