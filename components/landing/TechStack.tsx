/**
 * TechStack component for landing page (Server Component)
 */
export function TechStack() {
  const technologies = [
    {
      name: 'Next.js 16',
      icon: '⚡'
    },
    {
      name: 'Leaflet',
      icon: '🗺️'
    },
    {
      name: 'Tailwind CSS',
      icon: '🎨'
    },
    {
      name: 'TypeScript',
      icon: '📘'
    },
    {
      name: 'React 19',
      icon: '⚛️'
    }
  ]

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2">
      <h2 className="text-center text-sm font-semibold text-white/60 uppercase tracking-wider mb-12">
        Built With
      </h2>

      <div className="flex flex-wrap gap-4 sm:gap-6 items-center justify-center">
        {technologies.map(tech => (
          <div
            key={tech.name}
            className="flex items-center gap-3 px-6 py-2 rounded-2xl bg-white/10 hover:bg-white/20 transition-all duration-200 hover:scale-105 hover:shadow-lg group border border-white/20 backdrop-blur-sm"
          >
            <span className="text-2xl">{tech.icon}</span>
            <span className="text-lg sm:text-xl font-semibold text-white whitespace-nowrap">
              {tech.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
