import { Input, cn } from "@nextui-org/react";
import React from "react";

type Props = {
  label?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export const CWLTextField = ({ label, onChange }: Props) => {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-primary-500 font-bold mb-1">
          {label}
        </label>
      )}
      <Input
        type="text"
        classNames={{
          input: 'border-2 border-neutral-100 rounded-sm p-2',
          inputWrapper: cn(
            "p-0",
            "group-data-[focus=true]:border-primary-100",
            "data-[hover=true]:border-primary-100",
          ),
        }}
        onChange={onChange}
      />
    </div>
  );
};