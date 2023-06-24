import { Stack, StackProps } from "aws-cdk-lib";
import { AttributeType, ITable, Table } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { getSuffixFromStack } from "../Utils";

export class DataStack extends Stack {
	public readonly itemsTable: ITable;
	public readonly bidsTable: ITable;
	public readonly depositTable: ITable;
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
	}
}