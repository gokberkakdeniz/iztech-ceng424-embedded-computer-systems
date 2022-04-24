import useSWR from "swr";
import { useRouter } from "next/router";
import Link from "next/link";
import { PrivateWrapper } from "../../../../containers/wrappers";
import Loading from "../../../../components/loading";
import ErrorComponent from "../../../../components/error";
import Table from "../../../../components/table";
import { PencilAltIcon, PlusIcon } from "@heroicons/react/solid";
import Button from "../../../../components/button";

function ActionsPage() {
  const { query } = useRouter();
  const { data, error } = useSWR(`/api/devices/${query.deviceId}/actions`);

  return (
    <PrivateWrapper>
      {!data && !error && <Loading />}
      {error && <ErrorComponent description={error.message} />}
      {Array.isArray(data) && (
        <>
          <Table className="w-full">
            <Table.head>
              <Table.tr>
                <Table.th>Name</Table.th>
                <Table.th>Type</Table.th>
                <Table.th>Last Trigger</Table.th>
                <Table.th>Threshold</Table.th>
                <Table.th className="w-24"></Table.th>
              </Table.tr>
            </Table.head>

            <Table.body>
              {data.map((action) => (
                <Table.tr key={action.id}>
                  <Table.td>{action.name}</Table.td>
                  <Table.td>{action.type}</Table.td>
                  <Table.td>
                    {new Date(action.triggered_at).toLocaleString()}
                  </Table.td>
                  <Table.td>{action.wait_for}</Table.td>
                  <Table.td className="text-center ">
                    <Link
                      href={`/devices/${query.deviceId}/actions/${action.id}`}
                      passHref
                    >
                      <Button as={"a"} className="w-fit">
                        <PencilAltIcon className="h-4 w-4 align-middle pb-1 inline-block" />
                      </Button>
                    </Link>
                  </Table.td>
                </Table.tr>
              ))}
            </Table.body>
          </Table>
          <div className="flex justify-end">
            <Link href={`/devices/${query.deviceId}/actions/new`} passHref>
              <Button as={"a"} className="w-24 mr-0 p-0">
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

export default ActionsPage;
