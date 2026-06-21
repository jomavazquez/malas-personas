import { Link } from "react-router-dom";
import { C, F } from "../../../lib";

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
            MALAS PERSONAS<span style={{ display: "inline-block", width: 7, height: 7, borderRadius: 999, backgroundColor: dot, marginLeft: 5 }} />
        </Link>
    )
}