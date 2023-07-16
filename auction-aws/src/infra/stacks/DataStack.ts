import { AttributeType, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { getSuffixFromStack } from "../Utils";
import { Bucket, HttpMethods, IBucket, ObjectOwnership } from "aws-cdk-lib/aws-s3";
import { IStackCfnOutputObject } from "../../types";
import BaseStack from "./BaseStack";
import { StackProps } from "aws-cdk-lib";

export class DataStack extends BaseStack {
	public readonly itemsTable: ITable;
	public readonly bidsTable: ITable;
	public readonly usersTable: ITable;
	public readonly photosBucket: IBucket;
	public envFromCfnOutputs: IStackCfnOutputObject;

	constructor(scope: Construct, id: string, props: StackProps) {
		super(scope, id, props);

		this.itemsTable = new Table(this, `ItemsTable${this.suffix}`, {
			partitionKey: {
				name: "itemId",
				type: AttributeType.STRING
			},
		});

		this.bidsTable = new Table(this, `BidsTable${this.suffix}`, {
			partitionKey: {
				name: "bidId",
				type: AttributeType.STRING
			},
		});

		this.usersTable = new Table(this, `UsersTable${this.suffix}`, {
			partitionKey: {
				name: "id",
				type: AttributeType.STRING
			},
		});

		this.photosBucket = new Bucket(this, `AuctionPhotos${this.suffix}`, {
			cors: [
				{
					allowedMethods: [
						HttpMethods.GET,
						HttpMethods.PUT,
						HttpMethods.HEAD,
					],
					allowedOrigins: ["*"],
					allowedHeaders: ["*"]
				}
			],
			objectOwnership: ObjectOwnership.OBJECT_WRITER, // this allows the user to upload photos
			blockPublicAccess: { // this allows public access to the bucket
				blockPublicAcls: false,
				blockPublicPolicy: false,
				ignorePublicAcls: false,
				restrictPublicBuckets: false
			}
		});

		this.addEnvFromCfnOutputs("AuctionPhotosBucketName", this.photosBucket.bucketName);
	}
}