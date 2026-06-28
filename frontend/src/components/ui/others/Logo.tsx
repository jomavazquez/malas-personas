import { Link } from "react-router-dom";
import { C, F } from "../../../lib";
import { Dot } from "../../../components";

interface Props {
    color?: string;
    dot?: string;
}

export const Logo = ({ color = "#000", dot = C.accent }: Props) => {
    return (
        <Link
            to="/"
            style={{ fontFamily: F.display, fontWeight: 800, fontSize: 22, letterSpacing: "-0.03em", color, textDecoration: "none" }}
        >
            <span style={{ marginRight: 5 }}>MALAS PERSONAS</span><Dot color={ dot } />
        </Link>
    )
}