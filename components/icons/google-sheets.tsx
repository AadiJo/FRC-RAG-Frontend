import type * as React from "react";
import { memo } from "react";

type GoogleSheetsIconProps = React.ComponentProps<"svg"> & {
  className?: string;
};

const GoogleSheetsIconComponent = ({
  className,
  ...props
}: GoogleSheetsIconProps) => (
  <svg
    className={`flex-shrink-0 ${className || ""}`}
    viewBox="0 0 48 66"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    {...props}
  >
    <title>{"Sheets-icon"}</title>
    <defs>
      <path
        d="M29.583 0H4.438A4.45 4.45 0 0 0 0 4.438v56.208a4.45 4.45 0 0 0 4.438 4.437h38.458a4.45 4.45 0 0 0 4.437-4.437V17.75L29.583 0Z"
        id="a"
      />
      <path
        d="M29.583 0H4.438A4.45 4.45 0 0 0 0 4.438v56.208a4.45 4.45 0 0 0 4.438 4.437h38.458a4.45 4.45 0 0 0 4.437-4.437V17.75L29.583 0Z"
        id="c"
      />
      <path
        d="M29.583 0H4.438A4.45 4.45 0 0 0 0 4.438v56.208a4.45 4.45 0 0 0 4.438 4.437h38.458a4.45 4.45 0 0 0 4.437-4.437V17.75L29.583 0Z"
        id="e"
      />
      <path
        d="M29.583 0H4.438A4.45 4.45 0 0 0 0 4.438v56.208a4.45 4.45 0 0 0 4.438 4.437h38.458a4.45 4.45 0 0 0 4.437-4.437V17.75L29.583 0Z"
        id="h"
      />
      <path
        d="M29.583 0H4.438A4.45 4.45 0 0 0 0 4.438v56.208a4.45 4.45 0 0 0 4.438 4.437h38.458a4.45 4.45 0 0 0 4.437-4.437V17.75L29.583 0Z"
        id="j"
      />
      <path
        d="M29.583 0H4.438A4.45 4.45 0 0 0 0 4.438v56.208a4.45 4.45 0 0 0 4.438 4.437h38.458a4.45 4.45 0 0 0 4.437-4.437V17.75L29.583 0Z"
        id="l"
      />
      <path
        d="M29.583 0H4.438A4.45 4.45 0 0 0 0 4.438v56.208a4.45 4.45 0 0 0 4.438 4.437h38.458a4.45 4.45 0 0 0 4.437-4.437V17.75L29.583 0Z"
        id="n"
      />
      <radialGradient
        cx="3.168%"
        cy="2.717%"
        fx="3.168%"
        fy="2.717%"
        gradientTransform="matrix(1 0 0 .72727 0 .007)"
        id="p"
        r="161.249%"
      >
        <stop offset="0%" stopColor="#FFF" stopOpacity={0.1} />
        <stop offset="100%" stopColor="#FFF" stopOpacity={0} />
      </radialGradient>
      <linearGradient
        id="f"
        x1="50.005%"
        x2="50.005%"
        y1="8.586%"
        y2="100.014%"
      >
        <stop offset="0%" stopColor="#263238" stopOpacity={0.2} />
        <stop offset="100%" stopColor="#263238" stopOpacity={0.02} />
      </linearGradient>
    </defs>
    <g fill="none" fillRule="evenodd">
      <g transform="translate(.833 .958)">
        <mask fill="#fff" id="b">
          <use xlinkHref="#a" />
        </mask>
        <path
          d="M29.583 0H4.438A4.45 4.45 0 0 0 0 4.438v56.208a4.45 4.45 0 0 0 4.438 4.437h38.458a4.45 4.45 0 0 0 4.437-4.437V17.75L36.98 10.354 29.583 0Z"
          fill="#0F9D58"
          fillRule="nonzero"
          mask="url(#b)"
        />
      </g>
      <g transform="translate(.833 .958)">
        <mask fill="#fff" id="d">
          <use xlinkHref="#c" />
        </mask>
        <path
          d="M11.833 31.802V53.25H35.5V31.802H11.833Zm10.354 18.49h-7.395v-3.698h7.396v3.698Zm0-5.917h-7.395v-3.698h7.396v3.698Zm0-5.917h-7.395V34.76h7.396v3.698Zm10.355 11.834h-7.396v-3.698h7.396v3.698Zm0-5.917h-7.396v-3.698h7.396v3.698Zm0-5.917h-7.396V34.76h7.396v3.698Z"
          fill="#F1F1F1"
          fillRule="nonzero"
          mask="url(#d)"
        />
      </g>
      <g transform="translate(.833 .958)">
        <mask fill="#fff" id="g">
          <use xlinkHref="#e" />
        </mask>
        <path
          d="M30.881 16.452 47.333 32.9V17.75z"
          fill="url(#f)"
          fillRule="nonzero"
          mask="url(#g)"
        />
      </g>
      <g transform="translate(.833 .958)">
        <mask fill="#fff" id="i">
          <use xlinkHref="#h" />
        </mask>
        <g mask="url(#i)">
          <path
            d="M29.583 0v13.313a4.436 4.436 0 0 0 4.438 4.437h13.312L29.583 0Z"
            fill="#87CEAC"
            fillRule="nonzero"
          />
        </g>
      </g>
      <g transform="translate(.833 .958)">
        <mask fill="#fff" id="k">
          <use xlinkHref="#j" />
        </mask>
        <path
          d="M4.438 0A4.45 4.45 0 0 0 0 4.438v.37A4.45 4.45 0 0 1 4.438.37h25.145V0H4.438Z"
          fill="#FFF"
          fillOpacity={0.2}
          fillRule="nonzero"
          mask="url(#k)"
        />
      </g>
      <g transform="translate(.833 .958)">
        <mask fill="#fff" id="m">
          <use xlinkHref="#l" />
        </mask>
        <path
          d="M42.896 64.714H4.437A4.45 4.45 0 0 1 0 60.276v.37a4.45 4.45 0 0 0 4.438 4.437h38.458a4.45 4.45 0 0 0 4.437-4.437v-.37a4.45 4.45 0 0 1-4.437 4.438Z"
          fill="#263238"
          fillOpacity={0.2}
          fillRule="nonzero"
          mask="url(#m)"
        />
      </g>
      <g transform="translate(.833 .958)">
        <mask fill="#fff" id="o">
          <use xlinkHref="#n" />
        </mask>
        <path
          d="M34.02 17.75a4.436 4.436 0 0 1-4.437-4.438v.37a4.436 4.436 0 0 0 4.438 4.438h13.312v-.37H34.021Z"
          fill="#263238"
          fillOpacity={0.1}
          fillRule="nonzero"
          mask="url(#o)"
        />
      </g>
      <path
        d="M29.583 0H4.438A4.45 4.45 0 0 0 0 4.438v56.208a4.45 4.45 0 0 0 4.438 4.437h38.458a4.45 4.45 0 0 0 4.437-4.437V17.75L29.583 0Z"
        fill="url(#p)"
        fillRule="nonzero"
        transform="translate(.833 .958)"
      />
    </g>
  </svg>
);

export const GoogleSheetsIcon = memo(GoogleSheetsIconComponent);
