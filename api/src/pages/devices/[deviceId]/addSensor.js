/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useState } from "react";
import Button from "../../../components/button";
import ErrorComponent from "../../../components/error";
import Loading from "../../../components/loading";
import PinSelect from "../../../components/pinSelect";
import RenderLabel from "../../../components/renderLabel";
import Select from "../../../components/select";
import { withPrivateWrapper } from "../../../components/withPrivateWrapper";
import fetchJson from "../../../lib/fetchJson";
import { toast } from "react-hot-toast";

const supportedSensors = [
  {
    name: "DHT",
    description:
      "The DHT sensors are made of two parts, a capacitive humidity sensor and a thermistor. It is used for measuring Temperature, Humidity and heatIndex data. and It looks like this.",
    image: "/images/dht1.jpg",
    description2: "Here is how to setup the board:",
    image2: "/images/dht2.png",
  },
  {
    name: "LDR",
    description:
      "LDR (Light Dependent Resistor) is a component that has a resistance that changes with the light intensity. This allows them to be used in sensing light. It measures light level and outputs as voltage level. It looks like this.",
    image: "/images/ldr1.jpg",
    description2: "Here is how to setup the board:",
    image2: "/images/ldr2.png",
  },
];

function AddDevicePage() {
  const { query, push } = useRouter();
  const [sensorsData, setSensorsData] = useState([]);
  const [error, setError] = useState();
  const [sensor, setSensor] = useState();
  const [sensorInfo, setSensorInfo] = useState();

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
  }, [query.deviceId]);

  useEffect(() => {
    if (!sensor || sensor === "") return;

    const newSensorInfo = {
      ...(supportedSensors.find((s) => s.name === sensor) || {}),
      ...(sensorsData.find((s) => s.name === sensor) || {}),
    };

    setSensorInfo(newSensorInfo);
  }, [sensor, sensorsData]);

  const availableSensors = useMemo(() => sensorsData, [sensorsData]);

  const handlePinChange = useCallback(
    (sensorId, value) => {
      setSensorsData((sd) =>
        sd.map((s) => {
          if (s.id === sensorId) {
            return { ...s, pin: value };
          }
          return s;
        }),
      );
    },
    [setSensorsData],
  );

  const handleCheck = useCallback(
    (sensorId, outputId) => {
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
    },
    [setSensorsData],
  );

  const handleSave = useCallback(() => {
    fetch(`/api/devices/${query.deviceId}/sensors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        sensorsData.map((s) => {
          if (typeof s.pin === "number") {
            return { ...s, active: true };
          }

          return s;
        }),
      ),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error === false) {
          push("/devices/" + query.deviceId + "?checkStatus=1");
        } else {
          toast.error(data.message ?? "Unknown error occured.");
        }

        console.log(data);
      });
  }, [sensorsData, query.deviceId, push]);

  if (error) {
    return <ErrorComponent description={error.message || "Unknown error."} />;
  }

  if (!error && sensorsData.length === 0) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col p-2 space-y-2">
      {RenderLabel("Supported Sensors", "supported-sensors")}
      <Select
        id="supported-sensors"
        name="supported-sensors"
        placeholder="Sensor"
        required
        onChange={setSensor}
        value={sensor}
      >
        {availableSensors.map((data) => (
          <Select.Option key={data.id} value={data.name} text={data.name} />
        ))}
      </Select>

      {sensorInfo?.name && (
        <div className="flex flex-col space-y-4">
          <div>{sensorInfo.description}</div>
          <img
            src={sensorInfo.image}
            alt="Sensor Image"
            width={240}
            height={240}
            className="self-center"
          />
          <div>{sensorInfo.description2}</div>
          <img
            src={sensorInfo.image2}
            alt="Sensor Image 2"
            width={400}
            className="self-center"
          />
          <div className="flex flex-row items-center">
            {RenderLabel("Sensor input pin:", "input-pin", null, "pr-4")}
            <PinSelect
              pin={sensorInfo.pin}
              pinType={sensorInfo.type}
              handlePinChange={handlePinChange}
              id={sensorInfo.id}
              pinList={sensorInfo.availablePins}
            />
          </div>

          <span>
            <b>Note:</b> D means it is digital ping, and A means it is Analog
            pin. Please make sure you put the pin to the right place
          </span>

          {RenderLabel("Desired outputs", "desired-output")}
          <div className="space-y-2">
            {sensorInfo?.outputs?.map((output) => (
              <div
                key={output.id}
                className="flex flex-row items-center space-x-2 bg-gray-500 p-2 rounded"
              >
                <input
                  id="default-checkbox"
                  type="checkbox"
                  onChange={() => handleCheck(sensorInfo.id, output.id)}
                  value=""
                  defaultChecked={output.active}
                  className="w-5 h-5 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <span className="capitalize">{output.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="self-end mt-4">
        <Button className="w-36" onClick={handleSave}>
          Save
        </Button>
      </div>
      {/* <pre>{JSON.stringify(sensorsData, null, 2)}</pre> */}
    </div>
  );
}

export default withPrivateWrapper(AddDevicePage);
