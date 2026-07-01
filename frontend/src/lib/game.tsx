interface Props {
    color?: string;
    text: string;
}

export const BlackCardText = ({ text, color = "#fff" }: Props ) => {
    const parts = text.split("______");
    return (
        <>
        {
            parts.map((part, i) => (
                <span key={ i }>
                { part }
                {
                    i < parts.length - 1 &&
                    <span className="black_card_underline" style={{ borderBottom: `solid 2px ${color}` }} />
                }
                </span>
            ))
        }
        </>
    );
};