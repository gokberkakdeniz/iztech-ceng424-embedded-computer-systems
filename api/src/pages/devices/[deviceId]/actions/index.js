import useSWR from "swr";
import { useRouter } from "next/router";
import Link from "next/link";
import Loading from "../../../../components/loading";
import ErrorComponent from "../../../../components/error";
import Table from "../../../../components/table";
import { PencilAltIcon, PlusIcon, TrashIcon } from "@heroicons/react/solid";
import Button from "../../../../components/button";
import { useCallback } from "react";
import fetchJson from "../../../../lib/fetchJson";
import { toast } from "react-hot-toast";
import { withPrivateWrapper } from "../../../../components/withPrivateWrapper";

function ActionsPage() {
  const { query } = useRouter();
  const { data, error, mutate } = useSWR(
    `/api/devices/${query.deviceId}/actions`,
  );

  const handleDelete = useCallback(
    async (event) => {
      console.log(event.target.dataset);
      const actionId = event.target.dataset.actionId;

      if (confirm("Do you want to delete this action?")) {
        try {
          await fetchJson(
            `/api/devices/${query.deviceId}/actions/${actionId}`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
            },
          );

          mutate(data.filter((action) => action.id !== actionId));
          toast.success("Deleted successfully.");
        } catch (e) {
          toast.error("An error occurred.");
          console.log(e);
        }
      }
    },
    [data, mutate, query.deviceId],
  );

  return (
    <>
      {!data && !error && <Loading />}
      {error && <ErrorComponent description={error.message} />}
      {Array.isArray(data) && (
        <>
          <Table className="w-full">
            <Table.head>
              <Table.tr>
                <Table.th colspan={5}>Actions</Table.th>
              </Table.tr>
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
                  <Table.td>
                    <div className="flex justify-center">
                      <Button
                        as="div"
                        className="max-w-fit"
                        title="Edit action"
                      >
                        <Link
                          href={`/devices/${query.deviceId}/actions/${action.id}`}
                          passHref
                        >
                          <a>
                            <PencilAltIcon className="h-4 w-4 align-middle pb-1 inline-block pointer-events-none" />
                          </a>
                        </Link>
                      </Button>

                      <Button
                        className="max-w-fit"
                        data-action-id={action.id}
                        onClick={handleDelete}
                        title="Delete action"
                      >
                        <TrashIcon className="h-4 w-4 align-middle pb-1 inline-block pointer-events-none" />
                      </Button>
                    </div>
                  </Table.td>
                </Table.tr>
              ))}
              {data.length === 0 && (
                <Table.tr className="text-center">
                  <Table.td colspan={5}>No Data</Table.td>
                </Table.tr>
              )}
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
    </>
  );
}

export default withPrivateWrapper(ActionsPage);
