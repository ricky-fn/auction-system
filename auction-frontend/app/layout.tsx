import ToastMessage from "@/component/toast/ToastMessage";
import Provider from "../component/Provider"
import "./globals.css";
import Loading from "@/component/spinner/Loading";
import Nav from "@/component/nav/Nav";
import useAuthorizedAxios from "@/lib/api/axiosInstance";
import { ApiResponseList } from "auction-shared/api";
import { User } from "auction-shared/models";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function RootLayout({
  children,

}: {
  children: React.ReactNode
}) {
  let user: (undefined | User)
  const session = await getServerSession(authOptions)
  if (session) {
    const axios = useAuthorizedAxios(session)

    try {
      const { data } = await axios.get<ApiResponseList['get-user']>('get-user')

      user = data.data
    } catch (error) {
      console.error(error)
    }
  }
  return (
    <html lang="en">
      <body>
        <Provider>
          <ToastMessage />
          <Loading />
          <Nav user={user} />
          <main>{children}</main>
        </Provider>
      </body>
    </html>
  )
}