"use-strict";
const fetch = require("node-fetch");
const { getRequestToken } = require("./getRequestToken");

exports.handler = async (event, context, callback) => {
    var body = {
        error: null,
        requestToken: null,
        message: null,
    };

    const { requestToken, err } = await getRequestToken();

    if (err !== null) {
        body.error = err.toString;
        body.message = "failed";
    } else {
        body.requestToken = requestToken;
        body.message = "success";
    }

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(body),
    };
    const response = await fetch(
        "https://21b5-117-242-98-136.ngrok.io/broker/kiteLoginHandlerWebhook",
        requestOptions
    ).then((response) => response.json());

    return response;
};