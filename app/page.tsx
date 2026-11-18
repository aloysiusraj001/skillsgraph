import { HomeForm, RoleStrip } from "@/components/home-form";

export default function HomePage() {
  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8">
      <header>
        <p className="text-sm font-semibold text-[#2f62e0]">Classroom C60 · ages 11–15</p>
        <h1 className="mt-1 text-3xl font-semibold">What&apos;s the problem</h1>
        <p className="mt-2 max-w-2xl">
          Five students and one teacher share one board. You map who is affected, why it happens on a fishbone, and three five-blank problem statements. Role moves change the board. The teacher watches the radar and walks over only when a cue is amber or red.
        </p>
        <RoleStrip />
      </header>
      <HomeForm />
    </main>
  );
}
