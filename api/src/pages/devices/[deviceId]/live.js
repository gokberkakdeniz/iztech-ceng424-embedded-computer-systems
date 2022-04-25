import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { PrivateWrapper } from "../../../containers/wrappers";
import db from "../../../lib/db";

function DeviceLivePage({ initialData = {}, statistics = {} }) {
  const { query } = useRouter();
  const [sensors, setSensors] = useState(initialData);

  useEffect(() => {
    if (!query.deviceId) return;

    const protocol = window.location.protocol === "https:" ? "wss" : "ws";

    const ws = new WebSocket(
      `${protocol}://${window.location.host}/ws?deviceId=${query.deviceId}`,
    );

    ws.onopen = console.log;
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
      <b>live</b>
      <pre>{JSON.stringify(sensors, undefined, 2)}</pre>
      <b>statistics</b>
      <pre>{JSON.stringify(statistics, undefined, 2)}</pre>
    </PrivateWrapper>
  );
}

export async function getServerSideProps(context) {
  // NOTE: why not just send http req to internal server? :/
  const [data, err] = await db.getLatestSensorValuesByDeviceId(
    context.params.deviceId,
  );
  const initialData = err ? {} : data;

  // NOTE: why not just send http req to internal server? :/
  const [statsData, statsErr] = await db.getSensorValueCountByDeviceId(
    context.params.deviceId,
  );
  const statistics = statsErr ? {} : statsData;
  statistics.__total__ = Object.values(statistics).reduce(
    (pre, curr) => pre + curr,
    0,
  );

  return { props: { initialData, statistics } };
}

export default DeviceLivePage;
