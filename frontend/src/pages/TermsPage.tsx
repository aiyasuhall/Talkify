const TermsPage = () => {
  return (
    <div className="absolute inset-0 z-0 flex min-h-svh flex-col items-center justify-center bg-gradient-purple bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-2xl">
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <div className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Terms of Service</h1>
              <p className="text-balance text-muted-foreground">
                Last updated: March 20, 2026
              </p>
            </div>

            <div className="max-h-96 space-y-4 overflow-y-auto pr-2 text-sm text-muted-foreground">
              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">1. Acceptance</h2>
                <p>
                  By using Talkify, you agree to follow these terms and use the
                  service in a respectful and lawful way.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">2. Your Account</h2>
                <p>
                  You are responsible for keeping your login information secure
                  and for activities that happen under your account.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">3. Acceptable Use</h2>
                <p>
                  Do not use Talkify to harass others, spread spam, upload harmful
                  content, or interfere with the service.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">4. Service Changes</h2>
                <p>
                  We may update, improve, or remove features at any time to keep
                  the app stable and useful.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">5. Termination</h2>
                <p>
                  We may suspend or remove accounts that violate these terms or
                  misuse the platform.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">6. Liability</h2>
                <p>
                  Talkify is provided as-is. We try to keep it reliable, but we
                  cannot guarantee uninterrupted availability at all times.
                </p>
              </section>
            </div>

            <a
              href="/signin"
              className="w-full rounded-md bg-primary px-4 py-2 text-center text-primary-foreground transition hover:bg-primary/90"
            >
              Back
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;