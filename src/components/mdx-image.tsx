import Image from "next/image";

interface MdxImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  [key: string]: unknown; // Allow other props
}

export function MdxImage({
  src,
  alt,
  width,
  height,
  className,
  ...props
}: MdxImageProps) {
  const widthNum = width
    ? typeof width === "string"
      ? parseInt(width, 10)
      : width
    : 800;
  const heightNum = height
    ? typeof height === "string"
      ? parseInt(height, 10)
      : height
    : 400;

  return (
    <Image
      src={src}
      alt={alt}
      width={widthNum}
      height={heightNum}
      className={`rounded-lg border bg-muted ${className}`}
      style={{ width: "100%", height: "auto" }}
      {...props}
    />
  );
}
