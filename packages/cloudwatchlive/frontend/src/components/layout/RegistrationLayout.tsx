import React from "react";
import { Card, CardBody } from "@nextui-org/react";
import LoginBackground from "@/assets/images/login-bg.png";
import "../../app/globals.css";
import Image from "next/image";
import Logo from "../../assets/images/logo/logo.png";

interface RegistrationLayoutProps {
  children: React.ReactNode;
}

const RegistrationLayout = ({ children }: RegistrationLayoutProps) => {
  return (
    <>
      <div className="fixed w-screen h-screen">
        <div className="absolute w-full h-full bg-gradient-to-r from-secondary-500 to-primary-400 " />
        <Image src={LoginBackground} alt="Login Background" fill />
      </div>

      <div className="flex w-screen h-screen items-center justify-center">
        <Card className="bg-white shadow-xl w-[440px] m-auto text-center p-0 ">
          <CardBody className="p-0">
            <div className="relative flex self-center bg-white p-10">
              <Image src={Logo} alt="logo" width={180} height={100} />
            </div>
            {children}
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default RegistrationLayout;
