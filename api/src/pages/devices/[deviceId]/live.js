import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Loading from "../../../components/loading";
import { withPrivateWrapper } from "../../../components/withPrivateWrapper";

function DeviceLivePage() {
  const { query } = useRouter();
  const [sensors, setSensors] = useState({});
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query.deviceId) return;

    async function fetchStat() {
      const k = await fetch(`/api/devices/${query.deviceId}/values/summary`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => res.json());

      setSensors(k.data.initialData);
      setStatistics(k.data.statistics);
      setLoading(false);
    }
    fetchStat();
  }, [query.deviceId]);

  useEffect(() => {
    if (!query.deviceId || Object.keys(statistics).length === 0) return;
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
    <>
      {loading && <Loading />}
      <div className="grid md:grid-cols-4 grid-cols-2 gap-1">
        {!loading &&
          Object.entries(sensors).map(([name, value]) => {
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
        {!loading && (
          <>
            <b>Total:</b> {statistics.__total__}
          </>
        )}
      </div>
    </>
  );
}

export default withPrivateWrapper(DeviceLivePage);
