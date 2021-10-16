"use-strict";
const { getAccessToken } = require("./getAccessToken");
const { getRequestToken } = require("./getRequestToken");

exports.handler = async (event, context, callback) => {
    var body = {
        error: null,
        requestToken: null,
        message: null,
        accessToken: null,
    };
    var statusCode;

    const { requestToken, err } = await getRequestToken();

    if (err !== null) {
        statusCode = 500;
        body.error = err;
    } else {
        body.requestToken = requestToken;
        const { accessToken, err: err1 } = await getAccessToken(requestToken);
        if (err1 != null) {
            statusCode = 500;
            body.error = err1;
        } else {
            statusCode = 200;
            body.accessToken = accessToken;
        }
    }

    const response = {
        statusCode: statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: body,
    };
    return response;
};