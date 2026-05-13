import Link from "next/link";

export default function Home() {
  return (
    <main className="relative h-dvh w-dvw overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Background: stars (placeholder for now) */}
      <div className="absolute inset-0 opacity-60">
        {/* We'll implement a performant starfield next */}
      </div>

      {/* Center + orbits container */}
      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-[92vmin] w-[92vmin] max-h-[820px] max-w-[820px]">
          {/* ORBIT #1: Software */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="absolute top-4 left-4 rounded bg-red-500 px-3 py-1 text-sm text-white">
  Tailwind OK
</div>
            {/* Ring */}
            <div className="relative h-[46%] w-[46%] rounded-full border border-neutral-700/50">
              {/* Rotating Track */}
              <div className="absolute inset-0 animate-orbit">
                {/* Planet positing on the ring (right side) */}
                <Link
                  href="/software"
                  aria-label="Go to Software"
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2"
                >
                  <div className="group relative">
                    {/* planet */}
                    <div className="h-10 w-10 rounded-full border border-neutral-300/60 bg-neutral-900 shadow-sm transition-transform duration-200 group-hover:scale-110" />
                    <div className="absolute inset-0 animate-orbit"></div>
                    {/* label */}
                    <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-neutral-700/60 bg-neutral-950/80 px-3 py-1 text-xs text-neutral-200 opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100">
                      Software
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
          {/* Center node */}
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-700/60">
            <div className="grid h-full w-full place-items-center text-xs tracking-wide text-neutral-200">
              Abhik
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-neutral-400">
        Select a domain
      </div>
    </main>
  );
}