import useSWR from "swr";
import Link from "next/link";
import ErrorComponent from "../../components/error";
import Loading from "../../components/loading";
import Table from "../../components/table";
import { PrivateWrapper } from "../../containers/wrappers";
import Button from "../../components/button";
import {
  PencilAltIcon,
  PlusIcon,
  BellIcon,
  TableIcon,
} from "@heroicons/react/solid";

function DevicesPage() {
  const { data, error } = useSWR(`/api/devices`);

  return (
    <PrivateWrapper>
      {!data && !error && <Loading />}
      {error && <ErrorComponent description={error.message} />}
      {Array.isArray(data) && (
        <>
          <Table className="w-full">
            <Table.head>
              <Table.tr>
                <Table.th>Serial Number</Table.th>
                <Table.th>Username</Table.th>
                <Table.th className="w-36"></Table.th>
              </Table.tr>
            </Table.head>

            <Table.body>
              {data.map((device) => (
                <Table.tr key={device.id}>
                  <Table.td>{device.id}</Table.td>
                  <Table.td>{device.username}</Table.td>

                  <Table.td className="text-center">
                    <div className="inline-block">
                      <Link href={`/devices/${device.id}/live`} passHref>
                        <Button as={"a"} className="w-fit">
                          <TableIcon className="h-4 w-4 align-middle pb-1 inline-block" />
                        </Button>
                      </Link>
                      <Link href={`/devices/${device.id}/actions`} passHref>
                        <Button as={"a"} className="w-fit">
                          <BellIcon className="h-4 w-4 align-middle pb-1 inline-block" />
                        </Button>
                      </Link>
                      <Link href={`/devices/${device.id}`} passHref>
                        <Button as={"a"} className="w-fit">
                          <PencilAltIcon className="h-4 w-4 align-middle pb-1 inline-block" />
                        </Button>
                      </Link>
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
    </PrivateWrapper>
  );
}

export default DevicesPage;
