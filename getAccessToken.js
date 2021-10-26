"use-strict";

const CryptoJS = require("crypto-js");
const fetch = require("node-fetch");
const kiteAccessTokenUrl = "https://api.kite.trade/session/token";

exports.getAccessToken = async ({ data, requestToken }) => {
    var accessToken = null,
        err = null;
    const { kiteApiKey, kiteApiSecret, kiteApiVersion } = data;
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
            .catch((error) => {
                throw error;
            });

        console.log("Access Token", accessToken);
        
    } catch (error) {
        err = error;
    }
    return { accessToken, err };
};
