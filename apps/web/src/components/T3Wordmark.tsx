import type { SVGProps } from "react";

export function T3Wordmark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 300 76" xmlns="http://www.w3.org/2000/svg">
      <image href="/atqor-logo.png" width="300" height="76" className="dark:hidden" />
      <image href="/atqor-logo-dark.png" width="300" height="76" className="hidden dark:block" />
    </svg>
  );
}
