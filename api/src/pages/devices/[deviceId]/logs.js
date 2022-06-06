import { useRouter } from "next/router";
import useSWR from "swr";
import ErrorComponent from "../../../components/error";
import Loading from "../../../components/loading";
import Table from "../../../components/table";
import { withPrivateWrapper } from "../../../components/withPrivateWrapper";

function DeviceLogsPage() {
  const { query } = useRouter();

  const { data: deviceResetsData, error: deviceResetsError } = useSWR(
    `/api/devices/${query.deviceId}/resets`,
  );
  const { data: sensorErrorsData, error: sensorErrorsError } = useSWR(
    `/api/devices/${query.deviceId}/errors`,
  );

  if (deviceResetsError || sensorErrorsError) {
    return (
      <ErrorComponent
        description={
          (deviceResetsError || sensorErrorsError).message || "Unknown error."
        }
      />
    );
  }

  if (!deviceResetsData || !sensorErrorsData) {
    return <Loading />;
  }

  if (!Array.isArray(deviceResetsData) || !Array.isArray(sensorErrorsData)) {
    return <ErrorComponent description={"Invalid data received. "} />;
  }

  return (
    <>
      <Table className="w-full">
        <Table.head>
          <Table.tr>
            <Table.th className="text-center" colspan={2}>
              Device Reset History
            </Table.th>
          </Table.tr>
          <Table.tr>
            <Table.th className="w-24">#</Table.th>
            <Table.th>Time</Table.th>
          </Table.tr>
        </Table.head>

        <Table.body>
          {deviceResetsData.map((time, index) => (
            <Table.tr key={time} className="text-center">
              <Table.td>{index + 1}</Table.td>
              <Table.td>{new Date(time).toLocaleString()}</Table.td>
            </Table.tr>
          ))}
          {deviceResetsData.length === 0 && (
            <Table.tr className="text-center">
              <Table.td colspan={2}>No Data</Table.td>
            </Table.tr>
          )}
        </Table.body>
      </Table>
      <br />

      <Table className="w-full">
        <Table.head>
          <Table.tr>
            <Table.th className="text-center" colspan={3}>
              Device Sensors Error History
            </Table.th>
          </Table.tr>
          <Table.tr>
            <Table.th className="w-24">#</Table.th>
            <Table.th>Name</Table.th>
            <Table.th>Time</Table.th>
          </Table.tr>
        </Table.head>

        <Table.body>
          {sensorErrorsData.map(({ time, name }, index) => {
            const [sensor, ...sensorOutput] = name.split("_");

            return (
              <Table.tr key={`${name}_${time}`} className="text-center">
                <Table.td>{index + 1}</Table.td>
                <Table.td>
                  <span className="font-bold">{sensor}</span>

                  {sensorOutput.length > 0 && (
                    <>
                      <span className="font-bold">/</span>
                      <span>{sensorOutput.join("/")}</span>
                    </>
                  )}
                </Table.td>
                <Table.td>{new Date(time).toLocaleString()}</Table.td>
              </Table.tr>
            );
          })}
          {sensorErrorsData.length === 0 && (
            <Table.tr className="text-center">
              <Table.td colspan={3}>No Data</Table.td>
            </Table.tr>
          )}
        </Table.body>
      </Table>
    </>
  );
}

export default withPrivateWrapper(DeviceLogsPage);
