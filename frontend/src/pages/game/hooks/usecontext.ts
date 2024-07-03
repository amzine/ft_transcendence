import {useEffect, useState} from 'react';

export function useSetupContext(canvas: HTMLCanvasElement | undefined) {

	useEffect(() => {
		if (canvas) {
			canvas.width = canvas.offsetWidth;
			canvas.height = canvas.offsetHeight;
		}
	}, [canvas]);
};