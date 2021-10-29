"use-strict";

const chromium = require("chrome-aws-lambda");
const { addExtra } = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const UserAgent = require("user-agents");
const puppeteerExtra = addExtra(chromium.puppeteer);
puppeteerExtra.use(StealthPlugin());

// const AWS = require('aws-sdk');
// var s3bucket = new AWS.S3({params: {Bucket: 'mybucket1600'}});

exports.getRequestToken = async (cryptoUtils) => {
    const {
        kiteApiKey,
        kiteUserId,
        kiteUserPassword,
        kiteUserPin,
        kiteApiVersion,
    } = cryptoUtils;
    var browser,
        requestToken,
        err = null;
    try {
        browser = await puppeteerExtra.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: chromium.headless,
            ignoreHTTPSErrors: true,
        });
        const page = await browser.newPage();

        // config for timeout and captcha
        const UA = new UserAgent();
        await page.setUserAgent(UA.toString());
        await page.setDefaultNavigationTimeout(0);
        await page.setJavaScriptEnabled(true);

        await page.goto(
            `https://kite.zerodha.com/connect/login?v=${kiteApiVersion}&api_key=${kiteApiKey}`
        );
        await page.waitForTimeout(1000);
        await page.focus("input[type='text']");
        await page.keyboard.type(kiteUserId);
        await page.focus("input[type='password']");
        await page.keyboard.type(kiteUserPassword);
        await page.click("button[type='submit']");

        // var name = Date.now();

        // const buffer = await page.screenshot();

        // const s3result1 = await s3bucket
        //     .upload({
        //         Key: `${name}.png`,
        //         Body: buffer,
        //         ContentType: "image/png",
        //     })
        //     .promise();

        // console.log("S3 image URL:", s3result1.Location);

        await page.waitForTimeout(1000);
        await page.focus("input[type='password']");
        await page.keyboard.type(kiteUserPin);
        await page.click("button[type='submit']");

        // const buffer2 = await page.screenshot();
        // const s3result2 = s3bucket
        //     .upload({
        //         Key: `${name}-2.png`,
        //         Body: buffer2,
        //         ContentType: "image/png",
        //     })
        //     .promise();

        // console.log("S3 image URL:", s3result2.Location);

        await page.waitForTimeout(10000);

        const url = new URL(page.url());
        const searchParams = new URLSearchParams(url.search);
        requestToken = searchParams.get("request_token");
        // console.log({ url, requestToken });

        // const buffer3 = await page.screenshot();
        // const s3result3 = s3bucket
        //     .upload({
        //         Key: `${name}-3.png`,
        //         Body: buffer3,
        //         ContentType: "image/png",
        //     })
        //     .promise();

        // console.log("S3 image URL:", s3result3.Location);
        if (!requestToken) {
            throw "No request-token";
        }
    } catch (error) {
        err = error;
    } finally {
        if (browser != null) {
            browser.close();
        }
        return { requestToken, err };
    }
};
