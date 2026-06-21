import React from "react";

type BlobProps = {
    size: number;
    color: string;
    opacity?: number;
    blur?: number;
    style?: React.CSSProperties;
};

export const Blob = ({ size, color, opacity = 40, blur = 20, style }: BlobProps) => {
    return (
        <div
            style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: "50%",
                background: `color-mix(in srgb, ${ color } ${ opacity }%, transparent)`,
                filter: `blur(${ blur }px)`,
                pointerEvents: "none",
                zIndex: 0,
                ...style,
            }}
        />
    );
};