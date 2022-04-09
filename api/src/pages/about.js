import Link from "next/link";
import db from "../db";

function AboutPage({ data }) {
  return (
    <div className="bg-red-400">
      about - <Link href="/">home</Link>
      <br></br>
      db query says: {data},
    </div>
  );
}

export async function getServerSideProps() {
  const data = await db.queryOne("SELECT NOW()").then((r) => r.now.toString());
  console.log(data);
  // Pass data to the page via props
  return { props: { data } };
}

export default AboutPage;
