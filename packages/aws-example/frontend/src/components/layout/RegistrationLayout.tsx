import React from "react";
import { Card, CardBody } from "@nextui-org/react";
// Static image import for Next/Image optimization
import Image from "next/image";
import Logo from "@/components/common/Logo";
import Link from "next/link";
// Use public image path to avoid Next's sharp native dependency
const LoginBackground = "/images/login-bg.png";

interface RegistrationLayoutProps {
  children: React.ReactNode;
}

const RegistrationLayout = ({ children }: RegistrationLayoutProps) => {
  return (
    <>
      <div className="fixed w-screen h-screen z-0">
        <div className="absolute w-full h-full bg-gradient-to-r from-secondary-500 to-primary-400 " />
        <Image src={LoginBackground} alt="Login Background" fill />
      </div>

      <div className="flex w-screen h-screen items-center justify-center relative z-10">
        <Card className="bg-white shadow-xl w-[440px] m-auto text-center p-0 ">
          <CardBody className="p-0">
            <div className="relative flex self-center bg-white p-10">
              <Link href="/" className="flex items-center">
                <Logo width={180} height={100} alt="logo" />
              </Link>
            </div>
            {children}
          </CardBody>
        </Card>
      </div>
    </>
  );
};

export default RegistrationLayout;
