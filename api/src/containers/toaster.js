import { Toaster } from "react-hot-toast";

const AlertContainer = () => {
  return (
    <Toaster
      containerStyle={{
        top: 55,
      }}
      toastOptions={{
        position: "top-right",
        style: {
          background: "#1f2937",
          color: "#ffffff",
          border: "1px solid #facc15",
        },
      }}
    />
  );
};

export default AlertContainer;
