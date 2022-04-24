import React from "react";

const Loading = () => {
  return (
    <div className="flex flex-col justify-center items-center gap-5 my-4">
      <div className="animate-spin rounded-full h-16 w-16 border border-b-4 border-yellow-500"></div>
      <div className="font-bold text-yellow-500">
        Loading<span className="three-dot"></span>
      </div>
    </div>
  );
};

export default Loading;
