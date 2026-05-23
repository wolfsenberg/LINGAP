"use client";

import { CSSProperties, ReactNode, useEffect, useState } from "react";

type SafeImageFrameProps = {
  src?: string | null;
  alt: string;
  className: string;
  photoClassName: string;
  fallback: ReactNode;
  children?: ReactNode;
  style?: CSSProperties;
  hasPhotoClassName?: string;
};

export default function SafeImageFrame({
  src,
  alt,
  className,
  photoClassName,
  fallback,
  children,
  style,
  hasPhotoClassName = "has-photo",
}: SafeImageFrameProps) {
  const [failed, setFailed] = useState(false);
  const showPhoto = Boolean(src) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className={`${className}${showPhoto ? ` ${hasPhotoClassName}` : ""}`} style={style}>
      {showPhoto ? (
        <img className={photoClassName} src={src ?? ""} alt={alt} onError={() => setFailed(true)} />
      ) : (
        fallback
      )}
      {children}
    </div>
  );
}
