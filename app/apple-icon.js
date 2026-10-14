import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 60,
          fontWeight: 700,
          letterSpacing: -2,
        }}
      >
        101
      </div>
    ),
    size,
  );
}
