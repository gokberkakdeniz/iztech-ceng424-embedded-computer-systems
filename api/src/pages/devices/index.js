import useSWR from "swr";
import Link from "next/link";
import ErrorComponent from "../../components/error";
import Loading from "../../components/loading";
import Table from "../../components/table";
import Button from "../../components/button";
import {
  PencilAltIcon,
  PlusIcon,
  BellIcon,
  TableIcon,
  ChartBarIcon,
  TicketIcon,
} from "@heroicons/react/solid";
import { withPrivateWrapper } from "../../components/withPrivateWrapper";

function DevicesPage() {
  const { data, error } = useSWR(`/api/devices`);

  return (
    <>
      {!data && !error && <Loading />}
      {error && <ErrorComponent description={error.message} />}
      {Array.isArray(data) && (
        <>
          <Table className="w-full">
            <Table.head>
              <Table.tr>
                <Table.th className="w-72">Serial Number</Table.th>
                <Table.th>Username</Table.th>
                <Table.th className="w-64"></Table.th>
              </Table.tr>
            </Table.head>

            <Table.body>
              {data.map((device) => (
                <Table.tr key={device.id}>
                  <Table.td>{device.id}</Table.td>
                  <Table.td>{device.username}</Table.td>

                  <Table.td className="text-center">
                    <div className="flex justify-center">
                      <Button
                        as="div"
                        className="max-w-fit"
                        title="Show live data"
                      >
                        <Link href={`/devices/${device.id}/live`} passHref>
                          <a>
                            <TableIcon className="h-4 w-4 align-middle pb-1 inline-block" />
                          </a>
                        </Link>
                      </Button>

                      <Button
                        as="div"
                        className="max-w-fit"
                        title="Show chart data"
                      >
                        <Link href={`/devices/${device.id}/chart`} passHref>
                          <a>
                            <ChartBarIcon className="h-4 w-4 align-middle pb-1 inline-block" />
                          </a>
                        </Link>
                      </Button>

                      <Button
                        as="div"
                        className="max-w-fit"
                        title="Show actions"
                      >
                        <Link href={`/devices/${device.id}/actions`} passHref>
                          <a>
                            <BellIcon className="h-4 w-4 align-middle pb-1 inline-block" />
                          </a>
                        </Link>
                      </Button>

                      <Button as="div" className="max-w-fit" title="Show logs">
                        <Link href={`/devices/${device.id}/logs`} passHref>
                          <a>
                            <TicketIcon className="h-4 w-4 align-middle pb-1 inline-block" />
                          </a>
                        </Link>
                      </Button>

                      <Button
                        as="div"
                        className="max-w-fit"
                        title="Edit device"
                      >
                        <Link href={`/devices/${device.id}`} passHref>
                          <a>
                            <PencilAltIcon className="h-4 w-4 align-middle pb-1 inline-block" />
                          </a>
                        </Link>
                      </Button>
                    </div>
                  </Table.td>
                </Table.tr>
              ))}
            </Table.body>
          </Table>
          <div className="flex justify-end">
            <Link href={"" /* `/devices/new` */} passHref>
              <Button className="w-24 mr-0 p-0 cursor-not-allowed">
                <PlusIcon className="h-full w-4 align-middle inline-block" />{" "}
                Add
              </Button>
            </Link>
          </div>
        </>
      )}
    </>
  );
}

export default withPrivateWrapper(DevicesPage);
