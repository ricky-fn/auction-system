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

		const { stageName } = this.stageConfig;

		const suffix = `${stageName.toLowerCase()}-${getSuffixFromStack(this)}`;

		this.itemsTable = new Table(this, "ItemsTable", {
			partitionKey: {
				name: "itemId",
				type: AttributeType.STRING
			},
			tableName: `items-table-${suffix}`
		});

		this.bidsTable = new Table(this, "BidsTable", {
			partitionKey: {
				name: "bidId",
				type: AttributeType.STRING
			},
			tableName: `bids-record-table-${suffix}`
		});

		this.usersTable = new Table(this, "UsersTable", {
			partitionKey: {
				name: "id",
				type: AttributeType.STRING
			},
			tableName: `users-table-${suffix}`
		});


		this.photosBucket = new Bucket(this, "AuctionPhotos", {
			bucketName: `auction-photos-${suffix}`,
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