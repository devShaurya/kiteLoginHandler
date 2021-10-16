const { getRequestToken } = require("./getRequestToken");

exports.handler = async (event, context, callback) => {
    var body = {
        error: null,
        data: null,
        message: null,
    };
    var statusCode;
    try {
        const requestToken = await getRequestToken();
        body["requestToken"] = requestToken;
        statusCode = 201;
    } catch (error) {
        statusCode = 500;
        body.error = error;
    }
    return (response = {
        statusCode: statusCode,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: body,
    });
};
