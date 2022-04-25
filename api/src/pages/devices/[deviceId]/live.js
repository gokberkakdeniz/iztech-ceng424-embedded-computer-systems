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
      statistics[name] += 1;
      statistics.__total__ += 1;
    };

    return () => {
      ws.close();
    };
  }, [query.deviceId, setSensors, statistics]);

  return (
    <PrivateWrapper>
      <div className="grid md:grid-cols-4 grid-cols-2 gap-1">
        {Object.entries(sensors).map(([name, value]) => {
          const [sensor, ...sensorOutput] = name.split("_");

          return (
            <div key={name} className="bg-gray-700 p-2 rounded">
              <div>
                <span className="font-bold">{sensor}</span>

                {sensorOutput.length > 0 && (
                  <>
                    <span className="font-bold"> / </span>
                    <span>{sensorOutput.join("/")}</span>
                  </>
                )}
              </div>
              <div className="font-mono">{value}</div>
              <div
                className="text-right"
                title="Number of values belongs to this sensor"
              >
                {statistics[name]}
              </div>
            </div>
          );
        })}
      </div>
      <div
        className="text-right w-full"
        title="Number of values belongs to this device"
      >
        <b>Total:</b> {statistics.__total__}
      </div>
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
