import React from "react";
import NextImage from "next/image";
import { Card, CardBody } from "@nextui-org/react";
import LoginBackground from "@/assets/images/login-bg.png";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "../../app/globals.css";
import Logo from "../../assets/images/logo/logo.png";
interface RegistrationLayoutProps {
  children: React.ReactNode;
}

const RegistrationLayout = ({ children }: RegistrationLayoutProps) => {
    return (
      <QueryClientProvider
        client={
          new QueryClient({
            defaultOptions: {
              queries: {
                retry: false,
                refetchOnWindowFocus: false,
              },
            },
          })
        }
      >
        <div className="fixed w-screen h-screen">
          <div className="absolute w-full h-full bg-gradient-to-r from-secondary-500 to-primary-500 " />
          <NextImage src={LoginBackground} alt="Login Background" fill />
        </div>
  
        <div className="flex w-screen h-screen items-center justify-center">
          <Card className="bg-white shadow-xl w-[440px] m-auto text-center p-0 ">
            <CardBody className="p-0">
              <div className="relative flex h-[180px] self-center bg-white">
              <NextImage src={Logo} alt="logo" height={80} width={200}/>
              </div>
              {children}
            </CardBody>
          </Card>
        </div>
      </QueryClientProvider>
    );
  };
  

export default RegistrationLayout;
