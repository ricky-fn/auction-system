import AuthService from "@/services/AuthService";
import DataService from "@/services/DataService";
import { useSession } from "next-auth/react";

let authService: AuthService | undefined;
let dataService: DataService | undefined;

const useServices = () => {
  const { data: session } = useSession();

  if (!authService) {
    authService = new AuthService(session?.idToken!);
  }

  if (!dataService) {
    dataService = new DataService(authService);
  }

  if (session?.idToken) {
    authService.updateToken(session?.idToken);
  }

  return { authService, dataService };
};

export default useServices;