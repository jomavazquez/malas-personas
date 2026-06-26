export const BlackCardText = ({ text }: { text: string }) => {
    const parts = text.split("______");
    return (
        <>
        {
            parts.map((part, i) => (
                <span key={ i }>
                { part }
                {
                    i < parts.length - 1 &&
                    <span className="black_card_underline" />
                }
                </span>
            ))
        }
        </>
    );
};