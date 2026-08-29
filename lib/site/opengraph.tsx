import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { siteProfile } from "./profile";

const inter = readFile(
  path.join(process.cwd(), "public/assets/inter/regular.ttf"),
);

export const OPEN_GRAPH_SIZE = {
  width: 1200,
  height: 630,
};

export async function createOpenGraphImage({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px",
        color: "rgba(255, 255, 255, 0.92)",
        backgroundColor: "black",
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: 32,
          letterSpacing: "-0.6px",
        }}
      >
        {siteProfile.name}
      </div>
      <div
        style={{ display: "flex", flexDirection: "column", maxWidth: "960px" }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 400,
            letterSpacing: "-2.4px",
            lineHeight: 1.1,
          }}
        >
          {title}
        </div>
        {description ? (
          <div
            style={{
              marginTop: 28,
              color: "rgba(255, 255, 255, 0.65)",
              fontSize: 30,
              lineHeight: 1.35,
            }}
          >
            {description}
          </div>
        ) : null}
      </div>
    </div>,
    {
      ...OPEN_GRAPH_SIZE,
      fonts: [
        {
          name: "Inter",
          data: await inter,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );
}
