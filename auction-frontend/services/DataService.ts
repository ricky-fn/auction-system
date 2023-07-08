import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { AuthService } from "./AuthService";
import CDKStack from 'auction-shared/outputs.json';

export class DataService {
  private authService: AuthService;
  private s3Client: S3Client | undefined;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  public async uploadPhoto(file: File) {
    if (process.env.ENABLE_MOCKS) {
      return file.name;
    }
    const credentials = await this.authService.getTemporaryCredentials();
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        credentials: credentials as any,
        region: CDKStack.AuctionAuthStack.AuctionAuthRegion
      })
    }
    const command = new PutObjectCommand({
      Bucket: CDKStack.AuctionDataStack.AuctionPhotosBucketName,
      Key: file.name,
      ACL: 'public-read',
      Body: file
    })
    await this.s3Client.send(command);
    return `https://${command.input.Bucket}.s3.${CDKStack.AuctionAuthStack.AuctionAuthRegion}.amazonaws.com/${encodeURIComponent(file.name)}`
  }
}