import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#00648A",
          color: "#ffffff",
          fontSize: 168,
          fontWeight: 700,
          letterSpacing: -4,
        }}
      >
        N
      </div>
    ),
    size,
  );
}
