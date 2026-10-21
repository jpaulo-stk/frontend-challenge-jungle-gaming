import type * as React from "react";

// Brand marks of the social login buttons, traced from the Figma export
// (design/screens/desktop-06-login.svg). Colors come from the @theme tokens.

export function GoogleIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M16.43 17.61C14.7 19.07 12.45 20 10 20C6.36 20 3.16 17.99 1.42 15.06L2.07 12.07L4.95 11.54C5.62 13.69 7.63 15.27 10 15.27C11.15 15.27 12.22 14.91 13.09 14.27L15.86 14.69L16.43 17.61Z"
        fill="var(--color-brand-google-green)"
      />
      <path
        d="M16.43 17.61L15.86 14.69L13.09 14.27C12.22 14.91 11.15 15.27 10 15.27V20C12.45 20 14.7 19.07 16.43 17.61Z"
        fill="var(--color-brand-google-green-dark)"
      />
      <path
        d="M4.73 10C4.73 10.54 4.81 11.05 4.95 11.54L1.42 15.06C0.54 13.59 0 11.85 0 10C0 8.15 0.54 6.41 1.42 4.94L4.25 5.42L4.95 8.46C4.81 8.95 4.73 9.46 4.73 10Z"
        fill="var(--color-brand-google-yellow)"
      />
      <path
        d="M20 10C20 13.05 18.59 15.78 16.43 17.61L13.09 14.27C13.77 13.77 14.35 13.12 14.72 12.34H10C9.67 12.34 9.41 12.09 9.41 11.76V8.24C9.41 7.91 9.67 7.66 10 7.66H19.25C19.53 7.66 19.78 7.86 19.82 8.14C19.94 8.75 20 9.38 20 10V10Z"
        fill="var(--color-brand-google-blue)"
      />
      <path
        d="M14.72 12.34C14.35 13.12 13.77 13.77 13.09 14.27L16.43 17.61C18.59 15.78 20 13.05 20 10C20 9.38 19.94 8.75 19.82 8.14C19.78 7.86 19.53 7.66 19.25 7.66H10V12.34H14.72Z"
        fill="var(--color-brand-google-blue-dark)"
      />
      <path
        d="M16.6 2.79C16.61 2.96 16.54 3.11 16.43 3.23L13.93 5.72C13.73 5.93 13.4 5.96 13.16 5.78C12.24 5.09 11.15 4.73 10 4.73C7.63 4.73 5.62 6.31 4.95 8.46L1.42 4.94C3.16 2.01 6.36 0 10 0C12.33 0 14.61 0.86 16.39 2.36C16.52 2.46 16.59 2.63 16.6 2.79V2.79Z"
        fill="var(--color-brand-google-red)"
      />
    </svg>
  );
}

export function FacebookIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" {...props}>
      <path
        d="M13.17 3.32H15V0.14C14.68 0.1 13.6 0 12.34 0C6.56 0 8.13 6.54 7.9 7.5H5V11.05H7.9V20H11.46V11.06H14.25L14.69 7.5H11.46C11.62 5.15 10.83 3.32 13.17 3.32V3.32Z"
        fill="var(--color-brand-facebook)"
      />
    </svg>
  );
}
