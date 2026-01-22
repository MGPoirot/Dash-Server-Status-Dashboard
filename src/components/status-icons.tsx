// status-icons.tsx
import * as React from "react";
import { metricStatus } from "../types/alerts";
import { statusToThemeColor } from "../methods/utils";
import { Theme } from "../styles/themes";
import { useTheme } from "styled-components";


type IconProps = React.SVGProps<SVGSVGElement> & {
  title?: string;
};

const baseProps = {
  width: "1em",
  height: "1em",
  viewBox: "0 0 512 512",
  fill: "currentColor",
  style: {
    display: "inline-block",
    verticalAlign: "-0.125em", // FontAwesome-ish baseline alignment
  },
} as const;


/**
 * OK: check-circle
 */
export const StatusOkIcon = ({ title = "OK", ...props }: IconProps) => (
  <svg {...baseProps} role="img" aria-label={title} {...props}>
    <title>{title}</title>
    <path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm-28.3 299.3-89.4-89.4 22.6-22.6 66.8 66.8 123.6-123.6 22.6 22.6-146.2 146.2z" />
  </svg>
);

/**
 * STALE/UNKNOWN: question-circle
 */
export const StatusStaleIcon = ({ title = "Stale", ...props }: IconProps) => (
  <svg {...baseProps} role="img" aria-label={title} {...props}>
    <title>{title}</title>
    <path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm0 362c-13.3 0-24-10.7-24-24s10.7-24 24-24 24 10.7 24 24-10.7 24-24 24zm42.7-170.9c-18.7 13.1-18.7 16.6-18.7 34.9v6c0 13.3-10.7 24-24 24s-24-10.7-24-24v-10.2c0-31.6 10.7-48.4 38.9-68.2 17.6-12.3 24.1-20.9 24.1-33.2 0-18.8-15.7-33.1-40.7-33.1-19.6 0-36.5 8.9-47.8 25.1-7.6 10.9-22.6 13.6-33.4 6-10.9-7.6-13.6-22.6-6-33.4C182.9 128.7 216.7 112 256 112c52.6 0 88.7 34 88.7 81.1 0 34.6-17.6 56.4-46 76z" />
  </svg>
);

/**
 * INFO: info-circle
 */
export const StatusInfoIcon = ({ title = "Info", ...props }: IconProps) => (
  <svg {...baseProps} role="img" aria-label={title} {...props}>
    <title>{title}</title>
    <path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm0 92c17.7 0 32 14.3 32 32s-14.3 32-32 32-32-14.3-32-32 14.3-32 32-32zm48 272h-96c-13.3 0-24-10.7-24-24s10.7-24 24-24h24V264h-16c-13.3 0-24-10.7-24-24s10.7-24 24-24h56c13.3 0 24 10.7 24 24v124h8c13.3 0 24 10.7 24 24s-10.7 24-24 24z" />
  </svg>
);

/**
 * WARNING: exclamation-triangle
 */
export const StatusWarningIcon = ({ title = "Warning", ...props }: IconProps) => (
  <svg {...baseProps} role="img" aria-label={title} {...props}>
    <title>{title}</title>
    <path d="M256 32c-8.3 0-16.1 4.4-20.3 11.6L16.6 427.8C7.5 443.5 18.8 463.5 37 463.5h438c18.2 0 29.5-20 20.4-35.7L276.3 43.6C272.1 36.4 264.3 32 256 32zm0 127.5c13.3 0 24 10.7 24 24v120c0 13.3-10.7 24-24 24s-24-10.7-24-24v-120c0-13.3 10.7-24 24-24zm0 256c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z" />
  </svg>
);

/**
 * CRITICAL: siren / emergency (simple beacon)
 */
export const StatusCriticalIcon = ({
  title = "Critical",
  ...props
}: IconProps) => (
  <svg {...baseProps} role="img" aria-label={title} {...props}>
    <title>{title}</title>
    <path d="M256 48c-70.7 0-128 57.3-128 128v80.6c0 12.7-5.1 24.9-14.1 33.9L72 332.4c-10.5 10.5-16.4 24.8-16.4 39.7V416c0 26.5 21.5 48 48 48h304c26.5 0 48-21.5 48-48v-43.9c0-14.9-5.9-29.2-16.4-39.7l-41.9-41.9c-9-9-14.1-21.2-14.1-33.9V176c0-70.7-57.3-128-128-128zm0 64c35.3 0 64 28.7 64 64v96H192v-96c0-35.3 28.7-64 64-64zm-80 272c0-13.3 10.7-24 24-24h112c13.3 0 24 10.7 24 24s-10.7 24-24 24H200c-13.3 0-24-10.7-24-24z" />
  </svg>
);

export const StatusToIcon: Record<metricStatus, React.FC<IconProps>> = {
  ok: StatusOkIcon,
  stale: StatusStaleIcon,
  info: StatusInfoIcon,
  warning: StatusWarningIcon,
  critical: StatusCriticalIcon,
};

// Optional: drop-in replacement helper (same idea as your emoji map)
export const StatusIcon = ({ status, ...props }: { status: metricStatus } & IconProps) => {
  const Icon = StatusToIcon[status];
  const theme = useTheme() as Theme;
  return <Icon {...props} color={statusToThemeColor(theme, status)}/>;
};
