import { useState } from "react";
import { Link } from "react-router-dom";
import { C, F } from "../../../lib";

interface SolidProps {
    variant?: "solid";
    bgColor?: string;
    textColor?: string;
    color?: never;
}

interface OutlineProps {
    variant: "outline";
    color?: string;
    bgColor?: never;
    textColor?: never;
}

type ButtonProps = (SolidProps | OutlineProps) & {
    children: React.ReactNode;
    size?: "sm" | "md";
    to?: string;
    onClick?: () => void;
    style?: React.CSSProperties;
    disabled?: boolean;
};

export const Button = ({ children, variant = "solid", size = "md", to, onClick, style: extraStyle, disabled, ...rest }: ButtonProps) => {
    
    const isDisabled = disabled ?? (!to && !onClick);
    const [hovered, setHovered] = useState(false);
    const isSolid = variant === "solid";

    const bgColor = isSolid ? (rest as SolidProps).bgColor ?? C.base : undefined;
    const textColor = isSolid ? (rest as SolidProps).textColor ?? "#fff" : undefined;
    const color = !isSolid ? (rest as OutlineProps).color ?? C.base : undefined;

    const style: React.CSSProperties = {
        background: isSolid
        ? hovered ? textColor : bgColor
        : hovered ? color : "transparent",
        color: isSolid
        ? hovered ? bgColor : textColor
        : hovered ? "#fff" : color,
        border: isSolid ? "none" : `2px solid ${color}`,
        borderRadius: 12,
        padding: size === "sm" ? "10px 20px" : "15px 30px",
        fontFamily: F.display,
        fontWeight: 700,
        fontSize: 16,
        letterSpacing: "-0.01em",
        textDecoration: "none",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        pointerEvents: isDisabled ? "none" : "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        transition: "background 0.25s ease, color 0.25s ease",
        ...extraStyle
    };

    const handlers = isDisabled ? {} : {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
    };

    if( to ) return <Link to={ to } style={ style } { ...handlers }>{ children }</Link>;
    return <button onClick={ onClick } disabled={ isDisabled } style={ style } { ...handlers }>{ children }</button>;
};