import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface S3Config {
  region: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  bucket: string;
}

export class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor(config: S3Config) {
    this.client = new S3Client({
      region: config.region,
      credentials: config.credentials,
    });
    this.bucket = config.bucket;
  }

  /**
   * Generate a pre-signed URL for uploading a file
   * @param key The object key in the S3 bucket
   * @param expiresIn Number of seconds until the URL expires (default: 3600)
   * @returns Pre-signed URL for uploading
   */
  async getUploadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Generate a pre-signed URL for downloading a file
   * @param key The object key in the S3 bucket
   * @param expiresIn Number of seconds until the URL expires (default: 3600)
   * @returns Pre-signed URL for downloading
   */
  async getDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }
}






