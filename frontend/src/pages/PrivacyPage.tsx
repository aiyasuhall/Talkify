const PrivacyPage = () => {
  return (
    <div className="absolute inset-0 z-0 flex min-h-svh flex-col items-center justify-center bg-gradient-purple bg-muted p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-2xl">
        <div className="overflow-hidden rounded-lg border border-border bg-white">
          <div className="flex flex-col gap-6 p-6 md:p-8">
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Privacy Policy</h1>
              <p className="text-balance text-muted-foreground">
                Last updated: March 20, 2026
              </p>
            </div>

            <div className="max-h-96 space-y-4 overflow-y-auto pr-2 text-sm text-muted-foreground">
              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">1. Information We Collect</h2>
                <p>
                  We may collect information such as your username, email address,
                  profile details, and messages required to operate the app.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">2. How We Use Data</h2>
                <p>
                  We use your data to authenticate your account, provide chat
                  features, improve the service, and maintain security.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">3. Data Sharing</h2>
                <p>
                  We do not sell your personal information. Data may only be shared
                  when needed to run the service or comply with legal obligations.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">4. Data Security</h2>
                <p>
                  We apply reasonable technical measures to protect your data, but
                  no system can be guaranteed 100% secure.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">5. Your Choices</h2>
                <p>
                  You can stop using the service at any time, and you may request
                  changes to your account information where supported.
                </p>
              </section>

              <section>
                <h2 className="mb-2 text-lg font-semibold text-foreground">6. Updates</h2>
                <p>
                  This policy may be updated from time to time. Continued use of
                  Talkify means you accept the updated policy.
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

export default PrivacyPage;