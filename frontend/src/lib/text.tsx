interface Props {
    text: string;
}

export const TextWithBreaks = ({ text }: Props ) => {
    const lines = text.split(/<br\s*\/?>/i);
    return (
        <>
        {
            lines.map((line, i) => (
                <p key={ i } style={ i < lines.length - 1 ? { marginBottom: 15 } : undefined }>{ line }</p>
            ))
        }
        </>
    );
};