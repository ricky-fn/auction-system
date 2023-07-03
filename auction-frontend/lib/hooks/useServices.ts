import { AuthService } from "@/services/AuthService";
import { DataService } from "@/services/DataService";
import { useSession } from "next-auth/react";

let authService: AuthService | undefined;
let dataService: DataService | undefined;

const useServices = () => {
  const session = useSession();

  if (!authService) {
    authService = new AuthService(session.data?.idToken);
  }

  if (!dataService) {
    dataService = new DataService(authService);
  }

  if (session.data?.idToken) {
    authService.updateToken(session.data?.idToken);
  }

  return { authService, dataService };
};

export default useServices;