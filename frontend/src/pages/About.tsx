export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-foreground">
              Over 10+ Years of Excellence in Security Infrastructure
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Founded with a mission to deliver uncompromised security, SKTechnology has equipped thousands of residential properties, commercial offices, and industrial plants with reliable CCTV technology.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-card border border-border rounded-xl">
                <p className="text-2xl font-extrabold text-red-500">10,000+</p>
                <p className="text-xs text-muted-foreground font-medium">Installations Completed</p>
              </div>
              <div className="p-4 bg-card border border-border rounded-xl">
                <p className="text-2xl font-extrabold text-red-500">99.9%</p>
                <p className="text-xs text-muted-foreground font-medium">System Uptime Guarantee</p>
              </div>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border group">
            <img
              src="/images/about_cctv.jpg"
              alt="SK Technology CCTV Surveillance Installation"
              className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
