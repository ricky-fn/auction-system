import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { useSession } from "next-auth/react";
import CDKStack from 'auction-shared/outputs.json';
import { Session, getServerSession } from "next-auth";

const config: AxiosRequestConfig = {};
export const baseURL =
  process.env.NODE_ENV === "test"
    ? "http://localhost:3000"
    : CDKStack.AuctionApiStack.AuctionApiUrl

config.baseURL = baseURL;

export const axiosInstance = axios.create(config);

const useAuthorizedAxios = (session?: Session | undefined): AxiosInstance => {
  const idToken = session?.idToken || useSession().data?.idToken;

  const axiosInstance = axios.create({
    ...config,
    headers: {
      Authorization: idToken,
    },
  });

  return axiosInstance;
};

export default useAuthorizedAxios;