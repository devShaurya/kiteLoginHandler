"use-strict";

const chromium = require("chrome-aws-lambda");
const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-2" });

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
const kiteApiKeyEncrypted = process.env.KITE_API_KEY;
const kiteUserIdEncrypted = process.env.KITE_USER_ID;
const kiteUserPasswordEncrypted = process.env.KITE_USER_PASSWORD;
const kiteUserPinEncrypted = process.env.KITE_USER_PIN;
const kiteApiVersion = process.env.KITE_API_VERSION;
var kiteApiKey, kiteUserId, kiteUserPassword, kiteUserPin;

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
        } catch (err) {
            console.log("Decrypt error:", err);
            throw err;
        }
    }
};

exports.getRequestToken = async () => {
    await decryptEnvData();
    var browser,
        requestToken,
        err = null;
    try {
        browser = await chromium.puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();
        await page.waitForTimeout(1000);
        await page.goto(
            `https://kite.zerodha.com/connect/login?v=${kiteApiVersion}&api_key=${kiteApiKey}`
        );
        await page.waitForTimeout(1000);
        await page.focus("input[type='text']");
        await page.keyboard.type(kiteUserId);
        await page.focus("input[type='password']");
        await page.keyboard.type(kiteUserPassword);
        await page.click("button[type='submit']");

        await page.waitForTimeout(1000);
        await page.focus("input[type='password']");
        await page.keyboard.type(kiteUserPin);
        await page.click("button[type='submit']");

        await page.waitForNavigation();

        const url = new URL(page.url());
        const searchParams = new URLSearchParams(url.search);
        requestToken = searchParams.get("request_token");
    } catch (error) {
        err = error;
    } finally {
        if (browser != null) {
            browser.close();
        }
        return { requestToken, err };
    }
};
