const path = require('path');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: `${process.env.ACCESS_KEY}`,
  secretAccessKey: `${process.env.SECRET_KEY}`
});

export const uploadFile = (fileRequest) => {
  return new Promise(async (resolve, reject) => {
    let s3Res;
    const fileExt = path.extname(fileRequest.name);
    const timeStamp = new Date().getTime();
    const fileContent = Buffer.from(fileRequest.data, 'binary');
    const fileName = `${timeStamp}${fileExt}`;
    const params = {
      Bucket: 'irc-ihumane',
      Key: fileName,
      Body: fileContent
    };
    await s3.upload(params, function (s3Err, data) {
      if (s3Err) {
        reject(s3Err);
      }
      s3Res = data.Location;
      resolve(s3Res);
    });
  });
};
