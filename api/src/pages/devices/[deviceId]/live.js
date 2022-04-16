import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { PrivateWrapper } from "../../../containers/wrappers";

function DeviceLivePage() {
  const { query } = useRouter();
  const [sensors, setSensors] = useState({});

  useEffect(() => {
    if (!query.deviceId) return;

    const ws = new WebSocket(
      `ws://${window.location.host}/ws?deviceId=${query.deviceId}`,
    );

    ws.onerror = console.error;
    ws.onmessage = (event) => {
      const { name, value } = JSON.parse(event.data);
      setSensors((s) => ({ ...s, [name]: value }));
    };

    return () => {
      ws.close();
    };
  }, [query.deviceId, setSensors]);

  return (
    <PrivateWrapper>
      <pre>{JSON.stringify(sensors, undefined, 2)}</pre>
    </PrivateWrapper>
  );
}

export default DeviceLivePage;
