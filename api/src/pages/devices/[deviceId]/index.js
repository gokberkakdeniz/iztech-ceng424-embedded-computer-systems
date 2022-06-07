import { PlusCircleIcon, PlusIcon, TrashIcon } from "@heroicons/react/solid";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Button from "../../../components/button";
import ErrorComponent from "../../../components/error";
import Loading from "../../../components/loading";
import PinSelect from "../../../components/pinSelect";
import { withPrivateWrapper } from "../../../components/withPrivateWrapper";
import fetchJson from "../../../lib/fetchJson";

const checkStatusMessages = {
  restarting: "The device is restarting...",
  restart_failed: "The device could not be restarted.",
  started: "The device is started.",
  sensors_fetch_failed: "The sensors could not fetched from database.",
  sensors_publish_failed: "The sensors data could not transmitted to device.",
  checking: "Checking sensors...",
  check_fetch_error:
    "Checking failed, could not fetch sensors from database...",
  done: "The configuration is done.",
};

const checkStatusTerminalStates = [
  "restart_failed",
  "sensors_fetch_failed",
  "sensors_publish_failed",
  "check_fetch_error",
  "done",
];

const checkStatusInfos = ["restarting", "started", "checking"];

function DevicePage() {
  const { query } = useRouter();
  const [sensorsData, setSensorsData] = useState([]);
  const [error, setError] = useState();

  useEffect(() => {
    if (sensorsData.length === 0) return;

    setSensorsData((prevValue) => prevValue.sort((a) => a.type === "digital"));
  }, [sensorsData]);

  useEffect(() => {
    if (!query.deviceId) return;

    function fetchSensorData() {
      fetchJson(`/api/devices/${query.deviceId}/sensors`)
        .then((data) => {
          if (data) {
            setSensorsData(data);
          }
        })
        .catch(setError);
    }
    fetchSensorData();
  }, [query]);

  const activeSensors = useMemo(
    () => sensorsData.filter((s) => s.active || s.__isTempDelete),
    [sensorsData],
  );

  console.log(sensorsData);

  const handleCheck = (event) => {
    const sensorId = Number.parseInt(event.target.dataset.sensorId);
    const outputId = Number.parseInt(event.target.dataset.outputId);

    console.log(sensorId, outputId);

    setSensorsData((sd) =>
      sd.map((s) => {
        if (s.id === sensorId) {
          return {
            ...s,
            outputs: s.outputs.map((o) => {
              if (o.id === outputId) {
                o.active = !o.active;
              }
              return o;
            }),
          };
        }
        return s;
      }),
    );
  };

  const handlePinChange = useCallback(
    (sensorId, value) => {
      setSensorsData((sd) =>
        sd.map((s) => {
          if (s.id === Number.parseInt(sensorId)) {
            return { ...s, pin: value };
          }
          return s;
        }),
      );
    },
    [setSensorsData],
  );

  const handleToggleSensor = useCallback(
    (event) => {
      const sensorId = Number.parseInt(event.target.dataset.sensorId);
      const sensorActive = event.target.dataset.sensorActive === "true";

      setSensorsData((sd) =>
        sd.map((s) => {
          if (s.id === sensorId) {
            const sn = { ...s, active: !sensorActive, __isTempDelete: true };

            if (!sensorActive) {
              delete sn.__isTempDelete;
            }

            return sn;
          }
          return s;
        }),
      );
    },
    [setSensorsData],
  );

  useEffect(() => {
    if (!window.location.href.includes("?checkStatus=1") || !query.deviceId)
      return;

    let intervalId = null;
    let counter = 0;

    intervalId = setInterval(() => {
      fetch(`/api/devices/${query.deviceId}/sensors/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) throw data;

          console.log(data);

          if (checkStatusInfos.includes(data.data)) {
            toast(checkStatusMessages[data.data]);
          } else if (data.data === "done") {
            toast.success(checkStatusMessages[data.data]);
          } else {
            toast.error(
              checkStatusMessages[data.data] ||
                "Unknown status returned from the API.",
            );
          }

          if (
            checkStatusTerminalStates.includes(data.data) ||
            data?.data?.startsWith?.("check_failed")
          ) {
            clearInterval(intervalId);
          }
        })
        .catch((e) => {
          clearInterval(intervalId);
          toast.error("An error occured while checking status.");
          console.log(e);
        })
        .finally(() => {
          counter++;

          if (counter > 100) {
            toast.error("Checking is cancelled due to timeout.");

            clearInterval(intervalId);
          }
        });
    }, 1500);
  }, [query.deviceId]);

  const handleSave = useCallback(() => {
    fetch(`/api/devices/${query.deviceId}/sensors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sensorsData),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error === false) {
          window.location.href =
            "/devices/" + query.deviceId + "?checkStatus=1";
          return;
        }

        console.log(data);
      });
  }, [sensorsData, query.deviceId]);

  if (error) {
    return <ErrorComponent description={error.message || "Unknown error."} />;
  }

  if (!error && sensorsData.length === 0) {
    return <Loading />;
  }

  return (
    <div className="space-y-2">
      {activeSensors.length === 0 && (
        <div className="py-24 text-center">
          You don&apos;t have any sensor :(
        </div>
      )}
      {activeSensors.map((data) => (
        <div key={data.id} className="bg-gray-700 p-2 rounded">
          <div className="flex flex-row items-center justify-between">
            <h2 className={data.__isTempDelete ? " line-through" : ""}>
              {data.name} Sensor
            </h2>
            <div className="flex flex-row items-center space-x-2">
              <b className="mr-0.5">PIN:</b>{" "}
              <PinSelect
                pin={data.pin}
                pinType={data.type}
                handlePinChange={handlePinChange}
                id={data.id}
                className="w-20"
              />
              <button
                type="button"
                data-sensor-id={data.id}
                data-sensor-active={data.active}
                onClick={handleToggleSensor}
                className="w-6"
              >
                {data.active ? (
                  <TrashIcon className="w-6 mr-2 text-rose-700 hover:bg-gray-500 hover:rounded-full active:text-gray-400 pointer-events-none" />
                ) : (
                  <PlusCircleIcon className="w-6 mr-2 text-green-700 hover:bg-gray-500 hover:rounded-full active:text-gray-400 pointer-events-none" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {data.outputs.map((output) => (
              <div
                key={output.id}
                className="flex flex-row items-center space-x-2 bg-gray-500 p-2 rounded"
              >
                <input
                  id="default-checkbox"
                  type="checkbox"
                  data-sensor-id={data.id}
                  data-output-id={output.id}
                  onChange={handleCheck}
                  value=""
                  defaultChecked={output.active}
                  className="w-5 h-5 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="capitalize">{output.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex flex-row justify-end">
        <Link href={`/devices/${query.deviceId}/addSensor`} passHref>
          <Button
            as={"a"}
            className="w-24 flex flex-row items-center justify-center"
          >
            <PlusIcon className="h-full w-4 align-middle inline-block" /> Add
          </Button>
        </Link>
        <Button onClick={handleSave} className="w-24">
          Save
        </Button>
      </div>
      <pre>{JSON.stringify(sensorsData, null, 2)}</pre>
    </div>
  );
}

export default withPrivateWrapper(DevicePage);
