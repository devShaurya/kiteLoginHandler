"use-strict";

const chromium = require("chrome-aws-lambda");
const kiteApiKey = process.env.KITE_API_KEY;
const kiteUserId = process.env.KITE_USER_ID;
const kiteUserPassword = process.env.KITE_USER_PASSWORD;
const kiteUserPin = process.env.KITE_USER_PIN;
const kiteApiVersion = process.env.KITE_API_VERSION;

exports.getRequestToken = async () => {
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
