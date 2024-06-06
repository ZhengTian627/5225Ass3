
import AWS from 'aws-sdk';

AWS.config.update({
    region: 'us-east-1',
    accessKeyId: 'AKIA47CR3KFWBIIRGYAH',
    secretAccessKey: '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'
});

export const s3  = new AWS.S3();
export const sns = new AWS.SNS();