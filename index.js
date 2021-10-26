"use-strict";
const fetch = require("node-fetch");
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-2" });

const { getRequestToken } = require("./getRequestToken");
const { getAccessToken } = require("./getAccessToken");

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
const kiteApiKeyEncrypted = process.env.KITE_API_KEY;
const kiteApiSecretEncrypted = process.env.KITE_API_SECRET;
const kiteUserIdEncrypted = process.env.KITE_USER_ID;
const kiteUserPasswordEncrypted = process.env.KITE_USER_PASSWORD;
const kiteUserPinEncrypted = process.env.KITE_USER_PIN;
const kiteApiVersion = process.env.KITE_API_VERSION;
var kiteApiKey,
    kiteUserId,
    kiteUserPassword,
    kiteUserPin,
    kiteApiSecret,
    kiteEnvData;

const decryptEnvData = async () => {
    if (!kiteApiKey || !kiteUserId || !kiteUserPassword || !kiteUserPin) {
        // Decrypt code should run once and variables stored outside of the
        // function handler so that these are decrypted once per container
        const kms = new AWS.KMS();
        try {
            const reqKiteApiKey = {
                CiphertextBlob: Buffer.from(kiteApiKeyEncrypted, "base64"),
                EncryptionContext: { LambdaFunctionName: functionName },
            };
            var data = await kms.decrypt(reqKiteApiKey).promise();
            kiteApiKey = data.Plaintext.toString("ascii");

            const reqKiteUserId = {
                CiphertextBlob: Buffer.from(kiteUserIdEncrypted, "base64"),
                EncryptionContext: { LambdaFunctionName: functionName },
            };
            data = await kms.decrypt(reqKiteUserId).promise();
            kiteUserId = data.Plaintext.toString("ascii");

            const reqKiteUserPassword = {
                CiphertextBlob: Buffer.from(
                    kiteUserPasswordEncrypted,
                    "base64"
                ),
                EncryptionContext: { LambdaFunctionName: functionName },
            };
            data = await kms.decrypt(reqKiteUserPassword).promise();
            kiteUserPassword = data.Plaintext.toString("ascii");

            const reqKiteUserPin = {
                CiphertextBlob: Buffer.from(kiteUserPinEncrypted, "base64"),
                EncryptionContext: { LambdaFunctionName: functionName },
            };
            data = await kms.decrypt(reqKiteUserPin).promise();
            kiteUserPin = data.Plaintext.toString("ascii");

            const reqKiteApiSecret = {
                CiphertextBlob: Buffer.from(kiteApiSecretEncrypted, "base64"),
                EncryptionContext: { LambdaFunctionName: functionName },
            };
            data = await kms.decrypt(reqKiteApiSecret).promise();
            kiteApiSecret = data.Plaintext.toString("ascii");
        } catch (err) {
            console.log("Decrypt error:", err);
            throw err;
        }
    }
};

exports.handler = async (event, context, callback) => {
    var body = {
        error: null,
        requestToken: null,
        message: null,
        accessToken: null,
    };

    await decryptEnvData();

    kiteEnvData = {
        kiteApiKey,
        kiteApiSecret,
        kiteUserId,
        kiteUserPassword,
        kiteUserPin,
        kiteApiVersion,
    };

    const { requestToken, err } = await getRequestToken(kiteEnvData);

    if (err !== null) {
        body.error = err.toString();
        body.message = "Failed";
    } else {
        const { accessToken, err: err1 } = await getAccessToken({
            data: kiteEnvData,
            requestToken,
        });

        if (err1 !== null) {
            body.error = err1.toString();
            body.message = "Failed";
        } else {
            body.accessToken = accessToken;
            body.message = "Success";
        }
    }

    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(body),
    };
    console.log("Request:\n", requestOptions);
    // const response = await fetch(
    //     // "https://testapi.wintwealth.com/broker/kiteLoginHandlerWebhook",
    //     "https://6369-117-242-99-230.ngrok.io/broker/kiteLoginHandlerWebhook",
    //     requestOptions
    // ).then((response) => response.json());

    // if (response.message.toLowercase == "Failed") {
    //     throw "Failed";
    // }

    // return response;
};
