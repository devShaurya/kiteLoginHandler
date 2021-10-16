"use-strict";

const CryptoJS = require("crypto-js");
const fetch = require("node-fetch");
const kiteApiKey = process.env.KITE_API_KEY;
const kiteApiSecret = process.env.KITE_API_SECRET;
const kiteApiVersion = process.env.KITE_API_VERSION;
const kiteAccessTokenUrl = "https://api.kite.trade/session/token";

exports.getAccessToken = async (requestToken) => {
    var accessToken = null,
        err = null;
    try {
        const checksum = CryptoJS.SHA256(
            kiteApiKey + requestToken + kiteApiSecret
        ).toString(CryptoJS.enc.Hex);

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

        accessToken = await fetch(kiteAccessTokenUrl, requestOptions)
            .then((response) => response.json())
            .then(({ data }) => data.access_token)
            .catch((error) => console.log("error", error));
    } catch (error) {
        err = error;
    }
    return { accessToken, err };
};
