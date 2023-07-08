import axios, { AxiosHeaders, AxiosInstance, AxiosRequestConfig } from "axios";
import { useSession } from "next-auth/react";
import CDKStack from 'auction-shared/outputs.json';
import { Session } from "next-auth";

const config: AxiosRequestConfig = {
  baseURL: CDKStack.AuctionApiStack.AuctionApiUrl
};

export const axiosInstance = axios.create(config);

export const createAuthorizedAxios = (session: Session): AxiosInstance => {
  if (!session) {
    throw new Error('Session is undefined');
  }

  const idToken = session.idToken;

  const headers: Partial<AxiosHeaders> = {};
  if (!process.env.ENABLE_MOCKS) {
    headers['Authorization'] = idToken;
  }

  const axiosInstance = axios.create({
    ...config,
    headers
  });

  return axiosInstance;
};