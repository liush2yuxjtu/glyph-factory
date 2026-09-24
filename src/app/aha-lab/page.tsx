import { notFound } from "next/navigation";
import AhaLabClient from "./AhaLabClient";

export const metadata = {
  title: "字工厂 · Aha Lab",
  robots: { index: false, follow: false },
};

export default function AhaLabPage() {
  // Internal review surface: available locally and on Vercel Preview only.
  // Never expose the A01–A28 catalog on the production player deployment.
  if (process.env.VERCEL_ENV === "production") notFound();
  return <AhaLabClient />;
}
