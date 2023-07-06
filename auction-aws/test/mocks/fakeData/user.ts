import { User } from "auction-shared/models";

export const generateFakeUser = (user?: User) => {
	return {
		id: "testid",
		password: "password",
		email: "test@example.com",
		balance: 100,
		create_at: 1626432420000,
		given_name: "John",
		family_name: "Doe",
		picture: "https://example.com/avatar.jpg",
		...user
	};
};