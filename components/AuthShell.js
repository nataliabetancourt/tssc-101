import BrandLogo from "@/components/BrandLogo";
import { fieldClass, primaryButtonClass } from "@/components/ui";

export { fieldClass, primaryButtonClass };

export default function AuthShell({ children }) {
  return (
    <main className="min-h-screen bg-canvas px-5 pb-10 pt-[max(2.5rem,env(safe-area-inset-top))] text-ink">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="flex justify-center pt-6">
          <BrandLogo className="h-14 w-auto max-w-[220px]" />
        </div>
        <div className="pt-2">{children}</div>
      </div>
    </main>
  );
}
