'use client'
import { setupStore } from "@/store/reducers";
import { SessionProvider } from "next-auth/react";
import { Provider as ReduxProvider } from "react-redux";

const store = setupStore()

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