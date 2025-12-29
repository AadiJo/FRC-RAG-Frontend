import type * as React from "react";
import { memo } from "react";

type GoogleDocsIconProps = React.ComponentProps<"svg"> & {
  className?: string;
};

const GoogleDocsIconComponent = ({
  className,
  ...props
}: GoogleDocsIconProps) => (
  <svg
    className={`flex-shrink-0 ${className || ""}`}
    viewBox="0 0 47 65"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    {...props}
  >
    <title>{"Docs-icon"}</title>
    <defs>
      <path
        d="M29.375 0H4.406C1.983 0 0 1.994 0 4.432v56.136C0 63.006 1.983 65 4.406 65h38.188C45.017 65 47 63.006 47 60.568v-42.84L29.375 0Z"
        id="a"
      />
      <path
        d="M29.375 0H4.406C1.983 0 0 1.994 0 4.432v56.136C0 63.006 1.983 65 4.406 65h38.188C45.017 65 47 63.006 47 60.568v-42.84L29.375 0Z"
        id="c"
      />
      <path
        d="M29.375 0H4.406C1.983 0 0 1.994 0 4.432v56.136C0 63.006 1.983 65 4.406 65h38.188C45.017 65 47 63.006 47 60.568v-42.84L29.375 0Z"
        id="f"
      />
      <path
        d="M29.375 0H4.406C1.983 0 0 1.994 0 4.432v56.136C0 63.006 1.983 65 4.406 65h38.188C45.017 65 47 63.006 47 60.568v-42.84L29.375 0Z"
        id="h"
      />
      <path
        d="M29.375 0H4.406C1.983 0 0 1.994 0 4.432v56.136C0 63.006 1.983 65 4.406 65h38.188C45.017 65 47 63.006 47 60.568v-42.84L29.375 0Z"
        id="j"
      />
      <path
        d="M29.375 0H4.406C1.983 0 0 1.994 0 4.432v56.136C0 63.006 1.983 65 4.406 65h38.188C45.017 65 47 63.006 47 60.568v-42.84L29.375 0Z"
        id="l"
      />
      <path
        d="M29.375 0H4.406C1.983 0 0 1.994 0 4.432v56.136C0 63.006 1.983 65 4.406 65h38.188C45.017 65 47 63.006 47 60.568v-42.84L29.375 0Z"
        id="n"
      />
      <radialGradient
        cx="3.168%"
        cy="2.717%"
        fx="3.168%"
        fy="2.717%"
        gradientTransform="matrix(1 0 0 .72308 0 .008)"
        id="p"
        r="161.249%"
      >
        <stop offset="0%" stopColor="#FFF" stopOpacity={0.1} />
        <stop offset="100%" stopColor="#FFF" stopOpacity={0} />
      </radialGradient>
      <linearGradient
        id="d"
        x1="50.005%"
        x2="50.005%"
        y1="8.586%"
        y2="100.014%"
      >
        <stop offset="0%" stopColor="#1A237E" stopOpacity={0.2} />
        <stop offset="100%" stopColor="#1A237E" stopOpacity={0.02} />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <g>
        <mask fill="#fff" id="b">
          <use xlinkHref="#a" />
        </mask>
        <path
          d="M29.375 0H4.406C1.983 0 0 1.994 0 4.432v56.136C0 63.006 1.983 65 4.406 65h38.188C45.017 65 47 63.006 47 60.568v-42.84L36.719 10.34 29.375 0Z"
          fill="#4285F4"
          fillRule="nonzero"
          mask="url(#b)"
        />
      </g>
      <g>
        <mask fill="#fff" id="e">
          <use xlinkHref="#c" />
        </mask>
        <path
          d="M30.664 16.431 47 32.858v-15.13z"
          fill="url(#d)"
          fillRule="nonzero"
          mask="url(#e)"
        />
      </g>
      <g>
        <mask fill="#fff" id="g">
          <use xlinkHref="#f" />
        </mask>
        <path
          d="M11.75 47.273h23.5v-2.955h-23.5v2.955Zm0 5.909h17.625v-2.955H11.75v2.955Zm0-20.682v2.955h23.5V32.5h-23.5Zm0 8.864h23.5v-2.955h-23.5v2.955Z"
          fill="#F1F1F1"
          fillRule="nonzero"
          mask="url(#g)"
        />
      </g>
      <g>
        <mask fill="#fff" id="i">
          <use xlinkHref="#h" />
        </mask>
        <g mask="url(#i)">
          <path
            d="M29.375 0v13.295c0 2.449 1.972 4.432 4.406 4.432H47L29.375 0Z"
            fill="#A1C2FA"
            fillRule="nonzero"
          />
        </g>
      </g>
      <g>
        <mask fill="#fff" id="k">
          <use xlinkHref="#j" />
        </mask>
        <path
          d="M4.406 0C1.983 0 0 1.994 0 4.432v.37C0 2.363 1.983.368 4.406.368h24.969V0H4.406Z"
          fill="#FFF"
          fillOpacity={0.2}
          fillRule="nonzero"
          mask="url(#k)"
        />
      </g>
      <g>
        <mask fill="#fff" id="m">
          <use xlinkHref="#l" />
        </mask>
        <path
          d="M42.594 64.63H4.406C1.983 64.63 0 62.637 0 60.2v.37C0 63.005 1.983 65 4.406 65h38.188C45.017 65 47 63.006 47 60.568v-.37c0 2.438-1.983 4.433-4.406 4.433Z"
          fill="#1A237E"
          fillOpacity={0.2}
          fillRule="nonzero"
          mask="url(#m)"
        />
      </g>
      <g>
        <mask fill="#fff" id="o">
          <use xlinkHref="#n" />
        </mask>
        <path
          d="M33.781 17.727c-2.434 0-4.406-1.983-4.406-4.432v.37c0 2.448 1.972 4.432 4.406 4.432H47v-.37H33.781Z"
          fill="#1A237E"
          fillOpacity={0.1}
          fillRule="nonzero"
          mask="url(#o)"
        />
      </g>
      <path
        d="M29.375 0H4.406C1.983 0 0 1.994 0 4.432v56.136C0 63.006 1.983 65 4.406 65h38.188C45.017 65 47 63.006 47 60.568v-42.84L29.375 0Z"
        fill="url(#p)"
        fillRule="nonzero"
      />
    </g>
  </svg>
);

export const GoogleDocsIcon = memo(GoogleDocsIconComponent);
