
import AWS from 'aws-sdk';

AWS.config.update({
    region: 'us-east-1',
    accessKeyId: ''
    secretAccessKey:'' 
});

export const s3  = new AWS.S3();
export const sns = new AWS.SNS();
