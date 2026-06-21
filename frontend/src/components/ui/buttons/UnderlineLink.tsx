import { useState } from "react";
import { Link } from "react-router-dom";
import { C } from "../../../lib";

interface BaseProps {
    color?: string;
    children: React.ReactNode;
}

interface LinkProps extends BaseProps {
    to: string;
    onClick?: never;
}

interface ButtonProps extends BaseProps {
    onClick: (e?: React.MouseEvent) => void;
    to?: never;
}

type UnderlineLinkProps = LinkProps | ButtonProps;

export const UnderlineLink = ({ color = C.accentDeep, children, ...props }: UnderlineLinkProps) => {
    
    const [ hovered, setHovered ] = useState(false);

    const sharedStyle = {
        color,
        borderColor: hovered ? color : "transparent",
        transition: "border-color 0.25s ease",
    };

    const sharedProps = {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        className: "font-bold no-underline border-b-2 cursor-pointer",
        style: sharedStyle,
    };

    if( "onClick" in props && props.onClick ){
        return (
            <button
                { ...sharedProps }
                onClick={ props.onClick }
                style={{ 
                    ...sharedStyle, 
                    background: "none", 
                    border: "none", 
                    borderBottom: `2px solid ${ hovered ? color : "transparent" }`, 
                    padding: 0, 
                    fontFamily: "inherit", 
                    fontSize: "inherit" 
                }}
            >
                { children }
            </button>
        );
    }

    return (
        <Link to={ props.to! } { ...sharedProps }>
            { children }
        </Link>
    );
};