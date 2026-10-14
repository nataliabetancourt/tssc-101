import { ImageResponse } from "next/og";

const size = { width: 512, height: 512 };

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#5C268E",
          color: "white",
          fontSize: 180,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        101
      </div>
    ),
    size,
  );
}
