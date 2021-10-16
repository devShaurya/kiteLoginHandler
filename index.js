"use-strict";
const { getRequestToken } = require("./getRequestToken");

exports.handler = async (event, context, callback) => {
    var body = {
        error: null,
        requestToken: null,
        message: null,
    };
    var statusCode;

    const { requestToken, err } = await getRequestToken();
    body.requestToken = requestToken;
    body.error = err;

    if (body.error !== null) {
        statusCode = 500;
    } else {
        statusCode = 200;
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
