import { useCallback, useEffect, useState } from 'react';
import { PLACEHOLDER_BEAR } from '../lib/placeholderBear.js';

/* public/images/ 에서 아래 순서로 찾아봅니다. 하나라도 있으면 그걸 씁니다. */
const CANDIDATES = ['bear.png', 'bear.jpg', 'bear.jpeg', 'bear.webp']
  .map(name => `${import.meta.env.BASE_URL}images/${name}`);

/** 이미지를 불러서 크기까지 알아냅니다. 실패하면 null. */
function probe(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve({
      url,
      w: img.naturalWidth || 400,
      h: img.naturalHeight || 400,
    });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * 퍼즐에 쓸 그림을 관리합니다.
 * 처음에는 public/images/ 를 훑고, 없으면 기본 곰 그림을 씁니다.
 * 사용자가 파일을 고르면 그걸로 교체합니다.
 */
export function usePuzzleImage() {
  const [image, setImage] = useState(PLACEHOLDER_BEAR);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const url of CANDIDATES) {
        const found = await probe(url);
        if (cancelled) return;
        if (found) {
          setImage({ ...found, label: url.replace(import.meta.env.BASE_URL, '') });
          return;
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const loadFile = useCallback(file => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const found = await probe(reader.result);
      if (found) setImage({ ...found, label: file.name });
    };
    reader.readAsDataURL(file);
  }, []);

  return [image, loadFile];
}
