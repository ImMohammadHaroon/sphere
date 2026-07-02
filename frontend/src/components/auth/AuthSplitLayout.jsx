import loginImage from "@/assets/login.webp";

export function AuthSplitLayout({
  title,
  description,
  children,
  footer,
}) {
  return (
    <div className="min-h-screen bg-background p-[50px]">
      <div className="flex min-h-[calc(100vh-100px)] flex-col lg:flex-row lg:items-stretch lg:gap-[50px]">
        <div className="flex w-full items-center lg:w-1/2">
          <img
            src={loginImage}
            alt="ProjectSphere"
            className="h-full min-h-[280px] w-full rounded-[24px] object-cover lg:min-h-0"
          />
        </div>

        <div className="flex w-full items-center justify-center lg:w-1/2">
          <div className="w-full max-w-md rounded-[24px] border border-border bg-surface-raised p-8 shadow-sm">
            <div className="mb-8">
              <h1 className="font-display text-3xl font-semibold">{title}</h1>
              <p className="mt-2 text-text-secondary">{description}</p>
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
