'use client'
import store from "@/store/reducers";
import { SessionProvider } from "next-auth/react";
import { Provider as ReduxProvider } from "react-redux";

const Provider = ({ children }: {
  children: React.ReactNode
}) => {
  return (
    <SessionProvider>
      <ReduxProvider store={store}>
        {children}
      </ReduxProvider>
    </SessionProvider>
  )
}

export default Provider