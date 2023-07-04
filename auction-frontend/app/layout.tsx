import ToastMessage from "@/component/toast/ToastMessage";
import Provider from "../component/Provider"
import "./globals.css";
import Loading from "@/component/spinner/Loading";

export default function RootLayout({
  children,

}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Provider>
          <ToastMessage />
          <Loading />
          <Nav />
          <main>{children}</main>
        </Provider>
      </body>
    </html>
  )
}