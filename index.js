"use-strict";

const fetch = require("node-fetch");

const { getRequestToken } = require("./getRequestToken");
const { getAccessToken } = require("./getAccessToken");
const CryptoUtils = require("./CryptoUtils");
const cryptoUtils = new CryptoUtils();

exports.handler = async (event, context, callback) => {
    var body = {
        error: null,
        requestToken: null,
        message: null,
        encryptedAccessToken: null,
        generationTimestamp: null,
        checksum: null,
    };
    // Decrypt code should run once and variables stored outside of the
    // function handler so that these are decrypted once per container
    const { err } = await cryptoUtils.decryptEnvData();

    if (err == null) {
        const { requestToken, err: err1 } = await getRequestToken(cryptoUtils);

        if (err1 == null) {
            const { encryptedAccessToken, err: err2 } = await getAccessToken(
                cryptoUtils,
                requestToken
            );

            if (err2 == null) {
                body.encryptedAccessToken = encryptedAccessToken;
                body.message = "Success";
            } else {
                body.error = err2.toString();
                body.message = "Failed";
            }
        } else {
            body.error = err1.toString();
            body.message = "Failed";
        }
    } else {
        body.error = err.toString();
        body.message = "Failed";
    }

    body.generationTimestamp = new Date().toUTCString();
    body.checksum = cryptoUtils.generateChecksum(body.generationTimestamp);

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(body),
    };
    console.log("Request:\n", requestOptions);
    const response = await fetch(
        "https://testapi.wintwealth.com/broker/kiteLoginHandlerWebhook",
        requestOptions
    ).then((response) => response.json());

    console.log(response);
    if (response.message.toLowercase == "failed") {
        throw "Failed";
    }

    return response;
};
