export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="max-md:mt-0 md:-mt-2">{children}</div>;
}
