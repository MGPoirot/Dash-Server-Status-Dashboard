import React from 'react'
import { TextProps } from "../../../types/visuals";
import { StringPoint } from '../../../types/nodes';
import { AlertType } from '../../../types/alerts';

type TextRuntimeProps = TextProps & {
  points: StringPoint[];
  alerts?: AlertType[];
}

const TextVisual = ({
  points
}: TextRuntimeProps ) => {
  const point = points?.at(-1);
  const valueNum = points?.at(-1)?.s ?? null;
  return (
    <>
      <h1>Text Visual</h1>
      <p>
        Some text I guess: {valueNum}
      </p>
    </>
  );
};

export default TextVisual