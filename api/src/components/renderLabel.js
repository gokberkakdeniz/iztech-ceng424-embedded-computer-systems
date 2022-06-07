import React from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/solid";

const RenderLabel = (text, htmlFor, description) => (
  <label htmlFor={htmlFor} className="flex flex-row justify-center gap-x-0.5">
    <b>{text}</b>

    {description && (
      <>
        <QuestionMarkCircleIcon className="h-full ml-1 w-4 self-start">
          <span title={description}></span>
        </QuestionMarkCircleIcon>
      </>
    )}
  </label>
);

export default RenderLabel;
