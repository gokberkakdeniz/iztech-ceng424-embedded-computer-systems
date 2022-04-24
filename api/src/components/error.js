import React from "react";
import { ExclamationCircleIcon } from "@heroicons/react/solid";

const ErrorComponent = ({ description = "" }) => {
  return (
    <div className="flex flex-col justify-center items-center my-4">
      <ExclamationCircleIcon className="h-16 w-16 text-red-500" />
      <h3 className="font-bold text-red-500 mb-4">
        An error occurred please try again later.
      </h3>
      <p className="font-mono text-center">{description}</p>
    </div>
  );
};

export default ErrorComponent;
