import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trip Details",
};

export default function TripDetailsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
