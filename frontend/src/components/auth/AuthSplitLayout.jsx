import loginImage from "@/assets/login.webp";

export function AuthSplitLayout({
  title,
  description,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-[50px]">
      <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-6 sm:min-h-[calc(100vh-3rem)] sm:gap-8 lg:min-h-[calc(100vh-100px)] lg:flex-row lg:items-stretch lg:gap-[50px]">
        <div className="flex w-full items-center lg:w-1/2">
          <img
            src={loginImage}
            alt="ProjectSphere"
            className="h-full min-h-[200px] w-full rounded-2xl object-cover sm:min-h-[280px] sm:rounded-[24px] lg:min-h-0"
          />
        </div>

        <div className="flex w-full items-center justify-center lg:w-1/2">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface-raised p-6 shadow-sm sm:rounded-[24px] sm:p-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
              <p className="mt-2 text-sm text-text-secondary sm:text-base">{description}</p>
            </div>

            {children}

            {footer ? (
              <div className="mt-6 text-center text-sm">{footer}</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
