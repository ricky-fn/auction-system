import { CfnOutput, CfnOutputProps, Stack } from "aws-cdk-lib";
import { IStackCfnOutputObject } from "../../types";

class BaseStack extends Stack {
	public envFromCfnOutputs: IStackCfnOutputObject = {};

	protected addEnvFromCfnOutputs(id: string, value: string) {
		if (this.envFromCfnOutputs[id]) {
			throw new Error(`CfnOutput with id: ${id} already exists`);
		}

		this.envFromCfnOutputs[id] = new CfnOutput(this, id, {
			value
		} as CfnOutputProps);
	}
}

export default BaseStack;