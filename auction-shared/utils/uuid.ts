
// Function to generate a unique itemId
export const uuid = (prefix: string): string => {
	const timestamp = new Date().getTime();
	const randomId = Math.floor(Math.random() * 10000);
	return `${prefix}-${timestamp}-${randomId}`;
};