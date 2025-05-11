"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDDBClient = void 0;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const createDDBClient = () => {
    return lib_dynamodb_1.DynamoDBDocument.from(new client_dynamodb_1.DynamoDB({ region: "ap-southeast-2" }));
};
exports.createDDBClient = createDDBClient;
