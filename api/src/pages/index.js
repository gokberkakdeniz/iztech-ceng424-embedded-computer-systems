import Link from "next/link";

function HomePage() {
  return (
    <div className="bg-red-200">
      home - <Link href="/about">about</Link>
    </div>
  );
}

export default HomePage;
