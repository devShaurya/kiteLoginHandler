"use-strict";

const AWS = require("aws-sdk");

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
const kiteApiKeyEncrypted = process.env.KITE_API_KEY;
const kiteApiSecretEncrypted = process.env.KITE_API_SECRET;
const kiteUserIdEncrypted = process.env.KITE_USER_ID;
const kiteUserPasswordEncrypted = process.env.KITE_USER_PASSWORD;
const kiteUserPinEncrypted = process.env.KITE_USER_PIN;
const kiteApiVersion = process.env.KITE_API_VERSION;

const CryptoJS = require("crypto-js");

var CryptoUtils = function () {
    this.kiteApiSecret = null;
    this.kiteApiKey = null;
    this.kiteUserId = null;
    this.kiteUserPassword = null;
    this.kiteUserPin = null;
    this.kiteApiVersion = kiteApiVersion;
    this.keySize = 128 / 32;
    this.iterationCount = 1000;
    this.hasEnvDataDecrypted = false;
};

CryptoUtils.prototype.decryptEnvData = async function () {
    var err;
    try {
        if (!this.hasEnvDataDecrypted) {
            const kms = new AWS.KMS();

            const reqKiteUserId = {
                CiphertextBlob: Buffer.from(kiteUserIdEncrypted, "base64"),
                EncryptionContext: { LambdaFunctionName: functionName },
            };
            data = await kms.decrypt(reqKiteUserId).promise();
            this.kiteUserId = data.Plaintext.toString("ascii");

            const reqKiteUserPassword = {
                CiphertextBlob: Buffer.from(
                    kiteUserPasswordEncrypted,
                    "base64"
                ),
                EncryptionContext: { LambdaFunctionName: functionName },
            };
            data = await kms.decrypt(reqKiteUserPassword).promise();
            this.kiteUserPassword = data.Plaintext.toString("ascii");

            const reqKiteUserPin = {
                CiphertextBlob: Buffer.from(kiteUserPinEncrypted, "base64"),
                EncryptionContext: { LambdaFunctionName: functionName },
            };
            data = await kms.decrypt(reqKiteUserPin).promise();
            this.kiteUserPin = data.Plaintext.toString("ascii");

            const reqKiteApiKey = {
                CiphertextBlob: Buffer.from(kiteApiKeyEncrypted, "base64"),
                EncryptionContext: { LambdaFunctionName: functionName },
            };
            var data = await kms.decrypt(reqKiteApiKey).promise();
            this.kiteApiKey = data.Plaintext.toString("ascii");

            const reqKiteApiSecret = {
                CiphertextBlob: Buffer.from(kiteApiSecretEncrypted, "base64"),
                EncryptionContext: { LambdaFunctionName: functionName },
            };
            data = await kms.decrypt(reqKiteApiSecret).promise();
            this.kiteApiSecret = data.Plaintext.toString("ascii");
        }
        this.hasEnvDataDecrypted = true;
        err = null;
    } catch (error) {
        err = error;
        this.hasEnvDataDecrypted = false;
        console.log("Decrypt error:", err);
    } finally {
        return { err };
    }
};

CryptoUtils.prototype.generateChecksum = function (requestToken) {
    return CryptoJS.SHA256(
        this.kiteApiKey + requestToken + this.kiteApiSecret
    ).toString(CryptoJS.enc.Hex);
};

CryptoUtils.prototype.generateKey = function (salt) {
    const key = CryptoJS.PBKDF2(
        this.kiteApiSecret.substring(0, 16),
        CryptoJS.enc.Hex.parse(salt),
        {
            keySize: this.keySize,
            iterations: this.iterationCount,
        }
    );
    return key;
};

CryptoUtils.prototype.encrypt = function (plainText) {
    const iv = CryptoJS.lib.WordArray.random(this.keySize * 4).toString(
        CryptoJS.enc.Hex
    );
    const salt = CryptoJS.lib.WordArray.random(this.keySize * 4).toString(
        CryptoJS.enc.Hex
    );

    const key = this.generateKey(salt);

    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
        iv: CryptoJS.enc.Hex.parse(iv),
    });
    const cipherText = encrypted.ciphertext.toString(CryptoJS.enc.Base64);

    return Buffer.from(iv + "::" + salt + "::" + cipherText).toString("base64");
};

module.exports = CryptoUtils;
