import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { useSession } from "next-auth/react";
import CDKStack from 'auction-shared/outputs.json';

const config: AxiosRequestConfig = {};
export const baseURL =
  process.env.NODE_ENV === "test"
    ? "http://localhost:3000"
    : CDKStack.AuctionApiStack.AuctionApiUrl

config.baseURL = baseURL;

export const axiosInstance = axios.create(config);

const useAuthorizedAxios = (): AxiosInstance => {
  const session = useSession();

  const axiosInstance = axios.create({
    ...config,
    headers: {
      Authorization: session.data?.idToken,
    },
  });

  return axiosInstance;
};

export default useAuthorizedAxios;