import { C } from "../../../lib";
import styles from "./Avatar.module.css";

interface Props {
    user?: string;
    label?: string;
    showLabel?: boolean;
    size?: number;
    bgColor?: string;
    textColor?: string;
}

export const Avatar = ({ user, label, showLabel = false, size = 35, bgColor = C.accent, textColor = C.base }: Props) => {

    const avatarLabel = label ?? user?.[0]?.toUpperCase() ?? "?";

    return (
        <div className={ styles.avatar_container }>
            <div
                className={ styles.circle }
                style={{
                    width: size,
                    height: size,
                    background: bgColor,
                    color: textColor,
                }}
            >
                { avatarLabel }
            </div>
            {
                showLabel && user &&
                <span className={ styles.label } style={{ color: C.base }}>{ user }</span>
            }
        </div>
    );
};