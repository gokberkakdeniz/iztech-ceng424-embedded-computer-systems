import { useRouter } from "next/router";
import { useMemo } from "react";
import useSWR from "swr";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import ErrorComponent from "../../../components/error";
import Loading from "../../../components/loading";
import { withPrivateWrapper } from "../../../components/withPrivateWrapper";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: "top",
    },
  },
  scales: {
    yAxes: {
      ticks: {
        color: "rgb(245, 245, 245)",
      },
    },
    xAxes: {
      ticks: {
        color: "rgb(245, 245, 245)",
      },
    },
  },
  color: "rgb(245, 245, 245)",
};

const colors = [
  {
    borderColor: "rgb(255, 99, 132)",
    backgroundColor: "rgba(255, 99, 132, 0.5)",
  },
  {
    borderColor: "rgb(53, 162, 235)",
    backgroundColor: "rgba(53, 162, 235, 0.5)",
  },
  {
    borderColor: "rgb(32,139,58)",
    backgroundColor: "rgba(32,139,58, 0.5)",
  },
  {
    borderColor: "rgb(255,216,25)",
    backgroundColor: "rgba(255,216,25, 0.5)",
  },
];

function DeviceChartPage() {
  const { query } = useRouter();
  const { data, error } = useSWR(
    `/api/devices/${query.deviceId}/values?order=asc&offset=1 days`,
  );

  const chartData = useMemo(() => {
    if (!data) return;

    const timeValuesRaw = Array.from(new Set(data.map((s) => s.bucket)));

    const timeValues = timeValuesRaw.map((s) =>
      s.substring(0, s.lastIndexOf(":")).replace("T", " "),
    );

    let ci = 0;
    return {
      labels: timeValues,
      datasets: Object.values(
        data.reduce((datasets, { bucket, name, value }) => {
          const dataset = (datasets[name] ??= {
            label: name.replace("_", "/"),
            data: [],
            fill: false,
            cubicInterpolationMode: "monotone",
            tension: 0.4,
            ...colors[ci++ % colors.length],
          });

          while (timeValuesRaw[dataset.data.length] != bucket) {
            console.log(
              dataset.data.length,
              timeValuesRaw[dataset.data.length],
              bucket,
            );
            dataset.data.push(NaN);
          }

          dataset.data.push(value);

          return datasets;
        }, {}),
      ),
      color: "white",
    };
  }, [data]);

  return (
    <>
      {!data && !error && <Loading />}
      {chartData && <Line options={options} data={chartData} />}
      {error && <ErrorComponent description={error.message} />}
    </>
  );
}

export default withPrivateWrapper(DeviceChartPage);
