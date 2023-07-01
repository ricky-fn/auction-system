import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { getSuffixFromStack } from "../Utils";
import { Bucket, HttpMethods, IBucket, ObjectOwnership } from "aws-cdk-lib/aws-s3";

export class DataStack extends Stack {
	public readonly itemsTable: ITable;
	public readonly bidsTable: ITable;
	public readonly depositTable: ITable;
	public readonly usersTable: ITable;
	public readonly photosBucket: IBucket;

	constructor(scope: Construct, id: string, props?: StackProps) {
		super(scope, id, props);

		const suffix = getSuffixFromStack(this);

		this.itemsTable = new Table(this, "ItemsTable", {
			partitionKey: {
				name: "itemId",
				type: AttributeType.STRING
			},
			tableName: `ItemsTable-${suffix}`
		});

		this.bidsTable = new Table(this, "BidsTable", {
			partitionKey: {
				name: "id",
				type: AttributeType.STRING
			},
			tableName: `BidsTable-${suffix}`
		});

		this.depositTable = new Table(this, "DepositTable", {
			partitionKey: {
				name: "id",
				type: AttributeType.STRING
			},
			tableName: `DepositTable-${suffix}`
		});

		this.usersTable = new Table(this, "UsersTable", {
			partitionKey: {
				name: "id",
				type: AttributeType.STRING
			},
			tableName: `UsersTable-${suffix}`
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
		new CfnOutput(this, "AuctionPhotosBucketName", {
			value: this.photosBucket.bucketName
		});
	}
}