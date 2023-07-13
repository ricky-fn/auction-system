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

	public getEnvFromCfnOutput(id: string): CfnOutput {
		if (!this.envFromCfnOutputs[id]) {
			return;
		}

		return this.envFromCfnOutputs[id];
	}

	public getEnvFromCfnOutputValue(id: string): string {
		if (!this.envFromCfnOutputs[id]) {
			return;
		}

		return this.envFromCfnOutputs[id].value;
	}
}

export default BaseStack;